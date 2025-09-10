import api from './api';

export const moderationService = {
  // Obtenir tous les cours en attente de modération
  async getCoursEnAttente() {
    const response = await api.get('/moderation/cours/en-attente');
    return response.data.data;
  },

  // Approuver un cours
  async approuverCours(coursId: string, commentaire?: string) {
    const response = await api.put(`/moderation/cours/${coursId}/approuver`, {
      commentaire
    });
    return response.data;
  },

  // Rejeter un cours
  async rejeterCours(coursId: string, commentaire: string) {
    const response = await api.put(`/moderation/cours/${coursId}/rejeter`, {
      commentaire
    });
    return response.data;
  },

  // Suspendre un cours
  async suspendreCours(coursId: string, commentaire?: string) {
    const response = await api.put(`/moderation/cours/${coursId}/suspendre`, {
      commentaire
    });
    return response.data;
  },

  // Supprimer un cours
  async supprimerCours(coursId: string, commentaire?: string) {
    const response = await api.delete(`/moderation/cours/${coursId}/supprimer`, {
      data: { commentaire }
    });
    return response.data;
  },

  // Obtenir l'historique de modération
  async getHistoriqueModeration(page = 1, limit = 10, statut?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    if (statut && statut !== 'tous') {
      params.append('statut', statut);
    }

    const response = await api.get(`/moderation/cours/historique?${params}`);
    return response.data.data;
  },

  // Obtenir les statistiques de modération
  async getStatistiquesModeration() {
    const response = await api.get('/moderation/cours/statistiques');
    return response.data.data;
  }
};
