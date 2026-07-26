# Dispatchly — Smart Last-Mile Delivery Log

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=for-the-badge&logo=postgresql)](https://www.postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-6-black?style=for-the-badge&logo=prisma)](https://www.prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Vercel-Deployment-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Smart delivery orchestration, from rate to doorstep.**

Dispatchly is a high-performance, full-stack logistics portal designed to solve the structural opacity and coordination overhead of last-mile delivery. Utilizing a clean, layered service-oriented architecture, it automates parcel pricing via exact volumetric calculation cards, routes courier matching using GPS-nearest Haversine sorting, logs every delivery transition inside an immutable tracking log with audit override tracks, and integrates a direct Google Pay/Paytm UPI dynamic QR payment system attached to Admin account `9696146006`.

---

## 1. The Business Problem

Logistics operators struggle with three core issues in last-mile delivery:
- **Rate Surcharge Opacity**: Shipments are often incorrectly billed due to failure to account for dimensions (volumetric weight) vs. actual weight, causing margin leaks on large, lightweight items.
- **Assignment Delays**: Manually identifying and dispatching agents to pickup points leads to bottlenecks, unequal workloads, and high transit times.
- **Audit Tampering & Payment Friction**: Operators lack a secure, chronological ledger of parcel history and dynamic digital checkout, making payment collection and dispatch tracking inefficient.

Dispatchly fixes this by providing automated billing, automated dispatching, dynamic UPI QR checkout attached to Admin, and an immutable tracking event timeline.

---

## 2. Solution Architecture

Dispatchly implements a **Layered Service-Oriented Architecture**:

```
[API Route (Controller)] ──► [Business Service (Validations & Logic)] ──► [Prisma Client (Data Access)]
```

- **Thin Controllers**: Next.js API Routes parse requests, validate JWT tokens, enforce RBAC, and handle raw HTTP responses.
- **Service Layer**: House business rules (e.g. rate calculations, Haversine checks, state transitions). Isolated from HTTP details for unit-testing.
- **Prisma ORM**: Directly manages the database access with PostgreSQL on Neon Serverless.

---

## 3. Major Features

- **Google Pay, Paytm, & Dynamic UPI QR System**:
  - Direct payee attachment to Admin account `9696146006` (`9696146006@paytm`).
  - Dynamic QR code generation pre-filled with exact calculated shipment amount and order reference ID.
  - Direct launch buttons for Google Pay, Paytm, and PhonePe.
- **Google OAuth & Username Authentication**:
  - Google Account Chooser with native dark theme UI and smooth animated success state modal.
  - Role-based account creation (`CUSTOMER`, `AGENT`, `ADMIN`) with auto-provisioned `DeliveryAgent` profiles.
- **Pricing Engine**: Checks category (B2B/B2C), route type (intra/inter zone), billable weights, and COD flat charges in a pure, testable function.
- **Haversine Matcher**: Queries online couriers, calculates geodesic distance, and auto-assigns the nearest candidate.
- **Tie-Breaker Dispatch**: Evaluates active delivery loads to prevent courier burnout.
- **Immutable Log**: Logs every status transition to an insert-only tracking ledger.
- **Admin Overrides**: Empowers dispatchers to fix state mistakes while explicitly flagging overrides (`isOverride = true`).
- **Role-Based Portals**: Displays clean, distinct workspaces customized for Customers (`/customer/orders`), Courier Agents (`/agent/orders`), and Admin dispatchers (`/admin/dashboard`).

---

## 4. Screenshots

| Public Landing Page | Customer Booking Hub |
|:---:|:---:|
| ![Landing Page](./docs/screenshots/landing.png) | ![Customer Hub](./docs/screenshots/customer_hub.png) |

| Admin Dispatch Console | Courier Duty Portal |
|:---:|:---:|
| ![Admin Dashboard](./docs/screenshots/admin_dashboard.png) | ![Courier Portal](./docs/screenshots/courier_portal.png) |

---

## 5. Installation & Setup

### 1. Prerequisites
- Node.js (v18.0.0 or higher)
- PostgreSQL database instance (Neon / Local)

### 2. Install Dependencies
```bash
npm install
```

### 3. Local Environment Variables
Create a `.env` file at the root directory:
```env
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"
DIRECT_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"
JWT_SECRET="<your_jwt_secret_key_32_chars_min>"
ADMIN_SECRET_KEY="<your_admin_authorization_passcode>"
RESEND_API_KEY="<your_resend_api_key>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Database Sync & Seed
Deploy migrations and populate tables:
```bash
npx prisma db push
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
| **Admin** | Abhijeet Singh Rana | `admin@dispatchly.test` | `Admin@123` |
| **Customer** | Aarav Sharma | `aarav@dispatchly.test` | `Customer@123` |
| **Customer** | Priya Patel | `priya@dispatchly.test` | `Customer@123` |
| **Courier Agent 1 (Online)** | Amit Singh | `amit@dispatchly.test` | `Agent@123` |
| **Courier Agent 2 (Online)** | Vikram Malhotra | `vikram@dispatchly.test` | `Agent@123` |
| **Courier Agent 3 (Offline)** | Neha Gupta | `neha@dispatchly.test` | `Agent@123` |

*Note: Registering an Admin account requires entering the `ADMIN_SECRET_KEY` configured in your environment variables.*

---

## 7. Core Algorithms & Logic

### 1. Volumetric Rate Calculation
Parcels are evaluated by both scale weight and physical size. The engine computes:
$$\text{Volumetric Weight (kg)} = \frac{\text{Length (cm)} \times \text{Width (cm)} \times \text{Height (cm)}}{5000}$$
$$\text{Billable Weight} = \max(\text{Actual Weight}, \text{Volumetric Weight})$$

If the pickup area and drop area share a parent Zone, the route is classified as `INTRA_ZONE`. Otherwise, it is classified as `INTER_ZONE`. Surcharges are calculated as:
$$\text{Final Price} = (\text{Billable Weight} \times \text{Price Per Kg}) + \text{Flat COD Charge (if payment is Cash on Delivery)}$$

### 2. Dynamic Admin UPI Payment System
Payment URIs construct a dynamic payee payload targeting Admin account `9696146006`:
```text
upi://pay?pa=9696146006@paytm&pn=Dispatchly&am={Amount}&tr={OrderRef}&cu=INR
```
Rendered dynamically into a high-resolution QR Code image for scanning with any UPI app (Google Pay, Paytm, PhonePe, BHIM).

### 3. Auto-Assignment Matcher
Available agents (`available = true`) are evaluated using the geodesic **Haversine formula** from the shipment origin:
$$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
- **Tie-Breaker Rule**: If multiple agents share the same distance, the system selects the agent with the **fewest active orders** to balance driver workloads.

### 4. Order Status State Machine
Order statuses follow a strict sequence of transitions:
`CREATED` ──► `PICKED_UP` ──► `IN_TRANSIT` ──► `OUT_FOR_DELIVERY` ──► `DELIVERED`

---

## 8. API Reference

### Public & Auth Routes
- `POST /api/auth/register` - Create user with role selection.
- `POST /api/auth/login` - Authenticate user via username or email and receive JWT.
- `POST /api/auth/google` - Google OAuth authentication & account provisioning.

### Administrative Routes (ADMIN scope)
- `POST /api/zones` - Register new Delivery Zone.
- `POST /api/zones/:id/areas` - Register Area sub-locality.
- `POST /api/rate-cards` - Create or update Pricing Rates.
- `POST /api/orders/:id/assign` - Manually assign courier to order.
- `POST /api/orders/:id/auto-assign` - Trigger Haversine dispatch matcher.
- `GET /api/agents` - Monitor all courier locations and active workloads.
- `GET /api/admin/dashboard` - Retrieve aggregated dashboard counters.

### Customer & Courier Routes
- `POST /api/rate-cards/calculate` - Estimate parcel shipping pricing.
- `POST /api/orders` - Book shipment.
- `POST /api/orders/:id/pay` - Record UPI payment and transaction UTR reference.
- `GET /api/orders` - Scoped lookup (Admins see all, Customers see own, Agents see assigned).
- `PATCH /api/orders/:id/status` - Move order through state machine (Agent/Admin).
- `POST /api/orders/:id/reschedule` - Reschedule failed shipments (Customer/Admin).
- `GET /api/orders/:id/tracking` - Retrieve chronological event timeline.

---

## 9. Running Unit Tests

The test suite verifies rate calculations, authentication, and payment workflows:
```bash
npm test
```

---

## 10. Developer Profile
Developed by **Abhijeet Singh Rana** (Senior Software Engineer / Placement Candidate).
- Focus areas: High-performance microservices, spatial query optimization, and distributed transaction state machines.
