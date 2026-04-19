const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['post', 'event', 'profile', 'business', 'job'], required: true },
  targetRef: { type: mongoose.Schema.Types.ObjectId },
  
  /* Targeting */
  targetAudience: {
    industries: [String],
    roles: [String],
    locations: [String],
    experienceMin: Number,
  },
  
  /* Budget */
  budget: { type: Number, required: true },
  bonusCredits: { type: Number, default: 0 },
  spent: { type: Number, default: 0 },
  
  /* Coupon */
  couponCode: { type: String, unique: true, sparse: true },
  couponMultiplier: { type: Number, default: 1 },
  couponExpiresAt: Date,
  
  /* Performance */
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },
  
  status: { type: String, enum: ['draft', 'active', 'paused', 'completed', 'expired'], default: 'draft' },
  startDate: Date,
  endDate: Date,
  
}, { timestamps: true });

// owner lookup index only — couponCode already indexed via unique:true
campaignSchema.index({ owner: 1 });

module.exports = mongoose.model('Campaign', campaignSchema);
