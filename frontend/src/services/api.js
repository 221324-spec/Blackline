import axios from 'axios';
const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
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


api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const login = (credentials) => api.post('/api/auth/login', credentials);
export const register = (userData) => api.post('/api/auth/register', userData);
export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};


export const getTrades = (params) => api.get('/api/trades', { params });
export const getTrade = (id) => api.get(`/api/trades/${id}`);
export const createTrade = (tradeData) => api.post('/api/trades', tradeData);
export const updateTrade = (id, tradeData) => api.put(`/api/trades/${id}`, tradeData);
export const deleteTrade = (id) => api.delete(`/api/trades/${id}`);
export const addNote = (id, noteData) => api.post(`/api/trades/${id}/notes`, noteData);
export const deleteNote = (tradeId, noteId) => api.delete(`/api/trades/${tradeId}/notes/${noteId}`);


export const getMetrics = () => api.get('/api/metrics');


export const getResources = () => api.get('/api/resources');
export const createResource = (resourceData) => api.post('/api/resources', resourceData);
export const updateResource = (id, resourceData) => api.put(`/api/resources/${id}`, resourceData);
export const deleteResource = (id) => api.delete(`/api/resources/${id}`);


export const getPosts = () => api.get('/api/community');
export const createPost = (postData) => api.post('/api/community', postData);
export const updatePost = (id, postData) => api.put(`/api/community/${id}`, postData);
export const deletePost = (id) => api.delete(`/api/community/${id}`);
export const togglePostLike = (id) => api.post(`/api/community/${id}/like`);


export const getUsers = () => api.get('/api/admin/users');
export const blockUser = (id) => api.put(`/api/admin/users/${id}/block`);
export const unblockUser = (id) => api.put(`/api/admin/users/${id}/unblock`);


export const analyzeTrade = (id) => api.post(`/api/ai/analyze-trade/${id}`);
export const analyzePatterns = () => api.get('/api/ai/pattern-analysis');
export const getDailyAdvice = () => api.get('/api/ai/daily-advice');
export const identifyMistakes = (id) => api.post(`/api/ai/identify-mistakes/${id}`);
export const bulkAnalyze = () => api.post('/api/ai/bulk-analyze');


export default api;
