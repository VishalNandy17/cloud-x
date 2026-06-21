import { render, screen } from '@testing-library/react';
import Hero from '../components/home/Hero';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
}));

// Mock RainbowKit
jest.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: () => <button data-testid="connect-button">Connect Wallet</button>,
}));

// Mock wagmi
jest.mock('wagmi', () => ({
  useAccount: () => ({
    isConnected: false,
    address: undefined,
  }),
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  ArrowRightIcon: () => <div data-testid="arrow-icon" />,
  CloudIcon: () => <div data-testid="cloud-icon" />,
  ShieldCheckIcon: () => <div data-testid="shield-icon" />,
  CurrencyDollarIcon: () => <div data-testid="dollar-icon" />,
}));

describe('Hero Component', () => {
  it('renders hero section with main heading', () => {
    render(<Hero />);

    expect(screen.getByText(/Decentralized Cloud/i)).toBeInTheDocument();
    expect(screen.getByText(/Resource Marketplace/i)).toBeInTheDocument();
  });

  it('renders connect button when not connected', () => {
    render(<Hero />);

    expect(screen.getByTestId('connect-button')).toBeInTheDocument();
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });

  it('renders features section', () => {
    render(<Hero />);

    expect(screen.getByText('Decentralized Infrastructure')).toBeInTheDocument();
    expect(screen.getByText('Blockchain Security')).toBeInTheDocument();
    expect(screen.getByText('Cost Effective')).toBeInTheDocument();
  });

  it('renders statistics section', () => {
    render(<Hero />);

    expect(screen.getByText('12,847')).toBeInTheDocument();
    expect(screen.getByText('Active Resources')).toBeInTheDocument();
    expect(screen.getByText('$15.2M')).toBeInTheDocument();
    expect(screen.getByText('Total Value Locked')).toBeInTheDocument();
  });

  it('renders all feature icons', () => {
    render(<Hero />);

    expect(screen.getByTestId('cloud-icon')).toBeInTheDocument();
    expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
    expect(screen.getByTestId('dollar-icon')).toBeInTheDocument();
  });
});