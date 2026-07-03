# Daffodil — Last-Mile Delivery Tracker

A placement-evaluated, secure last-mile delivery tracking platform built using Next.js 15, Prisma, Tailwind CSS, PostgreSQL, and Resend. It features a layered service-oriented architecture, precise volumetric rate pricing, GPS-based courier auto-assignment, and an immutable tracking audit trail.

---

## 🚀 Setup & Execution Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher (v24 recommended)
- **PostgreSQL**: Neon Cloud Postgres (or a local PostgreSQL instance)

### Installation
1. **Clone & Install Dependencies**:
   ```bash
   git clone <repository-url> daffodil
   cd daffodil
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in the connection details:
   ```bash
   cp .env.example .env
   ```
   *Note: Set `DATABASE_URL` (pooled connection string) and `DIRECT_URL` (direct migration connection string) pointing to your PostgreSQL database.*

3. **Run Database Migrations**:
   Deploy the schemas and constraints to your PostgreSQL instance:
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Seed the Database**:
   Populate the initial rate cards, zones, areas, and test roles:
   ```bash
   npx prisma db seed
   ```
   *Seeded Accounts:*
   - **Admin**: `admin@daffodil.com` (password: `admin123`)
   - **Customer**: `customer1@daffodil.com`, `customer2@daffodil.com` (password: `customer123`)
   - **Delivery Agent**: `agent1@daffodil.com`, `agent2@daffodil.com` (password: `agent123`)

5. **Start Dev Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

6. **Run Rate Calculation Unit Tests**:
   ```bash
   npm test
   ```

---

## 📈 Rate Pricing Logic (Plain Language)

Pricing calculations are processed by a pure-function engine to ensure absolute correctness and allow easy unit-testing:

1. **Volumetric Weight Calculation**:
   Instead of just charging by weight, oversized parcels are priced by volume using the industry-standard formula:
   $$\text{Volumetric Weight (kg)} = \frac{\text{Length (cm)} \times \text{Width (cm)} \times \text{Height (cm)}}{5000}$$

2. **Billable Weight Selection**:
   The engine selects the larger of the two weights:
   $$\text{Billable Weight} = \max(\text{Actual Weight}, \text{Volumetric Weight})$$

3. **Zone Type Resolution**:
   If the pickup area and drop area share the same Zone, it is classified as `INTRA_ZONE`. Otherwise, it is classified as `INTER_ZONE`.

4. **Base Pricing Rule**:
   The engine searches for an active `RateCard` matching the order category (`B2B` or `B2C`) and resolved Zone type. If no card is active, it throws an explicit pricing error.
   $$\text{Base Cost} = \text{Billable Weight} \times \text{Price per Kg from Rate Card}$$

5. **COD Surcharges**:
   If the payment type is Cash on Delivery (`COD`), a flat charge defined in the matching `RateCard` is appended. Prepaid deliveries receive no surcharge.
   $$\text{Final Price} = \text{Base Cost} + \text{COD Surcharge}$$

---

## 🗃️ Database Schema Outline

- **User**: Name, Email (unique), PasswordHash (bcrypt), Role (`CUSTOMER`, `AGENT`, `ADMIN`), CreatedAt.
- **Zone**: Name (unique).
- **Area**: Name (unique), FK to Zone.
- **RateCard**: OrderType (`B2B`/`B2C`), ZoneType (`INTRA`/`INTER`), PricePerKg, flat CODSurcharge. Unique combination constraint on `(orderType, zoneType)`.
- **DeliveryAgent**: FK to User, GPS location (lat, lon), Availability flag.
- **Order**: Customer, Pickup/Drop addresses, Pickup/Drop Zone associations, Dimensions, Weights, Category, Payment Type, Final Amount, Status, Assigned Courier.
- **TrackingEvent**: Audit log tracking state changes. References Order ID, Old Status, New Status, changed by User ID, override boolean flag, and timestamp. (Insert-only, immutable).

---

## 🔗 Core API Contract

| Method | Endpoint | Description | Role Scope |
|---|---|---|---|
| **POST** | `/api/auth/register` | Register new account (Agent profiles generated dynamically if role is AGENT) | Public |
| **POST** | `/api/auth/login` | Login and acquire stateless JWT session token | Public |
| **GET** | `/api/zones` | List all zones and nested area selections | Authorized |
| **POST** | `/api/zones` | Create a new delivery zone | `ADMIN` |
| **POST** | `/api/zones/:id/areas` | Register an area under a specific zone | `ADMIN` |
| **GET** | `/api/rate-cards` | List all configured rate cards | Authorized |
| **POST** | `/api/rate-cards` | Set or update a rate pricing card | `ADMIN` |
| **POST** | `/api/rate-cards/calculate` | Calculate pricing breakdown preview for a parcel | Authorized |
| **POST** | `/api/orders` | Book a new shipment request | `CUSTOMER`, `ADMIN` |
| **GET** | `/api/orders` | Scoped list of orders (Customers see own, Agents see assigned, Admin sees all) | Authorized |
| **GET** | `/api/orders/:id` | Scoped detail page of a single shipment with timelines | Authorized |
| **POST** | `/api/orders/:id/assign` | Manually assign a courier to an order | `ADMIN` |
| **POST** | `/api/orders/:id/auto-assign` | Auto-assign closest online courier via Haversine | `ADMIN` |
| **PATCH** | `/api/orders/:id/status` | Update status (Agent transitions must pass state machine checks) | `AGENT`, `ADMIN` |
| **POST** | `/api/orders/:id/reschedule` | Reschedule a failed shipment for a future date | `CUSTOMER`, `ADMIN` |
| **GET** | `/api/orders/:id/tracking` | Get immutable history events timeline | Authorized |
| **GET** | `/api/agents` | List couriers and their current active workload levels | `ADMIN` |
| **PATCH** | `/api/agents/:id/availability` | Toggle online/offline status or update current GPS | `AGENT` (self), `ADMIN` |
| **GET** | `/api/admin/dashboard` | Get aggregates, unassigned queues, and regional logs | `ADMIN` |
