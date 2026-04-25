import { z } from "zod/v4";

/**
 * DIAGNOSIS FORM SCHEMA
 * 
 * Complete form for technician to assess fence condition and predict maintenance timeline.
 * Broken into logical sections for frontend form rendering.
 */

// ===== CUSTOMER & PROJECT CONTEXT =====
export const diagnosisContextSchema = z.object({
  projectId: z.number().optional(),
  customerId: z.number(),
  diagnosedById: z.number().optional(),
});

// ===== WOOD & STRUCTURE =====
export const diagnosisWoodSchema = z.object({
  woodType: z.enum(["fence", "pergola", "deck", "dock", "siding"]).default("fence"),
  fenceType: z.enum(["wood_privacy", "side_by_side", "post_rail", "split_rail"]).default("wood_privacy"),
  postsCondition: z.enum(["excellent", "good", "fair", "poor", "needs_repair"]).default("fair"),
});

// ===== DIMENSIONS =====
export const diagnosisDimensionsSchema = z.object({
  totalLinearFeet: z.number().positive("Must be positive").optional(),
  averageHeight: z.number().positive("Must be positive").optional(),
  numberOfSections: z.number().int().positive().optional(),
  numberOfPosts: z.number().int().optional(),
  numberOfGates: z.number().int().optional(),
});

// ===== SECTIONS (Individual fence sections) =====
export const diagnosisSectionSchema = z.object({
  sectionNumber: z.number().int().positive(),
  linearFeet: z.number().positive(),
  height: z.number().positive(),
  sidesCompleted: z.enum(["front", "back", "both", "none"]).default("both"),
  sectionNotes: z.string().optional(),
});

export const diagnosisSectionsSchema = z.array(diagnosisSectionSchema);

// ===== HISTORY & TIMELINE =====
export const diagnosisHistorySchema = z.object({
  lastStainedYear: z.number().int().min(2000).max(new Date().getFullYear()),
  lastStainedYearIsExact: z.boolean().default(false).describe("Is this year exact or estimated?"),
});

// ===== CURRENT STATE & ENVIRONMENT =====
export const diagnosisConditionSchema = z.object({
  currentFinish: z.enum(["stain_and_sealed", "bare", "weathered"]).default("bare"),
  weatherExposure: z.enum(["full_sun", "partial_shade", "full_shade", "near_water"]).default("partial_shade"),
  moistureLevel: z.enum(["dry", "normal", "high", "water_logged"]).default("normal"),
});

// ===== CONDITION ISSUES (Each = -3 months if present) =====
export const diagnosisIssuesSchema = z.object({
  moldMildew: z.boolean().default(false).describe("Mold or mildew present? (-3 months)"),
  cracking: z.boolean().default(false).describe("Wood cracking present? (-3 months)"),
  graying: z.boolean().default(false).describe("Wood graying/oxidation? (-3 months)"),
  repairNeeded: z.boolean().default(false).describe("Structural repair needed? (-3 months)"),
  repairNotes: z.string().optional(),
});

// ===== PRODUCT RECOMMENDATIONS =====
export const diagnosisProductSchema = z.object({
  recommendedBrand: z.string().default("Ultimate Liquid Gold"),
  recommendedProductType: z.enum(["stain", "seal"]).default("stain"),
  recommendedCoats: z.number().int().min(1).max(5).default(2),
  productColor: z.string().optional(),
  prepRequired: z.enum(["none", "light_cleaning", "power_wash", "sand", "scrape", "bleach_treat"]).default("none"),
  careNotes: z.string().optional(),
});

// ===== ESTIMATES =====
export const diagnosisEstimatesSchema = z.object({
  estimatedProductGallons: z.number().positive().optional(),
  estimatedLaborHours: z.number().positive().optional(),
  estimatedMaterialCost: z.number().nonnegative().optional(),
  estimatedBrandUpsell: z.number().nonnegative().default(0),
  estimatedLaborCost: z.number().nonnegative().optional(),
  estimatedTotal: z.number().nonnegative().optional(),
});

// ===== SYNCHRONIZATION & HEALTH =====
export const diagnosisHealthSchema = z.object({
  synchronizationStatus: z.enum(["synchronized", "needs_sync"]).default("needs_sync"),
  // These are calculated server-side, but included in response
  nextPredictedSealingDate: z.date().optional(),
  healthStatus: z.enum(["ultimate_health", "good", "needs_attention", "permanent_damage_risk"]).optional(),
});

// ===== COMPLETE DIAGNOSIS FORM =====
export const diagnosisFormSchema = z.object({
  // Context
  ...diagnosisContextSchema.shape,
  
  // Wood & Structure
  ...diagnosisWoodSchema.shape,
  
  // Dimensions
  ...diagnosisDimensionsSchema.shape,
  
  // History
  ...diagnosisHistorySchema.shape,
  
  // Current State
  ...diagnosisConditionSchema.shape,
  
  // Issues
  ...diagnosisIssuesSchema.shape,
  
  // Products
  ...diagnosisProductSchema.shape,
  
  // Estimates
  ...diagnosisEstimatesSchema.shape,
  
  // Health (read-only from server)
  nextPredictedSealingDate: z.date().optional(),
  healthStatus: z.enum(["ultimate_health", "good", "needs_attention", "permanent_damage_risk"]).optional(),
  synchronizationStatus: z.enum(["synchronized", "needs_sync"]).optional(),
});

// ===== SECTIONS FORM =====
export const diagnosisSectionFormSchema = z.object({
  diagnosisId: z.number(),
  sections: diagnosisSectionsSchema,
});

// ===== EXPORT TYPES =====
export type DiagnosisForm = z.infer<typeof diagnosisFormSchema>;
export type DiagnosisSection = z.infer<typeof diagnosisSectionSchema>;
export type DiagnosisSectionForm = z.infer<typeof diagnosisSectionFormSchema>;

/**
 * FORM SECTIONS - For frontend organization
 */
export const diagnosisFormSections = {
  woodAndStructure: {
    title: "Wood Type & Fence Structure",
    description: "What are we working with?",
    fields: [
      {
        name: "woodType",
        label: "Wood Type",
        type: "select",
        options: ["fence", "pergola", "deck", "dock", "siding"],
        required: true,
        hint: "fence(-3mo), pergola(-2mo), deck(-1mo), dock(-2mo), siding(-1mo)",
      },
      {
        name: "fenceType",
        label: "Fence Style",
        type: "select",
        options: ["wood_privacy", "side_by_side", "post_rail", "split_rail"],
        required: true,
      },
      {
        name: "postsCondition",
        label: "Posts Condition",
        type: "select",
        options: ["excellent", "good", "fair", "poor", "needs_repair"],
        required: true,
        hint: "Posts assessed separately",
      },
    ],
  },

  dimensions: {
    title: "Dimensions & Measurements",
    description: "How big is the project?",
    fields: [
      {
        name: "totalLinearFeet",
        label: "Total Linear Feet",
        type: "number",
        placeholder: "e.g., 150",
        hint: "Length of fence perimeter",
      },
      {
        name: "averageHeight",
        label: "Average Height (feet)",
        type: "number",
        placeholder: "e.g., 6",
        hint: "Used to calculate sq ft",
      },
      {
        name: "numberOfSections",
        label: "Number of Sections",
        type: "number",
        placeholder: "e.g., 3",
        hint: "Separate fence sections",
      },
      {
        name: "numberOfPosts",
        label: "Number of Posts",
        type: "number",
        placeholder: "Optional",
      },
      {
        name: "numberOfGates",
        label: "Number of Gates",
        type: "number",
        placeholder: "Optional",
      },
    ],
  },

  sections: {
    title: "Individual Sections",
    description: "Track different lengths/heights and which sides were done",
    fields: [
      {
        name: "sections",
        label: "Fence Sections",
        type: "array",
        itemSchema: diagnosisSectionSchema,
        hint: "Add each section (rare: different lengths/heights, different sides stained)",
      },
    ],
  },

  history: {
    title: "History & Timeline",
    description: "When was it last stained?",
    fields: [
      {
        name: "lastStainedYear",
        label: "Last Stained Year",
        type: "number",
        placeholder: "e.g., 2021",
        required: true,
      },
      {
        name: "lastStainedYearIsExact",
        label: "Is this year exact or estimated?",
        type: "checkbox",
        hint: "Check if exact date known",
      },
    ],
  },

  currentState: {
    title: "Current Condition",
    description: "What's the fence look like right now?",
    fields: [
      {
        name: "currentFinish",
        label: "Current Finish",
        type: "select",
        options: ["stain_and_sealed", "bare", "weathered"],
        required: true,
      },
      {
        name: "weatherExposure",
        label: "Weather Exposure",
        type: "select",
        options: ["full_sun", "partial_shade", "full_shade", "near_water"],
        required: true,
        hint: "full_sun(-3mo), near_water(-3mo), partial_shade(-1mo), full_shade(0)",
      },
      {
        name: "moistureLevel",
        label: "Moisture Level",
        type: "select",
        options: ["dry", "normal", "high", "water_logged"],
        required: true,
        hint: "dry(0), normal(-1mo), high(-3mo), water_logged(-3mo)",
      },
    ],
  },

  issues: {
    title: "Condition Issues",
    description: "Any damage present? Each issue = -3 months",
    fields: [
      {
        name: "moldMildew",
        label: "Mold or Mildew Present?",
        type: "checkbox",
        hint: "Fungal growth (-3 months)",
      },
      {
        name: "cracking",
        label: "Wood Cracking?",
        type: "checkbox",
        hint: "Structural cracking (-3 months)",
      },
      {
        name: "graying",
        label: "Wood Graying/Oxidation?",
        type: "checkbox",
        hint: "Gray weathering appearance (-3 months)",
      },
      {
        name: "repairNeeded",
        label: "Repair Needed?",
        type: "checkbox",
        hint: "Structural repair required (-3 months)",
      },
      {
        name: "repairNotes",
        label: "Repair Details",
        type: "textarea",
        placeholder: "Describe needed repairs...",
      },
    ],
  },

  products: {
    title: "Recommended Products",
    description: "What should they use?",
    fields: [
      {
        name: "recommendedBrand",
        label: "Recommended Brand",
        type: "text",
        defaultValue: "Ultimate Liquid Gold",
        hint: "Default: Ultimate Liquid Gold (no upcharge)",
      },
      {
        name: "recommendedProductType",
        label: "Product Type",
        type: "select",
        options: ["stain", "seal"],
        required: true,
      },
      {
        name: "recommendedCoats",
        label: "Number of Coats",
        type: "number",
        min: 1,
        max: 5,
        defaultValue: 2,
      },
      {
        name: "productColor",
        label: "Color",
        type: "text",
        placeholder: "e.g., Honey, Cedar, Ebony",
      },
      {
        name: "prepRequired",
        label: "Prep Work",
        type: "select",
        options: ["none", "light_cleaning", "power_wash", "sand", "scrape", "bleach_treat"],
        required: true,
      },
      {
        name: "careNotes",
        label: "Post-Application Care",
        type: "textarea",
        placeholder: "Care instructions...",
      },
    ],
  },

  estimates: {
    title: "Cost Estimates",
    description: "Calculate project cost",
    fields: [
      {
        name: "estimatedProductGallons",
        label: "Estimated Gallons",
        type: "number",
        hint: "Calculated automatically",
        readonly: true,
      },
      {
        name: "estimatedLaborHours",
        label: "Estimated Labor Hours",
        type: "number",
        hint: "Based on sq ft & coverage rate",
        readonly: true,
      },
      {
        name: "estimatedMaterialCost",
        label: "Material Cost",
        type: "currency",
        readonly: true,
      },
      {
        name: "estimatedBrandUpsell",
        label: "Brand Upcharge",
        type: "currency",
        readonly: true,
      },
      {
        name: "estimatedLaborCost",
        label: "Labor Cost",
        type: "currency",
        readonly: true,
      },
      {
        name: "estimatedTotal",
        label: "Total Estimate",
        type: "currency",
        readonly: true,
      },
    ],
  },
};

/**
 * CALCULATION HELPERS
 */

export const diagnosisCalculations = {
  /**
   * Calculate sq ft from dimensions
   */
  calculateSqFt: (linearFeet: number, averageHeight: number): number => {
    return linearFeet * averageHeight;
  },

  /**
   * Calculate estimated gallons
   * (assumes coverage rate in settings, e.g., 400-500 sq ft per gallon for stain)
   */
  calculateEstimatedGallons: (sqFt: number, coveragePerGallon: number = 450): number => {
    return sqFt / coveragePerGallon;
  },

  /**
   * Calculate estimated labor hours
   * (assumes labor rate in settings, e.g., 150 sq ft per hour)
   */
  calculateEstimatedHours: (sqFt: number, sqFtPerHour: number = 150): number => {
    return sqFt / sqFtPerHour;
  },

  /**
   * Calculate material cost
   */
  calculateMaterialCost: (
    gallons: number,
    costPerGallon: number,
    coats: number = 1
  ): number => {
    return gallons * costPerGallon * coats;
  },

  /**
   * Calculate labor cost
   */
  calculateLaborCost: (hours: number, laborRatePerHour: number): number => {
    return hours * laborRatePerHour;
  },

  /**
   * Calculate brand upcharge
   */
  calculateBrandUpcharge: (
    brand: string,
    defaultBrand: string,
    offBrandCharge: number = 50
  ): number => {
    return brand !== defaultBrand ? offBrandCharge : 0;
  },

  /**
   * Calculate next sealing date based on health factors
   * Each issue deducts from 48 months baseline
   */
  calculateNextSealingDate: (diagnosis: {
    lastStainedYear: number;
    woodType: string;
    currentFinish: string;
    weatherExposure: string;
    moistureLevel: string;
    moldMildew: boolean;
    cracking: boolean;
    graying: boolean;
    repairNeeded: boolean;
    postsCondition: string;
  }): { monthsRemaining: number; date: Date } => {
    let monthsRemaining = 48; // 4 years baseline

    // Wood type deductions
    const woodDeductions: Record<string, number> = {
      fence: 3,
      pergola: 2,
      deck: 1,
      dock: 2,
      siding: 1,
    };
    monthsRemaining -= woodDeductions[diagnosis.woodType] || 0;

    // Current finish
    const finishDeductions: Record<string, number> = {
      bare: 3,
      weathered: 1,
      stain_and_sealed: 0,
    };
    monthsRemaining -= finishDeductions[diagnosis.currentFinish] || 0;

    // Weather exposure
    const weatherDeductions: Record<string, number> = {
      full_sun: 3,
      near_water: 3,
      partial_shade: 1,
      full_shade: 0,
    };
    monthsRemaining -= weatherDeductions[diagnosis.weatherExposure] || 0;

    // Moisture level
    const moistureDeductions: Record<string, number> = {
      water_logged: 3,
      high: 3,
      normal: 1,
      dry: 0,
    };
    monthsRemaining -= moistureDeductions[diagnosis.moistureLevel] || 0;

    // Condition issues (each = -3 months if present)
    if (diagnosis.moldMildew) monthsRemaining -= 3;
    if (diagnosis.cracking) monthsRemaining -= 3;
    if (diagnosis.graying) monthsRemaining -= 3;
    if (diagnosis.repairNeeded) monthsRemaining -= 3;

    // Posts condition
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
    const futureDate = new Date(lastStainDate);
    futureDate.setMonth(futureDate.getMonth() + Math.max(0, monthsRemaining));

    return {
      monthsRemaining: Math.max(0, monthsRemaining),
      date: futureDate,
    };
  },

  /**
   * Calculate health status based on months until sealing
   */
  calculateHealthStatus: (monthsUntilSealing: number): string => {
    if (monthsUntilSealing <= 0) return "permanent_damage_risk";
    if (monthsUntilSealing <= 6) return "needs_attention";
    if (monthsUntilSealing <= 24) return "good";
    return "ultimate_health";
  },
};

export type DiagnosisCalculations = typeof diagnosisCalculations;
