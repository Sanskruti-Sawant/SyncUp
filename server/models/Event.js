const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  
  description: { type: String, maxlength: 5000 },
  type: { type: String, enum: ['hackathon', 'workshop', 'conference', 'networking', 'showcase', 'hiring', 'other'], default: 'other' },
  
  /* Schedule */
  startDate: { type: Date, required: true },
  endDate: Date,
  timezone: String,
  location: String,
  isOnline: { type: Boolean, default: false },
  meetingLink: String,

  /* Ticketing */
  ticketPrice: { type: Number, default: 0 },
  maxAttendees: { type: Number, default: 100 },
  attendees: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ticketId: String,
    paidAmount: Number,
    registeredAt: { type: Date, default: Date.now },
    attended: { type: Boolean, default: false }
  }],

  /* Escrow & Trust */
  escrowBalance: { type: Number, default: 0 },
  payoutStatus: { type: String, enum: ['held', 'released', 'refunded'], default: 'held' },
  cancellationPolicy: { type: String, enum: ['full-refund', 'partial-refund', 'no-refund'], default: 'full-refund' },
  
  /* Verification */
  status: { type: String, enum: ['draft', 'pending', 'approved', 'live', 'completed', 'cancelled'], default: 'draft' },
  isVerified: { type: Boolean, default: false },
  trustScore: { type: Number, default: 0 },
  fraudReports: [{ reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, reason: String, createdAt: Date }],
  
  /* Promotion */
  isSponsored: { type: Boolean, default: false },
  
}, { timestamps: true });

eventSchema.index({ title: 'text', description: 'text' });
eventSchema.index({ startDate: 1 });
eventSchema.index({ status: 1 });

module.exports = mongoose.model('Event', eventSchema);
