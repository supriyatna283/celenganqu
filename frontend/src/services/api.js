import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  // Gunakan variabel environment di Vercel, jika tidak ada fallback ke localhost
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
