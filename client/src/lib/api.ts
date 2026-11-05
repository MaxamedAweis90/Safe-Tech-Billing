import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from '../store/useUIStore';

export class ApiError extends Error {
  status?: number;
  data?: any;

  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Central Axios API Client configured for Safe Tech Billing API v1.
 * Base URL: /api/v1, Timeout: 15000ms, withCredentials: true.
 */
export const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request Interceptor: Attach Bearer Token from localStorage or state
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('safetech_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Standardize error payloads and handle 401 unauthenticated transitions
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; message?: string; success?: boolean }>) => {
    const status = error.response?.status;
    const errorData = error.response?.data;

    let message =
      errorData?.message ||
      errorData?.error ||
      error.message ||
      'An unexpected network error occurred';

    // Handle 401 unauthenticated transitions
    if (status === 401) {
      const authHeader = error.config?.headers?.Authorization?.toString() || '';
      if (!authHeader.includes('demo_token')) {
        localStorage.removeItem('safetech_token');
        if (
          !error.config?.url?.includes('/auth/me') &&
          !error.config?.url?.includes('/auth/login') &&
          !error.config?.url?.includes('/auth/google')
        ) {
          toast('Your session has expired or requires authentication.', true);
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.history.replaceState(null, '', '/login');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        }
      }
    } else if (status === 403) {
      toast("You don't have permission to perform this action.", true);
    }

    return Promise.reject(new ApiError(message, status, errorData));
  }
);

/**
 * Standard typed API response interface matching backend controllers
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

export default api;
