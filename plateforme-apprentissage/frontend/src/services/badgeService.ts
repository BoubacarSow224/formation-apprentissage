import api from './api';
import { Badge } from '../types';

export interface BadgeFilters {
  type?: 'apprentissage' | 'participation' | 'performance' | 'special';
  niveau?: 'bronze' | 'argent' | 'or' | 'platine';
  categorie?: string;
  obtenu?: boolean;
  dateObtention?: { depuis?: Date; jusqu?: Date };
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'dateObtention' | 'nom' | 'niveau' | 'points';
  sortOrder?: 'asc' | 'desc';
}

export interface BadgeResponse {
  badges: Badge[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const badgeService = {
  // Gestion des badges
  async getBadges(filters?: BadgeFilters): Promise<BadgeResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (typeof value === 'object' && !(value instanceof Date)) {
            Object.entries(value).forEach(([subKey, subValue]) => {
              if (subValue !== undefined && subValue !== null) {
                if (subValue instanceof Date) {
                  params.append(`${key}.${subKey}`, subValue.toISOString());
                } else {
                  params.append(`${key}.${subKey}`, subValue.toString());
                }
              }
            });
          } else if (value instanceof Date) {
            params.append(key, value.toISOString());
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }
    const response = await api.get(`/badges?${params.toString()}`);
    return response.data;
  },

  async getBadgeById(id: string): Promise<Badge> {
    const response = await api.get(`/badges/${id}`);
    return response.data;
  },

  async createBadge(badgeData: Partial<Badge>): Promise<Badge> {
    const response = await api.post('/badges', badgeData);
    return response.data;
  },

  async updateBadge(id: string, badgeData: Partial<Badge>): Promise<Badge> {
    const response = await api.put(`/badges/${id}`, badgeData);
    return response.data;
  },

  async deleteBadge(id: string): Promise<void> {
    await api.delete(`/badges/${id}`);
  },

  // Badges utilisateur
  async getMesBadges(): Promise<Badge[]> {
    const response = await api.get('/badges/mes-badges');
    return response.data;
  },

  async getBadgesObtenus(): Promise<Badge[]> {
    const response = await api.get('/badges/obtenus');
    return response.data;
  },

  async getBadgesDisponibles(): Promise<Badge[]> {
    const response = await api.get('/badges/disponibles');
    return response.data;
  },

  // Recherche
  async rechercherBadges(query: string, filters?: Partial<BadgeFilters>): Promise<BadgeResponse> {
    const params = new URLSearchParams();
    params.append('q', query);
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    const response = await api.get(`/badges/recherche?${params.toString()}`);
    return response.data;
  },

  // Statistiques
  async getStatistiquesBadges(): Promise<any> {
    const response = await api.get('/badges/statistiques');
    return response.data;
  }
};
