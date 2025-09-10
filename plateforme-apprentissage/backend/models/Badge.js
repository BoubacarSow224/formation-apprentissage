const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom du badge est requis'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'La description du badge est requise']
  },
  image: {
    type: String,
    required: [true, 'L\'image du badge est requise']
  },
  niveau: {
    type: String,
    enum: ['bronze', 'argent', 'or', 'platine'],
    default: 'bronze'
  },
  cours: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cours',
    required: [true, 'Le cours associé est requis']
  },
  competencesValidees: [{
    type: String,
    trim: true
  }],
  criteresObtention: {
    type: String,
    required: [true, 'Les critères d\'obtention sont requis']
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  estActif: {
    type: Boolean,
    default: true
  },
  qrCode: {
    type: String,
    unique: true
  },
  // Pour le suivi des statistiques
  nombreDecernes: {
    type: Number,
    default: 0
  },
  // Pour la validation par l'administrateur
  estValide: {
    type: Boolean,
    default: false
  },
  validePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dateValidation: Date
}, { timestamps: true });

// Index pour la recherche
badgeSchema.index({ nom: 'text', description: 'text', 'competencesValidees': 'text' });

// Méthode pour générer un code QR unique
badgeSchema.methods.genererQRCode = async function() {
  // Implémentation pour générer un QR code unique pour le badge
  // À implémenter avec une bibliothèque comme qrcode
  const qrData = `BADGE:${this._id}:${this.cours}`;
  this.qrCode = qrData; // En production, générer un vrai QR code
  await this.save();
  return qrData;
};

const Badge = mongoose.model('Badge', badgeSchema);

module.exports = Badge;
