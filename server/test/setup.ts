import '@testing-library/jest-dom';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/dcloudx-test';
process.env.REDIS_URL = 'redis://localhost:6379';

// Mock external services
jest.mock('@nestjs/mongoose', () => ({
  InjectModel: () => () => ({}),
  getModelToken: () => 'MockModel',
}));

jest.mock('@nestjs/config', () => ({
  ConfigService: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockReturnValue('test-value'),
  })),
}));

// Global test setup
beforeAll(async () => {
  // Setup test database connection if needed
});

afterAll(async () => {
  // Cleanup test database connection if needed
});

afterEach(() => {
  jest.clearAllMocks();
});
