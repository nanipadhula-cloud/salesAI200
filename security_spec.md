# Firestore Security Specification: SalesgenieAI CRM

## 1. Data Invariants
- **User profiles** (`users/{userId}`) can only be managed by the authenticating user (except Admins who have lookup permissions). No user can change their own role to Admin or self-assign privileges.
- **Leads** (`leads/{leadId}`) can only be created, read, updated, or deleted by authenticated users.
- **Customers** (`customers/{customerId}`) represent onboarded clients and can only be updated/deleted by authorized sales staff.
- **Opportunities** (`opportunities/{oppId}`) must correspond to existing leads or clients, and revenue amounts must be non-negative.
- **Global Catch-all**: Any access to unregistered collections is strictly forbidden by default.

---

## 2. The "Dirty Dozen" Threat Payloads
These payloads represent attempts to bypass identity checks, pollute the state, or spoof attributes:

1. **Self-Appointed Admin Privilege Escalation**
   - *Target*: `users/victim-uid`
   - *Payload*: `{ "id": "victim-uid", "role": "Admin", "name": "Hacker" }`
   - *Expectation*: `PERMISSION_DENIED`

2. **Lead Owner Hijack**
   - *Target*: `leads/active-lead-1`
   - *Payload*: `{ "ownerId": "attacker-uid", "name": "Stolen Lead" }`
   - *Expectation*: `PERMISSION_DENIED`

3. **Orphaned Opportunity Placement**
   - *Target*: `opportunities/opp-99`
   - *Payload*: `{ "leadId": "invalid-nonexistent-id", "revenue": -500000 }`
   - *Expectation*: `PERMISSION_DENIED`

4. **Resource Poisoning (Junk Character ID)**
   - *Target*: `leads/!!!@@@$$$###___JUNK_CHARACTER_OVERFLOW_OVER_128_BYTES_TESTING_THE_DENIAL_OF_WALLET_SAFEGUARDS_FOR_DOCUMENT_PATH_VARIABLES_EXTREMELY_LONG`
   - *Payload*: `{ "name": "Poison ID" }`
   - *Expectation*: `PERMISSION_DENIED`

5. **Immortality Field Override**
   - *Target*: `leads/lead-1`
   - *Payload*: `{ "createdAt": "2020-01-01T00:00:00Z" }` (Modifying historical timestamps)
   - *Expectation*: `PERMISSION_DENIED`

6. **Validation Bypass (Ghost Field Ingress)**
   - *Target*: `leads/lead-2`
   - *Payload*: `{ "name": "Test", "isPremiumSecretUnlocked": true }`
   - *Expectation*: `PERMISSION_DENIED`

7. **Anonymous Unauthorized Egress**
   - *Target*: `leads/lead-3`
   - *Auth*: None (Unauthenticated)
   - *Expectation*: `PERMISSION_DENIED`

8. **Bulk Query Scraping Egress**
   - *Target*: Querying the entire `leads` collection without ownerId filtering
   - *Expectation*: `PERMISSION_DENIED`

9. **Terminal State Lockdown Override**
   - *Target*: `opportunities/opp-finished`
   - *Payload*: `{ "stage": "Closed Won", "revenue": 100000 }` (updating already Closed Won opportunities)
   - *Expectation*: `PERMISSION_DENIED`

10. **Spoofed Metadata Timestamp**
    - *Target*: `tasks/task-1`
    - *Payload*: `{ "createdAt": "2035-12-31T23:59:59Z" }` (Using client instead of server timestamp)
    - *Expectation*: `PERMISSION_DENIED`

11. **Negative Opportunity Value**
    - *Target*: `opportunities/opp-neg`
    - *Payload*: `{ "revenue": -2500 }`
    - *Expectation*: `PERMISSION_DENIED`

12. **PII Egress Leak**
    - *Target*: Trying to read email and phone fields of user profiles that do not belong to the active user
    - *Expectation*: `PERMISSION_DENIED`

---

## 3. Threat Audit Matrix
| Collection | Identity Spoofing Guard | State Shortcutting Guard | Resource Poisoning Guard | Audit Status |
| :--- | :--- | :--- | :--- | :--- |
| `users` | Verifies `auth.uid == userId` | Cannot transition roles | Restricted size, type validation | PASSED |
| `leads` | Verifies `auth.uid == resource.data.ownerId` | Schema structure enforced | String lengths bounded | PASSED |
| `opportunities` | Relational check on owner | Stage constraints | Mandatory types check | PASSED |
