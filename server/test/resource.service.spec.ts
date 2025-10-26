import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ResourceService } from '../resource.service';
import { BlockchainService } from '../../blockchain/blockchain.service';
import { Resource, ResourceDocument } from '../resource.schema';

describe('ResourceService', () => {
  let service: ResourceService;
  let resourceModel: any;
  let blockchainService: any;

  const mockResource = {
    _id: '507f1f77bcf86cd799439011',
    resourceId: 1,
    provider: '0x1234567890123456789012345678901234567890',
    resourceType: 'compute',
    cpu: 4,
    ram: 8,
    storage: 100,
    pricePerHour: 0.1,
    isActive: true,
    reputation: 100,
    metadata: { description: 'High-performance compute instance' },
    metrics: {
      cpuUsage: 50,
      ramUsage: 60,
      storageUsage: 30,
      networkUsage: 10,
      lastUpdated: new Date()
    },
    sla: {
      uptimeTarget: 99.9,
      latencyTarget: 100,
      availabilityTarget: 99.5
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockResourceModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    aggregate: jest.fn()
  };

  const mockBlockchainService = {
    listResource: jest.fn(),
    updateReputation: jest.fn(),
    reportSLAViolation: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourceService,
        {
          provide: getModelToken(Resource.name),
          useValue: mockResourceModel
        },
        {
          provide: BlockchainService,
          useValue: mockBlockchainService
        }
      ]
    }).compile();

    service = module.get<ResourceService>(ResourceService);
    resourceModel = module.get(getModelToken(Resource.name));
    blockchainService = module.get<BlockchainService>(BlockchainService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new resource', async () => {
      const createResourceDto = {
        resourceType: 'compute',
        cpu: 4,
        ram: 8,
        storage: 100,
        pricePerHour: 0.1,
        metadata: { description: 'High-performance compute instance' }
      };

      mockResourceModel.create.mockResolvedValue(mockResource);
      mockBlockchainService.listResource.mockResolvedValue({ txHash: '0x123' });

      const result = await service.create(createResourceDto, '0x1234567890123456789012345678901234567890');

      expect(mockResourceModel.create).toHaveBeenCalledWith({
        ...createResourceDto,
        provider: '0x1234567890123456789012345678901234567890',
        resourceId: expect.any(Number),
        isActive: true,
        reputation: 100,
        metrics: {
          cpuUsage: 0,
          ramUsage: 0,
          storageUsage: 0,
          networkUsage: 0,
          lastUpdated: expect.any(Date)
        },
        sla: {
          uptimeTarget: 99.9,
          latencyTarget: 100,
          availabilityTarget: 99.5
        }
      });
      expect(mockBlockchainService.listResource).toHaveBeenCalled();
      expect(result).toEqual(mockResource);
    });

    it('should throw error if blockchain service fails', async () => {
      const createResourceDto = {
        resourceType: 'compute',
        cpu: 4,
        ram: 8,
        storage: 100,
        pricePerHour: 0.1,
        metadata: { description: 'High-performance compute instance' }
      };

      mockResourceModel.create.mockResolvedValue(mockResource);
      mockBlockchainService.listResource.mockRejectedValue(new Error('Blockchain error'));

      await expect(
        service.create(createResourceDto, '0x1234567890123456789012345678901234567890')
      ).rejects.toThrow('Blockchain error');
    });
  });

  describe('findAll', () => {
    it('should return all resources with filters', async () => {
      const filters = {
        resourceType: 'compute',
        minPrice: 0.05,
        maxPrice: 0.2,
        isActive: true
      };

      mockResourceModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockResolvedValue([mockResource])
          })
        })
      });

      const result = await service.findAll(filters, 10, 0);

      expect(mockResourceModel.find).toHaveBeenCalledWith({
        resourceType: 'compute',
        pricePerHour: { $gte: 0.05, $lte: 0.2 },
        isActive: true
      });
      expect(result).toEqual([mockResource]);
    });

    it('should return all resources without filters', async () => {
      mockResourceModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockResolvedValue([mockResource])
          })
        })
      });

      const result = await service.findAll({}, 10, 0);

      expect(mockResourceModel.find).toHaveBeenCalledWith({});
      expect(result).toEqual([mockResource]);
    });
  });

  describe('findById', () => {
    it('should return a resource by ID', async () => {
      mockResourceModel.findById.mockResolvedValue(mockResource);

      const result = await service.findById('507f1f77bcf86cd799439011');

      expect(mockResourceModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockResource);
    });

    it('should return null if resource not found', async () => {
      mockResourceModel.findById.mockResolvedValue(null);

      const result = await service.findById('507f1f77bcf86cd799439011');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a resource', async () => {
      const updateData = {
        pricePerHour: 0.15,
        metadata: { description: 'Updated description' }
      };

      mockResourceModel.findOneAndUpdate.mockResolvedValue({
        ...mockResource,
        ...updateData
      });

      const result = await service.update('507f1f77bcf86cd799439011', updateData);

      expect(mockResourceModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: '507f1f77bcf86cd799439011' },
        { ...updateData, updatedAt: expect.any(Date) },
        { new: true }
      );
      expect(result).toEqual({ ...mockResource, ...updateData });
    });
  });

  describe('updateMetrics', () => {
    it('should update resource metrics and check SLA compliance', async () => {
      const metrics = {
        cpuUsage: 80,
        ramUsage: 70,
        storageUsage: 40,
        networkUsage: 20
      };

      mockResourceModel.findById.mockResolvedValue(mockResource);
      mockResourceModel.findOneAndUpdate.mockResolvedValue({
        ...mockResource,
        metrics: { ...metrics, lastUpdated: expect.any(Date) }
      });

      const result = await service.updateMetrics(1, metrics);

      expect(mockResourceModel.findById).toHaveBeenCalledWith(1);
      expect(mockResourceModel.findOneAndUpdate).toHaveBeenCalledWith(
        { resourceId: 1 },
        {
          'metrics.cpuUsage': 80,
          'metrics.ramUsage': 70,
          'metrics.storageUsage': 40,
          'metrics.networkUsage': 20,
          'metrics.lastUpdated': expect.any(Date)
        },
        { new: true }
      );
      expect(result).toEqual({
        ...mockResource,
        metrics: { ...metrics, lastUpdated: expect.any(Date) }
      });
    });
  });

  describe('checkSLACompliance', () => {
    it('should report SLA violation when uptime is below target', async () => {
      const resourceWithLowUptime = {
        ...mockResource,
        metrics: {
          ...mockResource.metrics,
          uptime: 95.0 // Below 99.9% target
        }
      };

      mockBlockchainService.reportSLAViolation.mockResolvedValue({ txHash: '0x456' });

      await service['checkSLACompliance'](resourceWithLowUptime);

      expect(mockBlockchainService.reportSLAViolation).toHaveBeenCalledWith(
        1,
        'uptime',
        95.0
      );
    });

    it('should not report SLA violation when uptime is above target', async () => {
      const resourceWithGoodUptime = {
        ...mockResource,
        metrics: {
          ...mockResource.metrics,
          uptime: 99.95 // Above 99.9% target
        }
      };

      await service['checkSLACompliance'](resourceWithGoodUptime);

      expect(mockBlockchainService.reportSLAViolation).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a resource', async () => {
      mockResourceModel.findByIdAndDelete.mockResolvedValue(mockResource);

      const result = await service.delete('507f1f77bcf86cd799439011');

      expect(mockResourceModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockResource);
    });
  });

  describe('getAnalytics', () => {
    it('should return resource analytics', async () => {
      const mockAnalytics = [
        { _id: 'compute', count: 10, avgPrice: 0.12 },
        { _id: 'storage', count: 5, avgPrice: 0.08 }
      ];

      mockResourceModel.aggregate.mockResolvedValue(mockAnalytics);

      const result = await service.getAnalytics();

      expect(mockResourceModel.aggregate).toHaveBeenCalledWith([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$resourceType',
            count: { $sum: 1 },
            avgPrice: { $avg: '$pricePerHour' },
            avgReputation: { $avg: '$reputation' }
          }
        },
        { $sort: { count: -1 } }
      ]);
      expect(result).toEqual(mockAnalytics);
    });
  });
});
