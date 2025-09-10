const mongoose = require('mongoose');

const offreEmploiSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: [true, 'Le titre de l\'offre est requis'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La description de l\'offre est requise']
  },
  entreprise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'entreprise est requise']
  },
  typeContrat: {
    type: String,
    enum: ['CDI', 'CDD', 'Stage', 'Freelance', 'Temps partiel', 'Autre'],
    required: [true, 'Le type de contrat est requis']
  },
  localisation: {
    type: {
      adresse: String,
      ville: {
        type: String,
        required: [true, 'La ville est requise']
      },
      pays: {
        type: String,
        default: 'Sénégal'
      },
      coordonnees: {
        lat: Number,
        lng: Number
      },
      estEnPresentiel: {
        type: Boolean,
        default: true
      },
      estEnDistanciel: {
        type: Boolean,
        default: false
      }
    },
    required: [true, 'La localisation est requise']
  },
  competencesRequises: [{
    type: String,
    required: [true, 'Au moins une compétence est requise']
  }],
  badgesRequis: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge'
  }],
  salaire: {
    min: Number,
    max: Number,
    devise: {
      type: String,
      default: 'XOF'
    },
    estNegociable: {
      type: Boolean,
      default: false
    },
    periode: {
      type: String,
      enum: ['heure', 'jour', 'mois', 'an'],
      default: 'mois'
    }
  },
  datePublication: {
    type: Date,
    default: Date.now
  },
  dateLimite: {
    type: Date,
    required: [true, 'La date limite de candidature est requise']
  },
  dateDebut: Date,
  statut: {
    type: String,
    enum: ['en_attente', 'publiee', 'pourvue', 'expiree', 'annulee'],
    default: 'en_attente'
  },
  nombrePostes: {
    type: Number,
    default: 1,
    min: 1
  },
  candidats: [{
    utilisateur: {
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
      enum: ['en_attente', 'en_cours', 'acceptee', 'refusee', 'annulee'],
      default: 'en_attente'
    },
    lettreMotivation: String,
    cv: String,
    badgesPresentes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Badge'
    }],
    notes: {
      type: String,
      trim: true
    },
    entretiens: [{
      date: Date,
      typeEntretien: {
        type: String,
        enum: ['telephonique', 'video', 'presentiel']
      },
      notes: String,
      statut: {
        type: String,
        enum: ['planifie', 'effectue', 'annule', 'reporte']
      },
      feedback: String
    }]
  }],
  motsCles: [String],
  avantages: [String],
  processusRecrutement: {
    etapes: [{
      nom: String,
      description: String,
      dureeEstimee: String
    }]
  },
  estVerifie: {
    type: Boolean,
    default: false
  },
  verifiePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dateVerification: Date,
  vues: {
    type: Number,
    default: 0
  },
  candidaturesVues: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour la recherche
offreEmploiSchema.index({
  'titre': 'text',
  'description': 'text',
  'competencesRequises': 'text',
  'motsCles': 'text',
  'localisation.ville': 'text'
});

// Middleware pour mettre à jour le statut en fonction de la date limite
offreEmploiSchema.pre('save', function(next) {
  const maintenant = new Date();
  
  // Si la date limite est dépassée, marquer comme expirée
  if (this.dateLimite && this.dateLimite < maintenant) {
    this.statut = 'expiree';
  }
  
  next();
});

// Méthode pour postuler à l'offre
offreEmploiSchema.methods.postuler = async function(utilisateurId, donneesCandidature) {
  // Vérifier si l'utilisateur a déjà postulé
  const dejaPostule = this.candidats.some(
    candidat => candidat.utilisateur.toString() === utilisateurId.toString()
  );
  
  if (dejaPostule) {
    throw new Error('Vous avez déjà postulé à cette offre');
  }
  
  // Ajouter la candidature
  this.candidats.push({
    utilisateur: utilisateurId,
    ...donneesCandidature
  });
  
  await this.save();
  return this;
};

const OffreEmploi = mongoose.model('OffreEmploi', offreEmploiSchema);

module.exports = OffreEmploi;
