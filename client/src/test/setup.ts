import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: jest.fn(),
    pop: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    isFallback: false,
  }),
}));

// Mock Web3 providers
jest.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0x1234567890123456789012345678901234567890',
    isConnected: true,
  }),
  useConnect: () => ({
    connect: jest.fn(),
  }),
  useDisconnect: () => ({
    disconnect: jest.fn(),
  }),
  useContractRead: () => ({
    data: '0.1',
    isLoading: false,
    error: null,
  }),
  useContractWrite: () => ({
    write: jest.fn(),
    isLoading: false,
    error: null,
  }),
}));

// Mock API calls
jest.mock('../src/app/api/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// Global test setup
beforeAll(() => {
  // Setup any global test configuration
});

afterAll(() => {
  // Cleanup any global test configuration
});

afterEach(() => {
  jest.clearAllMocks();
});