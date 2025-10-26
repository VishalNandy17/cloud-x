import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from './booking.schema';
import { CreateBookingDto, UpdateBookingDto, BookingFiltersDto } from './dto/booking.dto';
import { ResourceService } from '../resource/resource.service';
import { UserService } from '../user/user.service';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class BookingService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private resourceService: ResourceService,
    private userService: UserService,
    private blockchainService: BlockchainService,
  ) {}

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    // Validate resource exists and is available
    const resource = await this.resourceService.findById(createBookingDto.resourceId);
    if (!resource.isActive) {
      throw new BadRequestException('Resource is not available');
    }

    // Check if resource is already booked for the requested time
    const conflictingBooking = await this.bookingModel.findOne({
      resourceId: createBookingDto.resourceId,
      status: { $in: ['pending', 'active'] },
      $or: [
        {
          startTime: { $lt: createBookingDto.endTime },
          endTime: { $gt: createBookingDto.startTime }
        }
      ]
    });

    if (conflictingBooking) {
      throw new BadRequestException('Resource is already booked for the requested time period');
    }

    // Calculate total cost
    const pricePerHour = parseFloat(resource.pricePerHour);
    const duration = createBookingDto.duration;
    const totalCost = (pricePerHour * duration).toString();

    // Create escrow on blockchain
    const escrowId = await this.blockchainService.createEscrow(
      resource.provider,
      createBookingDto.consumer,
      totalCost,
      duration
    );

    const booking = new this.bookingModel({
      ...createBookingDto,
      provider: resource.provider,
      totalCost,
      escrowId,
      resourceSpecs: {
        cpu: resource.cpu,
        ram: resource.ram,
        storage: resource.storage,
        resourceType: resource.resourceType,
      },
      sla: resource.sla,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return booking.save();
  }

  async findAll(filters: BookingFiltersDto = {}): Promise<Booking[]> {
    const query: any = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.consumer) {
      query.consumer = filters.consumer;
    }

    if (filters.provider) {
      query.provider = filters.provider;
    }

    if (filters.resourceId) {
      query.resourceId = filters.resourceId;
    }

    if (filters.startDate && filters.endDate) {
      query.startTime = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate),
      };
    }

    return this.bookingModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<Booking> {
    const booking = await this.bookingModel.findById(id).exec();
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }
    return booking;
  }

  async findByBookingId(bookingId: number): Promise<Booking> {
    const booking = await this.bookingModel.findOne({ bookingId }).exec();
    if (!booking) {
      throw new NotFoundException(`Booking with booking ID ${bookingId} not found`);
    }
    return booking;
  }

  async update(id: string, updateBookingDto: UpdateBookingDto): Promise<Booking> {
    const booking = await this.bookingModel
      .findByIdAndUpdate(id, { ...updateBookingDto, updatedAt: new Date() }, { new: true })
      .exec();
    
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }
    return booking;
  }

  async updateStatus(id: string, status: string, reason?: string): Promise<Booking> {
    const updateData: any = { status, updatedAt: new Date() };

    if (status === 'cancelled') {
      updateData.cancellationTime = new Date();
      updateData.cancellationReason = reason;
    } else if (status === 'completed') {
      updateData.completionTime = new Date();
    }

    const booking = await this.bookingModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    // Handle blockchain operations based on status
    if (status === 'completed') {
      await this.blockchainService.releaseEscrow(booking.escrowId);
    } else if (status === 'cancelled') {
      await this.blockchainService.refundEscrow(booking.escrowId);
    }

    return booking;
  }

  async updateMetrics(id: string, metrics: any): Promise<Booking> {
    const booking = await this.bookingModel
      .findByIdAndUpdate(
        id,
        { 
          metrics: {
            ...metrics,
            lastUpdated: new Date()
          },
          updatedAt: new Date()
        },
        { new: true }
      )
      .exec();
    
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    // Check SLA compliance
    await this.checkSLACompliance(booking);

    return booking;
  }

  async addReview(id: string, review: any): Promise<Booking> {
    const booking = await this.bookingModel
      .findByIdAndUpdate(
        id,
        { 
          $push: { reviews: review },
          updatedAt: new Date()
        },
        { new: true }
      )
      .exec();
    
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    // Update user reputation based on review
    const rating = review.rating;
    const reputationChange = (rating - 3) * 10; // Scale rating to reputation change
    await this.userService.updateReputation(booking.provider, reputationChange);

    return booking;
  }

  async getUserBookings(walletAddress: string, role: 'consumer' | 'provider'): Promise<Booking[]> {
    const query: any = {};
    query[role] = walletAddress;

    return this.bookingModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async getActiveBookings(): Promise<Booking[]> {
    return this.bookingModel.find({ status: 'active' }).exec();
  }

  async getExpiredBookings(): Promise<Booking[]> {
    const now = new Date();
    return this.bookingModel.find({
      status: 'active',
      endTime: { $lt: now }
    }).exec();
  }

  async cancelBooking(id: string, reason: string, cancelledBy: string): Promise<Booking> {
    const booking = await this.findById(id);
    
    if (booking.status !== 'pending' && booking.status !== 'active') {
      throw new BadRequestException('Booking cannot be cancelled');
    }

    // Check if user has permission to cancel
    if (cancelledBy !== booking.consumer && cancelledBy !== booking.provider) {
      throw new BadRequestException('Not authorized to cancel this booking');
    }

    return this.updateStatus(id, 'cancelled', reason);
  }

  async completeBooking(id: string): Promise<Booking> {
    const booking = await this.findById(id);
    
    if (booking.status !== 'active') {
      throw new BadRequestException('Booking is not active');
    }

    return this.updateStatus(id, 'completed');
  }

  async getBookingAnalytics(): Promise<any> {
    const analytics = await this.bookingModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalVolume: { $sum: { $toDouble: '$totalCost' } },
          averageDuration: { $avg: '$duration' },
        }
      }
    ]).exec();

    const totalBookings = await this.bookingModel.countDocuments();
    const activeBookings = await this.bookingModel.countDocuments({ status: 'active' });
    const completedBookings = await this.bookingModel.countDocuments({ status: 'completed' });

    return {
      totalBookings,
      activeBookings,
      completedBookings,
      statusBreakdown: analytics,
    };
  }

  private async checkSLACompliance(booking: Booking): Promise<void> {
    const { metrics, sla } = booking;
    
    if (!metrics || !sla) return;

    const violations = [];

    // Check uptime
    if (metrics.uptime < sla.uptimeTarget) {
      violations.push('Uptime below target');
    }

    // Check resource utilization
    if (metrics.cpuUsage > 90) {
      violations.push('High CPU usage');
    }

    if (metrics.ramUsage > 90) {
      violations.push('High RAM usage');
    }

    if (violations.length > 0) {
      // Update SLA violations count
      await this.bookingModel.findByIdAndUpdate(
        booking._id,
        { 
          $inc: { 'sla.violations': violations.length },
          updatedAt: new Date()
        }
      );

      // Report to blockchain
      await this.blockchainService.reportSLAViolation(
        booking.bookingId,
        violations.join(', ')
      );
    }
  }

  async delete(id: string): Promise<void> {
    const result = await this.bookingModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }
  }
}
