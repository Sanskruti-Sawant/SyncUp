const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  /* Verification */
  isVerified: { type: Boolean, default: false },
  ownershipClaim: {
    status: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
    documents: [String],
    domainEmail: String,
    reviewNotes: String
  },
  mapPlaceId: { type: String, default: null },
  businessRegistrationId: String,

  /* Profile */
  industry: String,
  description: { type: String, maxlength: 3000 },
  logo: String,
  website: String,
  location: String,
  size: { type: String, enum: ['1-10', '11-50', '51-200', '201-500', '500+'] },
  founded: Number,

  /* Services (for B2B) */
  servicesOffered: [String],
  serviceRating: { type: Number, default: 0 },
  completedProjects: { type: Number, default: 0 },
  
  /* Trust */
  trustScore: { type: Number, default: 0, min: 0, max: 100 },
  employees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  /* Investment (Milestone #4) */
  seekingInvestment: { type: Boolean, default: false },
  escalationLevel: { type: String, enum: ['none', 'review-required', 'high-trust-verified'], default: 'none' },
  authorizedRepresentatives: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, default: 'Representative' },
    verifiedAt: { type: Date, default: Date.now }
  }],
  investmentDetails: {
    seekingAmount: Number,
    equityOffered: Number,
    description: String,
    sector: String,
    postedAt: Date
  },
  investorInterests: [{
    investor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    amount: Number,
    proofRequested: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  }],
  
}, { timestamps: true });

companySchema.index({ name: 'text', industry: 'text', description: 'text' });
companySchema.index({ mapPlaceId: 1 });

module.exports = mongoose.model('Company', companySchema);
