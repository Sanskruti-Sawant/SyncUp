const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  description: { type: String, maxlength: 5000 },
  requirements: [String],
  skills: [String],
  experienceMin: { type: Number, required: true, min: 1 },
  experienceMax: Number,
  salaryMin: Number,
  salaryMax: Number,
  currency: { type: String, default: 'INR' },
  location: String,
  isRemote: { type: Boolean, default: false },
  type: { type: String, enum: ['full-time', 'part-time', 'contract', 'consulting'], default: 'full-time' },
  
  applicants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    coverNote: String,
    status: { type: String, enum: ['applied', 'shortlisted', 'interviewed', 'offered', 'rejected'], default: 'applied' },
    appliedAt: { type: Date, default: Date.now }
  }],
  
  status: { type: String, enum: ['open', 'paused', 'closed'], default: 'open' },
  isSponsored: { type: Boolean, default: false },
  
}, { timestamps: true });

jobSchema.index({ title: 'text', description: 'text', skills: 'text' });
jobSchema.index({ experienceMin: 1 });

module.exports = mongoose.model('Job', jobSchema);
