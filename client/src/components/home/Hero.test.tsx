import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Hero from '../components/home/Hero';

// Mock store
const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: (state = { user: null, isAuthenticated: false }, action) => state,
    },
  });
};

describe('Hero Component', () => {
  it('renders hero section', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <Hero />
      </Provider>
    );

    expect(screen.getByText(/D-CloudX/i)).toBeInTheDocument();
  });
});
