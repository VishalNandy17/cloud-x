import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resource, ResourceDocument } from './resource.schema';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class ResourceService {
  constructor(
    @InjectModel(Resource.name) private resourceModel: Model<ResourceDocument>,
    private blockchainService: BlockchainService,
  ) {}

  async create(resourceData: Partial<Resource>): Promise<Resource> {
    const resource = new this.resourceModel(resourceData);
    return resource.save();
  }

  async findAll(filters: any = {}): Promise<Resource[]> {
    return this.resourceModel.find(filters).exec();
  }

  async findById(id: number): Promise<Resource> {
    const resource = await this.resourceModel.findOne({ resourceId: id }).exec();
    if (!resource) {
      throw new NotFoundException(`Resource #${id} not found`);
    }
    return resource;
  }

  async update(id: number, updateData: Partial<Resource>): Promise<Resource> {
    const resource = await this.resourceModel
      .findOneAndUpdate({ resourceId: id }, updateData, { new: true })
      .exec();
    if (!resource) {
      throw new NotFoundException(`Resource #${id} not found`);
    }
    return resource;
  }

  async updateMetrics(id: number, metrics: any): Promise<Resource> {
    const resource = await this.resourceModel
      .findOneAndUpdate(
        { resourceId: id },
        { 
          $set: { 
            'metrics': {
              ...metrics,
              lastUpdated: new Date()
            }
          }
        },
        { new: true }
      )
      .exec();
    
    if (!resource) {
      throw new NotFoundException(`Resource #${id} not found`);
    }

    // Check SLA compliance
    this.checkSLACompliance(resource);

    return resource;
  }

  async delete(id: number): Promise<void> {
    const result = await this.resourceModel.deleteOne({ resourceId: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Resource #${id} not found`);
    }
  }

  private async checkSLACompliance(resource: Resource): Promise<void> {
    const { metrics, sla } = resource;
    
    if (!metrics || !sla) return;

    const violations = [];

    // Check CPU utilization
    if (metrics.cpuUsage > 90) {
      violations.push('High CPU usage');
    }

    // Check RAM utilization
    if (metrics.ramUsage > 90) {
      violations.push('High RAM usage');
    }

    // Check Storage utilization
    if (metrics.storageUsage > 90) {
      violations.push('High Storage usage');
    }

    if (violations.length > 0) {
      await this.blockchainService.reportSLAViolation(
        resource.resourceId,
        violations.join(', '),
      );
    }
  }

  async getAnalytics(): Promise<any> {
    const analytics = await this.resourceModel.aggregate([
      {
        $group: {
          _id: '$resourceType',
          count: { $sum: 1 },
          averagePrice: { $avg: { $toDouble: '$pricePerHour' } },
          totalResources: {
            $sum: {
              $cond: [{ $eq: ['$isActive', true] }, 1, 0]
            }
          }
        }
      }
    ]).exec();

    return analytics;
  }
}