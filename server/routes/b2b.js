const B2BProject = require('../models/B2BProject');
async function b2bRoutes(fastify, opts) {
  fastify.post('/projects', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const project = new B2BProject({ ...req.body, clientUser: req.user.id });
    await project.save();
    reply.code(201).send({ project });
  });
  fastify.get('/projects', async (req, reply) => {
    const { q, category, page = 1, limit = 20 } = req.query;
    const filter = { status: 'open' };
    if (q) filter.$text = { $search: q };
    if (category) filter.category = category;
    const projects = await B2BProject.find(filter).populate('client', 'name logo').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    reply.send({ projects, total: await B2BProject.countDocuments(filter) });
  });
  fastify.post('/projects/:id/propose', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const project = await B2BProject.findById(req.params.id);
    if (!project) return reply.code(404).send({ error: 'Project not found' });
    project.proposals.push({ ...req.body, user: req.user.id });
    await project.save();
    reply.send({ message: 'Proposal submitted' });
  });
  fastify.put('/projects/:id/milestone', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const project = await B2BProject.findById(req.params.id);
    if (!project) return reply.code(404).send({ error: 'Not found' });
    const { milestoneIndex, status } = req.body;
    if (project.milestones[milestoneIndex]) {
      project.milestones[milestoneIndex].status = status;
      if (status === 'completed') project.milestones[milestoneIndex].completedAt = new Date();
    }
    await project.save();
    reply.send({ message: 'Milestone updated', milestones: project.milestones });
  });
  fastify.post('/projects/:id/rate', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const project = await B2BProject.findById(req.params.id);
    if (!project) return reply.code(404).send({ error: 'Not found' });
    project.rating = { score: req.body.score, review: req.body.review };
    project.status = 'completed';
    await project.save();
    reply.send({ message: 'Rating submitted' });
  });
}
module.exports = b2bRoutes;
