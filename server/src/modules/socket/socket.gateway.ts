import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private logger = new Logger(SocketGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('message')
  handleMessage(client: Socket, data: string): void {
    this.logger.log(`Message from ${client.id}: ${data}`);
    this.server.emit('message', data);
  }

  @SubscribeMessage('resource:update')
  handleResourceUpdate(client: Socket, data: any): void {
    this.logger.log(`Resource update from ${client.id}`);
    this.server.emit('resource:update', data);
  }

  @SubscribeMessage('booking:update')
  handleBookingUpdate(client: Socket, data: any): void {
    this.logger.log(`Booking update from ${client.id}`);
    this.server.emit('booking:update', data);
  }
}
