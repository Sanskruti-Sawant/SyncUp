const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 5000 },
  type: { type: String, enum: ['update', 'article', 'opportunity', 'milestone'], default: 'update' },
  media: [String],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, maxlength: 1000 },
    createdAt: { type: Date, default: Date.now }
  }],
  shares: { type: Number, default: 0 },
  isSponsored: { type: Boolean, default: false },
  reach: { type: Number, default: 0 },
  impressions: { type: Number, default: 0 },
}, { timestamps: true });

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ content: 'text' });

module.exports = mongoose.model('Post', postSchema);
