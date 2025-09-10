import api from './api';
import { User } from '../types';

interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/login', { email, password });
    return {
      token: response.data.token,
      user: response.data.user
    };
  },

  async register(userData: Partial<User> & { password?: string }): Promise<AuthResponse> {
    const response = await api.post('/auth/register', userData);
    return {
      token: response.data.token,
      user: response.data.user
    };
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data.user;
  },

  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await api.put('/auth/profile', userData);
    return response.data.user || response.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.put('/auth/change-password', { currentPassword, newPassword });
  }
};
