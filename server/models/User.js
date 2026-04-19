const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  
  /* Verification */
  faceDescriptor: { type: [Number], default: [] },
  isVerified: { type: Boolean, default: false },
  verificationLevel: { type: String, enum: ['none', 'basic', 'identity', 'full'], default: 'none' },
  identityClaim: {
    status: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
    documents: [String],
    riskScore: { type: Number, default: 0 },
    reviewNotes: String
  },
  livenessProof: { type: Boolean, default: false },

  /* Profile */
  profilePic: String,
  headline: { type: String, maxlength: 200 },
  bio: { type: String, maxlength: 2000 },
  skills: [String],
  experience: [{
    title: String,
    company: String,
    years: Number,
    current: Boolean
  }],
  location: String,
  
  /* Networking */
  connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  connectionRequests: [{
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  }],

  /* Referral */
  referralCode: { type: String, unique: true },
  referredBy: { type: String, default: null },
  referralCount: { type: Number, default: 0 },
  
  /* Trust */
  trustScore: { type: Number, default: 0, min: 0, max: 100 },
  role: { type: String, enum: ['professional', 'recruiter', 'investor', 'organizer', 'admin'], default: 'professional' },

  /* Wallet */
  promotionalCredits: { type: Number, default: 0 },
  
}, { timestamps: true });

// Text search index only — email & referralCode already indexed via unique:true
userSchema.index({ name: 'text', headline: 'text', skills: 'text' });

module.exports = mongoose.model('User', userSchema);
