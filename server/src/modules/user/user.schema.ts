import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  walletAddress: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  avatar: string;

  @Prop({ default: 'user' })
  role: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: 100 })
  reputation: number;

  @Prop({ default: 0 })
  totalTransactions: number;

  @Prop({ default: 0 })
  successfulTransactions: number;

  @Prop({ default: 0 })
  failedTransactions: number;

  @Prop({ default: {} })
  preferences: {
    notifications: boolean;
    emailUpdates: boolean;
    darkMode: boolean;
    language: string;
  };

  @Prop({ default: {} })
  profile: {
    bio: string;
    website: string;
    location: string;
    timezone: string;
  };

  @Prop({ default: [] })
  socialLinks: Array<{
    platform: string;
    url: string;
  }>;

  @Prop({ default: Date.now })
  lastLoginAt: Date;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
