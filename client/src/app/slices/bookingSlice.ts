import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Booking {
  id: string;
  bookingId: number;
  resourceId: number;
  consumer: string;
  provider: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalCost: string;
  escrowId: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'disputed';
  resourceSpecs: {
    cpu: number;
    ram: number;
    storage: number;
    resourceType: string;
  };
  metrics?: {
    cpuUsage: number;
    ramUsage: number;
    storageUsage: number;
    networkUsage: number;
    uptime: number;
    lastUpdated: string;
  };
  sla?: {
    uptimeTarget: number;
    latencyTarget: number;
    availabilityTarget: number;
    violations: number;
  };
  cancellationReason?: string;
  cancellationTime?: string;
  completionTime?: string;
  isDisputed: boolean;
  disputeReason?: string;
  reviews: Array<{
    reviewer: string;
    rating: number;
    comment: string;
    timestamp: string;
  }>;
  metadata?: {
    region: string;
    instanceType: string;
    os: string;
    additionalNotes: string;
  };
}

interface BookingState {
  bookings: Booking[];
  selectedBooking: Booking | null;
  filters: {
    status?: string;
    consumer?: string;
    provider?: string;
    resourceId?: number;
    startDate?: string;
    endDate?: string;
  };
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

const initialState: BookingState = {
  bookings: [],
  selectedBooking: null,
  filters: {},
  isLoading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  pageSize: 10,
};

const bookingSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    setBookings: (state, action: PayloadAction<Booking[]>) => {
      state.bookings = action.payload;
    },
    addBooking: (state, action: PayloadAction<Booking>) => {
      state.bookings.unshift(action.payload);
      state.totalCount += 1;
    },
    updateBooking: (state, action: PayloadAction<Booking>) => {
      const index = state.bookings.findIndex(b => b.id === action.payload.id);
      if (index !== -1) {
        state.bookings[index] = action.payload;
      }
      if (state.selectedBooking?.id === action.payload.id) {
        state.selectedBooking = action.payload;
      }
    },
    removeBooking: (state, action: PayloadAction<string>) => {
      state.bookings = state.bookings.filter(b => b.id !== action.payload);
      state.totalCount -= 1;
    },
    setSelectedBooking: (state, action: PayloadAction<Booking | null>) => {
      state.selectedBooking = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<BookingState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.currentPage = 1;
    },
    clearFilters: (state) => {
      state.filters = {};
      state.currentPage = 1;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setTotalCount: (state, action: PayloadAction<number>) => {
      state.totalCount = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
      state.currentPage = 1;
    },
    updateBookingMetrics: (state, action: PayloadAction<{ id: string; metrics: any }>) => {
      const booking = state.bookings.find(b => b.id === action.payload.id);
      if (booking) {
        booking.metrics = action.payload.metrics;
      }
      if (state.selectedBooking?.id === action.payload.id) {
        state.selectedBooking.metrics = action.payload.metrics;
      }
    },
    addReview: (state, action: PayloadAction<{ bookingId: string; review: any }>) => {
      const booking = state.bookings.find(b => b.id === action.payload.bookingId);
      if (booking) {
        booking.reviews.push(action.payload.review);
      }
      if (state.selectedBooking?.id === action.payload.bookingId) {
        state.selectedBooking.reviews.push(action.payload.review);
      }
    },
  },
});

export const {
  setBookings,
  addBooking,
  updateBooking,
  removeBooking,
  setSelectedBooking,
  setFilters,
  clearFilters,
  setLoading,
  setError,
  setTotalCount,
  setCurrentPage,
  setPageSize,
  updateBookingMetrics,
  addReview,
} = bookingSlice.actions;

export default bookingSlice.reducer;
