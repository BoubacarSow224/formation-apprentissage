const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Informations de base
  nom: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true
  },
  telephone: {
    type: String,
    required: [true, 'Le numéro de téléphone est requis'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true
  },
  role: {
    type: String,
    enum: ['admin', 'formateur', 'apprenant', 'entreprise'],
    required: true
  },
  
  // Champs pour tous les utilisateurs
  photoProfil: {
    type: String,
    default: 'default.jpg'
  },
  langues: [{
    type: String,
    trim: true
  }],
  dateInscription: {
    type: Date,
    default: Date.now
  },
  
  // Champs pour les formateurs et apprenants
  bio: {
    type: String,
    trim: true
  },
  competences: [{
    type: String,
    trim: true
  }],
  
  // Champs spécifiques aux formateurs
  coursCrees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cours'
  }],
  evaluationMoyenne: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  
  // Champs spécifiques aux apprenants
  coursSuivis: [{
    cours: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cours'
    },
    progression: {
      type: Number,
      default: 0
    },
    termine: {
      type: Boolean,
      default: false
    },
    dateInscription: {
      type: Date,
      default: Date.now
    }
  }],
  badgesObtenus: [{
    badge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Badge'
    },
    dateObtention: {
      type: Date,
      default: Date.now
    },
    cours: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cours'
    }
  }],
  
  // Champs spécifiques aux entreprises
  nomEntreprise: {
    type: String,
    trim: true
  },
  secteurActivite: {
    type: String,
    trim: true
  },
  localisation: {
    adresse: String,
    ville: String,
    pays: String,
    coordonnees: {
      lat: Number,
      lng: Number
    }
  },
  offresEmploi: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OffreEmploi'
  }],
  
  // Authentification
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères']
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  // Statut du compte
  estActif: {
    type: Boolean,
    default: true
  },
  derniereConnexion: Date
});

// Hacher le mot de passe avant de sauvegarder l'utilisateur
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
