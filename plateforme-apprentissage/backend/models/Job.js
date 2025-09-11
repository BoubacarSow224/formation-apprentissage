const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: [true, 'Le titre du poste est requis'],
    trim: true,
    maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères']
  },
  description: {
    type: String,
    required: [true, 'La description du poste est requise'],
    maxlength: [5000, 'La description ne peut pas dépasser 5000 caractères']
  },
  entreprise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'entreprise est requise']
  },
  localisation: {
    ville: {
      type: String,
      required: [true, 'La ville est requise'],
      trim: true
    },
    pays: {
      type: String,
      required: [true, 'Le pays est requis'],
      trim: true,
      default: 'Sénégal'
    },
    adresse: {
      type: String,
      trim: true
    },
    travailDistance: {
      type: Boolean,
      default: false
    }
  },
  typeContrat: {
    type: String,
    enum: ['CDI', 'CDD', 'Stage', 'Freelance', 'Temps partiel'],
    required: [true, 'Le type de contrat est requis']
  },
  niveauExperience: {
    type: String,
    enum: ['Débutant', 'Junior (1-3 ans)', 'Intermédiaire (3-5 ans)', 'Senior (5+ ans)', 'Expert (10+ ans)'],
    required: [true, 'Le niveau d\'expérience est requis']
  },
  salaire: {
    montant: {
      type: Number,
      min: [0, 'Le salaire ne peut pas être négatif']
    },
    devise: {
      type: String,
      default: 'FCFA',
      enum: ['FCFA', 'EUR', 'USD']
    },
    periode: {
      type: String,
      enum: ['Mensuel', 'Annuel', 'Horaire'],
      default: 'Mensuel'
    },
    negociable: {
      type: Boolean,
      default: false
    }
  },
  competencesRequises: [{
    nom: {
      type: String,
      required: true,
      trim: true
    },
    niveau: {
      type: String,
      enum: ['Débutant', 'Intermédiaire', 'Avancé', 'Expert'],
      default: 'Intermédiaire'
    },
    obligatoire: {
      type: Boolean,
      default: true
    }
  }],
  avantages: [{
    type: String,
    trim: true
  }],
  datePublication: {
    type: Date,
    default: Date.now
  },
  dateExpiration: {
    type: Date,
    required: [true, 'La date d\'expiration est requise'],
    validate: {
      validator: function(value) {
        return value > this.datePublication;
      },
      message: 'La date d\'expiration doit être postérieure à la date de publication'
    }
  },
  statut: {
    type: String,
    enum: ['brouillon', 'en_attente', 'publie', 'expire', 'pourvue'],
    default: 'en_attente'
  },
  statutModeration: {
    type: String,
    enum: ['en_attente', 'approuve', 'rejete'],
    default: 'en_attente'
  },
  raisonRejet: {
    type: String,
    trim: true
  },
  moderePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dateModeration: Date,
  candidatures: [{
    candidat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    dateCandidature: {
      type: Date,
      default: Date.now
    },
    statut: {
      type: String,
      enum: ['en_attente', 'accepte', 'rejete'],
      default: 'en_attente'
    },
    lettreMotivation: String,
    cv: String // Chemin vers le fichier CV
  }],
  vues: {
    type: Number,
    default: 0
  },
  // Métadonnées pour le SEO et la recherche
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  secteurActivite: {
    type: String,
    enum: [
      'Informatique/Tech',
      'Finance/Banque',
      'Santé',
      'Éducation',
      'Commerce/Vente',
      'Marketing/Communication',
      'Ingénierie',
      'Ressources Humaines',
      'Logistique/Transport',
      'Agriculture',
      'Tourisme/Hôtellerie',
      'Autre'
    ],
    required: [true, 'Le secteur d\'activité est requis']
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour la recherche et les performances
jobSchema.index({ titre: 'text', description: 'text', 'competencesRequises.nom': 'text' });
jobSchema.index({ statut: 1, statutModeration: 1 });
jobSchema.index({ entreprise: 1 });
jobSchema.index({ dateExpiration: 1 });
jobSchema.index({ 'localisation.ville': 1, 'localisation.pays': 1 });
jobSchema.index({ secteurActivite: 1 });
jobSchema.index({ typeContrat: 1 });

// Virtual pour le nombre de candidatures
jobSchema.virtual('nombreCandidatures').get(function() {
  return this.candidatures ? this.candidatures.length : 0;
});

// Virtual pour vérifier si l'offre est expirée
jobSchema.virtual('estExpiree').get(function() {
  return new Date() > this.dateExpiration;
});

// Middleware pour mettre à jour le statut si expiré
jobSchema.pre('save', function(next) {
  if (this.estExpiree && this.statut === 'publie') {
    this.statut = 'expire';
  }
  next();
});

// Méthode pour approuver l'offre d'emploi
jobSchema.methods.approuver = async function(adminId) {
  this.statutModeration = 'approuve';
  this.statut = 'publie';
  this.moderePar = adminId;
  this.dateModeration = new Date();
  await this.save();
};

// Méthode pour rejeter l'offre d'emploi
jobSchema.methods.rejeter = async function(adminId, raison) {
  this.statutModeration = 'rejete';
  this.statut = 'brouillon';
  this.raisonRejet = raison;
  this.moderePar = adminId;
  this.dateModeration = new Date();
  await this.save();
};

// Méthode pour ajouter une candidature
jobSchema.methods.ajouterCandidature = async function(candidatId, lettreMotivation, cvPath) {
  // Vérifier si le candidat n'a pas déjà postulé
  const candidatureExistante = this.candidatures.find(
    c => c.candidat.toString() === candidatId.toString()
  );
  
  if (candidatureExistante) {
    throw new Error('Vous avez déjà postulé pour cette offre');
  }

  this.candidatures.push({
    candidat: candidatId,
    lettreMotivation,
    cv: cvPath
  });
  
  await this.save();
};

// Méthode pour incrémenter les vues
jobSchema.methods.incrementerVues = async function() {
  this.vues += 1;
  await this.save();
};

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
