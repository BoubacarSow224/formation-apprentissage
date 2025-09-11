import api from './api';
import { User } from '../types';

interface AuthResponse {
  success: boolean;
  message?: string;
  token: string;
  user: User;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/login', { 
        email: email.trim().toLowerCase(), 
        password 
      });
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Erreur de connexion');
      }
    } catch (error: any) {
      console.error('Erreur lors de la connexion:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Erreur de connexion au serveur'
      );
    }
  },

  async register(userData: any): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/register', {
        ...userData,
        email: userData.email?.trim().toLowerCase(),
        nom: userData.nom?.trim(),
        telephone: userData.telephone?.trim()
      });
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Erreur d\'inscription');
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Erreur d\'inscription au serveur'
      );
    }
  },

  async getProfile(): Promise<User> {
    try {
      const response = await api.get('/auth/profile');
      
      if (response.data.success) {
        return response.data.user;
      } else {
        throw new Error(response.data.message || 'Erreur de récupération du profil');
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération du profil:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Erreur de récupération du profil'
      );
    }
  },

  async updateProfile(profileData: any): Promise<User> {
    try {
      const response = await api.put('/auth/profile', profileData);
      
      if (response.data.success) {
        return response.data.user;
      } else {
        throw new Error(response.data.message || 'Erreur de mise à jour du profil');
      }
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Erreur de mise à jour du profil'
      );
    }
  },

  async changePassword(passwordData: any): Promise<void> {
    try {
      const response = await api.put('/auth/change-password', passwordData);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur de changement de mot de passe');
      }
    } catch (error: any) {
      console.error('Erreur lors du changement de mot de passe:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Erreur de changement de mot de passe'
      );
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get('/auth/me');
      
      if (response.data.success) {
        return response.data.user;
      } else {
        throw new Error(response.data.message || 'Erreur de récupération des informations utilisateur');
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Erreur de récupération des informations utilisateur'
      );
    }
  }
  ,

  async logout(): Promise<void> {
    try {
      const response = await api.post('/auth/logout');
      if (!response.data?.success) {
        console.warn('Réponse de déconnexion non réussie:', response.data);
      }
    } catch (error: any) {
      // Ne pas bloquer la déconnexion locale si l'appel échoue
      console.error('Erreur lors de la déconnexion côté serveur:', error);
    }
  }
};
