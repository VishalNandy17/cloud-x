import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ required: true })
  transactionId: string;

  @Prop({ required: true })
  txHash: string;

  @Prop({ required: true })
  from: string;

  @Prop({ required: true })
  to: string;

  @Prop({ required: true })
  amount: string;

  @Prop({ required: true })
  token: string; // ETH, USDC, USDT, DCX

  @Prop({ required: true })
  type: string; // booking, escrow_release, escrow_refund, platform_fee, reward

  @Prop({ required: true })
  status: string; // pending, confirmed, failed

  @Prop({ required: true })
  blockNumber: number;

  @Prop({ required: true })
  gasUsed: string;

  @Prop({ required: true })
  gasPrice: string;

  @Prop({ default: null })
  bookingId: number;

  @Prop({ default: null })
  escrowId: number;

  @Prop({ default: null })
  resourceId: number;

  @Prop({ default: {} })
  metadata: {
    description: string;
    category: string;
    tags: string[];
  };

  @Prop({ default: Date.now })
  timestamp: Date;

  @Prop({ default: null })
  confirmedAt: Date;

  @Prop({ default: null })
  failedAt: Date;

  @Prop({ default: null })
  failureReason: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
