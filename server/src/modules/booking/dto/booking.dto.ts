import { IsString, IsNumber, IsDateString, IsOptional, IsBoolean, Min, Max, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ description: 'ID of the resource to book' })
  @IsNumber()
  resourceId: number;

  @ApiProperty({ description: 'Wallet address of the consumer' })
  @IsString()
  consumer: string;

  @ApiProperty({ description: 'Start time of the booking' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ description: 'End time of the booking' })
  @IsDateString()
  endTime: string;

  @ApiProperty({ description: 'Duration of the booking in hours' })
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiPropertyOptional({ description: 'Additional metadata for the booking' })
  @IsOptional()
  metadata?: {
    region?: string;
    instanceType?: string;
    os?: string;
    additionalNotes?: string;
  };
}

export class UpdateBookingDto {
  @ApiPropertyOptional({ description: 'Status of the booking' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Cancellation reason' })
  @IsOptional()
  @IsString()
  cancellationReason?: string;

  @ApiPropertyOptional({ description: 'Cancellation time' })
  @IsOptional()
  @IsDateString()
  cancellationTime?: string;

  @ApiPropertyOptional({ description: 'Completion time' })
  @IsOptional()
  @IsDateString()
  completionTime?: string;

  @ApiPropertyOptional({ description: 'Whether the booking is disputed' })
  @IsOptional()
  @IsBoolean()
  isDisputed?: boolean;

  @ApiPropertyOptional({ description: 'Reason for dispute' })
  @IsOptional()
  @IsString()
  disputeReason?: string;
}

export class BookingFiltersDto {
  @ApiPropertyOptional({ description: 'Status of the booking' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Wallet address of the consumer' })
  @IsOptional()
  @IsString()
  consumer?: string;

  @ApiPropertyOptional({ description: 'Wallet address of the provider' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ description: 'ID of the resource' })
  @IsOptional()
  @IsNumber()
  resourceId?: number;

  @ApiPropertyOptional({ description: 'Start date filter' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date filter' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class BookingMetricsDto {
  @ApiPropertyOptional({ description: 'CPU usage percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  cpuUsage?: number;

  @ApiPropertyOptional({ description: 'RAM usage percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  ramUsage?: number;

  @ApiPropertyOptional({ description: 'Storage usage percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  storageUsage?: number;

  @ApiPropertyOptional({ description: 'Network usage in Mbps' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  networkUsage?: number;

  @ApiPropertyOptional({ description: 'Uptime percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  uptime?: number;
}

export class BookingReviewDto {
  @ApiProperty({ description: 'Wallet address of the reviewer' })
  @IsString()
  reviewer: string;

  @ApiProperty({ description: 'Rating from 1 to 5' })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Review comment' })
  @IsString()
  comment: string;
}

export class CancelBookingDto {
  @ApiProperty({ description: 'Reason for cancellation' })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'Wallet address of the person cancelling' })
  @IsString()
  cancelledBy: string;
}

export enum BookingStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
}

export class BookingStatusUpdateDto {
  @ApiProperty({ description: 'New status for the booking', enum: BookingStatus })
  @IsEnum(BookingStatus)
  status: BookingStatus;

  @ApiPropertyOptional({ description: 'Reason for status change' })
  @IsOptional()
  @IsString()
  reason?: string;
}
