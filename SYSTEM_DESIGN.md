# System Design & Core Architectural Decisions

This document outlines the technical implementation details and tradeoffs for the key components of the Daffodil Last-Mile Delivery Tracker.

---

## 1. Rate Calculation Engine

The rate engine calculates shipment pricing utilizing physical volume, order type categories, and shipping coverage zones.

### Core Mathematical Logic
To prevent loss of revenue on lightweight, oversized parcels, the engine implements volumetric weight pricing:
$$\text{Volumetric Weight (kg)} = \frac{\text{Length (cm)} \times \text{Width (cm)} \times \text{Height (cm)}}{5000}$$
The billable weight is established dynamically:
$$\text{Billable Weight (kg)} = \max(\text{Actual Weight}, \text{Volumetric Weight})$$

### Execution Flow
1. Validation checks reject non-positive dimensions/weights.
2. The engine resolves origin and destination zones to identify whether the shipment is `INTRA_ZONE` (same zone) or `INTER_ZONE` (different zones).
3. It fetches the active `RateCard` matching the order category (`B2B` or `B2C`) and coverage zone. If none is found, execution stops with an explicit, database-safe error.
4. Surcharges are calculated as:
   $$\text{Final Invoice} = (\text{Billable Weight} \times \text{RateCard.pricePerKg}) + \text{COD Surcharge}$$
   *(where the COD surcharge is a flat fee applied only if paymentType is COD).*

---

## 2. Zone Detection Approach

Zone detection determines delivery routing class dynamically.

### Implementation
- The database registers physical `Zone` records, which house multiple unique `Area` records (representing sub-localities, e.g., "Manhattan" under "Zone A").
- When a customer books a shipment, they supply specific `pickupAreaName` and `dropAreaName` values.
- The service layer performs indexed query lookups on the `Area` table to fetch the respective parent `zoneId` values. If an area name is unrecognized, the booking is rejected immediately.
- The route type is resolved:
  - If `pickupZoneId` equals `dropZoneId`, the order is classified as `INTRA_ZONE`.
  - Otherwise, it is classified as `INTER_ZONE`.
This design isolates spatial groupings from raw text addresses, allowing pricing logic to scale without geocoding latency.

---

## 3. Auto-Assignment Logic

The auto-assignment engine automates dispatcher decisions.

### GPS Distance Calculations
The engine uses the spherical Haversine formula to compute distances in kilometers between coordinates:
$$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
- The target destination point is set to the representative GPS coordinates of the pickup `Area`.
- Candidates are filtered from the `DeliveryAgent` table where `available = true`. If zero agents are online, the shipment remains in the `CREATED` state and is flagged for dispatcher review.

### Decision Sorting & Tie-Breaking
1. Candidates are sorted by computed distance ascending.
2. If two agents are located at the same distance (e.g. sharing a depot), the engine breaks ties by selecting the agent with the **fewest currently-active orders** (orders where status is not `DELIVERED` or `FAILED`).
This dual-metric approach prevents courier burn-out and ensures balanced shipment distributions.

---

## 4. Failed Delivery & Reschedule Handling

Failed deliveries require transition audits.

### State Transitions
Couriers are restricted by a state machine enforced in the service layer:
$$\text{CREATED} \rightarrow \text{PICKED\_UP} \rightarrow \text{IN\_TRANSIT} \rightarrow \text{OUT\_FOR\_DELIVERY} \rightarrow \text{FAILED}$$
- When a courier encounters an issue, they trigger a transition to `FAILED` from their portal.
- Direct transitions from other states (e.g., `CREATED` to `FAILED`) are blocked.

### Rescheduling Workflows
- Only the customer who owns the order, or an administrator, can reschedule.
- The order must currently be in the `FAILED` state.
- The reschedule date must be validated to be in the future.
- On confirmation, the service clears the `assignedAgentId` (releasing the previous courier) and sets the status to `RESCHEDULED`. This makes the order eligible for dispatch re-assignment.

### Immutable Tracking Auditing
Every state change creates a `TrackingEvent` record. This table is strictly **insert-only**; updates and deletions are disabled. If an administrator manually corrects a state, the system allows the transition but marks `isOverride = true` to preserve audit trail honesty.
