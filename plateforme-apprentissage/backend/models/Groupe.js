const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  apprenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  statut: {
    type: String,
    enum: ['en_attente', 'accepte', 'refuse'],
    default: 'en_attente',
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const groupeSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    formateur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    membres: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    cours: { type: mongoose.Schema.Types.ObjectId, ref: 'Cours' },
    visibilite: { type: String, enum: ['prive', 'public'], default: 'prive' },
    invitations: [invitationSchema],
  },
  {
    timestamps: true,
  }
);

// Index utiles
groupeSchema.index({ formateur: 1 });
groupeSchema.index({ membres: 1 });
groupeSchema.index({ cours: 1 });

module.exports = mongoose.model('Groupe', groupeSchema);
