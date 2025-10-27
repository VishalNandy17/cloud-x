import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Resource } from '../resource/resource.schema';
import { Booking } from '../booking/booking.schema';
import { Analytics } from '../analytics/analytics.schema';

export interface MonitoringMetrics {
  resourceId: string;
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  responseTime: number;
  availability: number;
  cost: number;
}

export interface Alert {
  id: string;
  resourceId: string;
  type: 'performance' | 'cost' | 'availability' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  metadata?: any;
}

export interface ResourceHealth {
  resourceId: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  score: number;
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
    availability: number;
  };
  alerts: Alert[];
  lastUpdated: Date;
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private readonly alertThresholds = {
    cpu: { warning: 80, critical: 95 },
    memory: { warning: 85, critical: 95 },
    disk: { warning: 90, critical: 95 },
    availability: { warning: 99, critical: 95 },
    cost: { warning: 1.5, critical: 2.0 }, // Multiplier of expected cost
  };

  constructor(
    @InjectModel(Resource.name) private resourceModel: Model<Resource>,
    @InjectModel(Booking.name) private bookingModel: Model<Booking>,
    @InjectModel(Analytics.name) private analyticsModel: Model<Analytics>,
    private eventEmitter: EventEmitter2,
  ) {}

  async collectMetrics(resourceId: string): Promise<MonitoringMetrics> {
    this.logger.log(`Collecting metrics for resource ${resourceId}`);

    try {
      // In a real implementation, this would collect actual metrics from cloud providers
      const metrics: MonitoringMetrics = {
        resourceId,
        timestamp: new Date(),
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        diskUsage: Math.random() * 100,
        networkIn: Math.random() * 1000,
        networkOut: Math.random() * 1000,
        responseTime: Math.random() * 1000,
        availability: Math.random() * 100,
        cost: Math.random() * 10,
      };

      // Store metrics in database
      await this.storeMetrics(metrics);

      // Check for alerts
      await this.checkAlerts(metrics);

      return metrics;
    } catch (error) {
      this.logger.error(`Error collecting metrics for resource ${resourceId}:`, error);
      throw error;
    }
  }

  async getResourceHealth(resourceId: string): Promise<ResourceHealth> {
    const resource = await this.resourceModel.findById(resourceId);
    if (!resource) {
      throw new Error(`Resource ${resourceId} not found`);
    }

    // Get recent metrics
    const recentMetrics = await this.analyticsModel
      .find({ resourceId })
      .sort({ timestamp: -1 })
      .limit(10);

    if (recentMetrics.length === 0) {
      return {
        resourceId,
        status: 'offline',
        score: 0,
        metrics: {
          cpu: 0,
          memory: 0,
          disk: 0,
          network: 0,
          availability: 0,
        },
        alerts: [],
        lastUpdated: new Date(),
      };
    }

    // Calculate health score
    const healthScore = this.calculateHealthScore(recentMetrics);
    const status = this.determineStatus(healthScore);

    // Get active alerts
    const alerts = await this.getActiveAlerts(resourceId);

    return {
      resourceId,
      status,
      score: healthScore,
      metrics: {
        cpu: this.calculateAverage(recentMetrics, 'cpuUsage'),
        memory: this.calculateAverage(recentMetrics, 'memoryUsage'),
        disk: this.calculateAverage(recentMetrics, 'diskUsage'),
        network: this.calculateAverage(recentMetrics, 'networkIn') + this.calculateAverage(recentMetrics, 'networkOut'),
        availability: this.calculateAverage(recentMetrics, 'availability'),
      },
      alerts,
      lastUpdated: new Date(),
    };
  }

  async getSystemOverview(): Promise<{
    totalResources: number;
    healthyResources: number;
    warningResources: number;
    criticalResources: number;
    offlineResources: number;
    totalAlerts: number;
    activeAlerts: number;
    averageHealthScore: number;
  }> {
    const resources = await this.resourceModel.find({ isActive: true });
    const resourceHealths = await Promise.all(
      resources.map(resource => this.getResourceHealth(resource._id.toString()))
    );

    const totalResources = resources.length;
    const healthyResources = resourceHealths.filter(h => h.status === 'healthy').length;
    const warningResources = resourceHealths.filter(h => h.status === 'warning').length;
    const criticalResources = resourceHealths.filter(h => h.status === 'critical').length;
    const offlineResources = resourceHealths.filter(h => h.status === 'offline').length;

    const totalAlerts = await this.analyticsModel.countDocuments({ type: 'alert' });
    const activeAlerts = await this.analyticsModel.countDocuments({ 
      type: 'alert', 
      resolved: false 
    });

    const averageHealthScore = resourceHealths.length > 0 
      ? resourceHealths.reduce((sum, h) => sum + h.score, 0) / resourceHealths.length
      : 0;

    return {
      totalResources,
      healthyResources,
      warningResources,
      criticalResources,
      offlineResources,
      totalAlerts,
      activeAlerts,
      averageHealthScore: Math.round(averageHealthScore * 100) / 100,
    };
  }

  async createAlert(alert: Omit<Alert, 'id' | 'timestamp'>): Promise<Alert> {
    const newAlert: Alert = {
      ...alert,
      id: this.generateAlertId(),
      timestamp: new Date(),
    };

    // Store alert
    await this.analyticsModel.create({
      resourceId: alert.resourceId,
      type: 'alert',
      data: newAlert,
      timestamp: new Date(),
    });

    // Emit event
    this.eventEmitter.emit('alert.created', newAlert);

    this.logger.warn(`Alert created: ${newAlert.message}`, newAlert);
    return newAlert;
  }

  async resolveAlert(alertId: string): Promise<void> {
    await this.analyticsModel.updateOne(
      { 'data.id': alertId, type: 'alert' },
      { $set: { 'data.resolved': true } }
    );

    this.eventEmitter.emit('alert.resolved', { alertId });
    this.logger.log(`Alert resolved: ${alertId}`);
  }

  async getAlerts(
    resourceId?: string,
    type?: string,
    severity?: string,
    resolved?: boolean
  ): Promise<Alert[]> {
    const filter: any = { type: 'alert' };
    
    if (resourceId) filter.resourceId = resourceId;
    if (resolved !== undefined) filter['data.resolved'] = resolved;

    const alerts = await this.analyticsModel.find(filter).sort({ timestamp: -1 });
    
    return alerts
      .map(alert => alert.data as Alert)
      .filter(alert => {
        if (type && alert.type !== type) return false;
        if (severity && alert.severity !== severity) return false;
        return true;
      });
  }

  private async storeMetrics(metrics: MonitoringMetrics): Promise<void> {
    await this.analyticsModel.create({
      resourceId: metrics.resourceId,
      type: 'metrics',
      data: metrics,
      timestamp: metrics.timestamp,
    });
  }

  private async checkAlerts(metrics: MonitoringMetrics): Promise<void> {
    const alerts: Omit<Alert, 'id' | 'timestamp'>[] = [];

    // CPU usage alert
    if (metrics.cpuUsage >= this.alertThresholds.cpu.critical) {
      alerts.push({
        resourceId: metrics.resourceId,
        type: 'performance',
        severity: 'critical',
        message: `CPU usage is critically high: ${metrics.cpuUsage.toFixed(1)}%`,
        resolved: false,
        metadata: { metric: 'cpu', value: metrics.cpuUsage },
      });
    } else if (metrics.cpuUsage >= this.alertThresholds.cpu.warning) {
      alerts.push({
        resourceId: metrics.resourceId,
        type: 'performance',
        severity: 'warning',
        message: `CPU usage is high: ${metrics.cpuUsage.toFixed(1)}%`,
        resolved: false,
        metadata: { metric: 'cpu', value: metrics.cpuUsage },
      });
    }

    // Memory usage alert
    if (metrics.memoryUsage >= this.alertThresholds.memory.critical) {
      alerts.push({
        resourceId: metrics.resourceId,
        type: 'performance',
        severity: 'critical',
        message: `Memory usage is critically high: ${metrics.memoryUsage.toFixed(1)}%`,
        resolved: false,
        metadata: { metric: 'memory', value: metrics.memoryUsage },
      });
    } else if (metrics.memoryUsage >= this.alertThresholds.memory.warning) {
      alerts.push({
        resourceId: metrics.resourceId,
        type: 'performance',
        severity: 'warning',
        message: `Memory usage is high: ${metrics.memoryUsage.toFixed(1)}%`,
        resolved: false,
        metadata: { metric: 'memory', value: metrics.memoryUsage },
      });
    }

    // Availability alert
    if (metrics.availability < this.alertThresholds.availability.critical) {
      alerts.push({
        resourceId: metrics.resourceId,
        type: 'availability',
        severity: 'critical',
        message: `Resource availability is critically low: ${metrics.availability.toFixed(1)}%`,
        resolved: false,
        metadata: { metric: 'availability', value: metrics.availability },
      });
    } else if (metrics.availability < this.alertThresholds.availability.warning) {
      alerts.push({
        resourceId: metrics.resourceId,
        type: 'availability',
        severity: 'warning',
        message: `Resource availability is low: ${metrics.availability.toFixed(1)}%`,
        resolved: false,
        metadata: { metric: 'availability', value: metrics.availability },
      });
    }

    // Create alerts
    for (const alert of alerts) {
      await this.createAlert(alert);
    }
  }

  private calculateHealthScore(metrics: any[]): number {
    if (metrics.length === 0) return 0;

    const avgCpu = this.calculateAverage(metrics, 'cpuUsage');
    const avgMemory = this.calculateAverage(metrics, 'memoryUsage');
    const avgDisk = this.calculateAverage(metrics, 'diskUsage');
    const avgAvailability = this.calculateAverage(metrics, 'availability');

    // Health score calculation (0-100)
    const cpuScore = Math.max(0, 100 - avgCpu);
    const memoryScore = Math.max(0, 100 - avgMemory);
    const diskScore = Math.max(0, 100 - avgDisk);
    const availabilityScore = avgAvailability;

    return (cpuScore + memoryScore + diskScore + availabilityScore) / 4;
  }

  private determineStatus(healthScore: number): 'healthy' | 'warning' | 'critical' | 'offline' {
    if (healthScore >= 80) return 'healthy';
    if (healthScore >= 60) return 'warning';
    if (healthScore >= 20) return 'critical';
    return 'offline';
  }

  private calculateAverage(metrics: any[], field: string): number {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, metric) => acc + (metric.data[field] || 0), 0);
    return sum / metrics.length;
  }

  private async getActiveAlerts(resourceId: string): Promise<Alert[]> {
    return this.getAlerts(resourceId, undefined, undefined, false);
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
