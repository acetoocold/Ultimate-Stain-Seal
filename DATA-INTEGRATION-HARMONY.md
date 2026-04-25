# Ultimate Stain Seal - Complete Data Integration & Functionality Analysis

## Executive Summary

This document maps the complete data flow and ensures **benevolent harmony** across all entities. Every calculation, relationship, and business rule works in synchronization to provide:

- ✅ Accurate health scoring for proactive customer engagement
- ✅ Real-time financial tracking (invoices → payments → balance due)
- ✅ Section-level work tracking for partial staining jobs
- ✅ Inventory synchronization with project material usage
- ✅ Audit trail for compliance and accountability
- ✅ Synchronized customer maintenance schedules

---

## 1. THE CORE TRIANGLE: CUSTOMERS → PROPERTIES → PROJECTS

### Relationship Flow

```
CUSTOMER (1)
    ↓ 1:N
PROPERTY (many per customer)
    ↓ 1:N
PROJECT (many per property)
    ├→ DIAGNOSIS (many: assess condition)
    ├→ JOBS (many: execution plan)
    ├→ INVOICES (many: billing)
    ├→ DOCUMENTS (many: photos, contracts)
    └→ PROJECT_MATERIALS (many: inventory tracking)
```

### Why This Structure?

**One customer** → Multiple properties (e.g., home + rental property)  
**One property** → Multiple projects (e.g., front fence done in 2021, back fence in 2024)  
**One project** → Multiple diagnoses (initial + follow-ups), jobs (prep, stain, seal), invoices

---

## 2. DIAGNOSIS SYSTEM - THE HEALTH PREDICTOR

### Purpose
Predict when a fence needs re-staining based on 10 environmental & condition factors.

### Calculation Engine

**Base**: 48 months (4 years) from last stain

**Deductions** (cumulative):

| Factor | Low/Healthy | Normal | High/Damage |
|--------|------------|--------|------------|
| **Wood Type** | - | - | fence(-3), pergola(-2), dock(-2), deck/siding(-1) |
| **Current Finish** | stain_and_sealed(0) | weathered(-1) | bare(-3) |
| **Weather** | full_shade(0) | partial_shade(-1) | full_sun(-3), near_water(-3) |
| **Moisture** | dry(0) | normal(-1) | high(-3), water_logged(-3) |
| **Mold/Mildew** | absent(0) | - | present(-3) |
| **Cracking** | absent(0) | - | present(-3) |
| **Graying** | absent(0) | - | present(-3) |
| **Repair Needed** | absent(0) | - | present(-3) |
| **Posts** | excellent(0) | good/fair(-1) | poor(-3), needs_repair(-3) |

### Health Status Timeline

```
Months Until Sealing    Status                  Action
─────────────────────  ──────────────────────  ─────────────────────
24+ months             🟢 Ultimate Health      No action needed
6-24 months            🟡 Good                 Monitor
0-6 months             🟠 Needs Attention      Schedule soon
<0 months              🔴 Permanent Damage     URGENT - Schedule now
```

### Example: Real-World Diagnosis

**Scenario**: Customer's fence from 2020

```
Base: 48 months (starting point)
- Wood type (fence): -3 months
- Current finish (bare): -3 months
- Weather (full_sun): -3 months
- Moisture (high): -3 months
- Mold/mildew (present): -3 months
- Cracking (present): -3 months
- Graying (present): -3 months
- Posts (good): -1 month

Total deductions: 22 months
Remaining: 48 - 22 = 26 months (~2.2 years)

Next Predicted Sealing: 26 months from 2020 = Mid 2023
Current Status: PERMANENT DAMAGE RISK (overdue in 2026)
```

### Diagnosis Sections: The Detail Layer

For complex jobs with different section dimensions/completion:

```
Diagnosis 1 (overall assessment)
└── Diagnosis Sections (1:N)
    ├── Section 1: Front fence, 60 ft × 6 ft = 360 sq ft, both sides done
    ├── Section 2: Side gate, 30 ft × 6 ft = 180 sq ft, front only done
    └── Section 3: Back fence, 50 ft × 4 ft = 200 sq ft, not done yet

Total: 740 sq ft (but not all stained)
```

**Use Case**: "We stained the front and sides this month, but the back fence needs prep work first."

---

## 3. PROJECTS: THE EXECUTION LAYER

### Project Status Flow

```
INQUIRY (customer reaches out)
    ↓
QUOTED (diagnosis complete, estimate provided)
    ↓
SCHEDULED (customer approved, date set)
    ↓
IN_PROGRESS (jobs assigned, work underway)
    ↓
COMPLETED (all work done, invoice final)
```

### Financial Tracking (Automatic Calculation)

```
Project Relationship:
Project → Invoices (1:N) → Invoice Line Items (1:N)
Project → Invoices (1:N) → Payments (1:N)

Calculations:
Invoice subtotal = Σ(line_item.quantity × line_item.unitPrice)
Invoice taxAmount = subtotal × taxRate
Invoice totalAmount = subtotal + taxAmount - discount
Invoice paidAmount = Σ(payments.amount)
Invoice balanceDue = totalAmount - paidAmount

Project totalAmount = Σ(invoices.totalAmount)
Project paidAmount = Σ(invoices.paidAmount)
Project balanceDue = totalAmount - paidAmount
```

### Example: Project Financial Flow

```
PROJECT: "Front Fence Stain" ($2,000)

INVOICES:
├── Invoice 1: Initial Stain Work - $1,500
│   ├── Line items: Labor (50 hrs × $20) + Materials (12 gal stain @ $30/gal)
│   ├── Tax: $1,500 × 0.085 = $127.50
│   ├── Total: $1,627.50
│   └── Payments:
│       ├── Payment 1: $800 (check #1234)
│       └── Payment 2: $827.50 (card)
│       → Paid: $1,627.50, Balance Due: $0 ✓
│
└── Invoice 2: Seal Application - $500
    ├── Line items: Labor (25 hrs × $20) + Materials (6 gal sealer @ $30/gal)
    ├── Tax: $500 × 0.085 = $42.50
    ├── Total: $542.50
    └── Payments: (pending)
        → Paid: $0, Balance Due: $542.50

PROJECT TOTALS:
Total: $2,170
Paid: $1,627.50
Balance Due: $542.50
```

---

## 4. JOBS & JOBSHEETS: THE EXECUTION RECORD

### Job Lifecycle

```
SCHEDULED (assigned to crew)
    ↓ (work day)
IN_PROGRESS (crew on site)
    ↓ (work complete)
COMPLETED (jobsheet submitted)
```

### Jobsheet: The Daily Work Log

Captured **on-site** by crew with mobile/tablet:

```
Job #42: Front Fence Stain
─────────────────────────────
Crew Lead: John Smith
Crew Members: Jane Doe, Bob Wilson
Work Date: 2026-04-20
Time: 8:00 AM - 3:00 PM (7 hours actual)
Weather: 72°F, sunny, 45% humidity
Surface Moisture: Dry ✓

Areas Completed:
- Front side: 100%
- Back side: 100%

Products Applied:
- Ultimate Liquid Gold (honey color)
- 2 coats applied
- Application method: Sprayer + brush detail

Issues Encountered:
- Small repair needed on post #3 (noted for next visit)

Customer Present: Yes
Customer Signature: [signed]

Follow-up Required: Yes (seal application in 2 weeks)
```

**Calculation**: Actual hours = 3 PM - 8 AM = 7 hours  
**Cost**: 7 hours × $20/hr = $140 labor

---

## 5. MATERIALS & INVENTORY: THE SUPPLY CHAIN

### Three-Layer Material Tracking

```
MATERIALS (master catalog)
├── Name: "Ultimate Liquid Gold"
├── Category: "liquid"
├── SKU: "ULG-HONEY-1G"
├── Unit Cost: $35/gallon
├── Coverage: 450 sq ft/gallon
└── Active: yes

    ↓

INVENTORY_ITEMS (stock levels)
├── Material ID: [link to ULG]
├── Quantity On Hand: 48 gallons
├── Reorder Point: 20 gallons
├── Location: "Warehouse Shelf B3"
├── Last Checked: 2026-04-15
└── Status: "operational"

    ↓

PROJECT_MATERIALS (usage per job)
├── Project ID: 42
├── Material ID: [link to ULG]
├── Quantity Estimated: 12 gallons (from diagnosis)
├── Quantity Used: 11.5 gallons (actual)
├── Unit Cost at Time: $35/gallon
└── Total Cost: 11.5 × $35 = $402.50
```

### Smart Tracking

**Before Project**: 
- Estimate from diagnosis: 12 gallons needed
- Reserve from inventory: decrease from 48 to 36

**During Project**:
- Crew logs actual usage: 11.5 gallons
- Real-time inventory: 36 → 24.5

**After Project**:
- Invoice line item: "$402.50 material (11.5 gal × $35)"
- Permanent record for future similar projects

---

## 6. SETTINGS: THE CONTROL CENTER

All calculations pull from **one source of truth**:

```
Settings Table (only 1 record)
├─ Company Info
│  ├── Name, Phone, Email
│  └── Logo, Address
│
├─ Financial Defaults
│  ├── Tax Rate: 0.085 (8.5%)
│  ├── Labor Rate: $20/hr
│  ├── Coverage Rate: 150 sq ft/hr
│  └── Default Pricing Rules
│
├─ Product Configuration
│  ├── Default Brand: "Ultimate Liquid Gold"
│  ├── ULG Upcharge: $0
│  ├── Off-Brand Upcharge: $50
│  ├── Oil Cost: $35/gallon
│  └── Concentrate Cost: $85/gallon
│
└─ Integration
   ├── Glide API Key
   ├── Glide Sync Enabled
   └── Auto Activity Log
```

**Why centralized?**: Change tax rate once → all future invoices auto-calculate correctly

---

## 7. COMPLETE DATA FLOW: END-TO-END

### Scenario: New Customer → Complete Project → Payment

```
STEP 1: CUSTOMER ACQUISITION
└── Create Customer record
    ├── Name, Phone, Email
    ├── Lead Source tracking
    └── Portal access enabled

STEP 2: PROPERTY ENTRY
└── Customer → Property (address, access notes)

STEP 3: PROJECT INQUIRY
└── Customer → Property → Project
    ├── Project status: "inquiry"
    ├── Service type: "stain"
    └── Assigned to: Senior Technician

STEP 4: DIAGNOSIS
└── Project → Diagnosis (condition assessment)
    ├── Dimensions: 150 ft × 6 ft = 900 sq ft
    ├── Last stained: 2020 (exact)
    ├── Current finish: bare
    ├── Weather: full_sun
    ├── Issues: mold_mildew=true, graying=true
    │
    ├─→ CALCULATION: Next Predicted Sealing
    │   Base: 48 months
    │   - Wood (fence): -3
    │   - Finish (bare): -3
    │   - Weather (full_sun): -3
    │   - Mold: -3
    │   - Graying: -3
    │   = 33 months remaining from 2020
    │   → 2023 (OVERDUE in 2026)
    │   → Health: PERMANENT DAMAGE RISK
    │
    └── Sections: 2 sections, both sides needed

STEP 5: ESTIMATE & QUOTE
└── Diagnosis → Recommendations
    ├── Material: 12 gallons ULG @ $35 = $420
    ├── Labor: 900÷150 = 6 hrs @ $20 = $120
    ├── Brand upcharge: $0
    ├── Subtotal: $540
    ├── Tax: $540 × 0.085 = $45.90
    └── Total estimate: $585.90

STEP 6: PROJECT APPROVAL
└── Project status: "quoted" → "scheduled"
    └── Scheduled date: 2026-04-25

STEP 7: INVOICE GENERATION
└── Project → Invoice 1: Work estimate
    ├── Line Items:
    │  ├── "Stain application (900 sq ft)" - 6 hrs × $20 = $120
    │  └── "Ultimate Liquid Gold (12 gal)" - 12 × $35 = $420
    │
    ├── Subtotal: $540
    ├── Tax: $45.90
    ├── Total: $585.90
    ├── Status: "draft"
    └── (saved for later)

STEP 8: WORK EXECUTION
└── Job created: "Front Fence Stain"
    ├── Assigned to: Crew [John + Jane]
    ├── Scheduled: 2026-04-25, 8 AM - 3 PM
    │
    └─→ WORK DAY (2026-04-25):
        ├── Actual Start: 8:05 AM
        ├── Actual End: 2:45 PM
        ├── Actual Hours: 6.67 hrs
        │
        ├─→ Jobsheet submitted:
        │   ├── Areas: 100% complete (both sides)
        │   ├── Products: 11.5 gal ULG applied
        │   ├── Weather: 72°F, sunny
        │   ├── Issues: None
        │   ├── Customer signature: [signed]
        │   └── Status: "submitted"
        │
        └─→ INVENTORY UPDATED:
            ├── Material: ULG remaining = 36.5 gal
            ├── Project Material record: 11.5 gal used
            └── Cost: 11.5 × $35 = $402.50

STEP 9: INVOICE FINALIZE
└── Invoice 1: Adjust for actual work
    ├── Line Items:
    │  ├── "Stain application (900 sq ft)" - 6.67 hrs × $20 = $133.40
    │  └── "Ultimate Liquid Gold (11.5 gal)" - 11.5 × $35 = $402.50
    │
    ├── Subtotal: $535.90
    ├── Tax: $535.90 × 0.085 = $45.55
    ├── Total: $581.45
    ├── Status: "sent"
    └── Due Date: 2026-05-25

STEP 10: PAYMENT RECORDING
└── Invoice 1: Receive payment
    ├── Payment 1 (2026-04-28): Check #2847 - $300
    │  └── Recorded by: Manager
    ├── Payment 2 (2026-05-15): Card - $281.45
    │  └── Recorded by: Admin
    │
    ├─→ Invoice Balance Calculation:
    │   Total: $581.45
    │   Paid: $581.45
    │   Balance Due: $0 ✓ PAID
    │   Status: "paid"
    │
    └─→ Project Balance Update:
        Total: $581.45
        Paid: $581.45
        Balance Due: $0

STEP 11: FOLLOW-UP & SYNCHRONIZATION
└── Scheduled: Seal application in 2 weeks (2026-05-09)
    │
    ├─→ Next Predicted Sealing (updated):
    │   Last stained: 2026-04-25
    │   Health: excellent (just stained)
    │   Next seal needed: ~4 years (2030)
    │
    └─→ Customer Alert:
        "Your fence was successfully stained on 2026-04-25!
         Next maintenance: Seal application recommended in 2 weeks.
         Next full stain: Expected 2030 (based on current conditions)."

STEP 12: ACTIVITY LOG (Audit Trail)
└── 12 entries recorded:
    ├── 2026-04-20: Diagnosis created (health: PERMANENT_DAMAGE_RISK)
    ├── 2026-04-22: Estimate generated ($581.45)
    ├── 2026-04-24: Project status → SCHEDULED
    ├── 2026-04-25: Job created (Assigned to John + Jane)
    ├── 2026-04-25: Jobsheet submitted
    ├── 2026-04-25: Inventory updated (ULG: 48→36.5 gal)
    ├── 2026-04-25: Invoice finalized
    ├── 2026-04-25: Project status → COMPLETED
    ├── 2026-04-28: Payment recorded ($300)
    ├── 2026-04-28: Invoice status → PARTIAL
    ├── 2026-05-15: Payment recorded ($281.45)
    ├── 2026-05-15: Invoice status → PAID
    └── [Complete audit trail for compliance]
```

---

## 8. DATA SYNCHRONIZATION & CONSISTENCY

### Automatic Cascading Updates

```
Invoice Payment Recorded
    ↓
Invoice.paidAmount updated
    ↓
Invoice.balanceDue recalculated (totalAmount - paidAmount)
    ↓
Invoice.status updated (draft→sent→paid/partial)
    ↓
Project.paidAmount recalculated (Σ invoices)
    ↓
Project.balanceDue recalculated
    ↓
Dashboard shows updated metrics
    ↓
Activity log records change
```

### Integrity Constraints

**Cannot have**:
- Invoice with balanceDue < 0 (prevented by max(0, totalAmount - paidAmount))
- Project without customer (FK required)
- Payment recorded for non-existent invoice (FK constraint)
- Diagnosis without customer (FK required)

---

## 9. DASHBOARD INDICATORS (Real-Time)

```
EXECUTIVE SUMMARY
─────────────────────────────────────────────────────
Total Customers: 47
  ├── Lead: 12
  ├── Prospect: 18
  ├── Customer: 15
  └── VIP: 2

Active Projects: 8
  ├── Inquiry: 2
  ├── Quoted: 1
  ├── Scheduled: 3
  ├── In Progress: 2
  └── Completed: 47 (this month)

Financial Metrics
─────────────────────────────────────────────────────
Total Outstanding: $4,247.50
  ├── Invoices paid: $28,493.00
  ├── Invoices pending: $4,247.50
  └── Payment rate: 87%

Upcoming Work
─────────────────────────────────────────────────────
Next Predicted Sealings (30 days): 5 customers
  ├── John Smith: June 1 (Ultimate Health - routine)
  ├── Jane Doe: June 5 (Needs Attention - SOON)
  ├── Bob Wilson: June 10 (Good - on schedule)
  └── [2 more]

Inventory Alerts
─────────────────────────────────────────────────────
✓ ULG: 36.5 gal (healthy, reorder at 20)
⚠️  Sealer: 8 gal (BELOW reorder, order now)
⚠️  Equipment: 2 sprayers need maintenance

Crew Utilization
─────────────────────────────────────────────────────
John Smith: 38 hours this week (4 jobs)
Jane Doe: 35 hours this week (3 jobs)
Bob Wilson: 12 hours this week (2 jobs)
```

---

## 10. RELATIONAL INTEGRITY MAP

```
USERS (Staff)
├─ Jobs.assignedToId FK
├─ Diagnoses.diagnosedById FK
├─ Payments.recordedById FK
├─ Documents.uploadedById FK
└─ Activity.userId FK

CUSTOMERS
├─ Properties.customerId FK
├─ Projects.customerId FK
├─ Diagnoses.customerId FK
├─ Invoices.customerId FK
├─ Payments.customerId FK
├─ Jobs.customerId FK
├─ Documents.customerId FK
├─ Activity.customerId FK
└─ Can't delete: has active projects/invoices

PROPERTIES
├─ Projects.propertyId FK (optional)
└─ Can't delete: has active projects

PROJECTS (Central Hub)
├─ Diagnoses.projectId FK (1:N, optional)
├─ Jobs.projectId FK (1:N)
├─ Invoices.projectId FK (1:N)
├─ ProjectMaterials.projectId FK (1:N)
├─ Documents.projectId FK (1:N)
├─ Jobsheets.projectId FK (1:N)
├─ Activity.projectId FK (1:N)
└─ Must have: customerId, cannot be deleted if has invoices

DIAGNOSES
├─ DiagnosisSections.diagnosisId FK (1:N)
└─ Can't update: once marked "submitted", read-only for audit

INVOICES (Financial Record)
├─ InvoiceLineItems.invoiceId FK (1:N, required)
├─ Payments.invoiceId FK (1:N)
└─ balanceDue calculated from paidAmount, cannot be directly set

JOBS
├─ Jobsheets.jobId FK (1:N, optional - one per job max)
├─ Documents.jobId FK (1:N)
└─ actualHours calculated from actualStartTime/actualEndTime

MATERIALS
├─ InventoryItems.materialId FK (1:1)
├─ ProjectMaterials.materialId FK (1:N)
└─ Can't delete: would orphan inventory records

ACTIVITY (Audit Trail - Immutable)
└─ All dates locked to creation time, can't be modified
```

---

## 11. BUSINESS RULES ENFORCED

### Project Lifecycle

✅ Can only invoice a project once it's QUOTED or beyond  
✅ Can't mark completed until all sections invoiced  
✅ Scheduling updates propagate to assigned crew  
✅ Cancellation requires reason & audit trail  

### Financial Accuracy

✅ Invoice totals match line item sums (enforced in API)  
✅ Tax calculated at time of invoice (not retroactive)  
✅ Discounts never exceed subtotal  
✅ Payment can't exceed invoice total  
✅ Balance due always ≥ 0  

### Diagnosis & Health

✅ Last stained year must be ≤ current year  
✅ Health score recalculated on every diagnosis update  
✅ Sections must total to project dimensions  
✅ If all sections synchronized, status updated automatically  

### Inventory

✅ Can't use more than on-hand quantity  
✅ Reorder alerts when below reorder point  
✅ Usage tracked per project for costing  
✅ Material deletions blocked if active inventory  

### Audit Trail

✅ Every action logged (create, update, delete)  
✅ Timestamps immutable  
✅ User recorded (who made the change)  
✅ Metadata captures before/after values  

---

## 12. PERFORMANCE & OPTIMIZATION

### Indexes (Speed)

```
diagnoses: INDEX ON (customer_id, health_status)
  → Fast: "Show all customers needing attention"

invoices: INDEX ON (status, balance_due)
  → Fast: "Show outstanding invoices"

projects: INDEX ON (customer_id, status)
  → Fast: "Show customer's active projects"

activity: INDEX ON (project_id, created_at DESC)
  → Fast: "Show project history"
```

### Caching Opportunities

```
Settings (immutable between edits) → Cache 5 minutes
Customer summary (name, email) → Cache until updated
Active projects (status != completed) → Cache 1 minute
Today's scheduled jobs → Cache 1 minute
```

---

## 13. API RESPONSE EXAMPLE

### GET /api/projects/42

```json
{
  "id": 42,
  "customerId": 12,
  "customerName": "John Smith",
  "propertyId": 5,
  "projectName": "Front Fence Stain",
  "status": "completed",
  "serviceType": "stain",
  "priority": "high",
  
  "financials": {
    "totalAmount": 581.45,
    "paidAmount": 581.45,
    "balanceDue": 0,
    "invoiceCount": 1,
    "paymentCount": 2
  },

  "diagnosis": {
    "healthStatus": "ultimate_health",
    "nextPredictedSealingDate": "2030-04-25",
    "lastStained": "2026-04-25",
    "dimensions": {
      "linearFeet": 150,
      "height": 6,
      "sqFt": 900
    },
    "issues": {
      "moldMildew": false,
      "cracking": false,
      "graying": false,
      "repairNeeded": false
    },
    "sections": 2,
    "synchronizationStatus": "synchronized"
  },

  "jobs": [
    {
      "id": 101,
      "jobName": "Front Fence Stain",
      "status": "completed",
      "actualHours": 6.67,
      "crewMembers": ["John Crew", "Jane Crew"]
    }
  ],

  "materials": [
    {
      "materialId": 3,
      "name": "Ultimate Liquid Gold",
      "quantityEstimated": 12,
      "quantityUsed": 11.5,
      "totalCost": 402.50
    }
  ],

  "createdAt": "2026-04-20T10:30:00Z",
  "updatedAt": "2026-05-15T14:22:00Z"
}
```

---

## Conclusion: Benevolent Harmony

Every table, field, and calculation works in concert:

- **Diagnosis** → predicts maintenance needs
- **Projects** → organizes execution
- **Jobs** → track actual work
- **Invoices** → bill accurately
- **Payments** → settle accounts
- **Materials** → control costs
- **Activity** → maintain compliance

When one piece updates, the entire system stays synchronized. A payment changes balance due, which updates project status, which triggers customer alerts, which creates activity logs—all automatically.

This is **ultimate functionality**: complete transparency from first customer contact to final payment.

---

## Quick Reference: Key Calculations

```
Health Score Deductions:
- Wood type: 1-3 months
- Current finish: 0-3 months
- Weather: 0-3 months
- Moisture: 0-3 months
- Issues (each): 3 months
- Posts: 0-3 months
BASE: 48 months

Invoice = Σ(line_items) + tax - discount
Balance Due = Invoice - Payments
Project = Σ(invoices)

Health Status:
- 24+ months: Ultimate Health
- 6-24 months: Good
- 0-6 months: Needs Attention
- <0 months: Permanent Damage Risk
```
