import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const filesBase = apiBase.replace(/\/api\/?$/, '');
export const bagImageUrl = (path?: string | null): string | null => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path; // Cloudinary / absolute URL
  return `${filesBase}${path.startsWith('/') ? path : '/' + path}`;
};

export default api;
