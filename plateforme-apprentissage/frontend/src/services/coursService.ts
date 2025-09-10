import api from './api';
import { Cours } from '../types';

export interface CoursFilters {
  niveau?: string;
  categorie?: string;
  search?: string;
  prix?: { min?: number; max?: number };
  duree?: { min?: number; max?: number };
  note?: number;
  page?: number;
  limit?: number;
  sortBy?: 'titre' | 'dateCreation' | 'prix' | 'note' | 'duree';
  sortOrder?: 'asc' | 'desc';
}

export interface CoursResponse {
  cours: Cours[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ModuleProgression {
  moduleId: string;
  completed: boolean;
  progression: number;
  timeSpent: number;
  lastAccessed: Date;
}

export interface CoursProgression {
  coursId: string;
  progression: number;
  modules: ModuleProgression[];
  timeSpent: number;
  lastAccessed: Date;
  completed: boolean;
  dateCompletion?: Date;
  certificatUrl?: string;
}

export interface Evaluation {
  _id: string;
  utilisateur: string;
  cours: string;
  note: number;
  commentaire: string;
  dateEvaluation: Date;
  utile: number;
}

export const coursService = {
  // Gestion des cours
  async getCours(filters?: CoursFilters): Promise<CoursResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (typeof value === 'object' && !(value instanceof Date)) {
            Object.entries(value).forEach(([subKey, subValue]) => {
              if (subValue !== undefined && subValue !== null) {
                params.append(`${key}.${subKey}`, subValue.toString());
              }
            });
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }
    const response = await api.get(`/cours?${params.toString()}`);
    return response.data;
  },

  async getCoursById(id: string): Promise<Cours> {
    const response = await api.get(`/cours/${id}`);
    return response.data;
  },

  async createCours(coursData: Partial<Cours>): Promise<Cours> {
    const response = await api.post('/cours', coursData);
    return response.data;
  },

  async updateCours(id: string, coursData: Partial<Cours>): Promise<Cours> {
    const response = await api.put(`/cours/${id}`, coursData);
    return response.data;
  },

  async deleteCours(id: string): Promise<void> {
    await api.delete(`/cours/${id}`);
  },

  async dupliquerCours(id: string, nouveauTitre: string): Promise<Cours> {
    const response = await api.post(`/cours/${id}/dupliquer`, { titre: nouveauTitre });
    return response.data;
  },

  // Inscription et gestion des étudiants
  async inscrireCours(coursId: string): Promise<void> {
    await api.post(`/cours/${coursId}/inscription`);
  },

  async desinscrireCours(coursId: string): Promise<void> {
    await api.delete(`/cours/${coursId}/inscription`);
  },

  async getCoursInscrits(): Promise<Cours[]> {
    const response = await api.get('/cours/mes-cours');
    return response.data;
  },

  async getEtudiantsInscrits(coursId: string): Promise<any[]> {
    const response = await api.get(`/cours/${coursId}/etudiants`);
    return response.data;
  },

  async inscrireEtudiantsBulk(coursId: string, userIds: string[]): Promise<void> {
    await api.post(`/cours/${coursId}/inscription-bulk`, { userIds });
  },

  // Progression et suivi
  async getProgression(coursId?: string): Promise<CoursProgression[]> {
    const endpoint = coursId ? `/cours/${coursId}/progression` : '/cours/progression';
    const response = await api.get(endpoint);
    return response.data;
  },

  async updateProgression(coursId: string, moduleId: string, progression: number): Promise<void> {
    await api.put(`/cours/${coursId}/modules/${moduleId}/progression`, { progression });
  },

  async marquerModuleComplete(coursId: string, moduleId: string): Promise<void> {
    await api.put(`/cours/${coursId}/modules/${moduleId}/complete`);
  },

  async marquerCoursComplete(coursId: string): Promise<CoursProgression> {
    const response = await api.put(`/cours/${coursId}/complete`);
    return response.data;
  },

  async genererCertificat(coursId: string): Promise<string> {
    const response = await api.post(`/cours/${coursId}/certificat`);
    return response.data.certificatUrl;
  },

  // Modules et contenu
  async getModules(coursId: string): Promise<any[]> {
    const response = await api.get(`/cours/${coursId}/modules`);
    return response.data;
  },

  async getModule(coursId: string, moduleId: string): Promise<any> {
    const response = await api.get(`/cours/${coursId}/modules/${moduleId}`);
    return response.data;
  },

  async createModule(coursId: string, moduleData: any): Promise<any> {
    const response = await api.post(`/cours/${coursId}/modules`, moduleData);
    return response.data;
  },

  async updateModule(coursId: string, moduleId: string, moduleData: any): Promise<any> {
    const response = await api.put(`/cours/${coursId}/modules/${moduleId}`, moduleData);
    return response.data;
  },

  async deleteModule(coursId: string, moduleId: string): Promise<void> {
    await api.delete(`/cours/${coursId}/modules/${moduleId}`);
  },

  async reorderModules(coursId: string, moduleIds: string[]): Promise<void> {
    await api.put(`/cours/${coursId}/modules/reorder`, { moduleIds });
  },

  // Évaluations et avis
  async getEvaluations(coursId: string): Promise<Evaluation[]> {
    const response = await api.get(`/cours/${coursId}/evaluations`);
    return response.data;
  },

  async createEvaluation(coursId: string, evaluation: {
    note: number;
    commentaire: string;
  }): Promise<Evaluation> {
    const response = await api.post(`/cours/${coursId}/evaluations`, evaluation);
    return response.data;
  },

  async updateEvaluation(coursId: string, evaluationId: string, evaluation: {
    note: number;
    commentaire: string;
  }): Promise<Evaluation> {
    const response = await api.put(`/cours/${coursId}/evaluations/${evaluationId}`, evaluation);
    return response.data;
  },

  async deleteEvaluation(coursId: string, evaluationId: string): Promise<void> {
    await api.delete(`/cours/${coursId}/evaluations/${evaluationId}`);
  },

  async marquerEvaluationUtile(coursId: string, evaluationId: string): Promise<void> {
    await api.put(`/cours/${coursId}/evaluations/${evaluationId}/utile`);
  },

  // Recherche et filtres
  async rechercherCours(query: string, filters?: Partial<CoursFilters>): Promise<CoursResponse> {
    const params = new URLSearchParams();
    params.append('q', query);
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    const response = await api.get(`/cours/recherche?${params.toString()}`);
    return response.data;
  },

  async getCoursRecommandes(): Promise<Cours[]> {
    const response = await api.get('/cours/recommandes');
    return response.data;
  },

  async getCoursPopulaires(): Promise<Cours[]> {
    const response = await api.get('/cours/populaires');
    return response.data;
  },

  async getCoursRecents(): Promise<Cours[]> {
    const response = await api.get('/cours/recents');
    return response.data;
  },

  async getCoursSimilaires(coursId: string): Promise<Cours[]> {
    const response = await api.get(`/cours/${coursId}/similaires`);
    return response.data;
  },

  // Catégories et niveaux
  async getCategories(): Promise<string[]> {
    const response = await api.get('/cours/categories');
    return response.data;
  },

  async getNiveaux(): Promise<string[]> {
    const response = await api.get('/cours/niveaux');
    return response.data;
  },

  async getCoursParCategorie(categorie: string): Promise<Cours[]> {
    const response = await api.get(`/cours/categorie/${categorie}`);
    return response.data;
  },

  async getCoursParNiveau(niveau: string): Promise<Cours[]> {
    const response = await api.get(`/cours/niveau/${niveau}`);
    return response.data;
  },

  // Statistiques
  async getStatistiquesCours(coursId?: string): Promise<any> {
    const endpoint = coursId ? `/cours/${coursId}/statistiques` : '/cours/mes-statistiques';
    const response = await api.get(endpoint);
    return response.data;
  },

  async getStatistiquesGlobales(): Promise<any> {
    const response = await api.get('/cours/statistiques-globales');
    return response.data;
  },

  async getRapportProgression(coursId: string): Promise<any> {
    const response = await api.get(`/cours/${coursId}/rapport-progression`);
    return response.data;
  },

  // Favoris et listes de souhaits
  async ajouterAuxFavoris(coursId: string): Promise<void> {
    await api.post(`/cours/${coursId}/favoris`);
  },

  async retirerDesFavoris(coursId: string): Promise<void> {
    await api.delete(`/cours/${coursId}/favoris`);
  },

  async getFavoris(): Promise<Cours[]> {
    const response = await api.get('/cours/favoris');
    return response.data;
  },

  async ajouterALaListeDeSouhaits(coursId: string): Promise<void> {
    await api.post(`/cours/${coursId}/liste-souhaits`);
  },

  async retirerDeLaListeDeSouhaits(coursId: string): Promise<void> {
    await api.delete(`/cours/${coursId}/liste-souhaits`);
  },

  async getListeDeSouhaits(): Promise<Cours[]> {
    const response = await api.get('/cours/liste-souhaits');
    return response.data;
  },

  // Gestion des fichiers et ressources
  async uploadRessource(coursId: string, file: File, type: 'video' | 'document' | 'image'): Promise<string> {
    const formData = new FormData();
    formData.append('ressource', file);
    formData.append('type', type);
    
    const response = await api.post(`/cours/${coursId}/ressources`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.url;
  },

  async getRessources(coursId: string): Promise<any[]> {
    const response = await api.get(`/cours/${coursId}/ressources`);
    return response.data;
  },

  async deleteRessource(coursId: string, ressourceId: string): Promise<void> {
    await api.delete(`/cours/${coursId}/ressources/${ressourceId}`);
  },

  // Export et partage
  async exporterCours(coursId: string, format: 'pdf' | 'json' | 'scorm'): Promise<Blob> {
    const response = await api.get(`/cours/${coursId}/export`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  },

  async partagerCours(coursId: string, emails: string[], message?: string): Promise<void> {
    await api.post(`/cours/${coursId}/partager`, { emails, message });
  },

  async genererLienPartage(coursId: string, options?: {
    expiration?: Date;
    motDePasse?: string;
    limitUtilisations?: number;
  }): Promise<string> {
    const response = await api.post(`/cours/${coursId}/lien-partage`, options);
    return response.data.lien;
  },

  // Notifications et alertes
  async activerNotifications(coursId: string): Promise<void> {
    await api.put(`/cours/${coursId}/notifications/activer`);
  },

  async desactiverNotifications(coursId: string): Promise<void> {
    await api.put(`/cours/${coursId}/notifications/desactiver`);
  },

  async getNotifications(): Promise<any[]> {
    const response = await api.get('/cours/notifications');
    return response.data;
  },

  async marquerNotificationLue(notificationId: string): Promise<void> {
    await api.put(`/cours/notifications/${notificationId}/lu`);
  }
};
