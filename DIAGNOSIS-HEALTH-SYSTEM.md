# Ultimate Stain Seal - Advanced Diagnosis & Health Scoring System

## Overview

The diagnosis system tracks the current state of a customer's fence and predicts when it will need re-staining. This is crucial for:
- Customer retention (proactive maintenance reminders)
- Accurate costing (based on wood condition)
- Setting realistic timelines

---

## Schema Updates

### 1. **Diagnoses Table - Key Changes**

#### Wood & Structure
```typescript
// REMOVED: vinyl_privacy, vinyl_picket, composite
woodType: "fence" | "pergola" | "deck" | "dock" | "siding"
fenceType: "wood_privacy" | "side_by_side" | "post_rail" | "split_rail"
postsCondition: "excellent" | "good" | "fair" | "poor" | "needs_repair" // NEW: Posts as separate category
```

#### Health Timeline
```typescript
lastStainedYear: integer              // e.g., 2021
lastStainedYearIsExact: boolean       // true if confirmed, false if estimated
nextPredictedSealingDate: timestamp   // CALCULATED (see formula below)
healthStatus: "ultimate_health" | "good" | "needs_attention" | "permanent_damage_risk"
synchronizationStatus: "synchronized" | "needs_sync" // Are all sections at same age?
```

#### Current State (3-Level System)
```typescript
currentFinish: "stain_and_sealed" | "bare" | "weathered"
weatherExposure: "full_sun" | "partial_shade" | "full_shade" | "near_water"
moistureLevel: "dry" | "normal" | "high" | "water_logged"
```

#### Condition Issues (Boolean → 3-Level)
```typescript
// CHANGED FROM BOOLEAN TO LEVELS
moldMildewLevel: "none" | "low" | "high"
crackingLevel: "none" | "low" | "high"
grayingLevel: "none" | "low" | "high"
repairNeededLevel: "none" | "low" | "high"
```

#### Products
```typescript
recommendedBrand: string // default: "Ultimate Liquid Gold"
recommendedProductType: "stain" | "seal" // REMOVED: clear_coat
estimatedBrandUpsell: decimal // Charge for off-brand products
```

### 2. **New Table: Diagnosis Sections**

Track individual sections of fence (different lengths, heights, sides stained):

```typescript
export const diagnosisSectionsTable = pgTable("diagnosis_sections", {
  id: serial,
  diagnosisId: integer FK,
  sectionNumber: integer,        // 1, 2, 3, etc.
  linearFeet: decimal,
  height: decimal,
  sqFt: decimal,                 // linearFeet × height
  sidesCompleted: "front" | "back" | "both" | "none",
  sectionNotes: text,
});
```

**Use Case**: A fence might have:
- Section 1: 50 ft × 6 ft, both sides (common privacy fence)
- Section 2: 30 ft × 4 ft, front only (already done, not sealed yet)
- Section 3: 40 ft × 6 ft, none (not done on this visit)

---

## Health Scoring Algorithm

### Base Calculation: Next Predicted Sealing Date

**Starting Point**: 48 months (4 years) from last stain date

```
nextPredictedSealingDate = lastStainedDate + 48 months - (deductions from health factors)
```

### Health Factor Deductions (Each Factor Has 3 Levels)

| Category | Factor | Health Level | Impact |
|----------|--------|--------------|--------|
| **Wood Type** | fence | - | -3 months |
| | pergola | - | -2 months |
| | deck | - | -1 month |
| | dock | - | -2 months |
| | siding | - | -1 month |
| **Current Finish** | bare | ✓ Damage | -3 months |
| | weathered | ◐ Normal | -1 month |
| | stain_and_sealed | ✓ Healthy | 0 months |
| **Weather Exposure** | full_sun | ✓ Damage | -3 months |
| | near_water | ✓ Damage | -3 months |
| | partial_shade | ◐ Normal | -1 month |
| | full_shade | ✓ Healthy | 0 months |
| **Moisture Level** | water_logged | ✓ Damage | -3 months |
| | high | ✓ Damage | -3 months |
| | normal | ◐ Normal | -1 month |
| | dry | ✓ Healthy | 0 months |
| **Mold/Mildew** | high | ✓ Damage | -3 months |
| | low | ◐ Normal | -1 month |
| | none | ✓ Healthy | 0 months |
| **Cracking** | high | ✓ Damage | -3 months |
| | low | ◐ Normal | -1 month |
| | none | ✓ Healthy | 0 months |
| **Graying** | high | ✓ Damage | -3 months |
| | low | ◐ Normal | -1 month |
| | none | ✓ Healthy | 0 months |
| **Repair Needed** | high | ✓ Damage | -3 months |
| | low | ◐ Normal | -1 month |
| | none | ✓ Healthy | 0 months |
| **Posts Condition** | excellent | ✓ Healthy | 0 months |
| | good | ◐ Normal | -1 month |
| | fair | ◐ Normal | -1 month |
| | poor | ✓ Damage | -3 months |
| | needs_repair | ✓ Damage | -3 months |

### Calculation Example

**Scenario**: Fence last stained in 2021
- Today: 2026 (5 years ago, but we predict based on factors)
- lastStainedYear: 2021
- Start: 48 months

**Deductions**:
- Wood type (fence): -3 months
- Current finish (bare): -3 months  
- Weather exposure (full_sun): -3 months
- Moisture (high): -3 months
- Mold/mildew (high): -3 months
- Cracking (low): -1 month
- Graying (high): -3 months
- Repair needed (low): -1 month
- Posts (fair): -1 month

**Total Deductions**: 3+3+3+3+3+1+3+1+1 = 21 months

**Result**: 48 - 21 = **27 months** = ~2.25 years from last stain

---

## Health Status Mapping

Based on `nextPredictedSealingDate - today`:

```typescript
if (monthsUntilDue <= 0) {
  healthStatus = "permanent_damage_risk"; // URGENT - DO NOW
} else if (monthsUntilDue <= 6) {
  healthStatus = "needs_attention";      // SOON - Within 6 months
} else if (monthsUntilDue <= 24) {
  healthStatus = "good";                 // NORMAL - 6-24 months
} else {
  healthStatus = "ultimate_health";      // EXCELLENT - 24+ months
}
```

---

## Diagnosis vs. Estimate

| Aspect | Diagnosis | Estimate |
|--------|-----------|----------|
| **Purpose** | Assess current condition & predict maintenance | Quote a specific job |
| **Timing** | Initial assessment or follow-up check | After diagnosis, when customer ready |
| **Includes** | Health score, damage assessment, timeline | Cost breakdown, materials, labor |
| **Condition Info** | Detailed: all issue levels | Simplified: materials needed |
| **Next Seal Date** | Predicted | Not applicable |
| **Example** | "Your fence is in fair condition. Full stain needed in 18 months." | "Staining this 1,200 sq ft fence will cost $2,400 + tax" |

---

## Synchronization Status

**Problem**: Customer has multiple fence sections that were stained at different times.

**Solution**: Track synchronization to recommend batch re-staining.

```typescript
synchronizationStatus: "synchronized" | "needs_sync"
```

**Logic**:
- If all `diagnosisSections` have `lastStainedYear` within 1 year → `"synchronized"`
- If sections vary > 1 year in age → `"needs_sync"`

**Customer Benefit**: "Your back fence (Section A) was done in 2020, but your front fence (Section B) was done in 2019. Consider re-staining both together for color consistency and labor efficiency."

---

## Product Brand & Pricing

### Default: Ultimate Liquid Gold

Settings table controls:

```typescript
defaultBrand: "Ultimate Liquid Gold"                    // Default
ultimateLiquidGoldUpsell: decimal (0)                  // No upcharge
offBrandProductCharge: decimal (50)                     // $50 upcharge for off-brand
```

### In Diagnosis

```typescript
recommendedBrand: "Ultimate Liquid Gold"                // Default
recommendedProductType: "stain" | "seal"
estimatedBrandUpsell: decimal (0 or offBrandProductCharge)

// Calculation:
if (recommendedBrand !== defaultBrand) {
  estimatedBrandUpsell = offBrandProductCharge;
}
estimatedTotal = estimatedMaterialCost + estimatedBrandUpsell + estimatedLaborCost;
```

---

## API Implementation Notes

### Calculate Next Predicted Sealing Date

```typescript
function calculateNextSealingDate(diagnosis: Diagnosis): Date {
  // Base: 4 years (48 months) from last stain
  let monthsRemaining = 48;
  
  // Wood type deductions
  const woodDeductions: Record<string, number> = {
    fence: 3,
    pergola: 2,
    deck: 1,
    dock: 2,
    siding: 1,
  };
  monthsRemaining -= woodDeductions[diagnosis.woodType] || 0;

  // Current finish deductions
  const finishDeductions: Record<string, number> = {
    bare: 3,
    weathered: 1,
    stain_and_sealed: 0,
  };
  monthsRemaining -= finishDeductions[diagnosis.currentFinish] || 0;

  // Weather exposure deductions
  const weatherDeductions: Record<string, number> = {
    full_sun: 3,
    near_water: 3,
    partial_shade: 1,
    full_shade: 0,
  };
  monthsRemaining -= weatherDeductions[diagnosis.weatherExposure] || 0;

  // Level-based deductions (3 = damage, 1 = normal, 0 = healthy)
  const levelDeductions: Record<string, number> = {
    high: 3,
    low: 1,
    none: 0,
  };
  
  monthsRemaining -= levelDeductions[diagnosis.moistureLevel === "water_logged" || diagnosis.moistureLevel === "high" ? "high" : diagnosis.moistureLevel === "normal" ? "low" : "none"] || 0;
  monthsRemaining -= levelDeductions[diagnosis.moldMildewLevel] || 0;
  monthsRemaining -= levelDeductions[diagnosis.crackingLevel] || 0;
  monthsRemaining -= levelDeductions[diagnosis.grayingLevel] || 0;
  monthsRemaining -= levelDeductions[diagnosis.repairNeededLevel] || 0;

  // Posts deductions
  const postsDeductions: Record<string, number> = {
    excellent: 0,
    good: 1,
    fair: 1,
    poor: 3,
    needs_repair: 3,
  };
  monthsRemaining -= postsDeductions[diagnosis.postsCondition] || 0;

  // Calculate date
  const lastStainDate = new Date(diagnosis.lastStainedYear, 0, 1);
  return addMonths(lastStainDate, Math.max(0, monthsRemaining));
}
```

### Calculate Health Status

```typescript
function calculateHealthStatus(nextSealDate: Date): string {
  const monthsUntil = differenceInMonths(nextSealDate, new Date());
  
  if (monthsUntil <= 0) return "permanent_damage_risk";
  if (monthsUntil <= 6) return "needs_attention";
  if (monthsUntil <= 24) return "good";
  return "ultimate_health";
}
```

---

## Frontend Considerations

### Diagnosis Form

1. **Section Details**: Repeatable section input (allow adding/removing sections)
2. **Health Levels**: 3-choice radio buttons for each issue (none/low/high)
3. **Sync Status**: Auto-calculated or manual override
4. **Timeline Display**: Show predicted seal date prominently with health status color:
   - 🟢 Ultimate Health (24+ months)
   - 🟡 Good (6-24 months)
   - 🟠 Needs Attention (0-6 months)
   - 🔴 Permanent Damage Risk (overdue)

### Dashboard Widget

```
Next Predicted Sealing: June 2028
Status: Ultimate Health ✓
Last Stained: 2021
Wood Type: Fence (Privacy)
Synchronization: Needs Sync ⚠️
```

---

## Mock Data Examples

### Settings

```json
{
  "defaultBrand": "Ultimate Liquid Gold",
  "ultimateLiquidGoldUpsell": 0,
  "offBrandProductCharge": 50,
  "oilCostPerGallon": 35,
  "concentrateCostPerGallon": 85
}
```

### Diagnosis

```json
{
  "projectId": 5,
  "customerId": 12,
  "woodType": "fence",
  "fenceType": "wood_privacy",
  "postsCondition": "good",
  "totalLinearFeet": 150,
  "averageHeight": 6,
  "numberOfSections": 3,
  "lastStainedYear": 2021,
  "lastStainedYearIsExact": true,
  "currentFinish": "weathered",
  "weatherExposure": "full_sun",
  "moistureLevel": "normal",
  "moldMildewLevel": "low",
  "crackingLevel": "none",
  "grayingLevel": "low",
  "repairNeededLevel": "none",
  "recommendedBrand": "Ultimate Liquid Gold",
  "recommendedProductType": "stain",
  "recommendedCoats": 2,
  "healthStatus": "good",
  "nextPredictedSealingDate": "2028-06-15",
  "synchronizationStatus": "needs_sync"
}
```

### Diagnosis Sections

```json
[
  {
    "diagnosisId": 42,
    "sectionNumber": 1,
    "linearFeet": 60,
    "height": 6,
    "sqFt": 360,
    "sidesCompleted": "both",
    "sectionNotes": "Main fence, good condition"
  },
  {
    "diagnosisId": 42,
    "sectionNumber": 2,
    "linearFeet": 50,
    "height": 6,
    "sqFt": 300,
    "sidesCompleted": "front",
    "sectionNotes": "Side fence, front done 2020, back not done yet"
  },
  {
    "diagnosisId": 42,
    "sectionNumber": 3,
    "linearFeet": 40,
    "height": 5,
    "sqFt": 200,
    "sidesCompleted": "both",
    "sectionNotes": "Back corner, shorter due to slope"
  }
]
```

---

## Summary of Changes

✅ **Diagnoses Table**:
- Removed vinyl & composite options
- Added pergola, side_by_side, separate posts condition
- Changed boolean conditions to 3-level health impact
- Added health scoring fields
- Added section synchronization tracking
- Added product brand & upcharge fields

✅ **New Table**:
- `diagnosisSections` for section-level tracking

✅ **Settings Table**:
- Added product pricing & brand configuration

✅ **Business Logic**:
- Health score based on 10+ factors (8 primary + 2 secondary)
- 4-year baseline with month-by-month deductions
- Health status indicators
- Synchronization warnings

This system enables proactive customer engagement with accurate maintenance timelines.
