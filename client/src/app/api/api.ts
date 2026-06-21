import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as any).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'User',
    'Resource',
    'Booking',
    'Transaction',
    'Analytics',
    'Cloud',
  ],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),

    // User endpoints
    getUsers: builder.query({
      query: (params) => ({
        url: '/users',
        params,
      }),
      providesTags: ['User'],
    }),
    getUser: builder.query({
      query: (id) => `/users/${id}`,
      providesTags: ['User'],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ['User'],
    }),

    // Resource endpoints
    getResources: builder.query({
      query: (params) => ({
        url: '/resources',
        params,
      }),
      providesTags: ['Resource'],
    }),
    getResource: builder.query({
      query: (id) => `/resources/${id}`,
      providesTags: ['Resource'],
    }),
    createResource: builder.mutation({
      query: (resourceData) => ({
        url: '/resources',
        method: 'POST',
        body: resourceData,
      }),
      invalidatesTags: ['Resource'],
    }),
    updateResource: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/resources/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ['Resource'],
    }),
    deleteResource: builder.mutation({
      query: (id) => ({
        url: `/resources/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Resource'],
    }),

    // Booking endpoints
    getBookings: builder.query({
      query: (params) => ({
        url: '/bookings',
        params,
      }),
      providesTags: ['Booking'],
    }),
    getBooking: builder.query({
      query: (id) => `/bookings/${id}`,
      providesTags: ['Booking'],
    }),
    createBooking: builder.mutation({
      query: (bookingData) => ({
        url: '/bookings',
        method: 'POST',
        body: bookingData,
      }),
      invalidatesTags: ['Booking'],
    }),
    updateBooking: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/bookings/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ['Booking'],
    }),
    cancelBooking: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/bookings/${id}/cancel`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Booking'],
    }),

    // Analytics endpoints
    getAnalytics: builder.query({
      query: (params) => ({
        url: '/analytics',
        params,
      }),
      providesTags: ['Analytics'],
    }),
    getResourceAnalytics: builder.query({
      query: () => '/resources/analytics/overview',
      providesTags: ['Analytics'],
    }),
    getBookingAnalytics: builder.query({
      query: () => '/bookings/analytics',
      providesTags: ['Analytics'],
    }),

    // Cloud provider endpoints
    createAWSInstance: builder.mutation({
      query: (specs) => ({
        url: '/cloud/aws/instance',
        method: 'POST',
        body: specs,
      }),
      invalidatesTags: ['Cloud'],
    }),
    createAzureVM: builder.mutation({
      query: (specs) => ({
        url: '/cloud/azure/vm',
        method: 'POST',
        body: specs,
      }),
      invalidatesTags: ['Cloud'],
    }),
    createGCPInstance: builder.mutation({
      query: (specs) => ({
        url: '/cloud/gcp/instance',
        method: 'POST',
        body: specs,
      }),
      invalidatesTags: ['Cloud'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetUsersQuery,
  useGetUserQuery,
  useUpdateUserMutation,
  useGetResourcesQuery,
  useGetResourceQuery,
  useCreateResourceMutation,
  useUpdateResourceMutation,
  useDeleteResourceMutation,
  useGetBookingsQuery,
  useGetBookingQuery,
  useCreateBookingMutation,
  useUpdateBookingMutation,
  useCancelBookingMutation,
  useGetAnalyticsQuery,
  useGetResourceAnalyticsQuery,
  useGetBookingAnalyticsQuery,
  useCreateAWSInstanceMutation,
  useCreateAzureVMMutation,
  useCreateGCPInstanceMutation,
} = api;
