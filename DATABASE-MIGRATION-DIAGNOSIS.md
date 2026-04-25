# Database Migration - Diagnosis System Update

## What Changed

The diagnosis system has been completely refactored to support advanced health scoring and section-level tracking.

## Schema Changes

### Tables Modified
- **diagnoses** - Major restructuring
  - ✅ New fields: `postsCondition`, `synchronizationStatus`, `healthStatus`, `nextPredictedSealingDate`, `lastStainedYearIsExact`, `moldMildewLevel`, `crackingLevel`, `grayingLevel`, `repairNeededLevel`, `recommendedBrand`, `estimatedBrandUpsell`
  - ❌ Removed fields: `fenceCondition`, `recommendedProduct`, `moldMildew` (boolean), `cracking` (boolean), `graying` (boolean), `repairNeeded` (boolean)
  - 📝 Updated field types: `currentFinish`, `weatherExposure`

- **settings** - Configuration added
  - ✅ New fields: `defaultBrand`, `ultimateLiquidGoldUpsell`, `offBrandProductCharge`

### Tables Added
- **diagnosis_sections** - NEW table for section-level tracking
  - `id`, `diagnosis_id` (FK), `section_number`, `linear_feet`, `height`, `sq_ft`, `sides_completed`, `section_notes`, `created_at`, `updated_at`

## Migration Steps

### 1. Backup Current Database

```bash
pg_dump -U postgres uss_dev > backup_diagnoses_$(date +%s).sql
```

### 2. Create Migration File

```bash
# Using Drizzle Kit
drizzle-kit generate --config ./lib/db/drizzle.config.ts
```

This will:
- Generate SQL migrations for new tables
- Generate SQL migrations for altered columns
- Detect removed columns

### 3. Review Migration

The generated SQL should include:

```sql
-- Add new fields to diagnoses table
ALTER TABLE diagnoses ADD COLUMN posts_condition TEXT NOT NULL DEFAULT 'fair';
ALTER TABLE diagnoses ADD COLUMN synchronization_status TEXT NOT NULL DEFAULT 'needs_sync';
ALTER TABLE diagnoses ADD COLUMN health_status TEXT NOT NULL DEFAULT 'ultimate_health';
ALTER TABLE diagnoses ADD COLUMN next_predicted_sealing_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE diagnoses ADD COLUMN last_stained_year_is_exact BOOLEAN DEFAULT FALSE;
ALTER TABLE diagnoses ADD COLUMN mold_mildew_level TEXT NOT NULL DEFAULT 'none';
ALTER TABLE diagnoses ADD COLUMN cracking_level TEXT NOT NULL DEFAULT 'none';
ALTER TABLE diagnoses ADD COLUMN graying_level TEXT NOT NULL DEFAULT 'none';
ALTER TABLE diagnoses ADD COLUMN repair_needed_level TEXT NOT NULL DEFAULT 'none';
ALTER TABLE diagnoses ADD COLUMN recommended_brand TEXT NOT NULL DEFAULT 'Ultimate Liquid Gold';
ALTER TABLE diagnoses ADD COLUMN estimated_brand_upsell DECIMAL(10,2) DEFAULT 0;

-- Drop old boolean columns
ALTER TABLE diagnoses DROP COLUMN IF EXISTS fence_condition;
ALTER TABLE diagnoses DROP COLUMN IF EXISTS mold_mildew;
ALTER TABLE diagnoses DROP COLUMN IF EXISTS cracking;
ALTER TABLE diagnoses DROP COLUMN IF EXISTS graying;
ALTER TABLE diagnoses DROP COLUMN IF EXISTS repair_needed;
ALTER TABLE diagnoses DROP COLUMN IF EXISTS recommended_product;

-- Create diagnosis_sections table
CREATE TABLE diagnosis_sections (
  id SERIAL PRIMARY KEY,
  diagnosis_id INTEGER NOT NULL REFERENCES diagnoses(id),
  section_number INTEGER NOT NULL,
  linear_feet DECIMAL(10,2),
  height DECIMAL(10,2),
  sq_ft DECIMAL(10,2),
  sides_completed TEXT NOT NULL DEFAULT 'both',
  section_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add new fields to settings table
ALTER TABLE settings ADD COLUMN default_brand TEXT NOT NULL DEFAULT 'Ultimate Liquid Gold';
ALTER TABLE settings ADD COLUMN ultimate_liquid_gold_upsell DECIMAL(10,2) DEFAULT 0;
ALTER TABLE settings ADD COLUMN off_brand_product_charge DECIMAL(10,2) DEFAULT 50;
```

### 4. Apply Migration

```bash
# Using Drizzle Kit
drizzle-kit push --config ./lib/db/drizzle.config.ts

# Or manually
psql -U postgres uss_dev -f migrations/0001_migration.sql
```

### 5. Data Migration (If Needed)

If you have existing diagnoses, you'll need to migrate boolean data to 3-level format:

```sql
-- Migrate mold/mildew boolean to level
UPDATE diagnoses 
SET mold_mildew_level = CASE 
  WHEN mold_mildew = TRUE THEN 'high'
  ELSE 'none'
END;

-- Similarly for other booleans
UPDATE diagnoses 
SET cracking_level = CASE 
  WHEN cracking = TRUE THEN 'low'
  ELSE 'none'
END;

UPDATE diagnoses 
SET graying_level = CASE 
  WHEN graying = TRUE THEN 'low'
  ELSE 'none'
END;

UPDATE diagnoses 
SET repair_needed_level = CASE 
  WHEN repair_needed = TRUE THEN 'low'
  ELSE 'none'
END;
```

### 6. Verify

```bash
# Check table structure
\d diagnoses
\d diagnosis_sections
\d settings

# Check for any nulls in required fields
SELECT id FROM diagnoses WHERE health_status IS NULL LIMIT 5;
```

## Rollback (If Needed)

If something goes wrong:

```bash
# Restore from backup
psql -U postgres uss_dev < backup_diagnoses_*.sql
```

## Testing

After migration:

1. **Verify data integrity**:
   ```bash
   pnpm typecheck
   ```

2. **Test diagnosis creation** (see mock data in DIAGNOSIS-HEALTH-SYSTEM.md)

3. **Test health score calculation** (implement in API routes)

4. **Verify sections table**:
   ```sql
   SELECT d.id, COUNT(ds.id) as section_count 
   FROM diagnoses d 
   LEFT JOIN diagnosis_sections ds ON d.id = ds.diagnosis_id 
   GROUP BY d.id;
   ```

## Next Steps

Once migration is complete:

1. **Update API routes** (diagnoses.ts endpoint) to handle new fields
2. **Implement health score calculation** (see algorithm in DIAGNOSIS-HEALTH-SYSTEM.md)
3. **Create frontend diagnosis form** with new fields and section management
4. **Add settings UI** for brand/product pricing

---

## Field Reference

### Diagnoses - Enum Values

**woodType**: `fence` | `pergola` | `deck` | `dock` | `siding`

**fenceType**: `wood_privacy` | `side_by_side` | `post_rail` | `split_rail`

**postsCondition**: `excellent` | `good` | `fair` | `poor` | `needs_repair`

**currentFinish**: `stain_and_sealed` | `bare` | `weathered`

**weatherExposure**: `full_sun` | `partial_shade` | `full_shade` | `near_water`

**moistureLevel**: `dry` | `normal` | `high` | `water_logged`

**moldMildewLevel** / **crackingLevel** / **grayingLevel** / **repairNeededLevel**: `none` | `low` | `high`

**recommendedProductType**: `stain` | `seal`

**synchronizationStatus**: `synchronized` | `needs_sync`

**healthStatus**: `ultimate_health` | `good` | `needs_attention` | `permanent_damage_risk`

### Diagnosis Sections - Enum Values

**sidesCompleted**: `front` | `back` | `both` | `none`

---

Questions? Check DIAGNOSIS-HEALTH-SYSTEM.md for complete algorithm details.
