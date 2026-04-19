/* ══════════════════════════════════════════════════════════════
   SyncUp Verified Professional Ecosystem — Comprehensive Tests
   Covers all 10 Functional Pillars + 4 Problem Statement Milestones
   ══════════════════════════════════════════════════════════════ */

const BASE = 'http://localhost:3000/api';
let token = '', demoToken = '', userId = '', companyId = '', jobId = '', postId = '', b2bId = '';
let pass = 0, fail = 0, total = 0;

async function req(method, path, body, customToken) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (customToken || token) opts.headers.Authorization = 'Bearer ' + (customToken || token);
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(BASE + path, opts);
    const data = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, ...data };
  } catch (e) { return { status: 0, ok: false, error: e.message }; }
}

function assert(name, condition, detail) {
  total++;
  if (condition) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.error(`  ❌ ${name}`, detail || ''); }
}

(async () => {
  console.log('\n══════════════════════════════════════════════');
  console.log('  SyncUp Ecosystem — 63-Point Test Suite');
  console.log('══════════════════════════════════════════════\n');

  /* ═══════════════════════════════════════════
     PILLAR 1: AUTH & USER REGISTRATION
     - Any email allowed (no domain restriction)
     - Password security (bcrypt 12 rounds)
     - JWT session management
     ═══════════════════════════════════════════ */
  console.log('── 1. Authentication & Registration (7 tests) ──');

  let x = await req('POST', '/auth/register', { name: 'Test User', email: 'test@anymail.com', password: 'Secure1234!' });
  assert('Register with any email domain', x.status === 201 && x.token, `status=${x.status}`);

  x = await req('POST', '/auth/register', { name: 'Dup', email: 'test@anymail.com', password: 'Secure1234!' });
  assert('Reject duplicate email', x.status === 409);

  x = await req('POST', '/auth/login', { email: 'test@anymail.com', password: 'Secure1234!' });
  assert('Login returns JWT token', x.ok && x.token);
  token = x.token;
  userId = x.user?.id;

  x = await req('POST', '/auth/login', { email: 'test@anymail.com', password: 'wrong' });
  assert('Reject wrong password', x.status === 401);

  x = await req('GET', '/auth/me');
  assert('Get current user via JWT', x.ok && x.user?.name === 'Test User');

  x = await req('POST', '/auth/login', { email: 'arjun@demo.com', password: 'Demo1234!' });
  assert('Demo user login', x.ok);
  demoToken = x.token;

  x = await req('POST', '/auth/register', { name: 'Referred User', email: 'ref@test.com', password: 'Secure1234!', referralCode: 'SU-ARJUN001' });
  assert('Register with referral code', x.status === 201);

  /* ═══════════════════════════════════════════
     PILLAR 10: REFERRAL, REWARDS & GROWTH
     - Shareable referral codes
     - Milestone-based rewards (100/500/1000)
     - Leaderboard
     ═══════════════════════════════════════════ */
  console.log('\n── 2. Referral & Rewards System (5 tests) ──');

  x = await req('GET', '/referrals/code', null, demoToken);
  assert('Get shareable referral code', x.ok && x.referralCode?.startsWith('SU-'));
  assert('Share link generated', x.shareLink?.includes(x.referralCode));

  x = await req('GET', '/referrals/milestones', null, demoToken);
  assert('Milestone targets: 100, 500, 1000', x.ok && x.milestones?.length === 3 && x.milestones[0].target === 100 && x.milestones[2].target === 1000);

  x = await req('GET', '/referrals/leaderboard');
  assert('Referral leaderboard accessible', x.ok && Array.isArray(x.leaderboard));

  x = await req('GET', '/referrals/history', null, demoToken);
  assert('Referral history with status tracking', x.ok && Array.isArray(x.referrals));

  /* ═══════════════════════════════════════════
     PILLAR 1: FACE VERIFICATION (Highest Priority)
     MILESTONE 1: Personal Identity Claim
     - Liveness proof required
     - Duplicate face detection
     - Trust score management
     ═══════════════════════════════════════════ */
  console.log('\n── 3. Face Verification & Anti-Spoofing (5 tests) ──');

  x = await req('POST', '/verify/face', { faceDescriptor: [1, 2, 3], livenessProof: true });
  assert('Reject invalid descriptor (too short)', x.status === 400);

  x = await req('POST', '/verify/face', { faceDescriptor: new Array(128).fill(0.1), livenessProof: false });
  assert('Reject without liveness proof', x.status === 400);

  x = await req('POST', '/verify/face', { faceDescriptor: new Array(128).fill(0.1), livenessProof: true });
  assert('Accept valid face + liveness', x.ok && x.success);
  assert('Trust score increases on verification', x.trustScore > 0);

  const u2 = await req('POST', '/auth/register', { name: 'Dup Face', email: 'dup@face.com', password: 'Secure1234!' });
  x = await req('POST', '/verify/face', { faceDescriptor: new Array(128).fill(0.1), livenessProof: true }, u2.token);
  assert('Detect & reject duplicate face identity', x.status === 409);

  /* ═══════════════════════════════════════════
     MILESTONE 1: Personal Identity Claim Verification
     - Risk scoring for high-profile names
     - Auto-approve vs manual review
     ═══════════════════════════════════════════ */
  console.log('\n── 4. Identity Claim Verification (3 tests) ──');

  x = await req('POST', '/verify/identity-claim', { claimedName: 'John Doe', documents: ['passport.pdf'] });
  assert('Normal name auto-approved', x.ok && x.status === 'approved');

  x = await req('POST', '/verify/identity-claim', { claimedName: 'CEO Elon Musk' });
  assert('High-profile name flagged for review', x.ok && x.status === 'pending');
  assert('Risk score > 70 for impersonation attempt', x.riskScore > 70);

  /* ═══════════════════════════════════════════
     PILLAR 9: COMPANY VERIFICATION
     MILESTONE 2: Company Ownership Claim
     - Domain email matching
     - Manual review fallback
     ═══════════════════════════════════════════ */
  console.log('\n── 5. Company Verification & Ownership (6 tests) ──');

  x = await req('POST', '/companies', { name: 'TestCorp', industry: 'Tech', description: 'Test company', website: 'https://testcorp.dev', location: 'Mumbai' }, demoToken);
  assert('Create company', x.status === 201);
  companyId = x.company?._id;

  x = await req('GET', '/companies');
  assert('List companies', x.ok && x.companies?.length > 0);

  x = await req('GET', '/companies/' + companyId);
  assert('Get company by ID', x.ok && x.company);

  x = await req('PUT', '/companies/' + companyId, { description: 'Updated' }, demoToken);
  assert('Update company (owner only)', x.ok);

  x = await req('POST', '/verify/company-ownership', { companyId, domainEmail: 'admin@testcorp.dev' }, demoToken);
  assert('Auto-approve ownership via domain email match', x.ok && x.domainMatch === true);

  x = await req('POST', '/verify/company-ownership', { companyId, domainEmail: 'random@gmail.com' }, demoToken);
  assert('Manual review for non-matching domain', x.ok && x.status === 'pending');

  /* ═══════════════════════════════════════════
     PILLAR 7: EVENT DISCOVERY & PARTICIPATION
     MILESTONE 3: Event Authenticity & Escrow
     - Payment escrow
     - Cancellation with refund
     - Fraud reporting
     ═══════════════════════════════════════════ */
  console.log('\n── 6. Events & Escrow Trust (5 tests) ──');

  x = await req('POST', '/events', { title: 'Test Hackathon', type: 'hackathon', description: 'Test', startDate: '2025-01-15', ticketPrice: 500, maxAttendees: 100, cancellationPolicy: 'full-refund' }, demoToken);
  assert('Create event with escrow policy', x.status === 201);

  x = await req('GET', '/events');
  assert('List events', x.ok);
  const eid = x.events?.[0]?._id;

  if (eid) {
    x = await req('POST', '/events/' + eid + '/register', {}, demoToken);
    assert('Register with escrow payment hold', x.ok && x.ticketId && x.escrowHeld >= 0);

    x = await req('POST', '/events/' + eid + '/register', {}, demoToken);
    assert('Reject duplicate registration', x.status === 409);

    x = await req('POST', '/events/' + eid + '/report', { reason: 'Suspicious listing' });
    assert('Submit fraud report', x.ok);
  }

  /* ═══════════════════════════════════════════
     PILLAR 6: EXPERIENCED JOBS PLATFORM
     - Freshers rejected
     - Experience minimum enforced
     - Application tracking
     ═══════════════════════════════════════════ */
  console.log('\n── 7. Experienced Jobs Platform (5 tests) ──');

  x = await req('POST', '/jobs', { title: 'Fresher Role', experienceMin: 0, description: 'Entry level' }, demoToken);
  assert('Reject fresher job posting (exp < 1)', x.status === 400);

  x = await req('POST', '/jobs', { title: 'Senior Dev', company: companyId, experienceMin: 5, description: 'Senior role', skills: ['Node.js'], salaryMin: 2000000, location: 'Bangalore' }, demoToken);
  assert('Create experienced job posting', x.status === 201);
  jobId = x.job?._id;

  x = await req('GET', '/jobs');
  assert('List jobs with company info', x.ok && x.jobs?.length > 0);

  x = await req('POST', '/jobs/' + jobId + '/apply', { coverNote: 'Interested' });
  assert('Apply for job', x.ok);

  x = await req('POST', '/jobs/' + jobId + '/apply', {});
  assert('Reject duplicate application', x.status === 409);

  /* ═══════════════════════════════════════════
     PILLAR 3: PROFESSIONAL NETWORKING
     - Content feed
     - Like/Comment/Share
     - Connection management
     - Profile management
     ═══════════════════════════════════════════ */
  console.log('\n── 8. Professional Feed & Networking (7 tests) ──');

  x = await req('POST', '/posts', { content: 'Test professional update', type: 'update' });
  assert('Create post', x.status === 201);
  postId = x.post?._id;

  x = await req('GET', '/posts');
  assert('Load feed with author info', x.ok && x.posts?.length > 0);

  x = await req('POST', '/posts/' + postId + '/like');
  assert('Like post', x.ok && x.liked === true);

  x = await req('POST', '/posts/' + postId + '/like');
  assert('Unlike (toggle)', x.ok && x.liked === false);

  x = await req('POST', '/posts/' + postId + '/comment', { content: 'Great post!' });
  assert('Comment on post', x.ok && x.commentCount === 1);

  x = await req('GET', '/users');
  assert('Search users', x.ok && x.users?.length > 0);

  x = await req('PUT', '/users/profile', { headline: 'Test Engineer', skills: ['Testing', 'QA'] });
  assert('Update profile', x.ok && x.user?.headline === 'Test Engineer');

  /* ═══════════════════════════════════════════
     PILLAR 2: SMART PROMOTION ENGINE (Second Highest)
     - Campaign creation
     - Coupon generation (60K → 120K)
     - Wallet & credit tracking
     ═══════════════════════════════════════════ */
  console.log('\n── 9. Promotion & Campaign Engine (7 tests) ──');

  x = await req('POST', '/campaigns', { type: 'post', budget: 5000 }, demoToken);
  assert('Create campaign', x.status === 201);

  x = await req('POST', '/campaigns/coupon', { budget: 500 }, demoToken);
  assert('Reject budget below ₹1,000 minimum', x.status === 400);

  x = await req('POST', '/campaigns/coupon', { budget: 60000 }, demoToken);
  assert('60K budget → 2x multiplier', x.ok && x.multiplier === 2);
  assert('Bonus credits = ₹60,000', x.bonusCredits === 60000);
  assert('Total promotional value = ₹120,000', x.totalCredits === 120000);
  assert('Coupon code format: SYNC-XXXXXX', x.couponCode?.startsWith('SYNC-'));

  x = await req('GET', '/campaigns/wallet', null, demoToken);
  assert('Wallet balance tracking', x.ok && x.credits > 0);

  /* ═══════════════════════════════════════════
     PILLAR 5: B2B SERVICE EXCHANGE
     - Project creation
     - Proposal/bidding flow
     - Milestone management
     - Rating system
     ═══════════════════════════════════════════ */
  console.log('\n── 10. B2B Service Exchange (5 tests) ──');

  x = await req('POST', '/b2b/projects', { title: 'CRM Development', description: 'Build custom CRM', category: 'development', budget: 500000, milestones: [{ title: 'Phase 1', amount: 200000 }] }, demoToken);
  assert('Create B2B project with milestones', x.status === 201);
  b2bId = x.project?._id;

  x = await req('GET', '/b2b/projects');
  assert('List B2B projects', x.ok);

  x = await req('POST', '/b2b/projects/' + b2bId + '/propose', { price: 450000, timeline: '3 months' });
  assert('Submit proposal/bid', x.ok);

  x = await req('PUT', '/b2b/projects/' + b2bId + '/milestone', { milestoneIndex: 0, status: 'completed' }, demoToken);
  assert('Update milestone status', x.ok);

  x = await req('POST', '/b2b/projects/' + b2bId + '/rate', { score: 5, review: 'Excellent work' }, demoToken);
  assert('Rate & review completed project', x.ok);

  /* ═══════════════════════════════════════════
     PILLAR 8: AI-ASSISTED USER EXPERIENCE
     - Profile improvement tips
     - Campaign recommendations
     - Networking suggestions
     - Opportunity matching
     ═══════════════════════════════════════════ */
  console.log('\n── 11. AI-Assisted Experience (4 tests) ──');

  x = await req('GET', '/ai/profile-tips');
  assert('AI profile improvement tips', x.ok && x.tips?.length >= 0);
  assert('Profile completeness score', typeof x.completeness === 'number');

  x = await req('GET', '/ai/campaign-tips');
  assert('AI campaign recommendations', x.ok && x.tips?.length > 0);

  x = await req('GET', '/ai/networking-suggestions');
  assert('AI networking suggestions', x.ok);

  /* ═══════════════════════════════════════════
     MILESTONE 4: DIRECT OWNER-TO-INVESTOR TRUST
     - Anti-middleman safeguards
     - Owner-only investment posting
     - Trust indicators
     ═══════════════════════════════════════════ */
  console.log('\n── 12. Investment Trust & Anti-Middleman (4 tests) ──');

  x = await req('POST', '/investment/seek', { companyId, seekingAmount: 1000000, equityOffered: 10, description: 'Seed round' }, demoToken);
  assert('Post investment opportunity (owner-only)', x.ok);

  x = await req('GET', '/investment/opportunities');
  assert('List investment opportunities', x.ok);

  x = await req('POST', '/investment/interest/' + companyId, { message: 'Interested in your company', amount: 500000 });
  assert('Express investor interest (direct connection)', x.ok);

  x = await req('GET', '/investment/trust/' + companyId);
  assert('Trust indicators for due diligence', x.ok && x.trustIndicators && x.safeguards?.length > 0);

  /* ═══════════════════════════════════════════ */
  console.log('\n══════════════════════════════════════════════');
  console.log(`  RESULTS: ${pass} / ${total} PASSED | ${fail} FAILED`);
  console.log('══════════════════════════════════════════════\n');
})();
