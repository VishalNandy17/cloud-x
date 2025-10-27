import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AIRecommendationService } from './ai-recommendation.service';
import { AIController } from './ai.controller';
import { Resource, ResourceSchema } from '../resource/resource.schema';
import { Booking, BookingSchema } from '../booking/booking.schema';
import { User, UserSchema } from '../user/user.schema';
import { Analytics, AnalyticsSchema } from '../analytics/analytics.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Resource.name, schema: ResourceSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: User.name, schema: UserSchema },
      { name: Analytics.name, schema: AnalyticsSchema },
    ]),
  ],
  providers: [AIRecommendationService],
  controllers: [AIController],
  exports: [AIRecommendationService],
})
export class AIModule {}
