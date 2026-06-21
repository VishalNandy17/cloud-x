'use client';

import { createContext, useContext, ReactNode, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'loading') => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showLoading: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const showToast = (message: string, type: 'success' | 'error' | 'loading' = 'success') => {
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'loading':
        toast.loading(message);
        break;
      default:
        toast(message);
    }
  };

  const showSuccess = (message: string) => showToast(message, 'success');
  const showError = (message: string) => showToast(message, 'error');
  const showLoading = (message: string) => showToast(message, 'loading');

  const value: ToastContextType = {
    showToast,
    showSuccess,
    showError,
    showLoading,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
