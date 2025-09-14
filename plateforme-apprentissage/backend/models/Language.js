const mongoose = require('mongoose');

const languageSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Le code de la langue est requis'],
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: [5, 'Le code ne peut pas dépasser 5 caractères'],
    match: [/^[a-z]{2}(-[a-z]{2})?$/, 'Format de code invalide (ex: fr, en, fr-sn)']
  },
  nom: {
    type: String,
    required: [true, 'Le nom de la langue est requis'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  nomNatif: {
    type: String,
    required: [true, 'Le nom natif de la langue est requis'],
    trim: true,
    maxlength: [100, 'Le nom natif ne peut pas dépasser 100 caractères']
  },
  direction: {
    type: String,
    enum: ['ltr', 'rtl'],
    default: 'ltr'
  },
  estActif: {
    type: Boolean,
    default: true
  },
  estParDefaut: {
    type: Boolean,
    default: false
  },
  // Métadonnées pour l'interface
  drapeau: {
    type: String,
    trim: true,
    default: '🌐'
  },
  // Traductions des éléments de l'interface
  traductions: {
    // Navigation
    navigation: {
      accueil: { type: String, default: 'Accueil' },
      cours: { type: String, default: 'Cours' },
      communaute: { type: String, default: 'Communauté' },
      emplois: { type: String, default: 'Emplois' },
      profil: { type: String, default: 'Profil' },
      admin: { type: String, default: 'Administration' }
    },
    // Actions communes
    actions: {
      connexion: { type: String, default: 'Connexion' },
      inscription: { type: String, default: 'Inscription' },
      deconnexion: { type: String, default: 'Déconnexion' },
      enregistrer: { type: String, default: 'Enregistrer' },
      annuler: { type: String, default: 'Annuler' },
      supprimer: { type: String, default: 'Supprimer' },
      modifier: { type: String, default: 'Modifier' },
      voir: { type: String, default: 'Voir' },
      rechercher: { type: String, default: 'Rechercher' }
    },
    // Messages
    messages: {
      bienvenue: { type: String, default: 'Bienvenue' },
      erreur: { type: String, default: 'Une erreur est survenue' },
      succes: { type: String, default: 'Opération réussie' },
      chargement: { type: String, default: 'Chargement...' },
      aucunResultat: { type: String, default: 'Aucun résultat trouvé' }
    },
    // Formulaires
    formulaires: {
      nom: { type: String, default: 'Nom' },
      email: { type: String, default: 'Email' },
      motDePasse: { type: String, default: 'Mot de passe' },
      telephone: { type: String, default: 'Téléphone' },
      adresse: { type: String, default: 'Adresse' },
      description: { type: String, default: 'Description' },
      titre: { type: String, default: 'Titre' },
      contenu: { type: String, default: 'Contenu' }
    }
  },
  // Statistiques d'utilisation
  statistiques: {
    nombreUtilisateurs: {
      type: Number,
      default: 0
    },
    derniereMiseAJour: {
      type: Date,
      default: Date.now
    }
  },
  // Informations sur le traducteur/mainteneur
  mainteneur: {
    nom: String,
    email: String,
    organisation: String
  },
  // Version de la traduction
  version: {
    type: String,
    default: '1.0.0'
  },
  // Pourcentage de complétion de la traduction
  completude: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour la recherche et les performances (code déjà unique via le champ)
languageSchema.index({ estActif: 1 });
languageSchema.index({ estParDefaut: 1 });

// Virtual pour le nom complet avec le code
languageSchema.virtual('nomComplet').get(function() {
  return `${this.nom} (${this.code.toUpperCase()})`;
});

// Middleware pour s'assurer qu'une seule langue est par défaut
languageSchema.pre('save', async function(next) {
  if (this.estParDefaut && this.isModified('estParDefaut')) {
    // Désactiver toutes les autres langues par défaut
    await mongoose.model('Language').updateMany(
      { _id: { $ne: this._id } },
      { estParDefaut: false }
    );
  }
  next();
});

// Méthode statique pour obtenir la langue par défaut
languageSchema.statics.getDefault = async function() {
  let defaultLang = await this.findOne({ estParDefaut: true, estActif: true });
  
  if (!defaultLang) {
    // Si aucune langue par défaut, prendre la première active
    defaultLang = await this.findOne({ estActif: true });
  }
  
  return defaultLang;
};

// Méthode pour mettre à jour les statistiques d'utilisation
languageSchema.methods.incrementerUtilisation = async function() {
  this.statistiques.nombreUtilisateurs += 1;
  this.statistiques.derniereMiseAJour = new Date();
  await this.save();
};

// Méthode pour calculer la completude de la traduction
languageSchema.methods.calculerCompletude = function() {
  const traductions = this.traductions;
  let totalChamps = 0;
  let champsRemplis = 0;
  
  function compterChamps(obj) {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        compterChamps(obj[key]);
      } else {
        totalChamps++;
        if (obj[key] && obj[key].trim() !== '') {
          champsRemplis++;
        }
      }
    }
  }
  
  compterChamps(traductions);
  
  this.completude = totalChamps > 0 ? Math.round((champsRemplis / totalChamps) * 100) : 100;
  return this.completude;
};

const Language = mongoose.model('Language', languageSchema);

module.exports = Language;
