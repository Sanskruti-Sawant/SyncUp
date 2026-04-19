const Company = require('../models/Company');

async function companyRoutes(fastify, opts) {

  /* ── Create Company ── */
  fastify.post('/', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { name, industry, description, website, location, size, founded, servicesOffered, mapPlaceId, domainEmail, documents } = request.body;

    // Duplicate check via mapPlaceId
    if (mapPlaceId) {
      const existing = await Company.findOne({ mapPlaceId });
      if (existing) return reply.code(409).send({ error: 'Company already registered with this location', existingId: existing._id });
    }

    if (!domainEmail || !documents || documents.length === 0) {
      return reply.code(400).send({ error: 'Domain email and supporting documents are required to verify ownership.' });
    }

    const company = new Company({
      name, owner: request.user.id, industry, description, website,
      location, size, founded, servicesOffered, mapPlaceId, trustScore: 10,
      isVerified: false,
      ownershipClaim: {
        status: 'pending',
        domainEmail,
        documents
      }
    });
    await company.save();
    reply.code(201).send({ company });
  });

  /* ── Get Company ── */
  fastify.get('/:id', async (request, reply) => {
    const company = await Company.findById(request.params.id).populate('owner', 'name headline profilePic isVerified');
    if (!company) return reply.code(404).send({ error: 'Company not found' });
    reply.send({ company });
  });

  /* ── Search Companies ── */
  fastify.get('/', async (request, reply) => {
    const { q, industry, page = 1, limit = 20 } = request.query;
    const filter = {
      $or: [
        { isVerified: true },
        { owner: request.user.id }
      ]
    };
    if (q) filter.$text = { $search: q };
    if (industry) filter.industry = industry;
    const companies = await Company.find(filter)
      .populate('owner', 'name isVerified')
      .skip((page - 1) * limit).limit(parseInt(limit));
    const total = await Company.countDocuments(filter);
    reply.send({ companies, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  });

  /* ── Update Company ── */
  fastify.put('/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const company = await Company.findById(request.params.id);
    if (!company) return reply.code(404).send({ error: 'Company not found' });
    if (company.owner.toString() !== request.user.id) return reply.code(403).send({ error: 'Not authorized' });

    const allowed = ['description', 'website', 'location', 'size', 'servicesOffered', 'logo', 'industry'];
    for (const key of allowed) {
      if (request.body[key] !== undefined) company[key] = request.body[key];
    }
    await company.save();
    reply.send({ company });
  });
}

module.exports = companyRoutes;
