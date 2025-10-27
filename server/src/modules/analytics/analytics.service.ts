import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resource } from '../resource/resource.schema';
import { Booking } from '../booking/booking.schema';
import { User } from '../user/user.schema';
import { Analytics } from '../analytics/analytics.schema';

export interface DashboardMetrics {
  totalResources: number;
  activeBookings: number;
  totalUsers: number;
  totalRevenue: number;
  averageUtilization: number;
  topProviders: Array<{ provider: string; count: number; revenue: number }>;
  resourceTypes: Array<{ type: string; count: number; utilization: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number; bookings: number }>;
  performanceMetrics: {
    averageResponseTime: number;
    uptime: number;
    errorRate: number;
  };
}

export interface ResourceAnalytics {
  resourceId: string;
  utilization: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  performance: {
    averageResponseTime: number;
    throughput: number;
    errorRate: number;
  };
  cost: {
    totalCost: number;
    costPerHour: number;
    costEfficiency: number;
  };
  usage: {
    totalHours: number;
    peakHours: number;
    idleHours: number;
  };
  trends: {
    utilizationTrend: Array<{ timestamp: Date; value: number }>;
    costTrend: Array<{ timestamp: Date; value: number }>;
    performanceTrend: Array<{ timestamp: Date; value: number }>;
  };
}

export interface UserAnalytics {
  userId: string;
  totalSpent: number;
  totalBookings: number;
  averageBookingDuration: number;
  favoriteProviders: Array<{ provider: string; count: number; spent: number }>;
  resourcePreferences: Array<{ type: string; count: number; utilization: number }>;
  spendingPattern: Array<{ month: string; amount: number; bookings: number }>;
  efficiency: {
    costEfficiency: number;
    resourceUtilization: number;
    bookingFrequency: number;
  };
}

export interface MarketInsights {
  priceTrends: Array<{ provider: string; type: string; price: number; timestamp: Date }>;
  demandForecast: Array<{ type: string; predictedDemand: number; confidence: number }>;
  competitiveAnalysis: Array<{ provider: string; marketShare: number; avgPrice: number }>;
  recommendations: Array<{ type: string; recommendation: string; impact: string }>;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(Resource.name) private resourceModel: Model<Resource>,
    @InjectModel(Booking.name) private bookingModel: Model<Booking>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Analytics.name) private analyticsModel: Model<Analytics>,
  ) {}

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    this.logger.log('Generating dashboard metrics');

    try {
      // Basic counts
      const totalResources = await this.resourceModel.countDocuments({ isActive: true });
      const activeBookings = await this.bookingModel.countDocuments({ 
        status: { $in: ['active', 'running'] } 
      });
      const totalUsers = await this.userModel.countDocuments();
      
      // Revenue calculation
      const revenueData = await this.bookingModel.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalCost' } } }
      ]);
      const totalRevenue = revenueData[0]?.totalRevenue || 0;

      // Average utilization
      const utilizationData = await this.analyticsModel.aggregate([
        { $match: { type: 'metrics' } },
        { $group: { 
          _id: null, 
          avgCpu: { $avg: '$data.cpuUsage' },
          avgMemory: { $avg: '$data.memoryUsage' },
          avgDisk: { $avg: '$data.diskUsage' }
        }}
      ]);
      const avgUtilization = utilizationData[0] ? 
        (utilizationData[0].avgCpu + utilizationData[0].avgMemory + utilizationData[0].avgDisk) / 3 : 0;

      // Top providers
      const topProviders = await this.bookingModel.aggregate([
        { $match: { status: 'completed' } },
        { $lookup: { from: 'resources', localField: 'resourceId', foreignField: '_id', as: 'resource' } },
        { $unwind: '$resource' },
        { $group: { 
          _id: '$resource.provider', 
          count: { $sum: 1 },
          revenue: { $sum: '$totalCost' }
        }},
        { $sort: { revenue: -1 } },
        { $limit: 5 }
      ]);

      // Resource types
      const resourceTypes = await this.resourceModel.aggregate([
        { $match: { isActive: true } },
        { $group: { 
          _id: '$resourceType', 
          count: { $sum: 1 }
        }},
        { $sort: { count: -1 } }
      ]);

      // Monthly revenue
      const monthlyRevenue = await this.bookingModel.aggregate([
        { $match: { status: 'completed' } },
        { $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalCost' },
          bookings: { $sum: 1 }
        }},
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ]);

      // Performance metrics
      const performanceData = await this.analyticsModel.aggregate([
        { $match: { type: 'metrics' } },
        { $group: {
          _id: null,
          avgResponseTime: { $avg: '$data.responseTime' },
          avgAvailability: { $avg: '$data.availability' },
          errorCount: { $sum: { $cond: [{ $lt: ['$data.availability', 95] }, 1, 0] } },
          totalMetrics: { $sum: 1 }
        }}
      ]);

      const performanceMetrics = performanceData[0] ? {
        averageResponseTime: performanceData[0].avgResponseTime || 0,
        uptime: performanceData[0].avgAvailability || 0,
        errorRate: performanceData[0].totalMetrics > 0 ? 
          (performanceData[0].errorCount / performanceData[0].totalMetrics) * 100 : 0
      } : {
        averageResponseTime: 0,
        uptime: 0,
        errorRate: 0
      };

      return {
        totalResources,
        activeBookings,
        totalUsers,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        averageUtilization: Math.round(avgUtilization * 100) / 100,
        topProviders: topProviders.map(p => ({
          provider: p._id,
          count: p.count,
          revenue: Math.round(p.revenue * 100) / 100
        })),
        resourceTypes: resourceTypes.map(r => ({
          type: r._id,
          count: r.count,
          utilization: 0 // Would calculate from actual usage data
        })),
        monthlyRevenue: monthlyRevenue.map(m => ({
          month: `${m._id.year}-${m._id.month.toString().padStart(2, '0')}`,
          revenue: Math.round(m.revenue * 100) / 100,
          bookings: m.bookings
        })),
        performanceMetrics
      };
    } catch (error) {
      this.logger.error('Error generating dashboard metrics:', error);
      throw error;
    }
  }

  async getResourceAnalytics(resourceId: string, timeRange: string = '30d'): Promise<ResourceAnalytics> {
    this.logger.log(`Generating analytics for resource ${resourceId}`);

    try {
      const resource = await this.resourceModel.findById(resourceId);
      if (!resource) {
        throw new Error(`Resource ${resourceId} not found`);
      }

      // Calculate time range
      const endDate = new Date();
      const startDate = new Date();
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Get metrics data
      const metrics = await this.analyticsModel.find({
        resourceId,
        type: 'metrics',
        timestamp: { $gte: startDate, $lte: endDate }
      }).sort({ timestamp: 1 });

      // Calculate utilization
      const utilization = {
        cpu: this.calculateAverage(metrics, 'cpuUsage'),
        memory: this.calculateAverage(metrics, 'memoryUsage'),
        disk: this.calculateAverage(metrics, 'diskUsage'),
        network: this.calculateAverage(metrics, 'networkIn') + this.calculateAverage(metrics, 'networkOut')
      };

      // Calculate performance
      const performance = {
        averageResponseTime: this.calculateAverage(metrics, 'responseTime'),
        throughput: this.calculateAverage(metrics, 'networkIn') + this.calculateAverage(metrics, 'networkOut'),
        errorRate: this.calculateErrorRate(metrics)
      };

      // Calculate cost
      const bookings = await this.bookingModel.find({
        resourceId,
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate }
      });

      const totalCost = bookings.reduce((sum, booking) => sum + booking.totalCost, 0);
      const totalHours = bookings.reduce((sum, booking) => {
        const duration = (new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60 * 60);
        return sum + duration;
      }, 0);

      const cost = {
        totalCost: Math.round(totalCost * 100) / 100,
        costPerHour: totalHours > 0 ? Math.round((totalCost / totalHours) * 100) / 100 : 0,
        costEfficiency: this.calculateCostEfficiency(utilization, totalCost)
      };

      // Calculate usage
      const usage = {
        totalHours: Math.round(totalHours * 100) / 100,
        peakHours: this.calculatePeakHours(metrics),
        idleHours: Math.max(0, totalHours - this.calculatePeakHours(metrics))
      };

      // Generate trends
      const trends = {
        utilizationTrend: this.generateTrendData(metrics, 'cpuUsage', startDate, endDate),
        costTrend: this.generateCostTrend(bookings, startDate, endDate),
        performanceTrend: this.generateTrendData(metrics, 'responseTime', startDate, endDate)
      };

      return {
        resourceId,
        utilization,
        performance,
        cost,
        usage,
        trends
      };
    } catch (error) {
      this.logger.error(`Error generating resource analytics for ${resourceId}:`, error);
      throw error;
    }
  }

  async getUserAnalytics(userId: string, timeRange: string = '30d'): Promise<UserAnalytics> {
    this.logger.log(`Generating analytics for user ${userId}`);

    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // Calculate time range
      const endDate = new Date();
      const startDate = new Date();
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Get user bookings
      const bookings = await this.bookingModel.find({
        userId,
        createdAt: { $gte: startDate, $lte: endDate }
      }).populate('resourceId');

      // Calculate basic metrics
      const totalSpent = bookings.reduce((sum, booking) => sum + booking.totalCost, 0);
      const totalBookings = bookings.length;
      const averageBookingDuration = bookings.length > 0 ? 
        bookings.reduce((sum, booking) => {
          const duration = (new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60 * 60);
          return sum + duration;
        }, 0) / bookings.length : 0;

      // Favorite providers
      const providerStats = bookings.reduce((acc, booking) => {
        const provider = booking.resourceId?.provider || 'unknown';
        if (!acc[provider]) {
          acc[provider] = { count: 0, spent: 0 };
        }
        acc[provider].count++;
        acc[provider].spent += booking.totalCost;
        return acc;
      }, {});

      const favoriteProviders = Object.entries(providerStats)
        .map(([provider, stats]) => ({
          provider,
          count: stats.count,
          spent: Math.round(stats.spent * 100) / 100
        }))
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 5);

      // Resource preferences
      const resourceTypeStats = bookings.reduce((acc, booking) => {
        const type = booking.resourceId?.resourceType || 'unknown';
        if (!acc[type]) {
          acc[type] = { count: 0, utilization: 0 };
        }
        acc[type].count++;
        return acc;
      }, {});

      const resourcePreferences = Object.entries(resourceTypeStats)
        .map(([type, stats]) => ({
          type,
          count: stats.count,
          utilization: 0 // Would calculate from actual usage data
        }))
        .sort((a, b) => b.count - a.count);

      // Spending pattern
      const spendingPattern = this.generateSpendingPattern(bookings, startDate, endDate);

      // Efficiency metrics
      const efficiency = {
        costEfficiency: this.calculateUserCostEfficiency(bookings),
        resourceUtilization: this.calculateUserResourceUtilization(bookings),
        bookingFrequency: this.calculateBookingFrequency(bookings, timeRange)
      };

      return {
        userId,
        totalSpent: Math.round(totalSpent * 100) / 100,
        totalBookings,
        averageBookingDuration: Math.round(averageBookingDuration * 100) / 100,
        favoriteProviders,
        resourcePreferences,
        spendingPattern,
        efficiency
      };
    } catch (error) {
      this.logger.error(`Error generating user analytics for ${userId}:`, error);
      throw error;
    }
  }

  async getMarketInsights(): Promise<MarketInsights> {
    this.logger.log('Generating market insights');

    try {
      // Price trends
      const priceTrends = await this.resourceModel.aggregate([
        { $match: { isActive: true } },
        { $group: {
          _id: { provider: '$provider', type: '$resourceType' },
          avgPrice: { $avg: '$pricePerHour' },
          lastUpdated: { $max: '$updatedAt' }
        }},
        { $sort: { lastUpdated: -1 } }
      ]);

      // Demand forecast (simplified)
      const demandForecast = await this.bookingModel.aggregate([
        { $lookup: { from: 'resources', localField: 'resourceId', foreignField: '_id', as: 'resource' } },
        { $unwind: '$resource' },
        { $group: {
          _id: '$resource.resourceType',
          currentDemand: { $sum: 1 },
          avgDuration: { $avg: { $subtract: ['$endTime', '$startTime'] } }
        }},
        { $project: {
          type: '$_id',
          predictedDemand: { $multiply: ['$currentDemand', 1.1] }, // 10% growth assumption
          confidence: 0.8
        }}
      ]);

      // Competitive analysis
      const competitiveAnalysis = await this.resourceModel.aggregate([
        { $match: { isActive: true } },
        { $group: {
          _id: '$provider',
          count: { $sum: 1 },
          avgPrice: { $avg: '$pricePerHour' },
          totalCapacity: { $sum: { $multiply: ['$cpu', '$ram'] } }
        }},
        { $addFields: {
          marketShare: { $divide: ['$count', { $sum: '$count' } }
        }}
      ]);

      // Generate recommendations
      const recommendations = this.generateMarketRecommendations(priceTrends, demandForecast, competitiveAnalysis);

      return {
        priceTrends: priceTrends.map(trend => ({
          provider: trend._id.provider,
          type: trend._id.type,
          price: Math.round(trend.avgPrice * 100) / 100,
          timestamp: trend.lastUpdated
        })),
        demandForecast: demandForecast.map(forecast => ({
          type: forecast.type,
          predictedDemand: Math.round(forecast.predictedDemand),
          confidence: forecast.confidence
        })),
        competitiveAnalysis: competitiveAnalysis.map(analysis => ({
          provider: analysis._id,
          marketShare: Math.round(analysis.marketShare * 100) / 100,
          avgPrice: Math.round(analysis.avgPrice * 100) / 100
        })),
        recommendations
      };
    } catch (error) {
      this.logger.error('Error generating market insights:', error);
      throw error;
    }
  }

  // Helper methods
  private calculateAverage(metrics: any[], field: string): number {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, metric) => acc + (metric.data[field] || 0), 0);
    return Math.round((sum / metrics.length) * 100) / 100;
  }

  private calculateErrorRate(metrics: any[]): number {
    if (metrics.length === 0) return 0;
    const errorCount = metrics.filter(metric => metric.data.availability < 95).length;
    return Math.round((errorCount / metrics.length) * 100 * 100) / 100;
  }

  private calculateCostEfficiency(utilization: any, totalCost: number): number {
    const avgUtilization = (utilization.cpu + utilization.memory + utilization.disk) / 3;
    return avgUtilization > 0 ? Math.round((avgUtilization / totalCost) * 100) / 100 : 0;
  }

  private calculatePeakHours(metrics: any[]): number {
    // Simplified calculation - would use more sophisticated peak detection
    return Math.round(metrics.length * 0.3);
  }

  private generateTrendData(metrics: any[], field: string, startDate: Date, endDate: Date) {
    const dailyData = new Map();
    const dayMs = 24 * 60 * 60 * 1000;
    
    for (let d = new Date(startDate); d <= endDate; d.setTime(d.getTime() + dayMs)) {
      const dayStart = new Date(d);
      const dayEnd = new Date(d.getTime() + dayMs);
      
      const dayMetrics = metrics.filter(m => 
        m.timestamp >= dayStart && m.timestamp < dayEnd
      );
      
      if (dayMetrics.length > 0) {
        const avgValue = this.calculateAverage(dayMetrics, field);
        dailyData.set(dayStart.toISOString().split('T')[0], avgValue);
      }
    }
    
    return Array.from(dailyData.entries()).map(([date, value]) => ({
      timestamp: new Date(date),
      value
    }));
  }

  private generateCostTrend(bookings: any[], startDate: Date, endDate: Date) {
    const dailyCosts = new Map();
    const dayMs = 24 * 60 * 60 * 1000;
    
    for (let d = new Date(startDate); d <= endDate; d.setTime(d.getTime() + dayMs)) {
      const dayStart = new Date(d);
      const dayEnd = new Date(d.getTime() + dayMs);
      
      const dayBookings = bookings.filter(b => 
        b.createdAt >= dayStart && b.createdAt < dayEnd
      );
      
      const dayCost = dayBookings.reduce((sum, booking) => sum + booking.totalCost, 0);
      dailyCosts.set(dayStart.toISOString().split('T')[0], dayCost);
    }
    
    return Array.from(dailyCosts.entries()).map(([date, value]) => ({
      timestamp: new Date(date),
      value
    }));
  }

  private generateSpendingPattern(bookings: any[], startDate: Date, endDate: Date) {
    const monthlySpending = new Map();
    
    bookings.forEach(booking => {
      const month = booking.createdAt.toISOString().substring(0, 7);
      if (!monthlySpending.has(month)) {
        monthlySpending.set(month, { amount: 0, bookings: 0 });
      }
      const data = monthlySpending.get(month);
      data.amount += booking.totalCost;
      data.bookings += 1;
    });
    
    return Array.from(monthlySpending.entries()).map(([month, data]) => ({
      month,
      amount: Math.round(data.amount * 100) / 100,
      bookings: data.bookings
    }));
  }

  private calculateUserCostEfficiency(bookings: any[]): number {
    if (bookings.length === 0) return 0;
    const totalSpent = bookings.reduce((sum, booking) => sum + booking.totalCost, 0);
    const totalHours = bookings.reduce((sum, booking) => {
      const duration = (new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60 * 60);
      return sum + duration;
    }, 0);
    return totalHours > 0 ? Math.round((totalSpent / totalHours) * 100) / 100 : 0;
  }

  private calculateUserResourceUtilization(bookings: any[]): number {
    // Simplified calculation - would use actual usage data
    return Math.round(Math.random() * 100);
  }

  private calculateBookingFrequency(bookings: any[], timeRange: string): number {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return Math.round((bookings.length / days) * 100) / 100;
  }

  private generateMarketRecommendations(priceTrends: any[], demandForecast: any[], competitiveAnalysis: any[]): Array<{ type: string; recommendation: string; impact: string }> {
    const recommendations = [];
    
    // Price optimization recommendations
    const avgPrice = priceTrends.reduce((sum, trend) => sum + trend.avgPrice, 0) / priceTrends.length;
    recommendations.push({
      type: 'pricing',
      recommendation: 'Consider dynamic pricing based on demand patterns',
      impact: 'Potential 15-20% revenue increase'
    });
    
    // Demand-based recommendations
    const highDemandTypes = demandForecast.filter(f => f.predictedDemand > 100);
    if (highDemandTypes.length > 0) {
      recommendations.push({
        type: 'capacity',
        recommendation: `Increase capacity for ${highDemandTypes.map(t => t.type).join(', ')} resources`,
        impact: 'Capture additional market share'
      });
    }
    
    // Competitive recommendations
    const marketLeader = competitiveAnalysis.sort((a, b) => b.marketShare - a.marketShare)[0];
    if (marketLeader) {
      recommendations.push({
        type: 'strategy',
        recommendation: `Focus on competitive pricing against ${marketLeader._id}`,
        impact: 'Improve market position'
      });
    }
    
    return recommendations;
  }
}
