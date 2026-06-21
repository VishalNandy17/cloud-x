import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Resource {
  id: number;
  provider: string;
  resourceType: string;
  cpu: number;
  ram: number;
  storage: number;
  pricePerHour: string;
  isActive: boolean;
  reputation: number;
  metadata?: string;
  metrics?: {
    cpuUsage: number;
    ramUsage: number;
    storageUsage: number;
    networkUsage: number;
    lastUpdated: string;
  };
  sla?: {
    uptimeTarget: number;
    latencyTarget: number;
    availabilityTarget: number;
  };
}

interface ResourceState {
  resources: Resource[];
  selectedResource: Resource | null;
  filters: {
    resourceType?: string;
    minCpu?: number;
    maxCpu?: number;
    minRam?: number;
    maxRam?: number;
    minPrice?: number;
    maxPrice?: number;
    provider?: string;
  };
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

const initialState: ResourceState = {
  resources: [],
  selectedResource: null,
  filters: {},
  isLoading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  pageSize: 12,
};

const resourceSlice = createSlice({
  name: 'resources',
  initialState,
  reducers: {
    setResources: (state, action: PayloadAction<Resource[]>) => {
      state.resources = action.payload;
    },
    addResource: (state, action: PayloadAction<Resource>) => {
      state.resources.unshift(action.payload);
      state.totalCount += 1;
    },
    updateResource: (state, action: PayloadAction<Resource>) => {
      const index = state.resources.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.resources[index] = action.payload;
      }
      if (state.selectedResource?.id === action.payload.id) {
        state.selectedResource = action.payload;
      }
    },
    removeResource: (state, action: PayloadAction<number>) => {
      state.resources = state.resources.filter(r => r.id !== action.payload);
      state.totalCount -= 1;
    },
    setSelectedResource: (state, action: PayloadAction<Resource | null>) => {
      state.selectedResource = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<ResourceState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.currentPage = 1; // Reset to first page when filters change
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
      state.currentPage = 1; // Reset to first page when page size changes
    },
    updateResourceMetrics: (state, action: PayloadAction<{ id: number; metrics: any }>) => {
      const resource = state.resources.find(r => r.id === action.payload.id);
      if (resource) {
        resource.metrics = action.payload.metrics;
      }
      if (state.selectedResource?.id === action.payload.id) {
        state.selectedResource.metrics = action.payload.metrics;
      }
    },
  },
});

export const {
  setResources,
  addResource,
  updateResource,
  removeResource,
  setSelectedResource,
  setFilters,
  clearFilters,
  setLoading,
  setError,
  setTotalCount,
  setCurrentPage,
  setPageSize,
  updateResourceMetrics,
} = resourceSlice.actions;

export default resourceSlice.reducer;
