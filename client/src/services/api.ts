import axios from 'axios';

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://127.0.0.1:5000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to add the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor to handle global errors (like 401/403)
let isRedirecting = false;

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't trigger redirect loop for login requests themselves
      if (!error.config.url.includes('/auth/login') && !isRedirecting) {
        isRedirecting = true;
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('bubble_pos_session');
        sessionStorage.removeItem('bubble_pos_session');
        
        window.location.hash = '#/login';
        window.location.reload();
      }
    }

    if (error.response && error.response.data) {
      const data = error.response.data;
      let msg = data.message || data.error || error.message;
      if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        const details = data.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ');
        msg = `${msg} - ${details}`;
      }
      error.message = msg;
    }

    return Promise.reject(error);
  }
);
