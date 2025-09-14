import axios from 'axios';

const API_BASE = 'http://localhost:5006/api/groupes';

export interface Groupe {
  _id: string;
  nom: string;
  description?: string;
  formateur: { _id: string; nom: string; email: string } | string;
  membres: Array<{ _id: string; nom: string; email: string } | string>;
  invitations?: Array<{
    _id: string;
    apprenant: { _id: string; nom: string; email: string } | string;
    statut: 'en_attente' | 'accepte' | 'refuse';
    date: string;
  }>;
}

function authHeaders() {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
}

export const groupeService = {
  async createGroupe(payload: { nom: string; description?: string; cours?: string }) {
    const res = await axios.post(`${API_BASE}`, payload, authHeaders());
    return res.data;
  },

  async getMesGroupes() {
    const res = await axios.get(`${API_BASE}/mes-groupes`, authHeaders());
    return res.data;
  },

  async getGroupe(id: string) {
    const res = await axios.get(`${API_BASE}/${id}`, authHeaders());
    return res.data;
  },

  async inviterApprenant(id: string, apprenantEmail: string) {
    const res = await axios.post(`${API_BASE}/${id}/invitations`, { apprenantEmail }, authHeaders());
    return res.data;
  },

  async listerInvitations(id: string) {
    const res = await axios.get(`${API_BASE}/${id}/invitations`, authHeaders());
    return res.data;
  },

  async repondreInvitation(id: string, invId: string, action: 'accepte' | 'refuse') {
    const res = await axios.post(`${API_BASE}/${id}/invitations/${invId}/repondre`, { action }, authHeaders());
    return res.data;
  },

  async getMesInvitations() {
    const res = await axios.get(`${API_BASE}/mes-invitations`, authHeaders());
    return res.data;
  },
};
