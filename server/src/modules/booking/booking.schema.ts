import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document;

@Schema({ timestamps: true })
export class Booking {
  @Prop({ required: true })
  bookingId: number;

  @Prop({ required: true })
  resourceId: number;

  @Prop({ required: true })
  consumer: string;

  @Prop({ required: true })
  provider: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ required: true })
  duration: number; // in hours

  @Prop({ required: true })
  totalCost: string;

  @Prop({ required: true })
  escrowId: number;

  @Prop({ default: 'pending' })
  status: string; // pending, active, completed, cancelled, disputed

  @Prop({ default: {} })
  resourceSpecs: {
    cpu: number;
    ram: number;
    storage: number;
    resourceType: string;
  };

  @Prop({ default: {} })
  metrics: {
    cpuUsage: number;
    ramUsage: number;
    storageUsage: number;
    networkUsage: number;
    uptime: number;
    lastUpdated: Date;
  };

  @Prop({ default: {} })
  sla: {
    uptimeTarget: number;
    latencyTarget: number;
    availabilityTarget: number;
    violations: number;
  };

  @Prop({ default: null })
  cancellationReason: string;

  @Prop({ default: null })
  cancellationTime: Date;

  @Prop({ default: null })
  completionTime: Date;

  @Prop({ default: false })
  isDisputed: boolean;

  @Prop({ default: null })
  disputeReason: string;

  @Prop({ default: [] })
  reviews: Array<{
    reviewer: string;
    rating: number;
    comment: string;
    timestamp: Date;
  }>;

  @Prop({ default: {} })
  metadata: {
    region: string;
    instanceType: string;
    os: string;
    additionalNotes: string;
  };
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
