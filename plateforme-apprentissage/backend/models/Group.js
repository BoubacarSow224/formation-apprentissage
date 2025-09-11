const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 1000 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  tags: [{ type: String, trim: true }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

groupSchema.index({ name: 1 }, { unique: false });

groupSchema.virtual('memberCount').get(function() { return this.members.length; });

groupSchema.set('toJSON', { virtuals: true });
groupSchema.set('toObject', { virtuals: true });

const Group = mongoose.model('Group', groupSchema);
module.exports = Group;
