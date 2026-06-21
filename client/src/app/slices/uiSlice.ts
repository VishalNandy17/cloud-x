import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timestamp: number;
}

export interface UiState {
  theme: 'dark';
  sidebarOpen: boolean;
  activeModal: string | null;
  notifications: Notification[];
  isLoading: boolean;
}

const initialState: UIState = {
  theme: 'dark',
  sidebarOpen: false,
  activeModal: null,
  notifications: [],
  isLoading: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    openModal: (state, action: PayloadAction<string>) => {
      state.activeModal = action.payload;
    },
    closeModal: (state) => {
      state.activeModal = null;
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'timestamp'>>) => {
      state.notifications.push({
        ...action.payload,
        timestamp: Date.now(),
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  openModal,
  closeModal,
  addNotification,
  removeNotification,
  setGlobalLoading,
} = uiSlice.actions;

export default uiSlice.reducer;
