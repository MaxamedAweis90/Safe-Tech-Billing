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

// Token Refresh Mutex State & Queue
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Standardize error payloads & perform silent JWT token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: string; message?: string; success?: boolean }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const errorData = error.response?.data;

    let message =
      errorData?.message ||
      errorData?.error ||
      error.message ||
      'An unexpected network error occurred';

    // Handle 401 Unauthenticated Transitions with Automatic Silent Refresh
    if (status === 401 && originalRequest) {
      const authHeader = originalRequest.headers?.Authorization?.toString() || '';
      const requestUrl = originalRequest.url || '';

      // Skip silent refresh for auth endpoints & prototype demo tokens
      const isAuthEndpoint =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/signup') ||
        requestUrl.includes('/auth/google') ||
        requestUrl.includes('/auth/refresh') ||
        requestUrl.includes('/team/accept-invite');

      if (!authHeader.includes('demo_token') && !isAuthEndpoint && !originalRequest._retry) {
        if (isRefreshing) {
          // If a refresh is already underway, wait for it and retry
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: (newToken: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${newToken}`;
                }
                resolve(api(originalRequest));
              },
              reject: (err) => reject(err),
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Attempt silent session refresh via HTTP-only cookie
          const refreshRes = await axios.post<{
            success: boolean;
            token: string;
          }>(
            '/api/v1/auth/refresh',
            {},
            { withCredentials: true }
          );

          if (refreshRes.data?.success && refreshRes.data.token) {
            const newToken = refreshRes.data.token;
            localStorage.setItem('safetech_token', newToken);

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }

            processQueue(null, newToken);
            return api(originalRequest);
          } else {
            throw new Error('Refresh response missing token');
          }
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          localStorage.removeItem('safetech_token');
          localStorage.removeItem('safetech_is_demo');
          localStorage.removeItem('safetech_auth_session');

          toast('Your session has expired. Please sign in to continue.', true);
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.history.replaceState(null, '', '/login');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
          return Promise.reject(new ApiError('Session expired', 401, errorData));
        } finally {
          isRefreshing = false;
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
