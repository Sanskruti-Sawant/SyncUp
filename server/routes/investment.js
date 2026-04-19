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

  /* ── Post investment opportunity (verified owners only) ── */
  fastify.post('/seek', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const user = await User.findById(req.user.id);
    if (!user.isVerified) return reply.code(403).send({ error: 'Only verified users can seek investment' });

    const { companyId, seekingAmount, equityOffered, description, sector } = req.body;
    const company = await Company.findById(companyId);
    if (!company) return reply.code(404).send({ error: 'Company not found' });
    if (company.owner.toString() !== req.user.id) return reply.code(403).send({ error: 'Only verified company owners can seek investment (anti-middleman check)' });

    company.seekingInvestment = true;
    company.investmentDetails = { seekingAmount, equityOffered, description, sector, postedAt: new Date() };
    await company.save();
    reply.send({ message: 'Investment opportunity posted', company });
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
        directContact: ownerVerified
      }
    });
  });

  /* ── Get trust indicators for a company ── */
  fastify.get('/trust/:companyId', async (req, reply) => {
    const company = await Company.findById(req.params.companyId)
      .populate('owner', 'name isVerified verificationLevel trustScore identityClaim');
    if (!company) return reply.code(404).send({ error: 'Company not found' });

    reply.send({
      companyName: company.name,
      trustIndicators: {
        companyVerified: company.isVerified,
        companyTrustScore: company.trustScore,
        ownershipVerified: company.ownershipClaim?.status === 'approved',
        ownerIdentityVerified: company.owner?.isVerified || false,
        ownerVerificationLevel: company.owner?.verificationLevel || 'none',
        ownerTrustScore: company.owner?.trustScore || 0,
        identityClaimStatus: company.owner?.identityClaim?.status || 'none',
        hasBusinessDocuments: (company.ownershipClaim?.documents?.length || 0) > 0,
        domainEmailVerified: company.ownershipClaim?.status === 'approved' && company.ownershipClaim?.reviewNotes?.includes('domain'),
      },
      safeguards: [
        'Only verified owners can list investment opportunities',
        'Direct communication between owner and investor (no middleman)',
        'Identity, company, and ownership verification required',
        'Trust score visible to all parties',
        'Fraud reports monitored by platform'
      ]
    });
  });
}

module.exports = investmentRoutes;
