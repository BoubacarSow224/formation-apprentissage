const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  aBloque: {
    type: Boolean,
    default: false
  },
  dateDernierMessageLu: {
    type: Date
  },
  estArchive: {
    type: Boolean,
    default: false
  },
  notifications: {
    type: Boolean,
    default: true
  }
});

const conversationSchema = new mongoose.Schema({
  participants: [participantSchema],
  titre: {
    type: String,
    trim: true
  },
  groupe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Groupe'
  },
  estGroupe: {
    type: Boolean,
    default: false
  },
  createur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cours: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cours'
  },
  offreEmploi: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OffreEmploi'
  },
  dernierMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  dateDernierMessage: {
    type: Date
  },
  messagesNonLus: {
    type: Number,
    default: 0
  },
  estArchive: {
    type: Boolean,
    default: false
  },
  estSignale: {
    type: Boolean,
    default: false
  },
  motifSignalement: {
    type: String,
    trim: true
  },
  estSupprime: {
    type: Boolean,
    default: false
  },
  supprimePar: [{
    utilisateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date,
      default: Date.now
    }
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour optimiser les recherches de conversations
conversationSchema.index({ 'participants.utilisateur': 1, dateDernierMessage: -1 });
conversationSchema.index({ cours: 1 });
conversationSchema.index({ offreEmploi: 1 });
conversationSchema.index({ groupe: 1 });

// Middleware pour s'assurer qu'une conversation a au moins 2 participants
conversationSchema.pre('validate', function(next) {
  if (this.participants.length < 2 && !this.estGroupe) {
    this.invalidate('participants', 'Une conversation doit avoir au moins 2 participants');
  }
  next();
});

// Méthode pour ajouter un participant à une conversation
conversationSchema.methods.ajouterParticipant = async function(utilisateurId) {
  // Vérifier si l'utilisateur est déjà dans la conversation
  const estDejaParticipant = this.participants.some(
    p => p.utilisateur.toString() === utilisateurId.toString()
  );
  
  if (!estDejaParticipant) {
    this.participants.push({ utilisateur: utilisateurId });
    await this.save();
  }
  
  return this;
};

// Méthode pour marquer les messages comme lus
conversationSchema.methods.marquerMessagesLus = async function(utilisateurId) {
  const participant = this.participants.find(
    p => p.utilisateur.toString() === utilisateurId.toString()
  );
  
  if (participant) {
    participant.dateDernierMessageLu = new Date();
    this.messagesNonLus = 0;
    await this.save();
  }
  
  return this;
};

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
