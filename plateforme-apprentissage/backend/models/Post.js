const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  // Contenu du post
  content: {
    type: String,
    required: [true, 'Le contenu du post est requis'],
    trim: true,
    maxlength: [1000, 'Le contenu ne peut pas dépasser 1000 caractères']
  },
  
  // Auteur du post
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Groupe (optionnel) pour posts de groupe
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  
  // Interactions
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Le commentaire ne peut pas dépasser 500 caractères']
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Métadonnées
  dateCreation: {
    type: Date,
    default: Date.now
  },
  
  dateModification: {
    type: Date,
    default: Date.now
  },
  
  // Statut du post
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Tags/Catégories
  tags: [{
    type: String,
    trim: true
  }]
});

// Index pour améliorer les performances
postSchema.index({ author: 1, dateCreation: -1 });
postSchema.index({ dateCreation: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ group: 1, dateCreation: -1 });

// Middleware pour mettre à jour dateModification
postSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.dateModification = new Date();
  }
  next();
});

// Méthodes virtuelles
postSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

postSchema.virtual('commentsCount').get(function() {
  return this.comments.length;
});

// Inclure les virtuels dans la sérialisation JSON
postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
