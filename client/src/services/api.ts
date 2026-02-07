import axios from 'axios';
import { auth } from '@/config/firebase';

// Auto-detect API URL: use env var if set, otherwise detect production vs local
const API_URL = import.meta.env.VITE_API_URL
  || (window.location.hostname !== 'localhost'
    ? 'https://personal-tracker-dun.vercel.app/api'
    : 'http://localhost:5000/api');

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Firebase token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log('API Request:', config.method?.toUpperCase(), config.url, config.data);
      return config;
    } catch (error) {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('Request interceptor setup error:', error);
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', error.message, error.config?.url, error.response?.data);
    if (error.response?.status === 401) {
      // Only sign out if it's NOT an auth-related endpoint (login/register)
      // and the user explicitly has an expired/invalid token
      console.warn('401 received - token may be expired. User can retry.');
    }
    return Promise.reject(error);
  }
);

// Habits API
export const habitsAPI = {
  getAll: () => api.get('/habits'),
  
  create: (habitData: any) => api.post('/habits', habitData),
  
  update: (id: string, habitData: any) => api.put(`/habits/${id}`, habitData),
  
  delete: (id: string) => api.delete(`/habits/${id}`),
  
  toggleDate: (id: string, date: string) =>
    api.patch(`/habits/${id}/toggle`, { date }),
};

// Tasks API
export const tasksAPI = {
  getAll: (date?: string) => 
    api.get('/tasks', { params: { date } }),
  
  create: (taskData: any) => api.post('/tasks', taskData),
  
  update: (id: string, taskData: any) => api.put(`/tasks/${id}`, taskData),
  
  delete: (id: string) => api.delete(`/tasks/${id}`),
  
  toggle: (id: string) => api.patch(`/tasks/${id}/toggle`),
};

export default api;
