import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MonitoringService } from '../monitoring/monitoring.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/monitoring',
})
export class MonitoringGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MonitoringGateway.name);
  private connectedClients = new Map<string, AuthenticatedSocket>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly monitoringService: MonitoringService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Authenticate the client
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      this.connectedClients.set(client.id, client);

      this.logger.log(`Client connected: ${client.id} (User: ${client.userId})`);
      
      // Send initial system overview
      const overview = await this.monitoringService.getSystemOverview();
      client.emit('system:overview', overview);

    } catch (error) {
      this.logger.error('Authentication failed:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:resource')
  async handleResourceSubscription(
    @MessageBody() data: { resourceId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      // Join the resource room
      await client.join(`resource:${data.resourceId}`);
      
      // Send current health status
      const health = await this.monitoringService.getResourceHealth(data.resourceId);
      client.emit('resource:health', health);

      this.logger.log(`Client ${client.id} subscribed to resource ${data.resourceId}`);
    } catch (error) {
      this.logger.error('Error subscribing to resource:', error);
      client.emit('error', { message: 'Failed to subscribe to resource' });
    }
  }

  @SubscribeMessage('unsubscribe:resource')
  async handleResourceUnsubscription(
    @MessageBody() data: { resourceId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    await client.leave(`resource:${data.resourceId}`);
    this.logger.log(`Client ${client.id} unsubscribed from resource ${data.resourceId}`);
  }

  @SubscribeMessage('subscribe:alerts')
  async handleAlertsSubscription(
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      // Join the alerts room for this user
      await client.join(`user:${client.userId}:alerts`);
      
      // Send recent alerts
      const alerts = await this.monitoringService.getAlerts(undefined, undefined, undefined, false);
      client.emit('alerts:list', alerts);

      this.logger.log(`Client ${client.id} subscribed to alerts`);
    } catch (error) {
      this.logger.error('Error subscribing to alerts:', error);
      client.emit('error', { message: 'Failed to subscribe to alerts' });
    }
  }

  @SubscribeMessage('resolve:alert')
  async handleAlertResolution(
    @MessageBody() data: { alertId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      await this.monitoringService.resolveAlert(data.alertId);
      client.emit('alert:resolved', { alertId: data.alertId });
      
      this.logger.log(`Alert ${data.alertId} resolved by client ${client.id}`);
    } catch (error) {
      this.logger.error('Error resolving alert:', error);
      client.emit('error', { message: 'Failed to resolve alert' });
    }
  }

  @SubscribeMessage('request:metrics')
  async handleMetricsRequest(
    @MessageBody() data: { resourceId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      const metrics = await this.monitoringService.collectMetrics(data.resourceId);
      client.emit('metrics:data', metrics);
    } catch (error) {
      this.logger.error('Error collecting metrics:', error);
      client.emit('error', { message: 'Failed to collect metrics' });
    }
  }

  // Broadcast methods for server-side events
  async broadcastResourceHealth(resourceId: string, health: any) {
    this.server.to(`resource:${resourceId}`).emit('resource:health', health);
  }

  async broadcastAlert(alert: any) {
    // Broadcast to all connected clients
    this.server.emit('alert:new', alert);
    
    // Also broadcast to specific user if available
    if (alert.userId) {
      this.server.to(`user:${alert.userId}:alerts`).emit('alert:new', alert);
    }
  }

  async broadcastSystemOverview(overview: any) {
    this.server.emit('system:overview', overview);
  }

  async broadcastMetrics(resourceId: string, metrics: any) {
    this.server.to(`resource:${resourceId}`).emit('metrics:data', metrics);
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // Get clients by user ID
  getClientsByUserId(userId: string): AuthenticatedSocket[] {
    return Array.from(this.connectedClients.values()).filter(client => client.userId === userId);
  }
}
