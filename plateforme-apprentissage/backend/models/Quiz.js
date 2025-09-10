const mongoose = require('mongoose');

const reponseSchema = new mongoose.Schema({
  texte: {
    type: String,
    required: [true, 'Le texte de la réponse est requis'],
    trim: true
  },
  estCorrecte: {
    type: Boolean,
    default: false
  },
  points: {
    type: Number,
    default: 1,
    min: 0
  },
  feedback: {
    type: String,
    trim: true
  },
  ordre: {
    type: Number,
    default: 0
  }
});

const questionSchema = new mongoose.Schema({
  enonce: {
    type: String,
    required: [true, 'L\'énoncé de la question est requis'],
    trim: true
  },
  type: {
    type: String,
    enum: ['choix_multiple', 'choix_unique', 'vrai_faux', 'texte_libre', 'association', 'ordre'],
    required: [true, 'Le type de question est requis']
  },
  reponses: [reponseSchema],
  points: {
    type: Number,
    default: 1,
    min: 0
  },
  duree: {
    type: Number, // en secondes
    min: 0
  },
  media: {
    type: String // URL vers une image, audio ou vidéo
  },
  explication: {
    type: String,
    trim: true
  },
  difficulte: {
    type: String,
    enum: ['facile', 'moyen', 'difficile'],
    default: 'moyen'
  },
  competences: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }],
  ordre: {
    type: Number,
    default: 0
  },
  estObligatoire: {
    type: Boolean,
    default: true
  }
});

const quizSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: [true, 'Le titre du quiz est requis'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  cours: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cours',
    required: [true, 'Le cours associé est requis']
  },
  createur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Le créateur du quiz est requis']
  },
  questions: [questionSchema],
  dureeTotale: {
    type: Number, // en minutes
    min: 0
  },
  noteDePassage: {
    type: Number,
    min: 0,
    max: 100,
    default: 70
  },
  nombreTentativesMax: {
    type: Number,
    min: 0,
    default: 0 // 0 = illimité
  },
  afficherReponses: {
    type: Boolean,
    default: true
  },
  afficherResultats: {
    type: Boolean,
    default: true
  },
  estPublie: {
    type: Boolean,
    default: false
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  dateMiseAJour: {
    type: Date,
    default: Date.now
  },
  estActif: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  parametresAvances: {
    melangerQuestions: {
      type: Boolean,
      default: false
    },
    melangerReponses: {
      type: Boolean,
      default: false
    },
    navigationLibre: {
      type: Boolean,
      default: true
    },
    afficherUneQuestionParPage: {
      type: Boolean,
      default: true
    },
    limiteTemps: {
      type: Boolean,
      default: false
    },
    bloquerApresDateLimite: {
      type: Boolean,
      default: false
    },
    dateLimite: Date,
    motDePasse: String
  },
  statistiques: {
    nombreTentatives: {
      type: Number,
      default: 0
    },
    noteMoyenne: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    tauxReussite: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    questionsLesPlusRatees: [{
      question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
      },
      tauxErreur: Number
    }]
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour la recherche
quizSchema.index({ titre: 'text', description: 'text', tags: 'text' });

// Middleware pour calculer la durée totale du quiz
quizSchema.pre('save', function(next) {
  if (this.questions && this.questions.length > 0) {
    this.dureeTotale = this.questions.reduce((total, question) => total + (question.duree || 0), 0);
  }
  next();
});

// Méthode pour calculer le score d'un quiz
quizSchema.methods.calculerScore = function(reponsesUtilisateur) {
  let score = 0;
  let pointsMax = 0;
  
  this.questions.forEach((question, index) => {
    pointsMax += question.points || 1;
    
    const reponsesCorrectes = question.reponses
      .filter(r => r.estCorrecte)
      .map(r => r._id.toString());
      
    const reponsesUtilisateurQuestion = reponsesUtilisateur[index] || [];
    
    // Vérifier si toutes les réponses correctes sont sélectionnées
    const toutesReponsesCorrectes = reponsesCorrectes.every(r => 
      reponsesUtilisateurQuestion.includes(r)
    );
    
    // Vérifier si seules les réponses correctes sont sélectionnées
    const pasDeReponsesIncorrectes = reponsesUtilisateurQuestion.every(r => 
      reponsesCorrectes.includes(r)
    );
    
    if (toutesReponsesCorrectes && pasDeReponsesIncorrectes) {
      score += question.points || 1;
    }
  });
  
  const pourcentage = pointsMax > 0 ? Math.round((score / pointsMax) * 100) : 0;
  const estReussi = pourcentage >= this.noteDePassage;
  
  return {
    score,
    pointsMax,
    pourcentage,
    estReussi,
    noteDePassage: this.noteDePassage
  };
};

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;
