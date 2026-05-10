import axios, { AxiosError, AxiosResponse } from 'axios';
import { HARDCODED_USER_ID } from '@/utils/app/user';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  config.headers['X-User-Id'] = HARDCODED_USER_ID;
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => Promise.reject(error)
);

export const handleAxiosError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    if (axiosError.response?.status === 404) {
      return 'Resource not found';
    }
    if (axiosError.response?.status === 500) {
      return 'Server error';
    }
    return axiosError.message || 'Network error';
  }
  return 'Network error';
};

export default api;
