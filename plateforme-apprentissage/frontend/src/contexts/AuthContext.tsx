import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { authService } from '../services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authService.getCurrentUser()
        .then(setUser)
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Tentative de connexion avec:', email);
      const response = await authService.login(email, password);
      console.log('Réponse de connexion:', response);
      
      if (response.success && response.token && response.user) {
        localStorage.setItem('token', response.token);
        setUser(response.user);
        
        console.log('Utilisateur connecté:', response.user);
        
        // Redirection selon le rôle de l'utilisateur
        const userRole = response.user.role;
        console.log('Redirection pour le rôle:', userRole);
        
        switch (userRole) {
          case 'admin':
            window.location.href = '/admin';
            break;
          case 'formateur':
            window.location.href = '/formateur';
            break;
          case 'apprenant':
            window.location.href = '/apprenant';
            break;
          case 'entreprise':
            window.location.href = '/entreprise';
            break;
          default:
            window.location.href = '/dashboard';
        }
      } else {
        throw new Error('Réponse de connexion invalide');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    }
  };

  const register = async (userData: Partial<User> & { password?: string }) => {
    try {
      console.log('Tentative d\'inscription avec:', userData);
      const response = await authService.register(userData);
      console.log('Réponse d\'inscription:', response);
      
      if (response.success && response.token && response.user) {
        localStorage.setItem('token', response.token);
        setUser(response.user);
        
        console.log('Utilisateur inscrit:', response.user);
        
        // Redirection selon le rôle de l'utilisateur après inscription
        const userRole = response.user.role;
        console.log('Redirection pour le rôle:', userRole);
        
        switch (userRole) {
          case 'admin':
            window.location.href = '/admin';
            break;
          case 'formateur':
            window.location.href = '/formateur';
            break;
          case 'apprenant':
            window.location.href = '/apprenant';
            break;
          case 'entreprise':
            window.location.href = '/entreprise';
            break;
          default:
            window.location.href = '/dashboard';
        }
      } else {
        throw new Error('Réponse d\'inscription invalide');
      }
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    // Redirection vers la page d'accueil après déconnexion
    window.location.href = '/';
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
