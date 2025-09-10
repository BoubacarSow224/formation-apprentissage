const mongoose = require('mongoose');

const etapeSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: [true, 'Le titre de l\'étape est requis'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  contenu: {
    texte: String,
    images: [String],
    audio: String,
    video: String
  },
  dureeEstimee: {
    type: Number, // en minutes
    default: 5
  },
  ordre: {
    type: Number,
    required: true
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz'
  }
}, { timestamps: true });

const coursSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: [true, 'Le titre du cours est requis'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La description du cours est requise']
  },
  formateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  categorie: {
    type: String,
    required: [true, 'La catégorie est requise'],
    enum: ['mecanique', 'couture', 'maconnerie', 'informatique', 'cuisine', 'autres']
  },
  niveau: {
    type: String,
    enum: ['débutant', 'intermédiaire', 'avancé'],
    default: 'débutant'
  },
  langue: {
    type: String,
    default: 'fr',
    enum: ['fr', 'ln', 'wo'] // français, lingala, wolof (à adapter selon les besoins)
  },
  etapes: [etapeSchema],
  dureeTotale: {
    type: Number, // en minutes
    default: 0
  },
  imageCouverture: {
    type: String,
    default: 'default-course.jpg'
  },
  estPublic: {
    type: Boolean,
    default: false
  },
  estApprouve: {
    type: Boolean,
    default: false
  },
  statutModeration: {
    type: String,
    enum: ['en_attente', 'approuve', 'rejete', 'suspendu'],
    default: 'en_attente'
  },
  commentaireModeration: {
    type: String,
    trim: true
  },
  moderePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dateModeration: {
    type: Date
  },
  tags: [String],
  prerequis: [String],
  objectifs: [String],
  evaluationMoyenne: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  nombreVues: {
    type: Number,
    default: 0
  },
  noteMoyenne: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  nombreAvis: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour la recherche
coursSchema.index({
  titre: 'text',
  description: 'text',
  tags: 'text',
  categorie: 'text'
});

// Middleware pour calculer la durée totale du cours
coursSchema.pre('save', function(next) {
  if (this.etapes && this.etapes.length > 0) {
    this.dureeTotale = this.etapes.reduce((total, etape) => total + (etape.dureeEstimee || 0), 0);
  }
  next();
});

// Méthode pour obtenir les statistiques du cours
coursSchema.methods.getStats = function() {
  return {
    nombreEtapes: this.etapes.length,
    dureeTotale: this.dureeTotale,
    nombreParticipants: this.participants ? this.participants.length : 0,
    noteMoyenne: this.noteMoyenne,
    nombreAvis: this.nombreAvis
  };
};

const Cours = mongoose.model('Cours', coursSchema);

module.exports = Cours;
