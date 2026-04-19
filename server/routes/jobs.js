const Job = require('../models/Job');
async function jobRoutes(fastify, opts) {
  fastify.post('/', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const job = new Job({ ...req.body, postedBy: req.user.id });
    if (!job.experienceMin || job.experienceMin < 1) return reply.code(400).send({ error: 'Minimum 1 year experience required. This platform is for experienced professionals only.' });
    await job.save();
    reply.code(201).send({ job });
  });
  fastify.get('/', async (req, reply) => {
    const { q, minExp, location, type, page = 1, limit = 20 } = req.query;
    const filter = { status: 'open' };
    if (q) filter.$text = { $search: q };
    if (minExp) filter.experienceMin = { $gte: parseInt(minExp) };
    if (type) filter.type = type;
    const jobs = await Job.find(filter).populate('company', 'name logo isVerified').populate('postedBy', 'name').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    reply.send({ jobs, total: await Job.countDocuments(filter) });
  });
  fastify.get('/:id', async (req, reply) => {
    const job = await Job.findById(req.params.id).populate('company').populate('postedBy', 'name headline');
    if (!job) return reply.code(404).send({ error: 'Job not found' });
    reply.send({ job });
  });
  fastify.post('/:id/apply', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const job = await Job.findById(req.params.id);
    if (!job) return reply.code(404).send({ error: 'Job not found' });
    if (job.applicants.some(a => a.user.toString() === req.user.id)) return reply.code(409).send({ error: 'Already applied' });
    job.applicants.push({ user: req.user.id, coverNote: req.body.coverNote || '' });
    await job.save();
    reply.send({ message: 'Application submitted' });
  });
}
module.exports = jobRoutes;
