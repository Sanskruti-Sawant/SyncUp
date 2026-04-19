const Event = require('../models/Event');
const { v4: uuidv4 } = require('uuid');

async function eventRoutes(fastify, opts) {
  fastify.post('/', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const event = new Event({ ...req.body, organizer: req.user.id, status: 'pending', trustScore: 10 });
    await event.save();
    reply.code(201).send({ event });
  });

  fastify.get('/', async (req, reply) => {
    const { q, type, page = 1, limit = 20 } = req.query;
    const filter = { status: { $in: ['approved', 'live'] } };
    if (q) filter.$text = { $search: q };
    if (type) filter.type = type;
    const events = await Event.find(filter).populate('organizer', 'name isVerified trustScore profilePic').sort({ startDate: 1 }).skip((page - 1) * limit).limit(parseInt(limit));
    reply.send({ events, total: await Event.countDocuments(filter) });
  });

  fastify.get('/:id', async (req, reply) => {
    const event = await Event.findById(req.params.id).populate('organizer', 'name isVerified trustScore profilePic headline');
    if (!event) return reply.code(404).send({ error: 'Event not found' });
    reply.send({ event });
  });

  // Register with escrow payment hold
  fastify.post('/:id/register', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const event = await Event.findById(req.params.id);
    if (!event) return reply.code(404).send({ error: 'Event not found' });
    if (event.status === 'cancelled') return reply.code(400).send({ error: 'Event cancelled' });
    if (event.attendees.some(a => a.user.toString() === req.user.id)) return reply.code(409).send({ error: 'Already registered' });
    if (event.attendees.length >= event.maxAttendees) return reply.code(400).send({ error: 'Event full' });
    const ticketId = 'TKT-' + uuidv4().slice(0, 8).toUpperCase();
    event.attendees.push({ user: req.user.id, ticketId, paidAmount: event.ticketPrice });
    event.escrowBalance += event.ticketPrice;
    await event.save();
    reply.send({ message: 'Registered', ticketId, escrowHeld: event.ticketPrice });
  });

  // Cancel with refund policy
  fastify.post('/:id/cancel', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const event = await Event.findById(req.params.id);
    if (!event || event.organizer.toString() !== req.user.id) return reply.code(403).send({ error: 'Not authorized' });
    event.status = 'cancelled';
    let refund = event.cancellationPolicy === 'full-refund' ? event.escrowBalance : event.cancellationPolicy === 'partial-refund' ? event.escrowBalance * 0.5 : 0;
    event.payoutStatus = 'refunded'; event.escrowBalance = 0;
    const User = require('../models/User');
    await User.findByIdAndUpdate(event.organizer, { $inc: { trustScore: -15 } });
    await event.save();
    reply.send({ message: 'Cancelled', refundAmount: refund });
  });

  // Complete → release escrow
  fastify.post('/:id/complete', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const event = await Event.findById(req.params.id);
    if (!event || event.organizer.toString() !== req.user.id) return reply.code(403).send({ error: 'Not authorized' });
    event.status = 'completed'; event.payoutStatus = 'released';
    const payout = event.escrowBalance; event.escrowBalance = 0;
    await event.save();
    reply.send({ message: 'Completed', payout });
  });

  // Fraud reporting
  fastify.post('/:id/report', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const event = await Event.findById(req.params.id);
    if (!event) return reply.code(404).send({ error: 'Not found' });
    event.fraudReports.push({ reporter: req.user.id, reason: req.body.reason, createdAt: new Date() });
    if (event.fraudReports.length >= 5) { event.status = 'pending'; event.trustScore = Math.max(event.trustScore - 20, 0); }
    await event.save();
    reply.send({ message: 'Report submitted' });
  });
}
module.exports = eventRoutes;
