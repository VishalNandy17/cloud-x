import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AnalyticsDocument = Analytics & Document;

@Schema({ timestamps: true })
export class Analytics {
  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  period: string; // daily, weekly, monthly, yearly

  @Prop({ default: 0 })
  totalResources: number;

  @Prop({ default: 0 })
  activeResources: number;

  @Prop({ default: 0 })
  totalBookings: number;

  @Prop({ default: 0 })
  activeBookings: number;

  @Prop({ default: 0 })
  completedBookings: number;

  @Prop({ default: 0 })
  cancelledBookings: number;

  @Prop({ default: 0 })
  totalUsers: number;

  @Prop({ default: 0 })
  activeUsers: number;

  @Prop({ default: 0 })
  newUsers: number;

  @Prop({ default: '0' })
  totalVolume: string; // in ETH

  @Prop({ default: '0' })
  platformRevenue: string; // in ETH

  @Prop({ default: '0' })
  averageBookingValue: string; // in ETH

  @Prop({ default: 0 })
  averageBookingDuration: number; // in hours

  @Prop({ default: {} })
  resourceTypeStats: {
    EC2_INSTANCE: number;
    AZURE_VM: number;
    GCP_COMPUTE: number;
    PRIVATE_NODE: number;
  };

  @Prop({ default: {} })
  regionStats: {
    'us-east': number;
    'us-west': number;
    'eu-west': number;
    'eu-central': number;
    'asia-pacific': number;
    'other': number;
  };

  @Prop({ default: {} })
  utilizationStats: {
    averageCpuUtilization: number;
    averageRamUtilization: number;
    averageStorageUtilization: number;
    averageNetworkUtilization: number;
  };

  @Prop({ default: {} })
  slaStats: {
    totalViolations: number;
    averageUptime: number;
    averageLatency: number;
    complianceRate: number;
  };

  @Prop({ default: {} })
  pricingStats: {
    averagePricePerHour: string;
    minPricePerHour: string;
    maxPricePerHour: string;
    priceTrend: string; // up, down, stable
  };

  @Prop({ default: {} })
  performanceMetrics: {
    averageResponseTime: number;
    errorRate: number;
    throughput: number;
    availability: number;
  };
}

export const AnalyticsSchema = SchemaFactory.createForClass(Analytics);
