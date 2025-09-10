import api from './api';
import { OffreEmploi } from '../types';

export interface JobFilters {
  titre?: string;
  entreprise?: string;
  lieu?: string;
  typeContrat?: 'CDI' | 'CDD' | 'Stage' | 'Freelance';
  niveauExperience?: 'junior' | 'confirme' | 'senior';
  competences?: string[];
  salaire?: { min?: number; max?: number };
  datePublication?: { depuis?: Date; jusqu?: Date };
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'datePublication' | 'titre' | 'entreprise' | 'salaire';
  sortOrder?: 'asc' | 'desc';
}

export interface JobResponse {
  jobs: OffreEmploi[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Candidature {
  _id: string;
  offreEmploi: string;
  candidat: string;
  cv?: string;
  lettreMotivation?: string;
  statut: 'en_attente' | 'acceptee' | 'refusee' | 'en_cours';
  dateCandidature: Date;
  dateReponse?: Date;
  commentaires?: string;
}

export const jobsService = {
  // Gestion des offres d'emploi
  async getJobs(filters?: JobFilters): Promise<JobResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (typeof value === 'object' && !(value instanceof Date)) {
            if (Array.isArray(value)) {
              value.forEach(v => params.append(`${key}[]`, v.toString()));
            } else {
              Object.entries(value).forEach(([subKey, subValue]) => {
                if (subValue !== undefined && subValue !== null) {
                  if (subValue instanceof Date) {
                    params.append(`${key}.${subKey}`, subValue.toISOString());
                  } else {
                    params.append(`${key}.${subKey}`, subValue.toString());
                  }
                }
              });
            }
          } else if (value instanceof Date) {
            params.append(key, value.toISOString());
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }
    const response = await api.get(`/jobs?${params.toString()}`);
    return response.data;
  },

  async getJobById(id: string): Promise<OffreEmploi> {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  },

  async createJob(jobData: Partial<OffreEmploi>): Promise<OffreEmploi> {
    const response = await api.post('/jobs', jobData);
    return response.data;
  },

  async updateJob(id: string, jobData: Partial<OffreEmploi>): Promise<OffreEmploi> {
    const response = await api.put(`/jobs/${id}`, jobData);
    return response.data;
  },

  async deleteJob(id: string): Promise<void> {
    await api.delete(`/jobs/${id}`);
  },

  // Candidatures
  async postuler(jobId: string, candidatureData: {
    cv?: File;
    lettreMotivation?: string;
  }): Promise<Candidature> {
    const formData = new FormData();
    if (candidatureData.cv) {
      formData.append('cv', candidatureData.cv);
    }
    if (candidatureData.lettreMotivation) {
      formData.append('lettreMotivation', candidatureData.lettreMotivation);
    }

    const response = await api.post(`/jobs/${jobId}/candidatures`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getMesCandidatures(): Promise<Candidature[]> {
    const response = await api.get('/jobs/mes-candidatures');
    return response.data;
  },

  async getCandidature(jobId: string, candidatureId?: string): Promise<Candidature> {
    const endpoint = candidatureId 
      ? `/jobs/${jobId}/candidatures/${candidatureId}`
      : `/jobs/${jobId}/candidatures/ma-candidature`;
    const response = await api.get(endpoint);
    return response.data;
  },

  // Recherche et filtres
  async rechercherJobs(query: string, filters?: Partial<JobFilters>): Promise<JobResponse> {
    const params = new URLSearchParams();
    params.append('q', query);
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(`${key}[]`, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }
    const response = await api.get(`/jobs/recherche?${params.toString()}`);
    return response.data;
  },

  async getJobsRecommandes(): Promise<OffreEmploi[]> {
    const response = await api.get('/jobs/recommandes');
    return response.data;
  },

  async getJobsRecents(): Promise<OffreEmploi[]> {
    const response = await api.get('/jobs/recents');
    return response.data;
  },

  // Favoris
  async ajouterAuxFavoris(jobId: string): Promise<void> {
    await api.post(`/jobs/${jobId}/favoris`);
  },

  async retirerDesFavoris(jobId: string): Promise<void> {
    await api.delete(`/jobs/${jobId}/favoris`);
  },

  async getFavoris(): Promise<OffreEmploi[]> {
    const response = await api.get('/jobs/favoris');
    return response.data;
  },

  // Statistiques
  async getStatistiquesJobs(): Promise<any> {
    const response = await api.get('/jobs/statistiques');
    return response.data;
  }
};
