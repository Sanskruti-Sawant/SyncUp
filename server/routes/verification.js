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

    const user = await User.findById(request.user.id);
    // Check name risk of the registered name
    const existingUsers = await User.find({ name: new RegExp(`^${user.name}$`, 'i'), _id: { $ne: user._id }, isVerified: true });
    const riskScore = calculateNameRisk(user.name, user.email, existingUsers);

    user.faceDescriptor = faceDescriptor;
    user.livenessProof = true;
    
    // All users must now go through document verification, regardless of risk score
    user.isVerified = false;
    user.verificationLevel = 'none';
    user.identityClaim = {
      status: 'pending',
      documents: [],
      riskScore
    };

    await user.save();

    reply.send({
      success: true,
      needsNameVerification: true,
      message: 'Face liveness confirmed. Please upload supporting documents in the Dashboard to complete verification.',
      verificationLevel: 'none',
      trustScore: user.trustScore
    });
  });

  /* ── Identity Claim Verification ── */
  fastify.post('/identity-claim', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { claimedName, documents, professionalProof } = request.body;
    const user = await User.findById(request.user.id);
    if (!user.livenessProof) return reply.code(403).send({ error: 'Face verification required first' });

    // Check for existing users with the same name to prevent impersonation
    const existingUsers = await User.find({ name: new RegExp(`^${claimedName}$`, 'i'), _id: { $ne: user._id }, isVerified: true });
    
    // Risk scoring for name claims
    const riskScore = calculateNameRisk(claimedName, user.email, existingUsers);

    if (!documents || documents.length === 0) {
      return reply.code(400).send({ error: 'Supporting documents are required for all name claims.' });
    }

    // All claims are now pending manual review
    user.identityClaim = {
      status: 'pending',
      documents: documents || [],
      riskScore
    };

    await user.save();

    reply.send({
      status: user.identityClaim.status,
      riskScore,
      message: 'Your name claim requires manual review. Please wait for an admin to verify your documents.'
    });
  });

  /* ── Check Name Risk (Real-time Frontend Feedback) ── */
  fastify.get('/check-name-risk', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { name } = request.query;
    if (!name) return reply.send({ riskScore: 0 });

    const user = await User.findById(request.user.id);
    const existingUsers = await User.find({ name: new RegExp(`^${name}$`, 'i'), _id: { $ne: user._id }, isVerified: true });
    
    const riskScore = calculateNameRisk(name, user.email, existingUsers);
    
    reply.send({ riskScore, requiresDocument: riskScore > 70 });
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
function calculateNameRisk(name, email = '', existingUsers = []) {
  const highProfilePatterns = [
    /\b(ceo|cto|founder|president|minister|chairman)\b/i,
    /\b(elon|bezos|zuckerberg|nadella|pichai|ambani|tata|adani|cook|jobs)\b/i,
    /\b(modi|trump|gates|musk|obama|biden)\b/i
  ];
  let risk = 0;
  
  // 1. High Profile Keywords
  for (const pattern of highProfilePatterns) {
    if (pattern.test(name)) risk += 40;
  }
  if (name.length < 3) risk += 20;

  // 2. Profile Authenticity Signals
  // If the claimed name somewhat matches their registered email domain or handle, reduce risk
  const emailLocalPart = email.split('@')[0].toLowerCase();
  const nameLower = name.toLowerCase().replace(/\s+/g, '');
  
  if (emailLocalPart.includes(nameLower) || nameLower.includes(emailLocalPart)) {
    risk = Math.max(0, risk - 15); // Authentic signal
  } else {
    risk += 10; // Generic email mismatch
  }

  // 3. Impersonation Prevention
  // If another verified user already has this exact name, huge risk increase
  if (existingUsers.length > 0) {
    risk += 50; 
  }

  return Math.min(risk, 100);
}

module.exports = verificationRoutes;
