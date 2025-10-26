import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { ResourceCard } from '../components/marketplace/ResourceCard';
import { resourceSlice } from '../app/slices/resourceSlice';

// Mock wagmi config
const config = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

// Mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      resource: resourceSlice.reducer,
    },
    preloadedState: {
      resource: {
        resources: [],
        loading: false,
        error: null,
        ...initialState.resource,
      },
    },
  });
};

// Mock query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock Web3 hooks
jest.mock('wagmi', () => ({
  ...jest.requireActual('wagmi'),
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
jest.mock('../app/api/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

const mockResource = {
  id: 1,
  resourceId: 1,
  provider: '0x1234567890123456789012345678901234567890',
  resourceType: 'compute',
  cpu: 4,
  ram: 8,
  storage: 100,
  pricePerHour: 0.1,
  isActive: true,
  reputation: 100,
  metadata: {
    description: 'High-performance compute instance',
    region: 'us-west-2',
    os: 'Ubuntu 20.04'
  },
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

const renderWithProviders = (component, initialState = {}) => {
  const store = createMockStore(initialState);
  
  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          {component}
        </WagmiProvider>
      </QueryClientProvider>
    </Provider>
  );
};

describe('ResourceCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders resource information correctly', () => {
    renderWithProviders(<ResourceCard resource={mockResource} />);

    expect(screen.getByText('High-performance compute instance')).toBeInTheDocument();
    expect(screen.getByText('4 CPU cores')).toBeInTheDocument();
    expect(screen.getByText('8 GB RAM')).toBeInTheDocument();
    expect(screen.getByText('100 GB Storage')).toBeInTheDocument();
    expect(screen.getByText('$0.10/hour')).toBeInTheDocument();
    expect(screen.getByText('Reputation: 100')).toBeInTheDocument();
  });

  it('displays resource metrics', () => {
    renderWithProviders(<ResourceCard resource={mockResource} />);

    expect(screen.getByText('CPU: 50%')).toBeInTheDocument();
    expect(screen.getByText('RAM: 60%')).toBeInTheDocument();
    expect(screen.getByText('Storage: 30%')).toBeInTheDocument();
    expect(screen.getByText('Network: 10%')).toBeInTheDocument();
  });

  it('shows SLA information', () => {
    renderWithProviders(<ResourceCard resource={mockResource} />);

    expect(screen.getByText('Uptime: 99.9%')).toBeInTheDocument();
    expect(screen.getByText('Latency: <100ms')).toBeInTheDocument();
    expect(screen.getByText('Availability: 99.5%')).toBeInTheDocument();
  });

  it('enables booking when user is connected', () => {
    renderWithProviders(<ResourceCard resource={mockResource} />);

    const bookButton = screen.getByRole('button', { name: /book resource/i });
    expect(bookButton).toBeEnabled();
  });

  it('disables booking when user is not connected', () => {
    // Mock disconnected state
    jest.mocked(require('wagmi').useAccount).mockReturnValue({
      address: undefined,
      isConnected: false,
    });

    renderWithProviders(<ResourceCard resource={mockResource} />);

    const bookButton = screen.getByRole('button', { name: /book resource/i });
    expect(bookButton).toBeDisabled();
  });

  it('handles booking click', async () => {
    const mockWrite = jest.fn();
    jest.mocked(require('wagmi').useContractWrite).mockReturnValue({
      write: mockWrite,
      isLoading: false,
      error: null,
    });

    renderWithProviders(<ResourceCard resource={mockResource} />);

    const bookButton = screen.getByRole('button', { name: /book resource/i });
    fireEvent.click(bookButton);

    await waitFor(() => {
      expect(mockWrite).toHaveBeenCalled();
    });
  });

  it('shows loading state during booking', () => {
    jest.mocked(require('wagmi').useContractWrite).mockReturnValue({
      write: jest.fn(),
      isLoading: true,
      error: null,
    });

    renderWithProviders(<ResourceCard resource={mockResource} />);

    const bookButton = screen.getByRole('button', { name: /booking.../i });
    expect(bookButton).toBeDisabled();
  });

  it('displays error message when booking fails', () => {
    const error = new Error('Transaction failed');
    jest.mocked(require('wagmi').useContractWrite).mockReturnValue({
      write: jest.fn(),
      isLoading: false,
      error,
    });

    renderWithProviders(<ResourceCard resource={mockResource} />);

    expect(screen.getByText('Transaction failed')).toBeInTheDocument();
  });

  it('shows resource status correctly', () => {
    renderWithProviders(<ResourceCard resource={mockResource} />);

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows inactive status for inactive resources', () => {
    const inactiveResource = { ...mockResource, isActive: false };
    renderWithProviders(<ResourceCard resource={inactiveResource} />);

    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('formats price correctly', () => {
    const expensiveResource = { ...mockResource, pricePerHour: 1.5 };
    renderWithProviders(<ResourceCard resource={expensiveResource} />);

    expect(screen.getByText('$1.50/hour')).toBeInTheDocument();
  });

  it('handles missing metadata gracefully', () => {
    const resourceWithoutMetadata = { ...mockResource, metadata: {} };
    renderWithProviders(<ResourceCard resource={resourceWithoutMetadata} />);

    expect(screen.getByText('4 CPU cores')).toBeInTheDocument();
    expect(screen.getByText('8 GB RAM')).toBeInTheDocument();
  });

  it('displays region information when available', () => {
    renderWithProviders(<ResourceCard resource={mockResource} />);

    expect(screen.getByText('Region: us-west-2')).toBeInTheDocument();
  });

  it('displays OS information when available', () => {
    renderWithProviders(<ResourceCard resource={mockResource} />);

    expect(screen.getByText('OS: Ubuntu 20.04')).toBeInTheDocument();
  });
});

describe('ResourceCard Integration', () => {
  it('integrates with Redux store correctly', () => {
    const initialState = {
      resource: {
        resources: [mockResource],
        loading: false,
        error: null,
      },
    };

    renderWithProviders(<ResourceCard resource={mockResource} />, initialState);

    expect(screen.getByText('High-performance compute instance')).toBeInTheDocument();
  });

  it('handles resource updates from store', () => {
    const updatedResource = { ...mockResource, pricePerHour: 0.15 };
    const initialState = {
      resource: {
        resources: [updatedResource],
        loading: false,
        error: null,
      },
    };

    renderWithProviders(<ResourceCard resource={updatedResource} />, initialState);

    expect(screen.getByText('$0.15/hour')).toBeInTheDocument();
  });
});
