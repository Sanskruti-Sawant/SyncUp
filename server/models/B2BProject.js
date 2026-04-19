const mongoose = require('mongoose');

const b2bProjectSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  clientUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  
  title: { type: String, required: true },
  description: { type: String, maxlength: 5000 },
  category: { type: String, enum: ['development', 'software', 'engineering', 'consulting', 'design', 'marketing', 'finance', 'operations', 'legal', 'other'] },
  budget: { type: Number, required: true },
  
  milestones: [{
    title: String,
    description: String,
    amount: Number,
    status: { type: String, enum: ['pending', 'in-progress', 'completed', 'approved'], default: 'pending' },
    dueDate: Date,
    completedAt: Date
  }],
  
  proposals: [{
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: String,
    proposedBudget: Number,
    timeline: String,
    status: { type: String, enum: ['submitted', 'accepted', 'rejected'], default: 'submitted' },
    submittedAt: { type: Date, default: Date.now }
  }],
  
  status: { type: String, enum: ['open', 'in-progress', 'completed', 'cancelled'], default: 'open' },
  rating: { score: Number, review: String },
  
}, { timestamps: true });

b2bProjectSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('B2BProject', b2bProjectSchema);
