# Dispatchly

Dispatchly is a last-mile delivery tracking and logistics orchestration platform. The system automates shipment creation, calculates pricing cards using volumetric algorithms, matches available courier agents using geodesic Haversine lookups, and tracks parcel lifecycles inside an immutable tracking ledger.

## Project Overview

Logistics operators require precision in billing, assignment, and tracking. Dispatchly addresses these core issues:
- **Pricing Leakage**: Bulgarian or bulky, light parcels are correctly charged by volume rather than raw mass.
- **Dispatch Lag**: Equidistant available couriers are auto-matched based on GPS metrics and active load counts.
- **Audit Trails**: History remains locked in an insert-only event table, preventing post-delivery state manipulation.

## Solution Architecture

Dispatchly utilizes a clean, **Layered Service-Oriented Architecture**:

```
[Next.js API Route (Controller)] ──► [Service Layer (Business Rules)] ──► [Prisma Client (ORM)]
```

### Key Decisions
- **Thin Controllers**: API routes are solely responsible for parsing parameters, validating payloads using Zod schemas, checking user JWT privileges, and handling HTTP status codes.
- **Dedicated Service Layer**: All core algorithms—rate pricing, Haversine checks, state machine transitions, and database queries—reside inside testable service files. This keeps logic isolated from Next.js server details.
- **No Repository Layer**: We interface directly with Prisma Client. Introducing a repository abstraction layer on top of Prisma would add redundant overhead without providing real benefits at this scale.

## Technology Stack

- **Framework**: Next.js 15 (App Router, Turbopack integration)
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **Database**: PostgreSQL (hosted on Neon Serverless)
- **Data Access**: Prisma ORM
- **Authentication**: Stateless JWT + Role-Based Access Control (RBAC)
- **Validation**: Zod
- **Notifications**: Resend SDK (Email Client)
- **Animation**: Framer Motion
- **Unit Testing**: Vitest

## Installation & Setup

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

## Test Logins & Regions (India / Uttar Pradesh Focus)

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

## Core Algorithms & Logic

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

## Database Schema Summary

- **User**: Contains core credentials, role type (`CUSTOMER`, `AGENT`, `ADMIN`), and password hashes.
- **Zone & Area**: Represents regional hierarchies. One Zone can contain multiple Areas.
- **RateCard**: Stores rate profiles based on order category (`B2B`/`B2C`) and route distance type (`INTRA_ZONE`/`INTER_ZONE`).
- **DeliveryAgent**: Keeps track of driver availability, duty states, and real-time coordinates.
- **Order**: Represents the shipment record, storing dimensions, billable amounts, current status, and assigned courier.
- **TrackingEvent**: Audit-safe logging table. Entries are strictly **insert-only**; database triggers and API constraints block all updates or deletes.

---

## API Reference

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

## Running Unit Tests

The rate engine's mathematical rules are verified via unit tests:
```bash
npm test
```

---

## Technical Design Tradeoffs & Interview Prep

### 1. Stateless JWT Sessions vs. Database Sessions
- **Tradeoff**: We use stateless, 7-day JWT tokens stored in localStorage. This eliminates session table reads on every API call, making operations fast. 
- **Consequence**: We cannot instantly revoke a token if a user's role changes mid-session. For a high-security context, we would need to switch to Redis-backed session stores or implement short-lived tokens with rotating refresh loops.

### 2. Pure Memory Rate Engine vs. Database Computations
- **Tradeoff**: The pricing engine performs calculations in-memory, querying only static rate cards from the database. 
- **Why**: This keeps pricing logic deterministic, incredibly fast, and easy to unit-test with mock data. It guarantees that calculations are correct before any database writes are committed.

### 3. Nearest-Neighbor Haversine vs. Routing API (OSRM)
- **Tradeoff**: We calculate geographic distance as a straight line on a sphere rather than querying real road routing matrices.
- **Why**: Haversine computes in microseconds with zero external API dependencies or network latency, serving as an excellent MVP approximation. In production, this would serve as a pre-filtering layer before calling a mapping service like OSRM or Google Maps.
