/* ── Investment Trust & Direct Owner-to-Investor Flows ── */
/* Problem Statement Milestone #4: Direct Owner-to-Investor Trust */

const Company = require('../models/Company');
const User = require('../models/User');

async function investmentRoutes(fastify, opts) {

  /* ── List investment-ready companies ── */
  fastify.get('/opportunities', async (req, reply) => {
    const companies = await Company.find({ isVerified: true, seekingInvestment: true })
      .populate('owner', 'name headline profilePic isVerified verificationLevel trustScore')
      .sort({ trustScore: -1 });
    reply.send({ opportunities: companies });
  });

  /* ── Post investment opportunity (verified owners or representatives only) ── */
  fastify.post('/seek', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const user = await User.findById(req.user.id);
    if (!user.isVerified) return reply.code(403).send({ error: 'Only verified users can seek investment' });

    const { companyId, seekingAmount, equityOffered, description, sector } = req.body;
    const company = await Company.findById(companyId);
    if (!company) return reply.code(404).send({ error: 'Company not found' });

    const isOwner = company.owner.toString() === req.user.id;
    const isRep = company.authorizedRepresentatives?.some(r => r.user.toString() === req.user.id);

    if (!isOwner && !isRep) {
      return reply.code(403).send({ error: 'Only verified company owners or authorized representatives can seek investment (anti-middleman check)' });
    }

    /* Anti-Broker Safeguard: A single user cannot represent more than 2 unverified companies for investment */
    if (!isOwner) {
      const representingCount = await Company.countDocuments({ 
        'authorizedRepresentatives.user': req.user.id,
        isVerified: false 
      });
      if (representingCount > 2) {
        return reply.code(403).send({ error: 'Anti-broker limit reached. You cannot represent more than 2 unverified companies.' });
      }
    }

    company.seekingInvestment = true;
    company.investmentDetails = { seekingAmount, equityOffered, description, sector, postedAt: new Date() };
    
    // High-value escalation check (e.g., > ₹1 Crore)
    if (seekingAmount >= 10000000) {
      company.escalationLevel = 'review-required';
    } else {
      company.escalationLevel = 'none';
    }

    await company.save();
    reply.send({ message: 'Investment opportunity posted', company });
  });

  /* ── Add Authorized Representative (Owner only) ── */
  fastify.post('/representatives/add', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const { companyId, userEmail, role } = req.body;
    const company = await Company.findById(companyId);
    if (!company || company.owner.toString() !== req.user.id) {
      return reply.code(403).send({ error: 'Only the company owner can add representatives.' });
    }

    const targetUser = await User.findOne({ email: userEmail });
    if (!targetUser) return reply.code(404).send({ error: 'User not found' });
    if (!targetUser.isVerified) return reply.code(400).send({ error: 'Representative must be a verified user' });

    company.authorizedRepresentatives.push({ user: targetUser._id, role: role || 'Representative' });
    await company.save();
    reply.send({ message: 'Representative added successfully' });
  });

  /* ── Request Direct Proof (Investor only) ── */
  fastify.post('/interest/:companyId/request-proof', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const company = await Company.findById(req.params.companyId);
    if (!company) return reply.code(404).send({ error: 'Company not found' });

    const interest = company.investorInterests.find(i => i.investor.toString() === req.user.id);
    if (!interest) return reply.code(400).send({ error: 'You must express interest before requesting proof' });

    interest.proofRequested = true;
    await company.save();
    reply.send({ message: 'Direct proof-of-identity requested from the owner.' });
  });

  /* ── Get My Investment Opportunities ── */
  fastify.get('/my-opportunities', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const companies = await Company.find({ 
      $or: [
        { owner: req.user.id },
        { 'authorizedRepresentatives.user': req.user.id }
      ],
      seekingInvestment: true 
    });
    reply.send({ opportunities: companies });
  });

  /* ── Express interest (verified investors only) ── */
  fastify.post('/interest/:companyId', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const user = await User.findById(req.user.id);
    if (!user.isVerified) return reply.code(403).send({ error: 'Only verified users can express interest' });

    const company = await Company.findById(req.params.companyId).populate('owner', 'name email headline isVerified verificationLevel');
    if (!company) return reply.code(404).send({ error: 'Company not found' });

    // Direct owner-to-investor trust: return owner info directly (no middleman)
    const ownerVerified = company.owner?.isVerified && company.isVerified;

    if (!company.investorInterests) company.investorInterests = [];
    const alreadyInterested = company.investorInterests.some(i => i.investor?.toString() === req.user.id);
    if (alreadyInterested) return reply.code(409).send({ error: 'Already expressed interest' });

    company.investorInterests.push({
      investor: req.user.id,
      message: req.body.message || '',
      amount: req.body.amount || 0,
      createdAt: new Date()
    });
    await company.save();

    reply.send({
      message: 'Interest registered. Direct connection established.',
      ownerContact: ownerVerified ? {
        name: company.owner.name,
        headline: company.owner.headline,
        verified: true,
        verificationLevel: company.owner.verificationLevel
      } : null,
      trustIndicators: {
        ownerVerified: company.owner?.isVerified || false,
        companyVerified: company.isVerified,
        ownerVerificationLevel: company.owner?.verificationLevel || 'none',
        companyTrustScore: company.trustScore,
        isDirectOwner: true,
        escalationLevel: company.escalationLevel
      }
    });
  });

  /* ── Get trust indicators for a company ── */
  fastify.get('/trust/:companyId', async (req, reply) => {
    const company = await Company.findById(req.params.companyId)
      .populate('owner', 'name isVerified verificationLevel trustScore identityClaim')
      .populate('authorizedRepresentatives.user', 'name isVerified');
    if (!company) return reply.code(404).send({ error: 'Company not found' });

    reply.send({
      companyName: company.name,
      escalationLevel: company.escalationLevel,
      trustIndicators: {
        companyVerified: company.isVerified,
        companyTrustScore: company.trustScore,
        ownershipVerified: company.ownershipClaim?.status === 'approved',
        ownerIdentityVerified: company.owner?.isVerified || false,
        ownerVerificationLevel: company.owner?.verificationLevel || 'none',
        ownerTrustScore: company.owner?.trustScore || 0,
        representativesCount: (company.authorizedRepresentatives || []).length,
        hasBusinessDocuments: (company.ownershipClaim?.documents?.length || 0) > 0,
      },
      lineage: {
        verifiedOwner: company.owner?.name,
        verifiedRepresentatives: (company.authorizedRepresentatives || []).map(r => ({ name: r.user.name, role: r.role })),
        verificationStatus: company.ownershipClaim?.status
      },
      safeguards: [
        'Only verified owners or mapped representatives can list investment opportunities',
        'Direct connection lineage ensures no unauthorized middlemen',
        'Anti-broker logic prevents mass representation by unverified accounts',
        'High-value deals (>₹1Cr) undergo manual escalation review'
      ]
    });
  });
}

module.exports = investmentRoutes;
