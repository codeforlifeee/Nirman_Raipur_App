import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from './api';

class AuthService {
  async login(credentials) {
    try {
      console.log('Attempting login with:', credentials.email);
      const response = await authAPI.login(credentials);
      console.log('Login response:', JSON.stringify(response, null, 2));

      // Backend returns: { success, message, data: { user, token } }
      const token = response.data?.token || response.token;
      const user = response.data?.user || response.user;

      if (token && user) {
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        console.log('Token and user data saved successfully');
        return { success: true, data: response };
      } else {
        console.error('No token or user in response:', response);
        throw new Error('Invalid response from server - no token received');
      }
    } catch (error) {
      console.error('Login error:', error.message);
      console.error('Full error:', error);
      return { success: false, error: error.message || 'Login failed' };
    }
  }

  async logout() {
    try {
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getCurrentUser() {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');

      if (token && userData) {
        return {
          token,
          user: JSON.parse(userData),
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem('userToken');
      return !!token;
    } catch (error) {
      return false;
    }
  }
}

export default new AuthService();