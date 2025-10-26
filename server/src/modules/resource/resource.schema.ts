import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ResourceDocument = Resource & Document;

@Schema({ timestamps: true })
export class Resource {
  @Prop({ required: true })
  resourceId: number;

  @Prop({ required: true })
  provider: string;

  @Prop({ required: true })
  resourceType: string;

  @Prop({ required: true })
  cpu: number;

  @Prop({ required: true })
  ram: number;

  @Prop({ required: true })
  storage: number;

  @Prop({ required: true })
  pricePerHour: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 100 })
  reputation: number;

  @Prop()
  metadata: string;

  @Prop({ default: {} })
  metrics: {
    cpuUsage: number;
    ramUsage: number;
    storageUsage: number;
    networkUsage: number;
    lastUpdated: Date;
  };

  @Prop({ default: {} })
  sla: {
    uptimeTarget: number;
    latencyTarget: number;
    availabilityTarget: number;
  };
}

export const ResourceSchema = SchemaFactory.createForClass(Resource);