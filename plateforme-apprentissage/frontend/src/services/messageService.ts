import api from './api';
import { Message, Conversation } from '../types';

export interface MessageFilters {
  conversation?: string;
  auteur?: string;
  type?: 'texte' | 'image' | 'fichier';
  dateDebut?: Date;
  dateFin?: Date;
  lu?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ConversationFilters {
  type?: 'prive' | 'groupe';
  participant?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'derniereActivite' | 'dateCreation' | 'nom';
  sortOrder?: 'asc' | 'desc';
}

export interface MessageResponse {
  messages: Message[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ConversationResponse {
  conversations: Conversation[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const messageService = {
  // Gestion des conversations
  async getConversations(filters?: ConversationFilters): Promise<ConversationResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (value instanceof Date) {
            params.append(key, value.toISOString());
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }
    const response = await api.get(`/conversations?${params.toString()}`);
    return response.data;
  },

  async getConversationById(id: string): Promise<Conversation> {
    const response = await api.get(`/conversations/${id}`);
    return response.data;
  },

  async createConversation(conversationData: {
    participants: string[];
    type: 'prive' | 'groupe';
    nom?: string;
  }): Promise<Conversation> {
    const response = await api.post('/conversations', conversationData);
    return response.data;
  },

  async updateConversation(id: string, updates: {
    nom?: string;
    participants?: string[];
  }): Promise<Conversation> {
    const response = await api.put(`/conversations/${id}`, updates);
    return response.data;
  },

  async deleteConversation(id: string): Promise<void> {
    await api.delete(`/conversations/${id}`);
  },

  // Gestion des messages
  async getMessages(conversationId: string, filters?: MessageFilters): Promise<MessageResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (value instanceof Date) {
            params.append(key, value.toISOString());
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }
    const response = await api.get(`/conversations/${conversationId}/messages?${params.toString()}`);
    return response.data;
  },

  async envoyerMessage(conversationId: string, messageData: {
    contenu: string;
    type?: 'texte' | 'image' | 'fichier';
    fichier?: File;
  }): Promise<Message> {
    if (messageData.fichier) {
      const formData = new FormData();
      formData.append('contenu', messageData.contenu);
      formData.append('type', messageData.type || 'fichier');
      formData.append('fichier', messageData.fichier);
      
      const response = await api.post(`/conversations/${conversationId}/messages`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      const response = await api.post(`/conversations/${conversationId}/messages`, {
        contenu: messageData.contenu,
        type: messageData.type || 'texte'
      });
      return response.data;
    }
  },

  async supprimerMessage(conversationId: string, messageId: string): Promise<void> {
    await api.delete(`/conversations/${conversationId}/messages/${messageId}`);
  },

  async marquerCommeLu(conversationId: string, messageId?: string): Promise<void> {
    if (messageId) {
      await api.put(`/conversations/${conversationId}/messages/${messageId}/lu`);
    } else {
      await api.put(`/conversations/${conversationId}/marquer-lu`);
    }
  },

  // Recherche
  async rechercherMessages(query: string, filters?: Partial<MessageFilters>): Promise<MessageResponse> {
    const params = new URLSearchParams();
    params.append('q', query);
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (value instanceof Date) {
            params.append(key, value.toISOString());
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }
    const response = await api.get(`/messages/recherche?${params.toString()}`);
    return response.data;
  },

  // Notifications
  async getMessagesNonLus(): Promise<Message[]> {
    const response = await api.get('/messages/non-lus');
    return response.data;
  },

  async getNombreMessagesNonLus(): Promise<number> {
    const response = await api.get('/messages/non-lus/count');
    return response.data.count;
  }
};
