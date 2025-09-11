export interface User {
  _id: string;
  nom: string;
  telephone: string;
  email?: string;
  role: 'admin' | 'formateur' | 'apprenant' | 'entreprise';
  photoProfil?: string;
  langues?: string[];
  dateInscription: Date;
  bio?: string;
  competences?: string[];
  
  // Champs spécifiques aux formateurs
  coursCrees?: string[];
  evaluationMoyenne?: number;
  
  // Champs spécifiques aux apprenants
  coursSuivis?: Array<{
    cours: string;
    progression: number;
    termine: boolean;
    dateInscription: Date;
  }>;
  badgesObtenus?: Array<{
    badge: string;
    dateObtention: Date;
    cours?: string;
  }>;
  
  // Champs spécifiques aux entreprises
  nomEntreprise?: string;
  secteurActivite?: string;
  localisation?: {
    adresse?: string;
    ville?: string;
    pays?: string;
    coordonnees?: {
      lat: number;
      lng: number;
    };
  };
  offresEmploi?: string[];
  
  // Statut du compte
  estActif?: boolean;
  derniereConnexion?: Date;
}

export interface Cours {
  _id: string;
  titre: string;
  description: string;
  formateur: string;
  niveau: 'debutant' | 'intermediaire' | 'avance';
  categorie: string;
  duree: number;
  modules: Module[];
  prerequis: string[];
  competencesAcquises: string[];
  prix: number;
  note: number;
  nombreEvaluations: number;
  dateCreation: Date;
  dateModification: Date;
  statut: 'brouillon' | 'publie' | 'archive';
  image?: string;
  video?: string;
}

export interface Module {
  titre: string;
  contenu: string;
  duree: number;
  ressources: string[];
  quiz?: string;
}

export interface Quiz {
  _id: string;
  titre: string;
  description: string;
  cours: string;
  createur: string;
  questions: Question[];
  duree: number;
  niveau: 'debutant' | 'intermediaire' | 'avance';
  noteMinimale?: number;
  maxTentatives?: number;
  dateCreation: Date;
  estActif?: boolean;
}

export interface Question {
  _id?: string;
  question: string;
  type: 'qcm' | 'vrai_faux' | 'texte_libre';
  options?: string[];
  bonneReponse: string | string[];
  points: number;
  explication?: string;
}

export interface Badge {
  _id: string;
  nom: string;
  description: string;
  icone: string;
  couleur: string;
  criteres: {
    type: string;
    valeur: number;
  };
  dateCreation: Date;
}

export interface Message {
  _id: string;
  contenu: string;
  auteur: string;
  conversation: string;
  dateEnvoi: Date;
  lu: boolean;
  type: 'texte' | 'image' | 'fichier';
  fichier?: {
    nom: string;
    url: string;
    taille: number;
  };
}

export interface Conversation {
  _id: string;
  participants: string[];
  messages: Message[];
  type: 'prive' | 'groupe';
  nom?: string;
  dateCreation: Date;
  derniereActivite: Date;
}

export interface OffreEmploi {
  _id: string;
  titre: string;
  description: string;
  entreprise: {
    nom: string;
    logo?: string;
    description?: string;
  };
  lieu: string;
  typeContrat: 'CDI' | 'CDD' | 'Stage' | 'Freelance';
  salaire?: {
    min: number;
    max: number;
    devise: string;
  };
  competencesRequises: string[];
  niveauExperience: 'junior' | 'confirme' | 'senior';
  datePublication: Date;
  dateExpiration: Date;
  statut: 'active' | 'pourvue' | 'expiree';
  candidatures: string[];
}

export interface ActivityLog {
  id: string;
  action: string;
  user: string;
  course?: string;
  company?: string;
  time: string;
}

export interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalQuizzes: number;
  totalJobs: number;
  activeUsers: number;
  newUsersThisMonth: number;
  coursesCompleted: number;
  revenue: number;
  pendingModeration: number;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Partial<User> & { password?: string }) => Promise<void>;
  logout: () => void;
  loading: boolean;
  updateUser: (user: User) => void;
}
