import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5006/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 secondes de timeout
  // Fournir un message d'erreur de timeout plus clair côté front
  timeoutErrorMessage: "Le serveur met trop de temps à répondre. Veuillez réessayer plus tard.",
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Normaliser les erreurs réseau/timeout avec un message propre
    const status = error?.response?.status;
    const code = error?.code;
    const requestUrl: string | undefined = error?.config?.url;

    if (status === 401) {
      // Ne pas éjecter l'utilisateur pour toute 401 générique.
      // On force la redirection seulement si l'appel touche des endpoints d'auth critiques.
      const criticalAuthPaths = ['/auth/me', '/auth/profile', '/auth/logout', '/auth/login', '/auth/register'];
      const isCritical = !!requestUrl && criticalAuthPaths.some(p => requestUrl.includes(p));
      if (isCritical) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return; // stop ici
      }
      // Sinon, on propage l'erreur pour laisser la page gérer localement
      return Promise.reject(error);
    }

    if (code === 'ECONNABORTED' || code === 'ERR_NETWORK' || code === 'ECONNREFUSED') {
      const friendly = new Error('Le serveur est indisponible pour le moment. Réessayez plus tard.');
      return Promise.reject(friendly);
    }

    // Pour les autres erreurs, retourner l'erreur d'origine (sans spam console)
    return Promise.reject(error);
  }
);

export default api;
