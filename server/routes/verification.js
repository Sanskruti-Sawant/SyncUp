const User = require('../models/User');
const Referral = require('../models/Referral');

async function verificationRoutes(fastify, opts) {

  /* ── Face Verification ── */
  fastify.post('/face', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { faceDescriptor, livenessProof } = request.body;

    if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length < 64) {
      return reply.code(400).send({ error: 'Invalid face descriptor data' });
    }
    if (!livenessProof) {
      return reply.code(400).send({ error: 'Liveness proof required. Please complete the blink challenge.' });
    }

    // Duplicate detection: compare against all stored descriptors
    const allUsers = await User.find({ 'faceDescriptor.0': { $exists: true }, _id: { $ne: request.user.id } });
    
    for (const existingUser of allUsers) {
      const distance = cosineSimilarity(faceDescriptor, existingUser.faceDescriptor);
      if (distance > 0.6) {
        return reply.code(409).send({
          error: 'Duplicate identity detected',
          message: 'A face matching this identity already exists in the system. Each person can only have one account.'
        });
      }
    }

    // Store descriptor and mark verified
    const user = await User.findById(request.user.id);
    user.faceDescriptor = faceDescriptor;
    user.isVerified = true;
    user.livenessProof = true;
    user.verificationLevel = 'basic';
    user.trustScore = Math.min(user.trustScore + 30, 100);
    await user.save();

    // Verify referral chain
    const referral = await Referral.findOne({ referred: user._id, status: 'pending' });
    if (referral) {
      referral.status = 'verified';
      await referral.save();
    }

    reply.send({
      success: true,
      message: 'Face verification complete. Identity confirmed.',
      verificationLevel: 'basic',
      trustScore: user.trustScore
    });
  });

  /* ── Identity Claim Verification ── */
  fastify.post('/identity-claim', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { claimedName, documents, professionalProof } = request.body;
    const user = await User.findById(request.user.id);
    if (!user.isVerified) return reply.code(403).send({ error: 'Face verification required first' });

    // Risk scoring for name claims
    const riskScore = calculateNameRisk(claimedName);

    user.identityClaim = {
      status: riskScore > 70 ? 'pending' : 'approved',  // High-risk names need manual review
      documents: documents || [],
      riskScore
    };

    if (riskScore <= 70) {
      user.verificationLevel = 'identity';
      user.trustScore = Math.min(user.trustScore + 20, 100);
    }

    await user.save();

    reply.send({
      status: user.identityClaim.status,
      riskScore,
      message: riskScore > 70
        ? 'Your name claim requires manual review due to high-profile match. Please upload supporting documents.'
        : 'Identity claim approved. Verification level upgraded.'
    });
  });

  /* ── Company Ownership Verification ── */
  fastify.post('/company-ownership', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { companyId, domainEmail, documents } = request.body;
    const Company = require('../models/Company');
    const company = await Company.findById(companyId);
    if (!company) return reply.code(404).send({ error: 'Company not found' });

    // Domain email verification
    let domainMatch = false;
    if (domainEmail && company.website) {
      const companyDomain = new URL(company.website).hostname.replace('www.', '');
      const emailDomain = domainEmail.split('@')[1];
      domainMatch = emailDomain === companyDomain;
    }

    company.ownershipClaim = {
      status: domainMatch ? 'approved' : 'pending',
      documents: documents || [],
      domainEmail,
      reviewNotes: domainMatch ? 'Auto-approved: domain email matches company website' : 'Pending manual review'
    };

    if (domainMatch) {
      company.isVerified = true;
      company.trustScore = Math.min(company.trustScore + 40, 100);
    }

    await company.save();

    reply.send({
      status: company.ownershipClaim.status,
      domainMatch,
      message: domainMatch
        ? 'Ownership verified via domain email match.'
        : 'Ownership claim submitted for manual review. Please ensure your documents are valid.'
    });
  });
}

/* ── Helper: Cosine Similarity ── */
function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/* ── Helper: Name Risk Scoring ── */
function calculateNameRisk(name) {
  const highProfilePatterns = [
    /\b(ceo|cto|founder|president|minister|chairman)\b/i,
    /\b(elon|bezos|zuckerberg|nadella|pichai|ambani|tata|adani)\b/i,
    /\b(modi|trump|gates|musk)\b/i
  ];
  let risk = 0;
  for (const pattern of highProfilePatterns) {
    if (pattern.test(name)) risk += 40;
  }
  if (name.length < 3) risk += 20;
  return Math.min(risk, 100);
}

module.exports = verificationRoutes;
