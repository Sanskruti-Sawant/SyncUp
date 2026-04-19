# SyncUp — Verified Professional Ecosystem

> A trusted digital platform for professionals, companies, organisers, founders, recruiters, investors, and communities. Built for the **Devkraft Hackathon**.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server (auto-restarts on changes)
npm run dev

# Production start
npm start
```

The server starts at **http://localhost:3000** with an in-memory MongoDB — zero configuration required.

### Demo Credentials
| User | Email | Password |
|------|-------|----------|
| Arjun Mehta (Investor/CEO) | `arjun@demo.com` | `Demo1234!` |
| Priya Sharma (Engineer) | `priya@demo.com` | `Demo1234!` |
| Vikram Desai (Recruiter) | `vikram@demo.com` | `Demo1234!` |

---

## 🏗 Architecture Overview

```
├── server/
│   ├── index.js              # Fastify server, DB connection, route registration
│   ├── models/               # Mongoose schemas (8 models)
│   │   ├── User.js           # User with face descriptor, trust score, referral
│   │   ├── Company.js        # Company with ownership claim, investment fields
│   │   ├── Event.js          # Event with escrow, fraud reports, ticketing
│   │   ├── Job.js            # Jobs (experienced only, min 1yr exp)
│   │   ├── Post.js           # Professional feed with likes/comments
│   │   ├── Campaign.js       # Promotional campaigns with coupon engine
│   │   ├── Referral.js       # Referral tracking with status
│   │   └── B2BProject.js     # B2B projects with milestones, proposals
│   └── routes/               # API route handlers (12 modules)
│       ├── auth.js           # Register, Login, JWT, /me
│       ├── users.js          # Profiles, Connections, Search
│       ├── verification.js   # Face verify, Identity claim, Company ownership
│       ├── companies.js      # CRUD, Search, Verification
│       ├── events.js         # CRUD, Escrow, Cancel/Complete, Fraud reporting
│       ├── jobs.js           # CRUD, Apply (experienced only)
│       ├── posts.js          # Feed, Like/Unlike toggle, Comments
│       ├── campaigns.js      # Create, Coupon engine, Wallet
│       ├── referrals.js      # Code, Milestones, Leaderboard, History
│       ├── b2b.js            # Projects, Proposals, Milestones, Ratings
│       ├── ai.js             # Profile tips, Campaign recs, Network suggestions
│       └── investment.js     # Seek funding, Interest, Trust indicators
├── index.html                # Landing page
├── login.html                # Auth page (login/register)
├── verify.html               # Face verification with liveness detection
├── dashboard.html            # Dashboard with all features
├── index.css                 # Design system (Luminous Monolith theme)
└── tests/
    └── api-tests.js          # 63-test comprehensive API test suite
```

---

## 🔧 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Backend** | Node.js + **Fastify** | High-performance, schema-based validation, plugin architecture |
| **Database** | **MongoDB** + Mongoose | Flexible document model, text search indexes |
| **Auth** | **JWT** (7-day tokens) | Stateless, scalable authentication |
| **Security** | **bcrypt** (12 rounds) | Industry-standard password hashing |
| **Face AI** | **face-api.js** (TensorFlow.js) | Browser-side face detection, landmark tracking, descriptor extraction |
| **Dev DB** | **mongodb-memory-server** | Zero-config local development |
| **Frontend** | HTML5 + CSS3 + Vanilla JS | Maximum performance, no framework overhead |

---

## 📋 10 Functional Pillars Coverage

### ✅ Pillar 1: Verified Human Identity (Highest Priority)
- **Face verification** using SSD MobileNet + 68-point landmarks
- **Liveness detection** via EAR-based blink challenge (adaptive calibration)
- **Anti-spoofing**: Rejects printed photos, screens, masks, static images
- **Duplicate prevention**: Cosine similarity matching against all stored descriptors
- **Trust scoring**: Increases with each verification level

### ✅ Pillar 2: Smart Promotion Engine (Second Highest)
- Campaign creation with audience targeting
- **Coupon engine**: Spend 60K → get 120K (2x multiplier, 3-month validity)
- Promotional wallet with credit tracking
- Campaign analytics (impressions, clicks, conversions)

### ✅ Pillar 3: Professional Networking
- User profiles with headline, bio, skills, experience
- Professional content feed with post types (update, article, opportunity)
- Like/unlike toggle, comments
- Connection requests with accept/reject flow
- User search with role and text filters

### ✅ Pillar 4: Business Opportunity Marketplace
- Investment opportunities listing (verified owners only)
- Direct owner-to-investor contact (anti-middleman)
- Trust indicators for due diligence

### ✅ Pillar 5: B2B Service Exchange
- Project posting with milestone breakdown
- Proposal/bidding workflow
- Milestone tracking and completion
- Rating and review system

### ✅ Pillar 6: Experienced Professionals Jobs
- **Freshers rejected** (minimum 1 year experience enforced)
- Company-linked job postings
- Skill-based matching
- Application tracking with duplicate prevention

### ✅ Pillar 7: Event Discovery & Participation
- Event creation with type classification
- **Escrow payment system** (funds held until event completes)
- Ticket generation (TKT-XXXXXXXX format)
- Cancellation with configurable refund policy
- **Fraud reporting** (auto-flag at 5+ reports)

### ✅ Pillar 8: AI-Assisted Experience
- Profile optimization tips with completeness scoring
- Campaign budget recommendations with multiplier guidance
- Networking suggestions based on shared skills
- Opportunity matching (jobs + events)

### ✅ Pillar 9: Verified Company Identity
- Company creation with duplicate prevention (mapPlaceId)
- **Domain email verification** for ownership claims
- Manual review fallback for unmatched domains
- Business document validation flow

### ✅ Pillar 10: Referral, Rewards & Growth
- Auto-generated referral codes (SU-XXXXXXXX)
- Shareable referral links
- **Milestone rewards**: 100 → Gift, 500 → Premium, 1000 → Flagship Device
- Referral leaderboard (top 50)
- Referral history with verification status tracking

---

## 🏆 Problem Statement Milestones

### Milestone 1: Personal Identity Claim Verification
**Solution**: Risk-based scoring engine that checks claimed names against high-profile patterns (CEOs, public figures, political names). Names scoring >70/100 require manual review with document upload. Normal names are auto-approved.

### Milestone 2: Company Ownership Claim Verification
**Solution**: Domain email matching — if the user's email domain matches the company website domain, ownership is auto-approved. Non-matching domains trigger manual review requiring business documents.

### Milestone 3: Event Authenticity & Post-Payment Trust
**Solution**: Escrow payment model where ticket payments are held until event completion. Organizer trust score affected by cancellations (-15 points). Fraud reporting system auto-flags events with 5+ reports.

### Milestone 4: Direct Owner-to-Investor Trust
**Solution**: Only verified company owners can post investment opportunities. Investors see multi-layered trust indicators (owner verification, company verification, ownership proof, trust scores). Direct contact is established only when both parties are verified — no middleman possible.

---

## 🧪 Test Coverage

Run the comprehensive test suite:
```bash
node tests/api-tests.js
```

### 63 Tests Across 12 Categories

| Category | Tests | Coverage |
|----------|-------|----------|
| Auth & Registration | 7 | Any-email login, JWT, duplicate prevention |
| Referral & Rewards | 5 | Codes, milestones, leaderboard, history |
| Face Verification | 5 | Liveness, descriptors, duplicates, trust |
| Identity Claims | 3 | Normal names, high-risk, risk scoring |
| Company Verification | 6 | CRUD, domain match, ownership, manual review |
| Events & Escrow | 5 | Create, register, escrow, duplicates, fraud |
| Experienced Jobs | 5 | Fresher rejection, CRUD, applications |
| Feed & Networking | 7 | Posts, likes, comments, search, profiles |
| Campaign Engine | 7 | Campaigns, coupons, multipliers, wallet |
| B2B Exchange | 5 | Projects, proposals, milestones, ratings |
| AI Assistance | 4 | Profile tips, campaign recs, suggestions |
| Investment Trust | 4 | Seek funding, interest, trust indicators |

### Test Strategy
- **Functional flows**: Complete user journeys (register → verify → use features)
- **Validations**: Input validation, schema enforcement, business rules
- **Edge cases**: Duplicate prevention, authorization checks, boundary values
- **User roles**: Unverified vs verified access, owner-only operations
- **Business logic**: Escrow calculations, coupon multipliers, trust scoring

---

## 📝 Assumptions & Scope

### Assumptions
1. Face verification happens client-side (browser) with descriptor sent to server — no server-side face processing needed
2. In-memory MongoDB is acceptable for hackathon demo (production would use persistent MongoDB)
3. Payment/escrow is simulated (no real payment gateway integration)
4. AI tips are rule-based (production would integrate with LLM APIs)
5. Email verification is simulated (production would send verification emails)

### Scope Limitations
1. No real-time messaging (WebSocket integration deferred)
2. No file upload for profile pictures or documents (multipart configured but UI deferred)
3. No admin dashboard (admin role exists in schema but no admin UI)
4. No push notifications (notification schema deferred)
5. Single-server deployment (production would use load balancing)

---

## 🔒 Security Implementation
- **bcrypt** with 12 salt rounds for password hashing
- **JWT** tokens with 7-day expiry
- **Rate limiting** configured via @fastify/rate-limit
- **CORS** properly configured
- **Input validation** via Fastify JSON schema
- **Face descriptor similarity** threshold at 0.6 (cosine)
- **Trust scoring** system (0-100) affecting feature access

---

## 📄 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, get JWT |
| GET | `/api/auth/me` | ✅ | Current user profile |
| POST | `/api/verify/face` | ✅ | Face verification + liveness |
| POST | `/api/verify/identity-claim` | ✅ | Claim name identity |
| POST | `/api/verify/company-ownership` | ✅ | Verify company ownership |
| GET/POST | `/api/users/*` | Mixed | Profiles, connections, search |
| GET/POST | `/api/companies/*` | Mixed | Company CRUD, search |
| GET/POST | `/api/events/*` | Mixed | Events, registration, escrow |
| GET/POST | `/api/jobs/*` | Mixed | Job postings, applications |
| GET/POST | `/api/posts/*` | Mixed | Feed, likes, comments |
| GET/POST | `/api/campaigns/*` | ✅ | Campaigns, coupons, wallet |
| GET | `/api/referrals/*` | Mixed | Codes, milestones, leaderboard |
| GET/POST | `/api/b2b/*` | Mixed | B2B projects, proposals |
| GET | `/api/ai/*` | ✅ | AI tips and recommendations |
| GET/POST | `/api/investment/*` | Mixed | Investment & trust flows |

---

*Built with ❤️ for Devkraft Hackathon*
