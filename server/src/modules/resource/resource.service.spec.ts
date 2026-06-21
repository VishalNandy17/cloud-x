import { Test, TestingModule } from '@nestjs/testing';
import { ResourceService } from './resource.service';
import { getModelToken } from '@nestjs/mongoose';
import { Resource } from './resource.schema';
import { BlockchainService } from '../blockchain/blockchain.service';

describe('ResourceService', () => {
  let service: ResourceService;

  const mockResourceModel = {
    create: jest.fn(),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          skip: jest.fn().mockResolvedValue([]),
        }),
      }),
    }),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    aggregate: jest.fn().mockResolvedValue([]),
  };

  const mockBlockchainService = {
    listResource: jest.fn(),
    updateReputation: jest.fn(),
    reportSLAViolation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourceService,
        {
          provide: getModelToken(Resource.name),
          useValue: mockResourceModel,
        },
        {
          provide: BlockchainService,
          useValue: mockBlockchainService,
        },
      ],
    }).compile();

    service = module.get<ResourceService>(ResourceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a resource successfully', async () => {
    const mockResource = {
      resourceType: 'compute',
      cpu: 4,
      ram: 8,
      storage: 100,
      pricePerHour: 0.1,
    };

    const createdResource = {
      ...mockResource,
      _id: '507f1f77bcf86cd799439011',
      resourceId: 1,
      provider: '0x123',
      isActive: true,
      reputation: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockResourceModel.create.mockResolvedValue(createdResource);
    mockBlockchainService.listResource.mockResolvedValue({ txHash: '0x123' });

    const result = await service.create(mockResource, '0x123');
    
    expect(result).toEqual(createdResource);
    expect(mockResourceModel.create).toHaveBeenCalled();
    expect(mockBlockchainService.listResource).toHaveBeenCalled();
  });

  it('should find all resources with filters', async () => {
    const filters = { resourceType: 'compute' };
    const limit = 10;
    const offset = 0;

    const result = await service.findAll(filters, limit, offset);
    
    expect(result).toEqual([]);
    expect(mockResourceModel.find).toHaveBeenCalledWith(filters);
  });

  it('should find resource by id', async () => {
    const mockResource = {
      _id: '507f1f77bcf86cd799439011',
      resourceId: 1,
      provider: '0x123',
      resourceType: 'compute',
    };

    mockResourceModel.findById.mockResolvedValue(mockResource);

    const result = await service.findById('507f1f77bcf86cd799439011');
    
    expect(result).toEqual(mockResource);
    expect(mockResourceModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
  });

  it('should handle resource creation errors gracefully', async () => {
    const mockResource = {
      resourceType: 'compute',
      cpu: 4,
      ram: 8,
      storage: 100,
      pricePerHour: 0.1,
    };

    mockResourceModel.create.mockRejectedValue(new Error('Database error'));

    await expect(service.create(mockResource, '0x123')).rejects.toThrow('Database error');
  });
});