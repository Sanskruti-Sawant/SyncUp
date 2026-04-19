require('dotenv').config();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const ROOT = path.join(__dirname, '..');

async function main() {
  const fastify = require('fastify')({ logger: true });

  /* ── Plugins ── */
  fastify.register(require('@fastify/cors'), { origin: true });
  fastify.register(require('@fastify/jwt'), { secret: process.env.JWT_SECRET || 'dev_secret' });
  fastify.register(require('@fastify/multipart'), { limits: { fileSize: 5 * 1024 * 1024 } });

  /* ── Allow empty-body POST (e.g. /like, /register) ── */
  fastify.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body, done) {
    try {
      const json = body && body.length > 0 ? JSON.parse(body) : {};
      done(null, json);
    } catch (e) { done(e, undefined); }
  });

  /* ── Auth Decorator ── */
  fastify.decorate('authenticate', async function (request, reply) {
    try { await request.jwtVerify(); }
    catch (err) { reply.code(401).send({ error: 'Unauthorized' }); }
  });

  /* ── API Routes ── */
  fastify.register(require('./routes/auth'), { prefix: '/api/auth' });
  fastify.register(require('./routes/users'), { prefix: '/api/users' });
  fastify.register(require('./routes/verification'), { prefix: '/api/verify' });
  fastify.register(require('./routes/companies'), { prefix: '/api/companies' });
  fastify.register(require('./routes/events'), { prefix: '/api/events' });
  fastify.register(require('./routes/jobs'), { prefix: '/api/jobs' });
  fastify.register(require('./routes/posts'), { prefix: '/api/posts' });
  fastify.register(require('./routes/campaigns'), { prefix: '/api/campaigns' });
  fastify.register(require('./routes/referrals'), { prefix: '/api/referrals' });
  fastify.register(require('./routes/b2b'), { prefix: '/api/b2b' });
  fastify.register(require('./routes/ai'), { prefix: '/api/ai' });
  fastify.register(require('./routes/investment'), { prefix: '/api/investment' });

  /* ── HTML page routes ── */
  const sendHTML = (file) => (req, reply) => {
    reply.type('text/html').send(fs.readFileSync(path.join(ROOT, file)));
  };
  fastify.get('/', sendHTML('index.html'));
  fastify.get('/login', sendHTML('login.html'));
  fastify.get('/verify', sendHTML('verify.html'));
  fastify.get('/dashboard', sendHTML('dashboard.html'));
  fastify.get('/register', sendHTML('login.html'));

  /* ── Static assets (CSS, JS, images) served from /static prefix ── */
  // Map common file extensions to their content types
  const MIME = {
    '.css': 'text/css', '.js': 'application/javascript', '.png': 'image/png',
    '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
    '.woff': 'font/woff', '.woff2': 'font/woff2', '.json': 'application/json',
    '.html': 'text/html',
  };

  // Serve known static files explicitly to avoid conflicting with /api/* routes
  const serveStatic = (filename) => {
    const ext = path.extname(filename);
    fastify.get('/' + filename, (req, reply) => {
      const filePath = path.join(ROOT, filename);
      if (fs.existsSync(filePath)) {
        reply.type(MIME[ext] || 'application/octet-stream').send(fs.readFileSync(filePath));
      } else {
        reply.code(404).send({ error: 'Not found' });
      }
    });
  };
  // Register known static assets
  ['index.css', 'index.js', 'screen.png', 'DESIGN.md', 'code.html'].forEach(serveStatic);

  /* ── Database ── */
  const MONGO_URI = process.env.MONGODB_URI;
  let mongoUri = MONGO_URI;

  if (!MONGO_URI || MONGO_URI.includes('127.0.0.1:27017')) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    fastify.log.info('Starting in-memory MongoDB...');
    const mongod = await MongoMemoryServer.create();
    mongoUri = mongod.getUri();
    fastify.log.info('In-memory MongoDB at: ' + mongoUri);
  }

  await mongoose.connect(mongoUri);
  fastify.log.info('Mongoose connected');

  await seedDemoData(fastify);

  /* ── Listen ── */
  const PORT = parseInt(process.env.PORT) || 3000;
  await fastify.ready();
  fastify.log.info('All routes registered. Route list:');
  fastify.log.info(fastify.printRoutes());
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  fastify.log.info(`✨ SyncUp running at http://localhost:${PORT}`);
}

/* ── Demo Seed Data ── */
async function seedDemoData(fastify) {
  const User = require('./models/User');
  const Company = require('./models/Company');
  const Event = require('./models/Event');
  const Job = require('./models/Job');
  const Post = require('./models/Post');
  const bcrypt = require('bcrypt');

  if (await User.countDocuments() > 0) return;
  fastify.log.info('Seeding demo data...');

  const hash = await bcrypt.hash('Demo1234!', 12);
  const users = await User.insertMany([
    { name: 'Arjun Mehta', email: 'arjun@demo.com', passwordHash: hash, referralCode: 'SU-ARJUN001', isVerified: true, verificationLevel: 'full', trustScore: 85, headline: 'CEO & Founder at TechNexus', role: 'investor', skills: ['Leadership', 'Strategy', 'AI'] },
    { name: 'Priya Sharma', email: 'priya@demo.com', passwordHash: hash, referralCode: 'SU-PRIYA002', isVerified: true, verificationLevel: 'identity', trustScore: 72, headline: 'Senior Engineer at CloudScale', role: 'professional', skills: ['Node.js', 'React', 'MongoDB'] },
    { name: 'Vikram Desai', email: 'vikram@demo.com', passwordHash: hash, referralCode: 'SU-VIKRM003', isVerified: true, verificationLevel: 'basic', trustScore: 55, headline: 'Product Manager at FinEdge', role: 'recruiter', skills: ['Product', 'Growth', 'Analytics'] },
  ]);

  const companies = await Company.insertMany([
    { name: 'TechNexus Solutions', owner: users[0]._id, industry: 'Technology', description: 'AI-powered enterprise solutions for modern businesses. Cloud migration, custom development, and AI consulting.', isVerified: true, trustScore: 90, size: '51-200', website: 'https://technexus.dev', location: 'Bangalore, India', servicesOffered: ['AI Consulting', 'Cloud', 'Custom Dev'] },
    { name: 'CloudScale Infra', owner: users[1]._id, industry: 'Cloud', description: 'Scalable cloud infrastructure for startups and enterprises.', isVerified: true, trustScore: 78, size: '11-50', location: 'Mumbai, India' },
  ]);

  await Event.insertMany([
    { title: 'Devkraft Innovation Hackathon 2024', organizer: users[0]._id, company: companies[0]._id, description: '48-hour hackathon with top mentors, prizes, and investor access. Build the future of verified professional networking.', type: 'hackathon', startDate: new Date('2024-12-15'), location: 'Bangalore', ticketPrice: 500, maxAttendees: 200, status: 'approved', isVerified: true, trustScore: 85 },
    { title: 'AI in Business Workshop', organizer: users[1]._id, description: 'Hands-on workshop on implementing AI in business processes. Free for all verified professionals.', type: 'workshop', startDate: new Date('2024-11-20'), isOnline: true, ticketPrice: 0, maxAttendees: 500, status: 'approved', isVerified: true },
  ]);

  await Job.insertMany([
    { title: 'Senior Full-Stack Engineer', company: companies[0]._id, postedBy: users[0]._id, description: 'Join our core platform team. Work with React, Node.js, and MongoDB at scale.', skills: ['React', 'Node.js', 'MongoDB'], experienceMin: 5, salaryMin: 2500000, salaryMax: 4500000, location: 'Bangalore' },
    { title: 'Lead Product Designer', company: companies[1]._id, postedBy: users[1]._id, description: 'Design cloud infrastructure dashboards. Lead a team of 4 designers.', skills: ['Figma', 'UI/UX'], experienceMin: 7, salaryMin: 2000000, location: 'Mumbai / Remote', isRemote: true },
  ]);

  await Post.insertMany([
    { author: users[0]._id, content: 'Excited to announce TechNexus has been selected for the Devkraft Innovation Challenge! Building the future of verified professional networking. 🚀', type: 'update' },
    { author: users[1]._id, content: 'Just completed our migration to serverless on Cloud Run. 40% cost reduction and 3x faster response times!', type: 'article' },
    { author: users[2]._id, content: 'Looking for a co-founder for an EdTech startup. Verified founders only. DM if interested. 📚 #StartupIndia', type: 'opportunity' },
  ]);

  fastify.log.info('Seeded: 3 users, 2 companies, 2 events, 2 jobs, 3 posts');
  fastify.log.info('Demo login: arjun@demo.com / Demo1234!');
}

main().catch(err => { console.error(err); process.exit(1); });
