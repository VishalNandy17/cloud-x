import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Resource, ResourceSchema } from '../resource/resource.schema';
import { Booking, BookingSchema } from '../booking/booking.schema';
import { User, UserSchema } from '../user/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Resource.name, schema: ResourceSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: User.name, schema: UserSchema }
    ])
  ],
  providers: [AnalyticsService],
  exports: [AnalyticsService]
})
export class AnalyticsModule {}
