const Referral = require('../models/Referral');
const User = require('../models/User');

async function referralRoutes(fastify, opts) {
  // Get my referral code
  fastify.get('/code', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const user = await User.findById(req.user.id).select('referralCode referralCount');
    reply.send({ referralCode: user.referralCode, referralCount: user.referralCount, shareLink: `/register?ref=${user.referralCode}` });
  });

  // Milestones & rewards
  fastify.get('/milestones', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const user = await User.findById(req.user.id);
    const verified = await Referral.countDocuments({ referrer: req.user.id, status: 'verified' });
    const milestones = [
      { target: 100, reward: '🎁 Gift Reward', reached: verified >= 100 },
      { target: 500, reward: '🏆 Premium Reward', reached: verified >= 500 },
      { target: 1000, reward: '📱 Flagship Device', reached: verified >= 1000 }
    ];
    reply.send({ verifiedReferrals: verified, milestones, referralCode: user.referralCode });
  });

  // Leaderboard
  fastify.get('/leaderboard', async (req, reply) => {
    const leaders = await User.find({ referralCount: { $gt: 0 } })
      .select('name referralCount profilePic headline trustScore')
      .sort({ referralCount: -1 }).limit(50);
    reply.send({ leaderboard: leaders });
  });

  // Referral history
  fastify.get('/history', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const referrals = await Referral.find({ referrer: req.user.id }).populate('referred', 'name createdAt isVerified').sort({ createdAt: -1 });
    reply.send({ referrals });
  });
}
module.exports = referralRoutes;
