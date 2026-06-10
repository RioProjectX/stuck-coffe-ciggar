# Security Specification: Stuck Coffee & Cigar Firestore Rules

This document outlines the security architecture, invariants, and threat analysis for the "Stuck Coffee & Cigar" Firestore database of project `lively-theater-1tgzl`.

Since the application uses a containerized backend (`server.ts`) proxying requests to Firestore via the REST API using the client Web API Key without an Auth bearer header, the REST requests are evaluated under Firestore Security Rules as **unauthenticated client requests**. Therefore, we enforce robust **structural validation**, **type safety**, **size limits**, and **regex guards** to ensure that any direct client-side bypass attempts using the Web API Key or database ID are rejected.

---

## 8 Pillars of Hardened Rules Implementation

1. **The "Master Gate" (Structural Validation)**: All collections have strict structural validation to prevent structural corruption.
2. **Anti-Update-Gap Key Isolation**: No arbitrary "Ghost Fields" can be injected. Update actions must use strict schema validation.
3. **Path Variable Hardening**: Document IDs are validated for format and length to prevent resource fatigue or ID spoofing.
4. **Self-Assigned Role Blocking**: Users cannot elevate permissions or set custom admin parameters.
5. **Array Boundary Safeguards**: All arrays (such as images, items) are strictly sized and inspected at index levels to prevent memory exhaustion.
6. **PII and Sensitive Info Masking**: Since reservations and order details contain contact credentials, their write schemas are highly sanitised.
7. **The Atomicity Guarantee**: Invariants such as point accrual or state constraints are checked at transition paths.
8. **Denial of Wallet Defense**: Ordered checks: static validation occurs prior to DB resource lookups to prevent massive performance degradations.

---

## Data Invariants & Schema Validations

- **Review Invariant**: A review must always reference an existing `productId` or `"general"`. Ratings must be a number between `1` and `5`. Comment length must not exceed 1000 characters.
- **Reservation Invariant**: Dates must be a 10-char string (`YYYY-MM-DD`). Time must be a 5-char string (`HH:MM`). Guests volume must be between `1` and `100`.
- **Order Invariant**: Order total must equal subtotal minus discount. Subtotal and total must be non-negative. Invoice number must fit the regular format.
- **Product Invariant**: Price must be positive. Stock must be non-negative. Category must be one of: `coffee`, `non-coffee`, `food`, `cigar`.

---

## The "Dirty Dozen" Malicious Payloads

The following 12 payloads are designed to challenge data integrity, inject script payloads, or trigger resource exploitation. All of them **must** be rejected by the compiled Firestore Rules.

### 1. Product Invalidation (Negative Price)
*Goal: Create a menu product with a negative price to cause shopping cart exploits.*
```json
{
  "id": "prod-exploit",
  "name": "Malicious Soda",
  "category": "coffee",
  "price": -50000,
  "stock": 10,
  "status": "available"
}
```

### 2. Product Field Injection (Self-Approved Parameter Injection)
*Goal: Inject unauthorized administrative attributes to skew store displays.*
```json
{
  "id": "prod-101",
  "name": "Luxury Cigar",
  "category": "cigar",
  "price": 250000,
  "stock": 15,
  "status": "available",
  "hiddenRevenueBonus": 999999
}
```

### 3. Review Over-Rating (Score Poisoning)
*Goal: Inject an unrealistic review rating score of 10 to skew averages.*
```json
{
  "id": "rev-score",
  "productId": "prod-1",
  "productName": "Signature Latte",
  "customerName": "Attacker",
  "email": "attacker@gmail.com",
  "rating": 10,
  "comment": "Nice!",
  "status": "approved",
  "date": "2026-06-10"
}
```

### 4. Review Comment Denial of Wallet (Size Exhaustion)
*Goal: Inject a huge 2MB string into comment field to trigger high storage billings.*
```json
{
  "id": "rev-bloat",
  "productId": "prod-1",
  "productName": "Signature Latte",
  "customerName": "Attacker",
  "email": "attacker@gmail.com",
  "rating": 5,
  "comment": "[2 Million Character Repeating String...]",
  "status": "approved",
  "date": "2026-06-10"
}
```

### 5. Reservation ID Poisoning (Path Traversal Attempt)
*Goal: Write to a document ID with non-alphanumeric characters.*
```json
// Target Path: /reservations/../../etc/passwd or similar
{
  "id": "res-invalid*id!",
  "customerName": "Alice",
  "email": "alice@gmail.com",
  "phone": "+6281",
  "date": "2026-06-15",
  "time": "19:00",
  "guests": 2,
  "tableArea": "Bar Area",
  "notes": "",
  "status": "Pending",
  "reservationCode": "LOK-RE1111",
  "createdAt": "2026-06-10T10:00:00Z"
}
```

### 6. Reservation Guests Spoofing (Negative Seating)
*Goal: Break seating logic by reserving tables for -5 guests.*
```json
{
  "id": "res-neg-guests",
  "customerName": "Attacker",
  "email": "attacker@gmail.com",
  "phone": "+628...",
  "date": "2026-06-15",
  "time": "19:00",
  "guests": -5,
  "tableArea": "VIP Patio",
  "status": "Pending",
  "reservationCode": "LOK-RE1212",
  "createdAt": "2026-06-10T10:00:00Z"
}
```

### 7. Order Formula Bypass (Fraudulent Pricing)
*Goal: Force an order with total cost of 0 when subtotal is 5 million IDR.*
```json
{
  "id": "ord-cheat",
  "customerEmail": "cheat@gmail.com",
  "customerName": "Cheater",
  "items": [{"productId": "prod-9", "price": 1850000, "quantity": 2}],
  "subtotal": 3700000,
  "tax": 0,
  "discount": 0,
  "total": 0,
  "status": "Pending",
  "createdAt": "2026-06-10T10:00:00Z",
  "invoiceNumber": "INV-20260610-101"
}
```

### 8. Order Array Injection (Malformed Item list)
*Goal: Send item fields with invalid structures to break order calculation algorithms.*
```json
{
  "id": "ord-bad-list",
  "customerEmail": "bad@gmail.com",
  "customerName": "Bad",
  "items": [null, 12, "broken-item"],
  "subtotal": 0,
  "tax": 0,
  "total": 0,
  "status": "Pending",
  "createdAt": "2026-06-10T10:00:00Z",
  "invoiceNumber": "INV-20260610-102"
}
```

### 9. Payment Method Type Exploitations (Unsupported Flow Injection)
*Goal: Inject a non-standard third-party transaction provider in payment modes.*
```json
{
  "id": "pay-exploit",
  "name": "Rogue Gateway",
  "type": "unsupported_malicious_gateway_injection",
  "image": "",
  "details": "Hack details",
  "isActive": true
}
```

### 10. Blank Name Identification (Null Identity Spoofing)
*Goal: Bypass buyer credentials check by transmitting missing or empty identity structures.*
```json
{
  "id": "rev-blank-name",
  "productId": "prod-1",
  "productName": "Signature Latte",
  "customerName": "",
  "email": "empty@email.com",
  "rating": 5,
  "comment": "Nice!",
  "status": "approved",
  "date": "2026-06-10"
}
```

### 11. Immutability Hijack (Altering Permanent Invoice)
*Goal: Update a generated order's critical parameters like total and buyer details after creation.*
```json
// Existing Document: Total 50,000 IDR
// Modified Payload:
{
  "id": "ord-fixed",
  "customerName": "Original Customer",
  "total": 1000,
  "invoiceNumber": "INV-MODIFIED-BY-HACKER"
}
```

### 12. State Lockout Overwrite
*Goal: Transition a cancelled reservation directly back to 'Approved' status without credentials.*
```json
// Existing Document: Cancelled
// Modified Payload:
{
  "id": "res-98",
  "status": "Approved"
}
```

---

## Test Runner: Security Rule Verification Mock

Below is the conceptual TypeScript test runner validating these invariants against our security definitions.

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc, updateDoc } from "firebase/firestore";

describe("Stuck Coffee & Cigar Security Rules", () => {
  let testEnv: any;

  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "lively-theater-1tgzl",
      firestore: {
        rules: require("fs").readFileSync("firestore.rules", "utf8"),
      },
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  it("should block products with negative prices", async () => {
    const unauthDb = testEnv.unauthenticatedContext().firestore();
    const badProdRef = doc(unauthDb, "products", "prod-exploit");
    await assertFails(setDoc(badProdRef, {
      id: "prod-exploit",
      name: "Malicious Soda",
      category: "coffee",
      price: -50000,
      stock: 10,
      status: "available"
    }));
  });

  it("should block review ratings over 5", async () => {
    const unauthDb = testEnv.unauthenticatedContext().firestore();
    const badRevRef = doc(unauthDb, "reviews", "rev-score");
    await assertFails(setDoc(badRevRef, {
      id: "rev-score",
      productId: "prod-1",
      productName: "Signature Latte",
      customerName: "Attacker",
      email: "attacker@gmail.com",
      rating: 10,
      comment: "Nice!",
      status: "approved",
      date: "2026-06-10"
    }));
  });

  it("should block reservations with guest counts less than 1 or over 100", async () => {
    const unauthDb = testEnv.unauthenticatedContext().firestore();
    const badResRef = doc(unauthDb, "reservations", "res-neg-guests");
    await assertFails(setDoc(badResRef, {
      id: "res-neg-guests",
      customerName: "Attacker",
      email: "attacker@gmail.com",
      phone: "+628...",
      date: "2026-06-15",
      time: "19:00",
      guests: -5,
      tableArea: "VIP Patio",
      status: "Pending",
      reservationCode: "LOK-RE1212",
      createdAt: "2026-06-10T10:00:00Z"
    }));
  });

  it("should block fraudulent order totals", async () => {
    const unauthDb = testEnv.unauthenticatedContext().firestore();
    const badOrdRef = doc(unauthDb, "orders", "ord-cheat");
    await assertFails(setDoc(badOrdRef, {
      id: "ord-cheat",
      customerEmail: "cheat@gmail.com",
      customerName: "Cheater",
      items: [{"productId": "prod-9", "price": 1850000, "quantity": 1}],
      subtotal: 1850000,
      tax: 0,
      discount: 0,
      total: 0, // Should be 1850000
      status: "Pending",
      createdAt: "2026-06-10T10:00:00Z",
      invoiceNumber: "INV-20260610-101"
    }));
  });
});
```
