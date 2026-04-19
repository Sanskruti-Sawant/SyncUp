const Campaign = require('../models/Campaign');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

async function campaignRoutes(fastify, opts) {
  // Create campaign
  fastify.post('/', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const campaign = new Campaign({ ...req.body, owner: req.user.id });
    await campaign.save();
    reply.code(201).send({ campaign });
  });

  // Generate coupon (spend 60K → get 120K)
  fastify.post('/coupon', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const { budget } = req.body;
    if (!budget || budget < 1000) return reply.code(400).send({ error: 'Minimum budget ₹1,000' });
    const multiplier = budget >= 60000 ? 2 : budget >= 30000 ? 1.5 : 1.2;
    const bonusCredits = Math.floor(budget * multiplier) - budget;
    const couponCode = 'SYNC-' + uuidv4().slice(0, 6).toUpperCase();
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 3 months

    const campaign = new Campaign({
      owner: req.user.id, type: 'post', budget, bonusCredits,
      couponCode, couponMultiplier: multiplier, couponExpiresAt: expiresAt, status: 'active',
      startDate: new Date(), endDate: expiresAt
    });
    await campaign.save();

    // Credit wallet
    await User.findByIdAndUpdate(req.user.id, { $inc: { promotionalCredits: budget + bonusCredits } });

    reply.send({ couponCode, budget, bonusCredits, totalCredits: budget + bonusCredits, expiresAt, multiplier });
  });

  // Wallet balance
  fastify.get('/wallet', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const user = await User.findById(req.user.id).select('promotionalCredits');
    const campaigns = await Campaign.find({ owner: req.user.id }).select('budget bonusCredits spent status couponCode');
    reply.send({ credits: user.promotionalCredits, campaigns });
  });

  // Campaign analytics
  fastify.get('/:id/analytics', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign || campaign.owner.toString() !== req.user.id) return reply.code(403).send({ error: 'Not authorized' });
    reply.send({ impressions: campaign.impressions, clicks: campaign.clicks, conversions: campaign.conversions, spent: campaign.spent, remaining: campaign.budget + campaign.bonusCredits - campaign.spent });
  });
}
module.exports = campaignRoutes;
