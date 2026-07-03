# Dispatchly — Smart Last-Mile Delivery Log

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=for-the-badge&logo=postgresql)](https://www.postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-6-black?style=for-the-badge&logo=prisma)](https://www.prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Vercel-Deployment-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Smart delivery orchestration, from rate to doorstep.**

Dispatchly is a high-performance, full-stack logistics portal designed to solve the structural opacity and coordination overhead of last-mile delivery. Utilizing a clean, layered service-oriented architecture, it automates parcel pricing via exact volumetric calculation cards, routes courier matching using GPS-nearest Haversine sorting, and logs every delivery transition inside an immutable tracking log with audit override tracks.

---

## 1. The Business Problem

Logistics operators struggle with three core issues in last-mile delivery:
- **Rate Surcharge Opacity**: Shipments are often incorrectly billed due to failure to account for dimensions (volumetric weight) vs. actual weight, causing margin leaks on large, lightweight items.
- **Assignment Delays**: Manually identifying and dispatching agents to pickup points leads to bottlenecks, unequal workloads, and high transit times.
- **Audit Tampering**: Operators lack a secure, chronological ledger of parcel history, making it difficult to analyze failed deliveries, customer claims, or dispatch mistakes.

Dispatchly fixes this by providing automated billing, automated dispatching, and an immutable tracking event timeline.

---

## 2. Solution Architecture

Dispatchly implements a **Layered Service-Oriented Architecture**:

```
[API Route (Controller)] ──► [Business Service (Validations & Logic)] ──► [Prisma Client (Data Access)]
```

- **Thin Controllers**: Next.js API Routes parse requests, validate JWT tokens, enforce RBAC, and handle raw HTTP responses.
- **Service Layer**: House business rules (e.g. rate calculations, Haversine checks, state transitions). Isolated from HTTP details for unit-testing.
- **Prisma ORM**: Directly manages the database access. There is **no repository-interface layer** on top of Prisma; doing so would introduce redundant boilerplate without adding value at this scale.

---

## 3. Major Features

- **Pricing Engine**: Checks category (B2B/B2C), route type (intra/inter zone), billable weights, and COD flat charges in a pure, testable function.
- **Haversine Matcher**: Queries online couriers, calculates geodesic distance, and auto-assigns the nearest candidate.
- **Tie-Breaker Dispatch**: Evaluates active delivery loads to prevent courier burnout.
- **Immutable Log**: Logs every status transition to an insert-only tracking ledger.
- **Admin Overrides**: Empowers dispatchers to fix state mistakes while explicitly flagging overrides (`isOverride = true`).
- **Role-Based Portals**: Displays clean workspaces customized for Customers, Courier Agents, and Admin dispatchers.
- **Resend Mail Notifications**: Triggers HTML update letters on every status transition.

---

## 4. Screenshots

| Public Landing Page | Customer Booking Hub |
|:---:|:---:|
| ![Landing Page](./docs/screenshots/landing.png) | ![Customer Hub](./docs/screenshots/customer_hub.png) |

| Admin Dispatch Console | Courier Duty Portal |
|:---:|:---:|
| ![Admin Dashboard](./docs/screenshots/admin_dashboard.png) | ![Courier Portal](./docs/screenshots/courier_portal.png) |

*(Note: Place your screenshots inside `/docs/screenshots/` in your repository).*

---

## 5. Installation & Setup

### 1. Prerequisites
- Node.js (v18.0.0 or higher)
- PostgreSQL database instance

### 2. Install Dependencies
```bash
npm install
```

### 3. Local Environment Variables
Create a `.env` file at the root directory:
```env
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"
DIRECT_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"
JWT_SECRET="dispatchly-random-security-key-32-chars-minimum"
RESEND_API_KEY="re_your_api_key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Database Sync & Seed
Deploy migrations and populate tables:
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 5. Start Development Server
```bash
npm run dev
```

---

## 6. Test Logins & Regions (India / Uttar Pradesh Focus)

The database seeder is preconfigured with Indian users, localized cities (Uttar Pradesh & NCR), and mock transactions:

### Localities & Zones
- **Uttar Pradesh (UP) Zone**: Kanpur (Sub-localities: *Barra*, *Kidwai Nagar*), Lucknow.
- **National Capital Region (NCR) Zone**: Noida, Delhi, Gurugram.

### Seeded Credentials

| Role | Name | Email | Password |
|---|---|---|---|
| **Admin** | Rajesh Kumar | `admin@dispatchly.test` | `Admin@123` |
| **Customer** | Aarav Sharma | `aarav@dispatchly.test` | `Customer@123` |
| **Customer** | Priya Patel | `priya@dispatchly.test` | `Customer@123` |
| **Courier Agent 1 (Online)** | Amit Singh | `amit@dispatchly.test` | `Agent@123` |
| **Courier Agent 2 (Online)** | Vikram Malhotra | `vikram@dispatchly.test` | `Agent@123` |
| **Courier Agent 3 (Offline)** | Neha Gupta | `neha@dispatchly.test` | `Agent@123` |

---

## 7. Core Algorithms & Logic

### 1. Volumetric Rate Calculation
Parcels are evaluated by both scale weight and physical size. The engine computes:
$$\text{Volumetric Weight (kg)} = \frac{\text{Length (cm)} \times \text{Width (cm)} \times \text{Height (cm)}}{5000}$$
$$\text{Billable Weight} = \max(\text{Actual Weight}, \text{Volumetric Weight})$$

If the pickup area and drop area share a parent Zone, the route is classified as `INTRA_ZONE`. Otherwise, it is classified as `INTER_ZONE`. Surcharges are calculated as:
$$\text{Final Price} = (\text{Billable Weight} \times \text{Price Per Kg}) + \text{Flat COD Charge (if payment is Cash on Delivery)}$$

### 2. Auto-Assignment Matcher
Available agents (`available = true`) are evaluated using the geodesic **Haversine formula** from the shipment origin:
$$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
- **Tie-Breaker Rule**: If multiple agents share the same distance, the system selects the agent with the **fewest active orders** to balance driver workloads.

### 3. Order Status State Machine
Order statuses follow a strict sequence of transitions:
`CREATED` ──► `PICKED_UP` ──► `IN_TRANSIT` ──► `OUT_FOR_DELIVERY` ──► `DELIVERED`

- **Failed Deliveries**: If delivery fails, status changes to `FAILED`. A Customer or Admin can then reschedule the order for a future date, which moves status to `RESCHEDULED` and clears the previous courier assignment.
- **Admin Overrides**: Administrators can change statuses out-of-sequence. When this happens, the service processes the update but flags the history event with `isOverride: true`.

---

## 8. Database Schema Summary

- **User**: Contains core credentials, role type (`CUSTOMER`, `AGENT`, `ADMIN`), and password hashes.
- **Zone & Area**: Represents regional hierarchies. One Zone can contain multiple Areas.
- **RateCard**: Stores rate profiles based on order category (`B2B`/`B2C`) and route distance type (`INTRA_ZONE`/`INTER_ZONE`).
- **DeliveryAgent**: Keeps track of driver availability, duty states, and real-time coordinates.
- **Order**: Represents the shipment record, storing dimensions, billable amounts, current status, and assigned courier.
- **TrackingEvent**: Audit-safe logging table. Entries are strictly **insert-only**; database triggers and API constraints block all updates or deletes.

---

## 9. API Reference

### Public Routes
- `POST /api/auth/register` - Create user.
- `POST /api/auth/login` - Authenticate user and receive JWT.

### Administrative Routes (ADMIN scope)
- `POST /api/zones` - Register new Delivery Zone.
- `POST /api/zones/:id/areas` - Register Area sub-locality.
- `POST /api/rate-cards` - Create or update Pricing Rates.
- `POST /api/orders/:id/assign` - Manually assign courier to order.
- `POST /api/orders/:id/auto-assign` - Trigger Haversine dispatch matcher.
- `GET /api/agents` - Monitor all courier locations and active workloads.
- `GET /api/admin/dashboard` - Retrieve aggregated dashboard counters.

### Shared & Scoped Routes
- `POST /api/rate-cards/calculate` - Estimate parcel shipping pricing.
- `POST /api/orders` - Book shipment.
- `GET /api/orders` - Scoped lookup (Admins see all, Customers see own, Agents see assigned).
- `PATCH /api/orders/:id/status` - Move order through state machine (Agent/Admin).
- `POST /api/orders/:id/reschedule` - Reschedule failed shipments (Customer/Admin).
- `GET /api/orders/:id/tracking` - Retrieve chronological event timeline.

---

## 10. Running Unit Tests

The rate engine's mathematical rules are verified via unit tests:
```bash
npm test
```

---

## 11. Technical Design Tradeoffs & Interview Prep

### 1. Stateless JWT Sessions vs. Database Sessions
- **Tradeoff**: We use stateless, 7-day JWT tokens stored in localStorage. This eliminates session table reads on every API call, making operations fast. 
- **Consequence**: We cannot instantly revoke a token if a user's role changes mid-session. For a high-security context, we would need to switch to Redis-backed session stores or implement short-lived tokens with rotating refresh loops.

### 2. Pure Memory Rate Engine vs. Database Computations
- **Tradeoff**: The pricing engine performs calculations in-memory, querying only static rate cards from the database. 
- **Why**: This keeps pricing logic deterministic, incredibly fast, and easy to unit-test with mock data. It guarantees that calculations are correct before any database writes are committed.

### 3. Nearest-Neighbor Haversine vs. Routing API (OSRM)
- **Tradeoff**: We calculate geographic distance as a straight line on a sphere rather than querying real road routing matrices.
- **Why**: Haversine computes in microseconds with zero external API dependencies or network latency, serving as an excellent MVP approximation. In production, this would serve as a pre-filtering layer before calling a mapping service like OSRM or Google Maps.

---

## 12. Developer Profile
Developed by **Abhijeet Singh Rana** (Senior Software Engineer / Placement Candidate).
- Focus areas: High-performance microservices, spatial query optimization, and distributed transaction state machines.
