/* ── AI-Assisted Tips & Recommendations ── */
/* Problem Statement Pillar #8: AI-Assisted User Experience */

const User = require('../models/User');

async function aiRoutes(fastify, opts) {

  /* ── Profile Improvement Tips ── */
  fastify.get('/profile-tips', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const user = await User.findById(req.user.id).select('-passwordHash -faceDescriptor');
    const tips = [];

    if (!user.isVerified) tips.push({ priority: 'high', type: 'verification', tip: 'Complete face verification to unlock all platform features and increase your trust score by 30 points.', action: '/verify' });
    if (!user.headline || user.headline.length < 10) tips.push({ priority: 'high', type: 'profile', tip: 'Add a professional headline (e.g. "Senior Engineer at Google"). Profiles with headlines get 5x more views.', field: 'headline' });
    if (!user.bio || user.bio.length < 50) tips.push({ priority: 'medium', type: 'profile', tip: 'Write a compelling bio (100+ chars). Tell others about your expertise and what you\'re looking for.', field: 'bio' });
    if (!user.skills || user.skills.length < 3) tips.push({ priority: 'medium', type: 'profile', tip: 'Add at least 3-5 skills to improve your visibility in search results and opportunity matching.', field: 'skills' });
    if (!user.location) tips.push({ priority: 'low', type: 'profile', tip: 'Add your location to get matched with local opportunities and events.', field: 'location' });
    if (!user.profilePic) tips.push({ priority: 'medium', type: 'profile', tip: 'Upload a professional photo. Profiles with photos receive 14x more views.', field: 'profilePic' });
    if (user.connections?.length < 5) tips.push({ priority: 'medium', type: 'networking', tip: 'Build your network! Connect with at least 5 professionals to unlock networking features.' });
    if (user.referralCount === 0) tips.push({ priority: 'low', type: 'growth', tip: 'Share your referral code to earn rewards. 100 verified referrals = Gift Reward!', action: '/dashboard#referrals' });
    if (user.trustScore < 50) tips.push({ priority: 'high', type: 'trust', tip: `Your trust score is ${user.trustScore}/100. Complete verification steps to increase it.` });

    // Completeness score
    const fields = ['headline', 'bio', 'skills', 'location', 'profilePic', 'isVerified'];
    const filled = fields.filter(f => {
      const val = user[f];
      return val && (Array.isArray(val) ? val.length > 0 : true);
    }).length;
    const completeness = Math.round((filled / fields.length) * 100);

    reply.send({ tips, completeness, totalTips: tips.length });
  });

  /* ── Campaign Recommendations ── */
  fastify.get('/campaign-tips', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const user = await User.findById(req.user.id);
    const tips = [];

    if (user.promotionalCredits === 0) {
      tips.push({ tip: 'Start with a ₹5,000 campaign to reach 1,000+ professionals. You\'ll get ₹1,000 bonus credits!', budget: 5000 });
    }
    if (user.promotionalCredits > 0 && user.promotionalCredits < 30000) {
      tips.push({ tip: 'Upgrade to ₹30,000 for 1.5x multiplier and reach 10,000+ professionals.', budget: 30000 });
    }
    tips.push({ tip: 'Best performing campaigns target specific industries and roles. Use audience filters for 3x better engagement.' });
    tips.push({ tip: 'Sponsored posts on Monday-Wednesday mornings get 40% higher engagement.' });

    reply.send({ tips, currentCredits: user.promotionalCredits });
  });

  /* ── Networking Suggestions ── */
  fastify.get('/networking-suggestions', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const user = await User.findById(req.user.id);
    const connectionIds = user.connections || [];

    // Suggest verified users with similar skills, excluding existing connections
    const suggestions = await User.find({
      _id: { $ne: req.user.id, $nin: connectionIds },
      isVerified: true,
      skills: { $in: user.skills || [] }
    }).select('name headline profilePic isVerified trustScore skills').limit(10);

    // Fallback: if no skill match, suggest top verified users
    if (suggestions.length < 5) {
      const more = await User.find({
        _id: { $ne: req.user.id, $nin: [...connectionIds, ...suggestions.map(s => s._id)] },
        isVerified: true,
        trustScore: { $gte: 50 }
      }).select('name headline profilePic isVerified trustScore skills').limit(5);
      suggestions.push(...more);
    }

    reply.send({
      suggestions,
      tip: suggestions.length > 0 ? 'These professionals share your skills and interests.' : 'Complete your profile to get personalized networking suggestions.'
    });
  });

  /* ── Opportunity Matching ── */
  fastify.get('/opportunity-match', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const user = await User.findById(req.user.id);
    const Job = require('../models/Job');
    const Event = require('../models/Event');

    const matchedJobs = await Job.find({
      status: 'open',
      skills: { $in: user.skills || [] }
    }).populate('company', 'name logo isVerified').limit(5);

    const upcomingEvents = await Event.find({
      status: { $in: ['approved', 'live'] },
      startDate: { $gte: new Date() }
    }).populate('organizer', 'name isVerified').sort({ startDate: 1 }).limit(5);

    reply.send({ matchedJobs, upcomingEvents, tip: 'Based on your skills and interests' });
  });
}

module.exports = aiRoutes;
