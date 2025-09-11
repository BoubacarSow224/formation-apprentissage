const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true, maxlength: 2000 },
  date: { type: Date, default: Date.now }
});

const discussionSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Le titre est requis'], trim: true, maxlength: 200 },
  content: { type: String, required: [true, 'Le contenu est requis'], trim: true, maxlength: 5000 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tags: [{ type: String, trim: true }],
  replies: [replySchema],
  lastActivity: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Indexes
discussionSchema.index({ createdAt: -1 });
discussionSchema.index({ lastActivity: -1 });
discussionSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Hooks
discussionSchema.pre('save', function(next) {
  this.lastActivity = new Date();
  next();
});

const Discussion = mongoose.model('Discussion', discussionSchema);
module.exports = Discussion;
