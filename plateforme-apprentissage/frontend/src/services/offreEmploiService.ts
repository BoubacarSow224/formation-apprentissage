import api from './api';

export interface OffreEmploi {
  _id: string;
  titre: string;
  description: string;
  lieu?: string;
  typeContrat?: string;
  salaire?: string;
  competences?: string[];
  statut?: 'ouverte' | 'fermee' | string;
  entreprise?: { _id: string; nom: string; description?: string; logo?: string };
  dateCreation?: string;
}

export interface CandidatureUpdatePayload {
  statut?: 'en_attente' | 'acceptee' | 'refusee';
  commentaire?: string;
}

export interface PaginationMeta { next?: { page: number; limit: number }; prev?: { page: number; limit: number } }
export interface ListResponse<T> { items: T[]; count?: number; total?: number; pagination?: PaginationMeta }

export interface CandidatOffre {
  offreId?: string;
  utilisateur: { _id: string; nom?: string; email?: string; photoProfil?: string } | string;
  statut?: string;
  dateCandidature?: string;
  badgesPresentes?: string[];
}

const getOffres = async (params?: Record<string, any>): Promise<ListResponse<OffreEmploi>> => {
  const res = await api.get('/offres-emploi', { params });
  const data = Array.isArray(res.data?.data) ? res.data.data as OffreEmploi[] : (Array.isArray(res.data) ? res.data as OffreEmploi[] : []);
  return { items: data, count: res.data?.count, pagination: res.data?.pagination };
};

const getOffre = async (id: string) => {
  const res = await api.get(`/offres-emploi/${id}`);
  return res.data?.data as OffreEmploi;
};

const postuler = async (id: string) => {
  const res = await api.post(`/offres-emploi/${id}/postuler`);
  return res.data;
};

const creerOffre = async (payload: Partial<OffreEmploi>) => {
  const res = await api.post('/offres-emploi', payload);
  return res.data?.data as OffreEmploi;
};

const mettreAJourOffre = async (id: string, payload: Partial<OffreEmploi>) => {
  const res = await api.put(`/offres-emploi/${id}`, payload);
  return res.data?.data as OffreEmploi;
};

const supprimerOffre = async (id: string) => {
  const res = await api.delete(`/offres-emploi/${id}`);
  return res.data;
};

const mettreAJourCandidature = async (id: string, candidatureId: string, payload: CandidatureUpdatePayload) => {
  const res = await api.put(`/offres-emploi/${id}/candidatures/${candidatureId}`, payload);
  return res.data?.data;
};

const getOffresParEntreprise = async (entrepriseId: string, params?: { page?: number; limit?: number }): Promise<ListResponse<OffreEmploi>> => {
  const res = await api.get(`/offres-emploi/entreprise/${entrepriseId}`, { params });
  const items = Array.isArray(res.data?.data) ? res.data.data as OffreEmploi[] : [];
  return { items, count: res.data?.count, total: res.data?.total, pagination: res.data?.pagination };
};

const getCandidatsParOffre = async (offreId: string, params?: { badgeId?: string }): Promise<CandidatOffre[]> => {
  const res = await api.get(`/offres-emploi/${offreId}/candidatures`, { params });
  return Array.isArray(res.data?.data) ? (res.data.data as CandidatOffre[]) : [];
};

const getCandidatsEntrepriseParBadge = async (entrepriseId: string, params?: { badgeId?: string }): Promise<CandidatOffre[]> => {
  const res = await api.get(`/offres-emploi/entreprise/${entrepriseId}/candidats`, { params });
  return Array.isArray(res.data?.data) ? (res.data.data as CandidatOffre[]) : [];
};

export default {
  getOffres,
  getOffre,
  postuler,
  creerOffre,
  mettreAJourOffre,
  supprimerOffre,
  mettreAJourCandidature,
  getOffresParEntreprise,
  getCandidatsParOffre,
  getCandidatsEntrepriseParBadge,
};
