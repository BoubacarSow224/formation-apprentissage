import api from './api';
import { Quiz } from '../types';

export interface QuizResultat {
  score: number;
  noteObtenue: number;
  reussi: boolean;
  reponses: Record<string, any>;
  tempsEcoule?: number;
  feedback?: string;
}

export interface QuizTentative {
  _id: string;
  quiz: string;
  utilisateur: string;
  reponses: Record<string, any>;
  score: number;
  noteObtenue: number;
  reussi: boolean;
  tempsEcoule: number;  
  dateCreation: Date;
}

export interface QuizStatistiques {
  nombreTentatives: number;
  meilleurScore: number;
  scoreMoyen: number;
  tempsPasseTotal: number;
  derniereTentative?: Date;
}

 const quizService = {
  // Gestion des quiz
  async getQuizById(id: string): Promise<Quiz> {
    const response = await api.get(`/quiz/${id}`);
    return response.data;
  },

  async getAllQuiz(): Promise<Quiz[]> {
    const response = await api.get('/quiz');
    return response.data;
  },

  async getQuizzesByCours(coursId: string): Promise<Quiz[]> {
    const response = await api.get(`/cours/${coursId}/quiz`);
    return response.data;
  },

  async createQuiz(quizData: Partial<Quiz>): Promise<Quiz> {
    const response = await api.post('/quiz', quizData);
    return response.data;
  },

  async updateQuiz(id: string, quizData: Partial<Quiz>): Promise<Quiz> {
    const response = await api.put(`/quiz/${id}`, quizData);
    return response.data;
  },

  async deleteQuiz(id: string): Promise<void> {
    await api.delete(`/quiz/${id}`);
  },

  // Gestion des tentatives
  async soumettreReponses(quizId: string, reponses: Record<string, any>, tempsEcoule?: number): Promise<QuizResultat> {
    const response = await api.post(`/quiz/${quizId}/submit`, { 
      reponses,
      tempsEcoule 
    });
    return response.data;
  },

  async getTentativesUtilisateur(quizId: string): Promise<QuizTentative[]> {
    const response = await api.get(`/quiz/${quizId}/tentatives`);
    return response.data;
  },

  async getNombreTentativesUtilisateur(quizId: string): Promise<number> {
    const response = await api.get(`/quiz/${quizId}/tentatives/count`);
    return response.data.count;
  },

  async getTentativeById(tentativeId: string): Promise<QuizTentative> {
    const response = await api.get(`/quiz/tentatives/${tentativeId}`);
    return response.data;
  },

  // Résultats et statistiques
  async getResultatsUtilisateur(quizId: string): Promise<QuizResultat[]> {
    const response = await api.get(`/quiz/${quizId}/resultats`);
    return response.data;
  },

  async getMeilleurScore(quizId: string): Promise<number> {
    const response = await api.get(`/quiz/${quizId}/meilleur-score`);
    return response.data.score;
  },

  async getStatistiquesQuiz(quizId: string): Promise<QuizStatistiques> {
    const response = await api.get(`/quiz/${quizId}/statistiques`);
    return response.data;
  },

  async getStatistiquesUtilisateur(): Promise<any> {
    const response = await api.get('/quiz/mes-statistiques');
    return response.data;
  },

  // Vérifications et validations
  async verifierDisponibilite(quizId: string): Promise<boolean> {
    const response = await api.get(`/quiz/${quizId}/disponible`);
    return response.data.disponible;
  },

  async verifierTentativesRestantes(quizId: string): Promise<number> {
    const response = await api.get(`/quiz/${quizId}/tentatives-restantes`);
    return response.data.tentativesRestantes;
  },

  async commencerQuiz(quizId: string): Promise<{ sessionId: string; tempsDebut: Date }> {
    const response = await api.post(`/quiz/${quizId}/commencer`);
    return response.data;
  },

  async sauvegarderProgression(quizId: string, sessionId: string, reponses: Record<string, any>): Promise<void> {
    await api.put(`/quiz/${quizId}/progression`, {
      sessionId,
      reponses
    });
  },

  async recupererProgression(quizId: string, sessionId: string): Promise<Record<string, any>> {
    const response = await api.get(`/quiz/${quizId}/progression/${sessionId}`);
    return response.data.reponses;
  },

  // Gestion des questions
  async ajouterQuestion(quizId: string, question: any): Promise<Quiz> {
    const response = await api.post(`/quiz/${quizId}/questions`, question);
    return response.data;
  },

  async modifierQuestion(quizId: string, questionIndex: number, question: any): Promise<Quiz> {
    const response = await api.put(`/quiz/${quizId}/questions/${questionIndex}`, question);
    return response.data;
  },

  async supprimerQuestion(quizId: string, questionIndex: number): Promise<Quiz> {
    const response = await api.delete(`/quiz/${quizId}/questions/${questionIndex}`);
    return response.data;
  },

  // Fonctionnalités avancées
  async dupliquerQuiz(quizId: string, nouveauTitre: string): Promise<Quiz> {
    const response = await api.post(`/quiz/${quizId}/dupliquer`, { titre: nouveauTitre });
    return response.data;
  },

  async exporterResultats(quizId: string, format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    const response = await api.get(`/quiz/${quizId}/export`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  },

  async genererRapport(quizId: string): Promise<any> {
    const response = await api.get(`/quiz/${quizId}/rapport`);
    return response.data;
  },

  // Quiz publics et partagés
  async getQuizPublics(): Promise<Quiz[]> {
    const response = await api.get('/quiz/publics');
    return response.data;
  },

  async partagerQuiz(quizId: string, utilisateurs: string[]): Promise<void> {
    await api.post(`/quiz/${quizId}/partager`, { utilisateurs });
  },

  async retirerPartage(quizId: string, utilisateurId: string): Promise<void> {
    await api.delete(`/quiz/${quizId}/partager/${utilisateurId}`);
  }
};
 export default quizService;
