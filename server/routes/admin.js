const User = require('../models/User');
const Company = require('../models/Company');
const Event = require('../models/Event');

async function adminRoutes(fastify, opts) {
  // Middleware to check if user is an admin
  fastify.addHook('onRequest', async (request, reply) => {
    await fastify.authenticate(request, reply);
    const user = await User.findById(request.user.id);
    if (!user || user.role !== 'admin') {
      return reply.code(403).send({ error: 'Forbidden. Admin access required.' });
    }
  });

  /* ── Get Pending Identity Claims ── */
  fastify.get('/pending-claims', async (request, reply) => {
    const users = await User.find({ 'identityClaim.status': 'pending' }, 'name email profilePic identityClaim trustScore isVerified');
    reply.send({ pendingClaims: users });
  });

  /* ── Approve Identity Claim ── */
  fastify.post('/claims/:userId/approve', async (request, reply) => {
    const { userId } = request.params;
    const user = await User.findById(userId);
    
    if (!user || user.identityClaim.status !== 'pending') {
      return reply.code(404).send({ error: 'Pending claim not found for this user.' });
    }

    user.identityClaim.status = 'approved';
    user.identityClaim.reviewNotes = 'Approved by admin';
    user.verificationLevel = 'full';
    user.isVerified = true;
    user.trustScore = Math.min(user.trustScore + 40, 100);
    
    await user.save();
    
    reply.send({ success: true, message: 'Identity claim approved successfully.' });
  });

  /* ── Reject Identity Claim ── */
  fastify.post('/claims/:userId/reject', async (request, reply) => {
    const { userId } = request.params;
    const { reason } = request.body;
    const user = await User.findById(userId);
    
    if (!user || user.identityClaim.status !== 'pending') {
      return reply.code(404).send({ error: 'Pending claim not found for this user.' });
    }

    user.identityClaim.status = 'rejected';
    user.identityClaim.reviewNotes = reason || 'Rejected by admin';
    // Decrease trust score slightly as penalty
    user.trustScore = Math.max(user.trustScore - 10, 0);
    
    await user.save();
    
    reply.send({ success: true, message: 'Identity claim rejected.' });
  });

  /* ── Get Pending Company Claims ── */
  fastify.get('/pending-company-claims', async (request, reply) => {
    const companies = await Company.find({ 'ownershipClaim.status': 'pending' }).populate('owner', 'name email isVerified');
    reply.send({ pendingCompanyClaims: companies });
  });

  /* ── Approve Company Claim ── */
  fastify.post('/companies/:id/approve', async (request, reply) => {
    const { id } = request.params;
    const company = await Company.findById(id);
    
    if (!company || company.ownershipClaim.status !== 'pending') {
      return reply.code(404).send({ error: 'Pending claim not found for this company.' });
    }

    company.ownershipClaim.status = 'approved';
    company.ownershipClaim.reviewNotes = 'Approved by admin manually';
    company.isVerified = true;
    company.trustScore = Math.min(company.trustScore + 40, 100);
    
    await company.save();
    
    reply.send({ success: true, message: 'Company claim approved successfully.' });
  });

  /* ── Reject Company Claim ── */
  fastify.post('/companies/:id/reject', async (request, reply) => {
    const { id } = request.params;
    const { reason } = request.body || {};
    const company = await Company.findById(id);
    
    if (!company || company.ownershipClaim.status !== 'pending') {
      return reply.code(404).send({ error: 'Pending claim not found for this company.' });
    }

    company.ownershipClaim.status = 'rejected';
    company.ownershipClaim.reviewNotes = reason || 'Rejected by admin';
    
    await company.save();
    
    reply.send({ success: true, message: 'Company claim rejected.' });
  });

  /* ── Get Pending Events ── */
  fastify.get('/pending-events', async (request, reply) => {
    const events = await Event.find({ status: 'pending' }).populate('organizer', 'name email trustScore');
    reply.send({ pendingEvents: events });
  });

  /* ── Approve Event ── */
  fastify.post('/events/:id/approve', async (request, reply) => {
    const { id } = request.params;
    const event = await Event.findById(id);
    if (!event || event.status !== 'pending') {
      return reply.code(404).send({ error: 'Pending event not found.' });
    }
    event.status = 'approved';
    event.isVerified = true;
    event.trustScore = Math.min(event.trustScore + 30, 100);
    await event.save();
    reply.send({ success: true, message: 'Event approved successfully.' });
  });

  /* ── Reject Event ── */
  fastify.post('/events/:id/reject', async (request, reply) => {
    const { id } = request.params;
    const { reason } = request.body || {};
    const event = await Event.findById(id);
    if (!event || event.status !== 'pending') {
      return reply.code(404).send({ error: 'Pending event not found.' });
    }
    event.status = 'cancelled';
    event.reviewNotes = reason || 'Rejected by admin';
    await event.save();
    reply.send({ success: true, message: 'Event rejected and cancelled.' });
  });
}

module.exports = adminRoutes;
