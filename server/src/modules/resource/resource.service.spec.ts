import { Test, TestingModule } from '@nestjs/testing';
import { ResourceService } from '../modules/resource/resource.service';
import { getModelToken } from '@nestjs/mongoose';
import { Resource } from '../modules/resource/resource.schema';

describe('ResourceService', () => {
  let service: ResourceService;

  const mockResourceModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    aggregate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourceService,
        {
          provide: getModelToken(Resource.name),
          useValue: mockResourceModel,
        },
      ],
    }).compile();

    service = module.get<ResourceService>(ResourceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a resource', async () => {
    const mockResource = {
      resourceType: 'compute',
      cpu: 4,
      ram: 8,
      storage: 100,
      pricePerHour: 0.1,
    };

    mockResourceModel.create.mockResolvedValue(mockResource);

    const result = await service.create(mockResource, '0x123');
    expect(result).toEqual(mockResource);
  });
});
