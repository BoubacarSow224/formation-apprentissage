const mongoose = require('mongoose');

const certificatSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom du certificat est requis'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La description du certificat est requise']
  },
  template: {
    type: String,
    required: [true, 'Le template du certificat est requis'],
    default: 'default-template'
  },
  cours: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cours',
    required: [true, 'Le cours associé est requis']
  },
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'utilisateur est requis']
  },
  formateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Le formateur est requis']
  },
  noteFinale: {
    type: Number,
    required: [true, 'La note finale est requise'],
    min: 0,
    max: 100
  },
  pourcentageCompletion: {
    type: Number,
    required: [true, 'Le pourcentage de complétion est requis'],
    min: 0,
    max: 100
  },
  competencesValidees: [{
    nom: {
      type: String,
      required: true
    },
    niveau: {
      type: String,
      enum: ['debutant', 'intermediaire', 'avance', 'expert'],
      required: true
    }
  }],
  dateObtention: {
    type: Date,
    default: Date.now
  },
  dateExpiration: {
    type: Date,
    // Par défaut, expire après 2 ans
    default: function() {
      return new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000);
    }
  },
  numeroSerie: {
    type: String,
    unique: true,
    required: true
  },
  qrCode: {
    type: String,
    unique: true
  },
  estValide: {
    type: Boolean,
    default: true
  },
  estRevoque: {
    type: Boolean,
    default: false
  },
  raisonRevocation: String,
  dateRevocation: Date,
  revoquePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Pour la vérification d'authenticité
  hashVerification: {
    type: String,
    required: true
  },
  // Métadonnées pour le PDF
  metadonneesPDF: {
    couleurPrimaire: {
      type: String,
      default: '#1976d2'
    },
    couleurSecondaire: {
      type: String,
      default: '#f5f5f5'
    },
    logo: {
      type: String,
      default: 'logo-plateforme.png'
    }
  }
}, { timestamps: true });

// Index pour la recherche et la vérification
certificatSchema.index({ numeroSerie: 1 });
certificatSchema.index({ utilisateur: 1, cours: 1 });
certificatSchema.index({ hashVerification: 1 });

// Méthode pour générer un numéro de série unique
certificatSchema.pre('save', async function(next) {
  if (!this.numeroSerie) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Certificat').countDocuments();
    this.numeroSerie = `CERT-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  
  if (!this.hashVerification) {
    const crypto = require('crypto');
    const dataToHash = `${this.numeroSerie}-${this.utilisateur}-${this.cours}-${this.dateObtention}`;
    this.hashVerification = crypto.createHash('sha256').update(dataToHash).digest('hex');
  }
  
  next();
});

// Méthode pour générer le QR code
certificatSchema.methods.genererQRCode = async function() {
  const qrData = `CERT:${this.numeroSerie}:${this.hashVerification}`;
  this.qrCode = qrData;
  await this.save();
  return qrData;
};

// Méthode pour vérifier l'authenticité
certificatSchema.methods.verifierAuthenticite = function() {
  const crypto = require('crypto');
  const dataToHash = `${this.numeroSerie}-${this.utilisateur}-${this.cours}-${this.dateObtention}`;
  const hashCalcule = crypto.createHash('sha256').update(dataToHash).digest('hex');
  return hashCalcule === this.hashVerification;
};

// Méthode pour révoquer le certificat
certificatSchema.methods.revoquer = async function(adminId, raison) {
  this.estRevoque = true;
  this.estValide = false;
  this.raisonRevocation = raison;
  this.dateRevocation = new Date();
  this.revoquePar = adminId;
  await this.save();
};

const Certificat = mongoose.model('Certificat', certificatSchema);

module.exports = Certificat;
