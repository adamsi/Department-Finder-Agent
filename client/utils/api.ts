import axios, { AxiosError, AxiosResponse } from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => Promise.reject(error)
);

export const handleAxiosError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; detail?: string | { msg: string }[] }>;
    const detail = axiosError.response?.data?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    if (Array.isArray(detail) && detail[0]?.msg) {
      return detail.map((d) => d.msg).join(', ');
    }
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

export async function loginWithPasskey(passkey: string): Promise<void> {
  await api.post('/auth/login', { passkey });
}

export default api;
