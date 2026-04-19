const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Referral = require('../models/Referral');

async function authRoutes(fastify, opts) {

  /* ── Register ── */
  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          referralCode: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { name, email, password, referralCode } = request.body;

    const existing = await User.findOne({ email });
    if (existing) return reply.code(409).send({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const userReferralCode = 'SU-' + uuidv4().slice(0, 8).toUpperCase();

    const user = new User({
      name, email, passwordHash,
      referralCode: userReferralCode,
      referredBy: referralCode || null,
      trustScore: 10,
    });
    await user.save();

    // Track referral
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        await Referral.create({ referrer: referrer._id, referred: user._id, referralCode, status: 'pending' });
        referrer.referralCount += 1;
        await referrer.save();
      }
    }

    const token = fastify.jwt.sign({ id: user._id, email: user.email }, { expiresIn: '7d' });

    reply.code(201).send({
      token,
      user: { id: user._id, name: user.name, email: user.email, referralCode: userReferralCode, isVerified: false, verificationLevel: 'none' }
    });
  });

  /* ── Login ── */
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { email, password } = request.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      fastify.log.warn(`Login failed: User not found (${email})`);
      return reply.code(401).send({ error: 'User not found. If you recently registered, please note the in-memory database resets when the server restarts.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      fastify.log.warn(`Login failed: Incorrect password for ${email}`);
      return reply.code(401).send({ error: 'Incorrect password. Please check your credentials.' });
    }

    const token = fastify.jwt.sign({ id: user._id, email: user.email }, { expiresIn: '7d' });

    reply.send({
      token,
      user: {
        id: user._id, name: user.name, email: user.email,
        isVerified: user.isVerified, verificationLevel: user.verificationLevel,
        referralCode: user.referralCode, trustScore: user.trustScore,
        profilePic: user.profilePic, headline: user.headline, role: user.role
      }
    });
  });

  /* ── Get Current User ── */
  fastify.get('/me', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const user = await User.findById(request.user.id).select('-passwordHash -faceDescriptor');
    if (!user) return reply.code(404).send({ error: 'User not found' });
    reply.send({ user });
  });
}

module.exports = authRoutes;
