import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { 
  CreateBookingDto, 
  UpdateBookingDto, 
  BookingFiltersDto,
  BookingMetricsDto,
  BookingReviewDto,
  CancelBookingDto,
  BookingStatusUpdateDto
} from './dto/booking.dto';

@ApiTags('bookings')
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid booking data' })
  async create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingService.create(createBookingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bookings' })
  @ApiResponse({ status: 200, description: 'Bookings retrieved successfully' })
  async findAll(@Query() filters: BookingFiltersDto) {
    return this.bookingService.findAll(filters);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active bookings' })
  @ApiResponse({ status: 200, description: 'Active bookings retrieved successfully' })
  async getActiveBookings() {
    return this.bookingService.getActiveBookings();
  }

  @Get('expired')
  @ApiOperation({ summary: 'Get expired bookings' })
  @ApiResponse({ status: 200, description: 'Expired bookings retrieved successfully' })
  async getExpiredBookings() {
    return this.bookingService.getExpiredBookings();
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get booking analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  async getBookingAnalytics() {
    return this.bookingService.getBookingAnalytics();
  }

  @Get('user/:walletAddress/:role')
  @ApiOperation({ summary: 'Get user bookings by role' })
  @ApiResponse({ status: 200, description: 'User bookings retrieved successfully' })
  async getUserBookings(
    @Param('walletAddress') walletAddress: string,
    @Param('role') role: 'consumer' | 'provider'
  ) {
    return this.bookingService.getUserBookings(walletAddress, role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiResponse({ status: 200, description: 'Booking retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async findOne(@Param('id') id: string) {
    return this.bookingService.findById(id);
  }

  @Get('booking-id/:bookingId')
  @ApiOperation({ summary: 'Get booking by booking ID' })
  @ApiResponse({ status: 200, description: 'Booking retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async findByBookingId(@Param('bookingId') bookingId: number) {
    return this.bookingService.findByBookingId(bookingId);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update booking' })
  @ApiResponse({ status: 200, description: 'Booking updated successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
    return this.bookingService.update(id, updateBookingDto);
  }

  @Put(':id/status')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update booking status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async updateStatus(@Param('id') id: string, @Body() statusDto: BookingStatusUpdateDto) {
    return this.bookingService.updateStatus(id, statusDto.status, statusDto.reason);
  }

  @Put(':id/metrics')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update booking metrics' })
  @ApiResponse({ status: 200, description: 'Metrics updated successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async updateMetrics(@Param('id') id: string, @Body() metrics: BookingMetricsDto) {
    return this.bookingService.updateMetrics(id, metrics);
  }

  @Put(':id/review')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add review to booking' })
  @ApiResponse({ status: 200, description: 'Review added successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async addReview(@Param('id') id: string, @Body() review: BookingReviewDto) {
    const reviewData = {
      ...review,
      timestamp: new Date(),
    };
    return this.bookingService.addReview(id, reviewData);
  }

  @Put(':id/cancel')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel booking' })
  @ApiResponse({ status: 200, description: 'Booking cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Booking cannot be cancelled' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async cancelBooking(@Param('id') id: string, @Body() cancelDto: CancelBookingDto) {
    return this.bookingService.cancelBooking(id, cancelDto.reason, cancelDto.cancelledBy);
  }

  @Put(':id/complete')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete booking' })
  @ApiResponse({ status: 200, description: 'Booking completed successfully' })
  @ApiResponse({ status: 400, description: 'Booking is not active' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async completeBooking(@Param('id') id: string) {
    return this.bookingService.completeBooking(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete booking' })
  @ApiResponse({ status: 204, description: 'Booking deleted successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async delete(@Param('id') id: string) {
    await this.bookingService.delete(id);
  }
}
