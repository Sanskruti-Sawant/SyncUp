const Post = require('../models/Post');
async function postRoutes(fastify, opts) {
  fastify.post('/', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const post = new Post({ ...req.body, author: req.user.id });
    await post.save();
    reply.code(201).send({ post });
  });
  fastify.get('/', async (req, reply) => {
    const { page = 1, limit = 20, type } = req.query;
    const filter = {};
    if (type) filter.type = type;
    const posts = await Post.find(filter).populate('author', 'name headline profilePic isVerified').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    reply.send({ posts, total: await Post.countDocuments(filter) });
  });
  fastify.post('/:id/like', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const post = await Post.findById(req.params.id);
    if (!post) return reply.code(404).send({ error: 'Post not found' });
    const idx = post.likes.indexOf(req.user.id);
    if (idx > -1) post.likes.splice(idx, 1); else post.likes.push(req.user.id);
    await post.save();
    reply.send({ liked: idx === -1, likeCount: post.likes.length });
  });
  fastify.post('/:id/comment', { onRequest: [fastify.authenticate] }, async (req, reply) => {
    const post = await Post.findById(req.params.id);
    if (!post) return reply.code(404).send({ error: 'Post not found' });
    post.comments.push({ author: req.user.id, content: req.body.content });
    await post.save();
    reply.send({ message: 'Comment added', commentCount: post.comments.length });
  });
}
module.exports = postRoutes;
