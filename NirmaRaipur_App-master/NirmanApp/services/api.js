import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL comes from Expo public env var for flexibility across web/native
// EXPO_PUBLIC_API_URL should be like: https://nirman-raipur-app.vercel.app/api
const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || '').trim() || 'https://nirman-raipur-app.vercel.app/api';

console.log('=== API Configuration ===');
console.log('BASE_URL:', BASE_URL);
console.log('Environment:', process.env.NODE_ENV);
console.log('========================');

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // Increased timeout to 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      // Only log for non-login requests to reduce console noise
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('API Response Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });

    // Network error
    if (!error.response) {
      console.error('Network Error: Cannot reach server at', BASE_URL);
      error.message = 'Cannot connect to server. Please check your internet connection and ensure the backend is running.';
    }

    if (error.response?.status === 401) {
      // Token expired, logout user
      await AsyncStorage.multiRemove(['userToken', 'userData']);
    }
    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  login: async (credentials) => {
    try {
      console.log('API: Sending login request to:', `${BASE_URL}/auth/login`);
      console.log('API: With credentials:', { email: credentials.email, password: '***' });
      const response = await api.post('/auth/login', credentials);
      console.log('API: Login response received:', response.status);
      return response.data;
    } catch (error) {
      console.error('API: Login error:', error.message);
      console.error('API: Error response:', error.response?.data);
      console.error('API: Error status:', error.response?.status);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(errorMessage);
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },
};

export const workAPI = {
  getWorkProposals: async () => {
    try {
      const response = await api.get('/work-proposals');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch work proposals');
    }
  },

  getWorkProposal: async (id) => {
    try {
      const response = await api.get(`/work-proposals/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch work proposal');
    }
  },

  updateWorkProposal: async (id, updateData) => {
    try {
      const response = await api.put(`/work-proposals/${id}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update work proposal');
    }
  },

  submitProgress: async (id, progressData) => {
    try {
      const formData = new FormData();

      // Add images if present (backend expects 'images' field, max 5)
      if (progressData.images && progressData.images.length > 0) {
        progressData.images.forEach((image, index) => {
          formData.append('images', {
            uri: image.uri,
            type: image.type || 'image/jpeg',
            name: image.name || `progress_image_${index}.jpg`,
          });
        });
      }

      // Add document if present (backend expects 'document' field)
      if (progressData.document) {
        formData.append('document', {
          uri: progressData.document.uri,
          type: progressData.document.type || 'application/pdf',
          name: progressData.document.name || 'document.pdf',
        });
      }

      // Add other fields
      if (progressData.desc) formData.append('desc', progressData.desc);
      if (progressData.sanctionedAmount) formData.append('sanctionedAmount', progressData.sanctionedAmount.toString());
      if (progressData.totalAmountReleasedSoFar) formData.append('totalAmountReleasedSoFar', progressData.totalAmountReleasedSoFar.toString());
      if (progressData.remainingBalance) formData.append('remainingBalance', progressData.remainingBalance.toString());
      if (progressData.expenditureAmount) formData.append('expenditureAmount', progressData.expenditureAmount.toString());
      if (progressData.mbStageMeasurementBookStag) formData.append('mbStageMeasurementBookStag', progressData.mbStageMeasurementBookStag);
      
      // Add installments as JSON string
      if (progressData.installments && progressData.installments.length > 0) {
        formData.append('installments', JSON.stringify(progressData.installments));
      }

      // Add GPS location (if required by backend)
      if (progressData.latitude) formData.append('latitude', progressData.latitude.toString());
      if (progressData.longitude) formData.append('longitude', progressData.longitude.toString());

      const response = await api.post(`/work-proposals/${id}/progress`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Submit progress error:', error.response?.data || error);
      throw new Error(error.response?.data?.message || 'Failed to submit progress');
    }
  },

  getWorkProgress: async (id) => {
    try {
      const response = await api.get(`/work-proposals/${id}/progress`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch work progress');
    }
  },
};

export default api;