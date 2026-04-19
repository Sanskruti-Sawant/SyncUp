# SyncUp: Trust & Verification Milestones

This document outlines the solutions implemented within the SyncUp platform to address the four major trust and verification problem statements.

---

## 1. Personal Identity Claim Verification
**Problem**: How to verify that a user is who they claim to be, especially for high-profile names?

### Our Solution: Risk-Based Identity Shield
We implemented a multi-layered verification logic that combines automated risk scoring with manual administrative oversight.

- **High-Profile Impersonation Detection**: An integrated risk engine checks claimed names against a blacklist of high-profile business personalities.
- **Risk-Based Gating**: If a user claims a high-profile name, their **Risk Score** increases. High-risk claims are automatically "Flagged for Review" and the user is locked out of public features.
- **Mandatory Documentation**: Users must upload official professional proof (e.g., ID, LinkedIn profile verification) which is then reviewed by an Admin.
- **Verification Levels**: 
    - `none`: Unverified.
    - `basic`: Email verified.
    - `identity`: Name and Identity Document verified.
    - `full`: Identity + Face Match + Liveness verified.

---

## 2. Company Ownership Claim Verification
**Problem**: How to verify that a person claiming to be an owner is actually the owner?

### Our Solution: The Ownership Lineage Flow
We enforce a strict verification pipeline before a company can be listed as "Verified" or "Owned" on the platform.

- **Domain-Email Association**: Users must provide an official domain email matching the company's website (e.g., `ceo@acme.com` for `acme.com`).
- **Mandatory Business Documents**: Users must upload business registry or incorporation documents during the claim process.
- **Admin Approval Workflow**: Every company claim enters a `pending` queue where Admins verify the uploaded documents against the provided domain.
- **Owner vs. Employee Role Logic**: Only the verified owner can manage company settings or add authorized representatives.

---

## 3. Event Authenticity & Post-Payment Trust
**Problem**: How to ensure events are real and attendees are protected after payment?

### Our Solution: SyncEscrow & Mandatory Moderation
We built a "Zero-Trust" event management architecture that protects participant funds.

- **Mandatory Admin Gating**: All new events start as `pending` and are invisible to the public. They only go "Live" after an Admin reviews the event details and the organizer's credibility.
- **SyncEscrow Payment Model**: Funds paid by attendees are held in a platform-controlled escrow balance.
- **Organizer Accountability**: Funds are only released to the organizer once they mark the event as "Complete." If the event is canceled, funds are automatically refunded to attendees based on the selected **Cancellation Policy**.
- **Community Peer Moderation**: Attendees can "Report Fraud" directly on event cards. Multiple reports trigger an automatic flag for Admin investigation.

---

## 4. Direct Owner-to-Investor Trust
**Problem**: How to ensure direct contact between founders and investors without middlemen/brokers?

### Our Solution: Anti-Broker Shield & Trust Lineage
We eliminated the "Broker-in-the-Middle" problem by strictly mapping verified owners to investment listings.

- **Authorized Representative Mapping**: Verified owners can explicitly delegate roles (CFO/COO) to other verified users. Any attempt by an unmapped user to list a company is blocked.
- **Anti-Broker Safeguards**: Algorithmic limits prevent a single user from representing multiple unconnected unverified companies, stopping mass-brokerage accounts.
- **Direct-to-Founder Connection**: Expressing interest in an investment opportunity unlocks the **Founder's Direct Contact**.
- **Lineage Verification**: Investors can view the "Trust Lineage" of a company—a visual proof-chain showing exactly how the owner's identity and documents were verified.
- **High-Value Escalation**: Investment rounds exceeding ₹1 Crore trigger a manual **Escrow & Due Diligence** review by the platform admin.

---

## 🛠 Admin Operations & Manual Oversight

The platform includes a dedicated **Admin Governance Module** that acts as the final arbiter of trust. Below is exactly how the Admin role resolves each problem statement.

### 1. Identity Fraud Resolution (Milestone 1)
- **The Trigger**: When a user's `riskScore` exceeds 70 (e.g., claiming to be "Arjun Mehta" or "Elon Musk"), the account is flagged.
- **Admin Dashboard**: Admins view a specialized queue at `/api/verification/identity-claims/pending`.
- **The Action**: The Admin inspects the **Identity Documents** (Passport/Professional ID) against the profile data.
- **System Impact**: Upon Admin `approval`, the user's `verificationLevel` is promoted to `identity`, and they are removed from the "Flagged" state, unlocking platform access.

### 2. Business Legitimacy Audit (Milestone 2)
- **The Trigger**: Every new company listing enters a `review-required` state.
- **Admin Dashboard**: Admins access `/api/verification/company-claims/pending`.
- **The Action**: 
    1. Verify the **Domain Email** (is it a real business domain?).
    2. Inspect the **Business Registry PDF** (does it match the company name and owner?).
- **System Impact**: Admin approval sets `isVerified: true` for the company, making it visible in the public **B2B Service Exchange** and **Investment** tabs.

### 3. Event Safety & Escrow Release (Milestone 3)
- **The Trigger**: New events are hidden (`status: 'pending'`) until manually audited.
- **Admin Dashboard**: Admins review events at `/api/events/admin/pending`.
- **The Action**:
    - **Vetting**: Checks if the organizer has a high `trustScore`.
    - **Approval**: Sets `status: 'approved'`, making tickets available for purchase.
    - **Conflict Resolution**: If an event is reported for fraud (5+ reports), the Admin is notified to freeze the **SyncEscrow** funds.
- **System Impact**: Admin has the power to force-cancel an event and trigger **Automatic Refunds** to all attendees.

### 4. High-Value Investment Escalation (Milestone 4)
- **The Trigger**: Investment listings above ₹1 Crore or listings from "unverified representatives" are flagged as `review-required`.
- **The Action**: 
    - **Lineage Audit**: Admin verifies the **Trust Lineage** (is the person listing this actually authorized by the founder?).
    - **Safeguard Enforcement**: Admin can ban "Broker Accounts" that attempt to represent multiple unconnected companies.
- **System Impact**: Only after Admin sign-off does a high-value listing gain the "Verified Investment" badge, signaling safety to potential investors.

---

## 💻 Technical Implementation Details

| Feature | Logic Location | Database Impact |
|---------|---------------|-----------------|
| **Risk Engine** | `server/routes/verification.js` | Sets `identityClaim.riskScore` |
| **Escrow Hold** | `server/routes/events.js` | Updates `Event.escrowBalance` |
| **Anti-Broker Limit** | `server/routes/investment.js` | Queries `Company.countDocuments` for Rep |
| **Trust Lineage** | `server/routes/investment.js` | Populates `owner` and `authorizedRepresentatives` |
| **Admin Controls** | `server/routes/verification.js` | Role-based gate: `if (user.role !== 'admin')` |

---

**SyncUp: The Verified Professional Ecosystem.**
*Network. Deal. Hire. Experience.*
