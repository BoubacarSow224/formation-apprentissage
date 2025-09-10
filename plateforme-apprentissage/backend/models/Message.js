const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: [true, 'La conversation est requise']
  },
  expediteur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'expéditeur est requis']
  },
  destinataire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Le destinataire est requis']
  },
  contenu: {
    texte: {
      type: String,
      trim: true
    },
    audio: String,
    images: [String],
    documents: [{
      url: String,
      nom: String,
      type: String
    }]
  },
  lu: {
    type: Boolean,
    default: false
  },
  dateLecture: Date,
  type: {
    type: String,
    enum: ['texte', 'audio', 'image', 'document', 'notification'],
    default: 'texte'
  },
  estSupprime: {
    type: Boolean,
    default: false
  },
  reponseA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  reactions: [{
    utilisateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
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

// Index pour optimiser les recherches de messages par conversation
messageSchema.index({ conversation: 1, createdAt: 1 });
messageSchema.index({ expediteur: 1, destinataire: 1 });

// Middleware pour s'assurer qu'au moins un type de contenu est fourni
messageSchema.pre('validate', function(next) {
  const contenu = this.contenu || {};
  if (!contenu.texte && !contenu.audio && 
      (!contenu.images || contenu.images.length === 0) && 
      (!contenu.documents || contenu.documents.length === 0)) {
    this.invalidate('contenu', 'Le message doit contenir du texte, un audio, une image ou un document');
  }
  next();
});

// Méthode pour marquer un message comme lu
messageSchema.methods.marquerCommeLu = async function() {
  if (!this.lu) {
    this.lu = true;
    this.dateLecture = new Date();
    await this.save();
  }
  return this;
};

// Méthode pour ajouter une réaction
messageSchema.methods.ajouterReaction = async function(utilisateurId, emoji) {
  // Vérifier si l'utilisateur a déjà réagi avec cet emoji
  const reactionExistante = this.reactions.find(
    r => r.utilisateur.toString() === utilisateurId.toString() && r.emoji === emoji
  );

  if (reactionExistante) {
    // Retirer la réaction si elle existe déjà
    this.reactions = this.reactions.filter(
      r => !(r.utilisateur.toString() === utilisateurId.toString() && r.emoji === emoji)
    );
  } else {
    // Ajouter la réaction
    this.reactions.push({
      utilisateur: utilisateurId,
      emoji,
      date: new Date()
    });
  }

  await this.save();
  return this;
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
