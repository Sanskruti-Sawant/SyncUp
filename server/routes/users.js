const User = require('../models/User');

async function userRoutes(fastify, opts) {

  /* ── Get Profile ── */
  fastify.get('/:id', async (request, reply) => {
    const user = await User.findById(request.params.id)
      .select('-passwordHash -faceDescriptor')
      .populate('connections', 'name headline profilePic');
    if (!user) return reply.code(404).send({ error: 'User not found' });
    reply.send({ user });
  });

  /* ── Update Profile ── */
  fastify.put('/profile', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const allowed = ['name', 'headline', 'bio', 'skills', 'experience', 'location', 'profilePic', 'role'];
    const updates = {};
    for (const key of allowed) {
      if (request.body[key] !== undefined) updates[key] = request.body[key];
    }
    const user = await User.findByIdAndUpdate(request.user.id, updates, { new: true }).select('-passwordHash -faceDescriptor');
    reply.send({ user });
  });

  /* ── Send Connection Request ── */
  fastify.post('/connect/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    if (request.params.id === request.user.id) return reply.code(400).send({ error: 'Cannot connect with yourself' });

    const target = await User.findById(request.params.id);
    if (!target) return reply.code(404).send({ error: 'User not found' });

    const existing = target.connectionRequests.find(r => r.from.toString() === request.user.id);
    if (existing) return reply.code(409).send({ error: 'Connection request already sent' });

    if (target.connections.includes(request.user.id)) return reply.code(409).send({ error: 'Already connected' });

    target.connectionRequests.push({ from: request.user.id });
    await target.save();
    reply.send({ message: 'Connection request sent' });
  });

  /* ── Accept/Reject Connection ── */
  fastify.put('/connect/:requestId', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { action } = request.body; // 'accept' or 'reject'
    const user = await User.findById(request.user.id);
    const reqEntry = user.connectionRequests.id(request.params.requestId);
    if (!reqEntry) return reply.code(404).send({ error: 'Request not found' });

    if (action === 'accept') {
      user.connections.push(reqEntry.from);
      const other = await User.findById(reqEntry.from);
      other.connections.push(user._id);
      await other.save();
      reqEntry.status = 'accepted';
    } else {
      reqEntry.status = 'rejected';
    }
    await user.save();
    reply.send({ message: `Connection ${action}ed` });
  });

  /* ── Search Users ── */
  fastify.get('/', async (request, reply) => {
    const { q, role, page = 1, limit = 20 } = request.query;
    const filter = {};
    if (q) filter.$text = { $search: q };
    if (role) filter.role = role;
    const users = await User.find(filter)
      .select('name headline profilePic isVerified trustScore role skills')
      .skip((page - 1) * limit).limit(parseInt(limit));
    const total = await User.countDocuments(filter);
    reply.send({ users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  });
}

module.exports = userRoutes;
