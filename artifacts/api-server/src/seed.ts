import { db, usersTable, customersTable, propertiesTable, projectsTable, diagnosesTable, invoicesTable, invoiceLineItemsTable, paymentsTable, jobsTable, jobsheetsTable, materialsTable, inventoryItemsTable, activityTable, settingsTable, pricingRulesTable, documentsTable } from "@workspace/db";
import { createHash } from "crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "uss-ops-salt").digest("hex");
}

async function seed() {
  console.log("Seeding database...");

  const existingSettings = await db.select().from(settingsTable).limit(1);
  if (existingSettings.length === 0) {
    await db.insert(settingsTable).values({
      companyName: "Ultimate Stain & Seal",
      companyPhone: "(512) 867-5309",
      companyEmail: "ops@ultimatestainnseal.com",
      companyAddress: "1247 Woodcraft Lane, Austin, TX 78701",
      defaultTaxRate: "0.0825",
      defaultLaborRate: "45.00",
      defaultCoverageRate: "100",
      softDisclaimerText: "Note: Weather conditions may affect drying time. USS is not responsible for re-staining needs due to extreme weather events within 30 days of service.",
      hardDisclaimerText: "DISCLAIMER: Customer acknowledges that wood surfaces expand and contract naturally with temperature and humidity changes. USS provides no warranty for color matching on previously stained wood. This invoice constitutes an agreement between USS and the customer. Customer signature is required before work begins.",
      invoicePrefix: "USS",
      batchOilGallons: "20",
      batchConcentrateGallons: "5",
      oilCostPerGallon: "8.50",
      concentrateCostPerGallon: "28.00",
      glideEnabled: false,
    });
    console.log("  Settings created");
  }

  const existingAdmin = await db.select().from(usersTable).limit(1);
  let adminUser: typeof usersTable.$inferSelect;
  if (existingAdmin.length === 0) {
    const users = await db.insert(usersTable).values([
      { email: "admin@ussops.com", passwordHash: hashPassword("admin123"), firstName: "Chad", lastName: "Morrison", role: "admin", phone: "(512) 100-0001", isActive: true },
      { email: "sarah@ussops.com", passwordHash: hashPassword("sarah123"), firstName: "Sarah", lastName: "Jenkins", role: "office", phone: "(512) 100-0002", isActive: true },
      { email: "mike@ussops.com", passwordHash: hashPassword("mike123"), firstName: "Mike", lastName: "Torres", role: "crew", phone: "(512) 100-0003", isActive: true },
      { email: "derek@ussops.com", passwordHash: hashPassword("derek123"), firstName: "Derek", lastName: "Hall", role: "crew", phone: "(512) 100-0004", isActive: true },
    ]).returning();
    adminUser = users[0];
    console.log("  Users created");
  } else {
    adminUser = existingAdmin[0];
  }

  const existingRules = await db.select().from(pricingRulesTable).limit(1);
  if (existingRules.length === 0) {
    await db.insert(pricingRulesTable).values([
      { name: "Cedar Fence - Stain & Seal", serviceType: "stain_seal", fenceType: "cedar", pricePerSqFt: "0.65", minimumCharge: "350.00", laborRatePerHour: "45.00", notes: "Standard cedar panel stain & seal. Both sides included.", isActive: true },
      { name: "Pressure Treated - Stain & Seal", serviceType: "stain_seal", fenceType: "pressure_treated", pricePerSqFt: "0.55", minimumCharge: "300.00", laborRatePerHour: "45.00", notes: "PT lumber. Must be dried minimum 6 months before staining.", isActive: true },
      { name: "Cedar Fence - Seal Only", serviceType: "stain_seal", fenceType: "cedar", pricePerSqFt: "0.40", minimumCharge: "250.00", laborRatePerHour: "45.00", notes: "Clear seal only, no colorant.", isActive: true },
      { name: "Gate - Standard", serviceType: "stain_seal", fenceType: "gate", pricePerSqFt: null, minimumCharge: "75.00", laborRatePerHour: "45.00", notes: "Per gate, standard size (4x7 ft). Includes both sides.", isActive: true },
      { name: "Redwood - Stain & Seal", serviceType: "stain_seal", fenceType: "redwood", pricePerSqFt: "0.75", minimumCharge: "400.00", laborRatePerHour: "50.00", notes: "Redwood premium. Color match critical.", isActive: true },
      { name: "Power Washing", serviceType: "power_washing", fenceType: null, pricePerSqFt: "0.18", minimumCharge: "150.00", laborRatePerHour: "40.00", notes: "Surface prep / power wash only. No stain.", isActive: true },
      { name: "Cleaning Service", serviceType: "cleaning", fenceType: null, pricePerSqFt: "0.12", minimumCharge: "120.00", laborRatePerHour: "38.00", notes: "Soft wash / soap-and-brush cleaning without full pressure wash.", isActive: true },
      { name: "Fence Repair", serviceType: "repair", fenceType: null, pricePerSqFt: null, minimumCharge: "200.00", laborRatePerHour: "55.00", notes: "Board, post, or hardware repair. Quoted per scope.", isActive: true },
    ]);
    console.log("  Pricing rules created");
  }

  const existingMaterials = await db.select().from(materialsTable).limit(1);
  let allMaterials: typeof materialsTable.$inferSelect[] = [];
  if (existingMaterials.length === 0) {
    allMaterials = await db.insert(materialsTable).values([
      // LIQUIDS — custom oil-base stain system (mixed on-site)
      { name: "Stain Oil Base — 100gal Tank", sku: "OIL-TANK-100", category: "liquid", trackingType: "quantity", oilType: "oil_base", containerCapacity: "100", brand: "USS Custom", description: "Main oil-base storage tank. 100 gallon capacity. Used to mix batches of USS custom stain.", unitType: "gallon", unitCost: "8.50", coveragePerUnit: "100", coverageUnit: "sq_ft", isActive: true },
      { name: "Stain Concentrate — 5gal Jug", sku: "CONC-5G", category: "liquid", trackingType: "quantity", containerCapacity: "5", brand: "USS Custom", description: "Color concentrate, 5-gallon jug. Mix 1 jug concentrate per 20 gal oil to make a 25gal stain batch.", unitType: "gallon", unitCost: "28.00", isActive: true },
      // FUELS / CHEMICALS
      { name: "Gasoline — 5gal Can", sku: "GAS-5G", category: "fuel", trackingType: "quantity", containerCapacity: "5", description: "5-gallon gas can for sprayer and equipment. Track fill level.", unitType: "gallon", unitCost: "3.50", isActive: true },
      { name: "Mineral Spirits — 5gal", sku: "MSPIRITS-5G", category: "chemical", trackingType: "quantity", containerCapacity: "5", description: "5-gallon mineral spirits for equipment cleaning between colors.", unitType: "gallon", unitCost: "12.00", isActive: true },
      // CONSUMABLES
      { name: "Paper Towel Rolls", sku: "TOWEL-ROLL", category: "consumable", trackingType: "quantity", description: "Shop-grade paper towel rolls. Track by roll count.", unitType: "roll", unitCost: "1.80", isActive: true },
      { name: "Black Nitrile Gloves", sku: "GLOVES-NITRILE", category: "consumable", trackingType: "quantity", description: "Black nitrile disposable gloves, one-size-fits-most. Track by box (100 count).", unitType: "box", unitCost: "11.00", isActive: true },
      // CONTAINERS — tracked by contents + fill level
      { name: "5-Gallon Stain Jug #1", sku: "JUG-5G-1", category: "container", trackingType: "both", containerCapacity: "5", description: "Portable 5-gallon stain jug #1. Track how full and what color/batch is inside.", unitType: "each", isActive: true },
      { name: "5-Gallon Stain Jug #2", sku: "JUG-5G-2", category: "container", trackingType: "both", containerCapacity: "5", description: "Portable 5-gallon stain jug #2. Track how full and what color/batch is inside.", unitType: "each", isActive: true },
      { name: "5-Gallon Stain Jug #3", sku: "JUG-5G-3", category: "container", trackingType: "both", containerCapacity: "5", description: "Portable 5-gallon stain jug #3. Track how full and what color/batch is inside.", unitType: "each", isActive: true },
      // EQUIPMENT — status tracked (good/fair/bad)
      { name: "Extension Ladder #1", sku: "LADDER-1", category: "equipment", trackingType: "status", description: "24-foot aluminum extension ladder.", unitType: "each", isActive: true },
      { name: "Extension Ladder #2", sku: "LADDER-2", category: "equipment", trackingType: "status", description: "24-foot aluminum extension ladder.", unitType: "each", isActive: true },
      { name: "Airless Sprayer (Electric)", sku: "SPRAYER-ELEC", category: "equipment", trackingType: "status", description: "Electric airless sprayer for stain application. Graco model.", unitType: "each", isActive: true },
      { name: "Gas Sprayer (Van-Mounted)", sku: "SPRAYER-GAS", category: "equipment", trackingType: "status", description: "Gas-powered van-mounted sprayer. Used for large jobs and power washing.", unitType: "each", isActive: true },
      { name: "Rock Bar", sku: "ROCKBAR-1", category: "equipment", trackingType: "status", description: "Heavy-duty rock bar / digging bar for post setting.", unitType: "each", isActive: true },
      { name: "Post Hole Digger #1", sku: "PHD-1", category: "equipment", trackingType: "status", description: "Manual clamshell post hole digger.", unitType: "each", isActive: true },
      { name: "Post Hole Digger #2", sku: "PHD-2", category: "equipment", trackingType: "status", description: "Manual clamshell post hole digger.", unitType: "each", isActive: true },
      { name: "String Line (Mason Line)", sku: "STRING-LINE", category: "equipment", trackingType: "status", description: "Braided mason's string line for fence layout.", unitType: "each", isActive: true },
      { name: "Nuts & Bolts Assorted", sku: "NUTS-BOLTS", category: "consumable", trackingType: "quantity", description: "Assorted nuts, bolts, washers for fence hardware. Track by bag.", unitType: "bag", unitCost: "14.00", isActive: true },
      { name: "Measuring Square", sku: "SQ-MEASURE", category: "equipment", trackingType: "status", description: "Speed square for angle measurement during fence installation.", unitType: "each", isActive: true },
      { name: "Level — 48in", sku: "LEVEL-48", category: "equipment", trackingType: "status", description: "48-inch aluminum level. Primary level for post setting.", unitType: "each", isActive: true },
      { name: "Level — 24in", sku: "LEVEL-24", category: "equipment", trackingType: "status", description: "24-inch torpedo level. Secondary / tight-space use.", unitType: "each", isActive: true },
      { name: "Drill — Blue (Milwaukee)", sku: "DRILL-BLUE", category: "equipment", trackingType: "status", description: "Milwaukee cordless drill, blue. Primary drill.", unitType: "each", isActive: true },
      { name: "Drill — Orange #1 (Dewalt)", sku: "DRILL-ORG-1", category: "equipment", trackingType: "status", description: "Dewalt 20V cordless drill, orange. Second drill.", unitType: "each", isActive: true },
      { name: "Drill — Orange #2 (Dewalt)", sku: "DRILL-ORG-2", category: "equipment", trackingType: "status", description: "Dewalt 20V cordless drill, orange. Third drill / backup.", unitType: "each", isActive: true },
      { name: "Drill Battery — Blue (Milwaukee)", sku: "BATT-BLUE", category: "equipment", trackingType: "status", description: "Milwaukee 18V drill battery pack.", unitType: "each", isActive: true },
      { name: "Drill Battery — Orange (Dewalt)", sku: "BATT-ORG", category: "equipment", trackingType: "status", description: "Dewalt 20V drill battery pack.", unitType: "each", isActive: true },
      { name: "Drill Charger — Blue (Milwaukee)", sku: "CHG-BLUE", category: "equipment", trackingType: "status", description: "Milwaukee 18V rapid charger.", unitType: "each", isActive: true },
      { name: "Drill Charger — Orange (Dewalt)", sku: "CHG-ORG", category: "equipment", trackingType: "status", description: "Dewalt 20V rapid charger.", unitType: "each", isActive: true },
      { name: "Car Cover #1", sku: "COVER-1", category: "equipment", trackingType: "status", description: "Protective car/vehicle cover for overspray protection. Large.", unitType: "each", isActive: true },
      { name: "Car Cover #2", sku: "COVER-2", category: "equipment", trackingType: "status", description: "Protective car/vehicle cover for overspray protection. Large.", unitType: "each", isActive: true },
      { name: "Car Cover #3", sku: "COVER-3", category: "equipment", trackingType: "status", description: "Protective car/vehicle cover for overspray protection. Medium.", unitType: "each", isActive: true },
      { name: "Electric Saw (Reciprocating)", sku: "SAW-RECIP", category: "equipment", trackingType: "status", description: "Cordless reciprocating saw for fence board cutting and removal.", unitType: "each", isActive: true },
      { name: "Circular Saw", sku: "SAW-CIRC", category: "equipment", trackingType: "status", description: "7.25-inch circular saw for fence board trimming.", unitType: "each", isActive: true },
    ]).returning();

    await db.insert(inventoryItemsTable).values([
      // Liquids — quantity + fill tracking
      { materialId: allMaterials[0].id, quantityOnHand: "60", reorderPoint: "20", reorderQuantity: "100", location: "Yard - Tank Station", notes: "Main oil tank. Refill when below 20 gal." },
      { materialId: allMaterials[1].id, quantityOnHand: "10", reorderPoint: "5", reorderQuantity: "25", location: "Supply Shelf", notes: "Keep minimum 2 jugs. 1 jug per batch." },
      { materialId: allMaterials[2].id, quantityOnHand: "3", reorderPoint: "2", reorderQuantity: "5", location: "Van - Fuel Can", notes: "5-gallon red gas can. Refill when below half." },
      { materialId: allMaterials[3].id, quantityOnHand: "5", reorderPoint: "2", reorderQuantity: "5", location: "Supply Shelf", notes: "For equipment cleaning between color batches." },
      // Consumables
      { materialId: allMaterials[4].id, quantityOnHand: "12", reorderPoint: "4", reorderQuantity: "12", location: "Supply Shelf", notes: "Track by roll." },
      { materialId: allMaterials[5].id, quantityOnHand: "3", reorderPoint: "1", reorderQuantity: "4", location: "Supply Shelf", notes: "Track by box (100 gloves per box)." },
      // Containers — track contents + color
      { materialId: allMaterials[6].id, quantityOnHand: "4.5", colorContent: "medium_brown", contentDescription: "USS Mix B — medium brown batch 4/20/26", location: "Van", notes: "Jug #1: currently has leftover batch from Whispering Oaks job." },
      { materialId: allMaterials[7].id, quantityOnHand: "0", location: "Yard - Jug Rack", notes: "Jug #2: empty, clean, ready." },
      { materialId: allMaterials[8].id, quantityOnHand: "0", location: "Yard - Jug Rack", notes: "Jug #3: empty, clean, ready." },
      // Equipment — status only
      { materialId: allMaterials[9].id, status: "good", location: "Van - Ladder Rack", notes: "Extension Ladder #1: no damage." },
      { materialId: allMaterials[10].id, status: "fair", statusNotes: "Right rail has minor bend at rung 3. Still safe, flagged for replacement.", location: "Van - Ladder Rack" },
      { materialId: allMaterials[11].id, status: "good", location: "Van - Equipment Bay", notes: "Electric sprayer. Cleaned after last use." },
      { materialId: allMaterials[12].id, status: "good", location: "Van - Mounted", notes: "Gas sprayer. Last serviced 3/2026." },
      { materialId: allMaterials[13].id, status: "good", location: "Van - Tool Bin" },
      { materialId: allMaterials[14].id, status: "good", location: "Van - Tool Bin" },
      { materialId: allMaterials[15].id, status: "fair", statusNotes: "Handle cracked near grip. Still functional.", location: "Van - Tool Bin" },
      { materialId: allMaterials[16].id, status: "good", location: "Van - Tool Bin" },
      { materialId: allMaterials[17].id, quantityOnHand: "3", reorderPoint: "1", reorderQuantity: "3", location: "Van - Parts Bin" },
      { materialId: allMaterials[18].id, status: "good", location: "Van - Tool Bin" },
      { materialId: allMaterials[19].id, status: "good", location: "Van - Tool Bin" },
      { materialId: allMaterials[20].id, status: "good", location: "Van - Tool Bin" },
      { materialId: allMaterials[21].id, status: "good", location: "Van - Drill Bag" },
      { materialId: allMaterials[22].id, status: "good", location: "Van - Drill Bag" },
      { materialId: allMaterials[23].id, status: "fair", statusNotes: "Chuck slipping occasionally. Functional but schedule repair.", location: "Van - Drill Bag" },
      { materialId: allMaterials[24].id, status: "good", location: "Van - Drill Bag" },
      { materialId: allMaterials[25].id, status: "good", location: "Van - Drill Bag" },
      { materialId: allMaterials[26].id, status: "good", location: "Van - Drill Bag" },
      { materialId: allMaterials[27].id, status: "good", location: "Van - Drill Bag" },
      { materialId: allMaterials[28].id, status: "good", location: "Van - Cover Bin" },
      { materialId: allMaterials[29].id, status: "good", location: "Van - Cover Bin" },
      { materialId: allMaterials[30].id, status: "fair", statusNotes: "Small tear on one corner. Still usable for most vehicles.", location: "Van - Cover Bin" },
      { materialId: allMaterials[31].id, status: "good", location: "Van - Tool Bag" },
      { materialId: allMaterials[32].id, status: "good", location: "Van - Tool Bag" },
    ]);
    console.log("  Materials & inventory created");
  } else {
    allMaterials = await db.select().from(materialsTable);
  }

  const existingCustomers = await db.select().from(customersTable).limit(1);
  if (existingCustomers.length === 0) {
    const customers = await db.insert(customersTable).values([
      { firstName: "James", lastName: "Anderson", email: "james.anderson@gmail.com", phone: "(512) 555-2341", phone2: "(512) 555-9876", status: "active", leadSource: "referral", leadSourceDetail: "Referred by the Smiths", notes: "Excellent customer. Prefers TWP Cedar stain." },
      { firstName: "Linda", lastName: "Weaver", email: "lweaver@yahoo.com", phone: "(512) 555-7732", status: "active", leadSource: "google", notes: "Large estate. 450 LF cedar fence. Very particular about color matching." },
      { firstName: "Robert", lastName: "Chen", email: "robert.chen@outlook.com", phone: "(512) 555-4488", status: "prospect", leadSource: "nextdoor", notes: "Interested in fence replacement + stain. Getting multiple quotes. Follow up 4/30." },
      { firstName: "Patricia", lastName: "Gutierrez", email: "pgutierrez@gmail.com", phone: "(512) 555-3319", status: "completed", leadSource: "repeat", notes: "Returning customer — 2nd project. Quick payer. Very happy with work." },
      { firstName: "Marcus", lastName: "Thompson", email: "mthompson@icloud.com", phone: "(512) 555-8821", status: "active", leadSource: "google", notes: "Large corner lot. Fence weathered but solid. Wants TWP Cedar, 2 coats." },
      { firstName: "Diane", lastName: "Holloway", email: "dholloway@hotmail.com", phone: "(512) 555-6644", status: "active", leadSource: "referral", leadSourceDetail: "Referred by James Anderson", notes: "New cedar fence needs first treatment." },
      { firstName: "Carlos", lastName: "Reyes", email: "c.reyes@gmail.com", phone: "(737) 555-2290", status: "prospect", leadSource: "facebook", notes: "PT fence — need to verify cure time before scheduling stain." },
      { firstName: "Helen", lastName: "Bradshaw", email: "hbradshaw@gmail.com", phone: "(512) 555-4411", status: "completed", leadSource: "repeat", notes: "Third job with USS. Always pays immediately. Prefers Armstrong Clark." },
    ]).returning();

    const props = await db.insert(propertiesTable).values([
      { customerId: customers[0].id, address: "4521 Oak Hollow Dr", city: "Austin", state: "TX", zip: "78746", propertyType: "residential", accessNotes: "Board-on-board cedar, north-facing. Good shade coverage. 210 LF, 6ft, 2 gates." },
      { customerId: customers[1].id, address: "892 Ridgeline Blvd", city: "Austin", state: "TX", zip: "78733", propertyType: "residential", gateCode: "8821", accessNotes: "Mix of board-on-board and picket. 450 LF, 6ft, 4 gates. Some sections need repair." },
      { customerId: customers[3].id, address: "744 Pecan Street", city: "Cedar Park", state: "TX", zip: "78613", propertyType: "residential", accessNotes: "New cedar fence, 175 LF, 6ft, 1 gate. First treatment." },
      { customerId: customers[4].id, address: "3310 Whispering Oaks Blvd", city: "Austin", state: "TX", zip: "78759", propertyType: "residential", accessNotes: "Full perimeter, 320 LF, 6ft, 3 gates. West side most weathered." },
      { customerId: customers[5].id, address: "218 Lakewood Terrace", city: "Austin", state: "TX", zip: "78734", propertyType: "residential", accessNotes: "Brand new cedar — first seal. 140 LF, 6ft, 1 gate." },
      { customerId: customers[7].id, address: "901 River Oaks Dr", city: "Lakeway", state: "TX", zip: "78734", propertyType: "residential", gateCode: "4411", accessNotes: "8ft privacy fence, 195 LF, 2 gates. Match Armstrong Clark Naturaltone exactly." },
    ]).returning();

    const projects = await db.insert(projectsTable).values([
      { customerId: customers[0].id, propertyId: props[0].id, projectName: "Oak Hollow Fence Stain & Seal", serviceType: "stain_seal", status: "in_progress", priority: "high", scheduledDate: new Date("2026-04-28"), totalAmount: "1650.00", paidAmount: "0", balanceDue: "1650.00", notes: "Two coats. Customer wants original cedar color. Check gate hinges.", assignedToId: adminUser.id },
      { customerId: customers[1].id, propertyId: props[1].id, projectName: "Ridgeline Estate Full Restoration", serviceType: "stain_seal", status: "scheduled", priority: "high", scheduledDate: new Date("2026-05-12"), totalAmount: "4200.00", paidAmount: "1500.00", balanceDue: "2700.00", notes: "2-day job. Confirm product availability before scheduling.", assignedToId: adminUser.id },
      { customerId: customers[2].id, projectName: "Crestwood Fence Quote", serviceType: "stain_seal", status: "inquiry", priority: "medium", scheduledDate: new Date("2026-05-20"), totalAmount: "1100.00", notes: "Getting multiple quotes. Follow up by 4/30." },
      { customerId: customers[3].id, propertyId: props[2].id, projectName: "Pecan Street New Fence Seal", serviceType: "stain_seal", status: "completed", priority: "medium", scheduledDate: new Date("2026-03-15"), completedDate: new Date("2026-03-18"), totalAmount: "875.00", paidAmount: "875.00", balanceDue: "0", notes: "Single coat clear seal. Customer very happy.", assignedToId: adminUser.id },
      { customerId: customers[4].id, propertyId: props[3].id, projectName: "Whispering Oaks Restoration", serviceType: "stain_seal", status: "in_progress", priority: "high", scheduledDate: new Date("2026-04-30"), totalAmount: "2800.00", paidAmount: "0", balanceDue: "2800.00", notes: "Power wash required. Mildew on north side. Start west face.", assignedToId: adminUser.id },
      { customerId: customers[5].id, propertyId: props[4].id, projectName: "Lakewood New Cedar First Seal", serviceType: "stain_seal", status: "scheduled", priority: "medium", scheduledDate: new Date("2026-05-08"), totalAmount: "690.00", notes: "Brand new cedar. Single coat protective seal.", assignedToId: adminUser.id },
      { customerId: customers[7].id, propertyId: props[5].id, projectName: "River Oaks 8ft Privacy Refresh", serviceType: "stain_seal", status: "completed", priority: "medium", scheduledDate: new Date("2026-02-20"), completedDate: new Date("2026-02-22"), totalAmount: "1950.00", paidAmount: "1950.00", balanceDue: "0", notes: "8ft boards. Color matched previous exactly. Customer thrilled.", assignedToId: adminUser.id },
      { customerId: customers[6].id, projectName: "Silver Creek PT Fence Evaluation", serviceType: "stain_seal", status: "inquiry", priority: "low", totalAmount: "950.00", notes: "PT fence — confirm cure time. Schedule site assessment first." },
    ]).returning();

    await db.insert(diagnosesTable).values([
      { projectId: projects[0].id, customerId: customers[0].id, diagnosedById: adminUser.id, woodType: "fence", totalLinearFeet: "210", averageHeight: "6", totalSqFt: "2520", fenceCondition: "good", fenceType: "cedar", numberOfGates: 2, numberOfPosts: 28, lastStainedYear: 2018, currentFinish: "Cabot Australian Timber Oil (faded)", weatherExposure: "partial_shade", moistureLevel: "dry", moldMildew: false, graying: true, cracking: false, repairNeeded: false, recommendedProduct: "USS Custom Oil Base", recommendedProductType: "oil_base", recommendedCoats: 2, productColor: "medium_brown", prepRequired: "Light power wash, sand any rough sections, mask landscape and trim", careNotes: "Cedar is in good shape but needs color refresh. Both sides need treatment. Gate #2 hinge is squeaky — flag for crew.", estimatedProductGallons: "50.40", estimatedLaborHours: "18.4", estimatedMaterialCost: "2116.80", estimatedLaborCost: "828.00", estimatedTotal: "1648.00", diagnosedAt: new Date("2026-04-08") },
      { projectId: projects[3].id, customerId: customers[3].id, diagnosedById: adminUser.id, woodType: "fence", totalLinearFeet: "175", averageHeight: "6", totalSqFt: "2100", fenceCondition: "excellent", fenceType: "cedar", numberOfGates: 1, numberOfPosts: 23, currentFinish: "None (new wood)", weatherExposure: "full_sun", moistureLevel: "dry", moldMildew: false, graying: false, cracking: false, repairNeeded: false, recommendedProduct: "USS Custom Clear Seal", recommendedProductType: "water_base", recommendedCoats: 1, productColor: "light_brown", prepRequired: "Light brush-down only — no power wash needed on new wood", careNotes: "Brand new cedar. Single coat seal only. No stain needed yet.", estimatedProductGallons: "21", estimatedLaborHours: "10", estimatedMaterialCost: "735.00", estimatedLaborCost: "450.00", estimatedTotal: "875.00", diagnosedAt: new Date("2026-03-14") },
      { projectId: projects[4].id, customerId: customers[4].id, diagnosedById: adminUser.id, woodType: "fence", totalLinearFeet: "320", averageHeight: "6", totalSqFt: "3840", fenceCondition: "fair", fenceType: "cedar", numberOfGates: 3, numberOfPosts: 42, lastStainedYear: 2017, currentFinish: "Unknown (DIY application)", weatherExposure: "full_sun", moistureLevel: "dry", moldMildew: true, graying: true, cracking: true, repairNeeded: false, repairNotes: "Surface cracks but no structural damage", recommendedProduct: "USS Custom Oil Base", recommendedProductType: "oil_base", recommendedCoats: 2, productColor: "medium_brown", prepRequired: "Full power wash + sodium hypochlorite mildew treatment, 48hr dry time", careNotes: "Mildew on north-facing sections. Power wash required. West side has significant graying and surface cracks.", estimatedProductGallons: "76.8", estimatedLaborHours: "28", estimatedMaterialCost: "3225.60", estimatedLaborCost: "1260.00", estimatedTotal: "2820.00", diagnosedAt: new Date("2026-04-18") },
      { projectId: projects[6].id, customerId: customers[7].id, diagnosedById: adminUser.id, woodType: "fence", totalLinearFeet: "195", averageHeight: "8", totalSqFt: "3120", fenceCondition: "good", fenceType: "cedar", numberOfGates: 2, numberOfPosts: 26, lastStainedYear: 2022, currentFinish: "Armstrong Clark Cedar Naturaltone", weatherExposure: "partial_shade", moistureLevel: "dry", moldMildew: false, graying: false, cracking: false, repairNeeded: false, recommendedProduct: "USS Custom Oil Base", recommendedProductType: "oil_base", recommendedCoats: 2, productColor: "dark_brown", prepRequired: "Light wash and dry — color match critical, do test patch first", careNotes: "8ft fence in good condition. Stain fading. Match previous color exactly — dark brown.", estimatedProductGallons: "41.6", estimatedLaborHours: "22", estimatedMaterialCost: "1580.80", estimatedLaborCost: "990.00", estimatedTotal: "1950.00", diagnosedAt: new Date("2026-02-15") },
      { projectId: projects[5].id, customerId: customers[5].id, diagnosedById: adminUser.id, woodType: "fence", totalLinearFeet: "140", averageHeight: "6", totalSqFt: "1680", fenceCondition: "excellent", fenceType: "cedar", numberOfGates: 1, numberOfPosts: 19, currentFinish: "None (new wood)", weatherExposure: "partial_shade", moistureLevel: "dry", moldMildew: false, graying: false, cracking: false, repairNeeded: false, recommendedProduct: "USS Custom Clear Seal", recommendedProductType: "water_base", recommendedCoats: 1, productColor: "light_brown", prepRequired: "None — brand new wood, ready to seal", careNotes: "Brand new cedar. Clear seal only. Very straightforward.", estimatedProductGallons: "16.8", estimatedLaborHours: "8", estimatedMaterialCost: "588.00", estimatedLaborCost: "360.00", estimatedTotal: "680.00", diagnosedAt: new Date("2026-04-22") },
    ]);

    const softText = "Note: Weather conditions may affect drying time. USS is not responsible for re-staining needs due to extreme weather events within 30 days of service.";
    const hardText = "DISCLAIMER: Customer acknowledges that wood surfaces expand and contract naturally with temperature and humidity changes. USS provides no warranty for color matching on previously stained wood. Customer signature is required before work begins.";

    const invoices = await db.insert(invoicesTable).values([
      { projectId: projects[0].id, customerId: customers[0].id, invoiceNumber: "USS-1001", status: "sent", subtotal: "1485.00", taxRate: "0.0825", taxAmount: "122.51", discountAmount: "0", totalAmount: "1607.51", paidAmount: "0", balanceDue: "1607.51", dueDate: new Date("2026-05-28"), notes: "2-coat cedar stain & seal — Oak Hollow Dr. Due upon completion.", disclaimerText: softText, disclaimerMode: "soft" },
      { projectId: projects[3].id, customerId: customers[3].id, invoiceNumber: "USS-1000", status: "paid", subtotal: "875.00", taxRate: "0.0825", taxAmount: "72.19", discountAmount: "0", totalAmount: "947.19", paidAmount: "947.19", balanceDue: "0", dueDate: new Date("2026-04-01"), notes: "Single coat clear seal — Pecan Street.", disclaimerText: hardText, disclaimerMode: "hard", customerSignature: "Patricia Gutierrez", signedAt: new Date("2026-03-15") },
      { projectId: projects[4].id, customerId: customers[4].id, invoiceNumber: "USS-1002", status: "draft", subtotal: "2580.00", taxRate: "0.0825", taxAmount: "212.85", discountAmount: "0", totalAmount: "2792.85", paidAmount: "0", balanceDue: "2792.85", dueDate: new Date("2026-06-01"), notes: "2-coat full restoration — Whispering Oaks. Includes power wash & mildew treatment.", disclaimerText: softText, disclaimerMode: "soft" },
      { projectId: projects[6].id, customerId: customers[7].id, invoiceNumber: "USS-1003", status: "paid", subtotal: "1800.00", taxRate: "0.0825", taxAmount: "148.50", discountAmount: "0", totalAmount: "1948.50", paidAmount: "1948.50", balanceDue: "0", dueDate: new Date("2026-03-15"), notes: "2-coat 8ft privacy fence — River Oaks Dr.", disclaimerText: softText, disclaimerMode: "soft" },
      { projectId: projects[1].id, customerId: customers[1].id, invoiceNumber: "USS-1004", status: "partial", subtotal: "3850.00", taxRate: "0.0825", taxAmount: "317.63", discountAmount: "200.00", totalAmount: "3967.63", paidAmount: "1500.00", balanceDue: "2467.63", dueDate: new Date("2026-06-12"), notes: "Ridgeline Estate 2-day job. $200 loyalty discount. $1,500 deposit received.", disclaimerText: softText, disclaimerMode: "soft" },
    ]).returning();

    await db.insert(invoiceLineItemsTable).values([
      { invoiceId: invoices[0].id, description: "Fence Stain & Seal — 210 LF cedar board-on-board (both sides)", quantity: "1", unitPrice: "1260.00", lineTotal: "1260.00", category: "labor" },
      { invoiceId: invoices[0].id, description: "TWP 100 Series Cedar Stain (26 gal)", quantity: "26", unitPrice: "42.00", lineTotal: "1092.00", category: "materials" },
      { invoiceId: invoices[0].id, description: "Gate Treatment (2 gates)", quantity: "2", unitPrice: "75.00", lineTotal: "150.00", category: "labor" },
      { invoiceId: invoices[0].id, description: "Early Booking Discount", quantity: "1", unitPrice: "-300.00", lineTotal: "-300.00", category: "discount" },
      { invoiceId: invoices[1].id, description: "Fence Clear Seal — 175 LF cedar (1 coat)", quantity: "1", unitPrice: "700.00", lineTotal: "700.00", category: "labor" },
      { invoiceId: invoices[1].id, description: "Defy Extreme Clear (21 gal)", quantity: "21", unitPrice: "35.00", lineTotal: "735.00", category: "materials" },
      { invoiceId: invoices[2].id, description: "Power Wash & Mildew Treatment — 320 LF", quantity: "1", unitPrice: "580.00", lineTotal: "580.00", category: "labor" },
      { invoiceId: invoices[2].id, description: "Fence Stain & Seal — 320 LF cedar (2 coats)", quantity: "1", unitPrice: "1840.00", lineTotal: "1840.00", category: "labor" },
      { invoiceId: invoices[2].id, description: "TWP 100 Cedar Stain (42 gal)", quantity: "42", unitPrice: "42.00", lineTotal: "1764.00", category: "materials" },
      { invoiceId: invoices[2].id, description: "Gate Treatment (3 gates)", quantity: "3", unitPrice: "75.00", lineTotal: "225.00", category: "labor" },
      { invoiceId: invoices[3].id, description: "Fence Stain & Seal — 195 LF 8ft privacy cedar", quantity: "1", unitPrice: "1560.00", lineTotal: "1560.00", category: "labor" },
      { invoiceId: invoices[3].id, description: "Armstrong Clark Cedar Naturaltone (26 gal)", quantity: "26", unitPrice: "38.00", lineTotal: "988.00", category: "materials" },
      { invoiceId: invoices[3].id, description: "Gate Treatment (2 gates)", quantity: "2", unitPrice: "75.00", lineTotal: "150.00", category: "labor" },
      { invoiceId: invoices[4].id, description: "Fence Stain & Seal — 450 LF cedar estate (2 coats)", quantity: "1", unitPrice: "2700.00", lineTotal: "2700.00", category: "labor" },
      { invoiceId: invoices[4].id, description: "Armstrong Clark Cedar Naturaltone (36 gal)", quantity: "36", unitPrice: "38.00", lineTotal: "1368.00", category: "materials" },
      { invoiceId: invoices[4].id, description: "Gate Treatment (4 gates)", quantity: "4", unitPrice: "75.00", lineTotal: "300.00", category: "labor" },
      { invoiceId: invoices[4].id, description: "Loyalty Repeat Customer Discount", quantity: "1", unitPrice: "-200.00", lineTotal: "-200.00", category: "discount" },
    ]);

    await db.insert(paymentsTable).values([
      { invoiceId: invoices[1].id, customerId: customers[3].id, amount: "947.19", paymentMethod: "check", paymentDate: new Date("2026-03-20"), checkNumber: "CHK-4421", notes: "Check received at job completion.", recordedById: adminUser.id },
      { invoiceId: invoices[3].id, customerId: customers[7].id, amount: "1948.50", paymentMethod: "zelle", paymentDate: new Date("2026-02-24"), transactionId: "ZEL-0224", notes: "Zelle received same day as job completion.", recordedById: adminUser.id },
      { invoiceId: invoices[4].id, customerId: customers[1].id, amount: "1500.00", paymentMethod: "check", paymentDate: new Date("2026-04-20"), checkNumber: "CHK-8801", notes: "Deposit check from Linda Weaver. Balance due on completion.", recordedById: adminUser.id },
    ]);

    const jobs = await db.insert(jobsTable).values([
      { projectId: projects[0].id, customerId: customers[0].id, assignedToId: adminUser.id, jobName: "Prep & First Coat — Oak Hollow", status: "scheduled", jobType: "application", scheduledDate: new Date("2026-04-28"), scheduledTimeStart: "07:30", scheduledTimeEnd: "13:00", estimatedHours: "5.5", crewSize: 2, notes: "Start south fence panel. Light power wash first, let dry 2 hours. Bring TWP 100 Cedar (14 gal) and two 4in brushes." },
      { projectId: projects[0].id, customerId: customers[0].id, assignedToId: adminUser.id, jobName: "Second Coat & Finish — Oak Hollow", status: "scheduled", jobType: "application", scheduledDate: new Date("2026-04-29"), scheduledTimeStart: "07:30", scheduledTimeEnd: "12:00", estimatedHours: "4.5", crewSize: 2, notes: "Second coat. Focus on gates and posts. Take completion photos before leaving." },
      { projectId: projects[4].id, customerId: customers[4].id, assignedToId: adminUser.id, jobName: "Power Wash & Mildew Treat — Whispering Oaks", status: "completed", jobType: "prep", scheduledDate: new Date("2026-04-24"), scheduledTimeStart: "08:00", scheduledTimeEnd: "12:00", estimatedHours: "4.0", actualHours: "3.5", crewSize: 1, completionNotes: "Power wash complete. Sodium hypochlorite applied. 48hr dry started." },
      { projectId: projects[4].id, customerId: customers[4].id, assignedToId: adminUser.id, jobName: "First Coat — Whispering Oaks", status: "scheduled", jobType: "application", scheduledDate: new Date("2026-04-30"), scheduledTimeStart: "07:00", scheduledTimeEnd: "14:00", estimatedHours: "7.0", crewSize: 2, notes: "TWP 100 Cedar first coat. Start west side (most weathered). Tarp plant beds." },
      { projectId: projects[4].id, customerId: customers[4].id, assignedToId: adminUser.id, jobName: "Second Coat & Gates — Whispering Oaks", status: "scheduled", jobType: "application", scheduledDate: new Date("2026-05-02"), scheduledTimeStart: "07:00", scheduledTimeEnd: "13:00", estimatedHours: "6.0", crewSize: 2, notes: "Final coat. Gates and posts last. Complete photos required. Collect balance." },
      { projectId: projects[3].id, customerId: customers[3].id, assignedToId: adminUser.id, jobName: "Seal Application — Pecan Street", status: "completed", jobType: "application", scheduledDate: new Date("2026-03-18"), scheduledTimeStart: "08:00", scheduledTimeEnd: "14:00", estimatedHours: "6.0", actualHours: "5.5", crewSize: 2, completionNotes: "Single coat Defy Clear applied. Brush only per customer. Customer satisfied." },
      { projectId: projects[6].id, customerId: customers[7].id, assignedToId: adminUser.id, jobName: "Day 1 — River Oaks 8ft Fence", status: "completed", jobType: "application", scheduledDate: new Date("2026-02-21"), scheduledTimeStart: "07:00", scheduledTimeEnd: "15:00", estimatedHours: "8.0", actualHours: "8.5", crewSize: 2, completionNotes: "North and east panels complete. Armstrong Clark Naturaltone match excellent." },
      { projectId: projects[6].id, customerId: customers[7].id, assignedToId: adminUser.id, jobName: "Day 2 — River Oaks 8ft Fence", status: "completed", jobType: "application", scheduledDate: new Date("2026-02-22"), scheduledTimeStart: "07:00", scheduledTimeEnd: "14:00", estimatedHours: "7.0", actualHours: "6.5", crewSize: 2, completionNotes: "South and west panels + gates complete. Customer signed off." },
      { projectId: projects[5].id, customerId: customers[5].id, assignedToId: adminUser.id, jobName: "New Cedar Seal — Lakewood Terrace", status: "scheduled", jobType: "application", scheduledDate: new Date("2026-05-08"), scheduledTimeStart: "08:00", scheduledTimeEnd: "12:00", estimatedHours: "4.0", crewSize: 2, notes: "Quick seal job. Defy Extreme Clear single coat. Confirm gate latch." },
      { projectId: projects[1].id, customerId: customers[1].id, assignedToId: adminUser.id, jobName: "Ridgeline Day 1 — Prep & First Coat", status: "scheduled", jobType: "application", scheduledDate: new Date("2026-05-12"), scheduledTimeStart: "06:30", scheduledTimeEnd: "17:00", estimatedHours: "10.0", crewSize: 3, notes: "Full crew for 450 LF. Start on back fence. Bring full product load." },
      { projectId: projects[1].id, customerId: customers[1].id, assignedToId: adminUser.id, jobName: "Ridgeline Day 2 — Second Coat & Finish", status: "scheduled", jobType: "application", scheduledDate: new Date("2026-05-13"), scheduledTimeStart: "07:00", scheduledTimeEnd: "16:00", estimatedHours: "9.0", crewSize: 3, notes: "Final coat. All 4 gates + posts. Completion photos before leaving." },
    ]).returning();

    await db.insert(jobsheetsTable).values([
      { jobId: jobs[5].id, projectId: projects[3].id, workOrderNumber: "WO-1000", crewLead: "Mike Torres", crewMembers: "Mike Torres, Derek Hall", workDate: new Date("2026-03-18"), startTime: "08:00", endTime: "14:00", weatherConditions: "Sunny, light breeze", temperature: 72, humidity: 45, surfaceMoisture: "dry", areasCompleted: "All 175 LF cedar fence both sides + 1 gate", productsApplied: "Defy Extreme Clear (21 gal)", coatsApplied: 1, applicationMethod: "brush", customerPresent: false, fieldNotes: "Great access. Customer provided water hookup. Brush-only per request honored.", inspectionNotes: "All surfaces evenly coated. No drips on landscape.", followUpRequired: true, followUpNotes: "Gate latch needs minor repair — flagged for customer.", status: "completed" },
      { jobId: jobs[6].id, projectId: projects[6].id, workOrderNumber: "WO-1001", crewLead: "Mike Torres", crewMembers: "Mike Torres, Derek Hall", workDate: new Date("2026-02-21"), startTime: "07:00", endTime: "15:00", weatherConditions: "Clear, mild", temperature: 68, humidity: 50, surfaceMoisture: "dry", areasCompleted: "North and East 8ft panels, both sides", productsApplied: "Armstrong Clark Cedar Naturaltone (22 gal)", coatsApplied: 2, applicationMethod: "spray_then_back_brush", customerPresent: true, fieldNotes: "Extension ladders worked well. Color match excellent — confirmed by customer.", inspectionNotes: "Even coverage on all 8ft sections. Tarps protected deck.", followUpRequired: false, status: "completed" },
      { jobId: jobs[7].id, projectId: projects[6].id, workOrderNumber: "WO-1002", crewLead: "Mike Torres", crewMembers: "Mike Torres, Derek Hall", workDate: new Date("2026-02-22"), startTime: "07:00", endTime: "14:00", weatherConditions: "Sunny", temperature: 71, humidity: 42, surfaceMoisture: "dry", areasCompleted: "South and West panels + 2 gates. Final coat & cleanup.", productsApplied: "Armstrong Clark Cedar Naturaltone (19 gal)", coatsApplied: 2, applicationMethod: "spray_then_back_brush", customerPresent: true, customerSignature: "Helen Bradshaw", fieldNotes: "Finished ahead of schedule. Customer inspected and signed off.", inspectionNotes: "All 4 corners photographed. Customer paid via Zelle immediately.", followUpRequired: false, status: "completed" },
      { jobId: jobs[0].id, projectId: projects[0].id, workOrderNumber: "WO-1003", crewLead: "Mike Torres", crewMembers: "Mike Torres, Derek Hall", workDate: new Date("2026-04-28"), startTime: "07:30", endTime: "13:00", weatherConditions: "Forecast: clear", productsApplied: "TWP 100 Series Cedar Stain", coatsApplied: 1, applicationMethod: "brush_and_roller", customerPresent: false, fieldNotes: "Gate access code: 4421. Customer NOT home. Call Chad if any issues. Do NOT let dog out.", status: "draft" },
    ]);

    await db.insert(documentsTable).values([
      { projectId: projects[0].id, customerId: customers[0].id, fileName: "Oak Hollow Pre-Job Photos", documentType: "photo", description: "Before photos taken during diagnosis — April 8, 2026.", fileUrl: "https://storage.ussops.com/docs/proj1/before-photos.zip", fileSize: 12400000, mimeType: "application/zip", uploadedById: adminUser.id },
      { projectId: projects[0].id, customerId: customers[0].id, fileName: "USS-1001 Invoice", documentType: "invoice", description: "Sent invoice for Oak Hollow Stain & Seal project.", fileUrl: "https://storage.ussops.com/docs/proj1/USS-1001.pdf", fileSize: 145000, mimeType: "application/pdf", uploadedById: adminUser.id },
      { projectId: projects[3].id, customerId: customers[3].id, fileName: "Pecan Street Completion Photos", documentType: "photo", description: "After photos — March 18, 2026. Before/after included.", fileUrl: "https://storage.ussops.com/docs/proj4/completion-photos.zip", fileSize: 8900000, mimeType: "application/zip", uploadedById: adminUser.id },
      { projectId: projects[3].id, customerId: customers[3].id, fileName: "Signed Hard Disclaimer — Gutierrez", documentType: "contract", description: "Hard disclaimer signed by Patricia Gutierrez prior to service.", fileUrl: "https://storage.ussops.com/docs/proj4/signed-disclaimer.pdf", fileSize: 98000, mimeType: "application/pdf", uploadedById: adminUser.id },
      { projectId: projects[6].id, customerId: customers[7].id, fileName: "River Oaks Before & After Photos", documentType: "photo", description: "Complete before/after set — 8ft privacy fence transformation.", fileUrl: "https://storage.ussops.com/docs/proj7/before-after.zip", fileSize: 18700000, mimeType: "application/zip", uploadedById: adminUser.id },
      { projectId: projects[6].id, customerId: customers[7].id, fileName: "USS-1003 Invoice — Bradshaw", documentType: "invoice", description: "Paid invoice for River Oaks 8ft fence restoration.", fileUrl: "https://storage.ussops.com/docs/proj7/USS-1003.pdf", fileSize: 132000, mimeType: "application/pdf", uploadedById: adminUser.id },
      { projectId: projects[4].id, customerId: customers[4].id, fileName: "Whispering Oaks Diagnosis Photos", documentType: "photo", description: "Diagnosis photos showing mildew and weathering on north/west faces.", fileUrl: "https://storage.ussops.com/docs/proj5/diagnosis.zip", fileSize: 7200000, mimeType: "application/zip", uploadedById: adminUser.id },
      { projectId: projects[1].id, customerId: customers[1].id, fileName: "Ridgeline Estate Project Proposal", documentType: "contract", description: "Project proposal and scope of work for 450 LF restoration.", fileUrl: "https://storage.ussops.com/docs/proj2/proposal.pdf", fileSize: 220000, mimeType: "application/pdf", uploadedById: adminUser.id },
    ]);

    await db.insert(activityTable).values([
      { projectId: projects[0].id, customerId: customers[0].id, userId: adminUser.id, entityType: "project", entityId: projects[0].id, action: "created", description: "Project created: Oak Hollow Fence Stain & Seal" },
      { projectId: projects[0].id, customerId: customers[0].id, userId: adminUser.id, entityType: "diagnosis", entityId: 1, action: "created", description: "Fence diagnosis completed for Oak Hollow — condition: good" },
      { projectId: projects[0].id, customerId: customers[0].id, userId: adminUser.id, entityType: "invoice", entityId: invoices[0].id, action: "sent", description: `Invoice ${invoices[0].invoiceNumber} sent to James Anderson ($1,607.51)` },
      { projectId: projects[3].id, customerId: customers[3].id, userId: adminUser.id, entityType: "payment", entityId: 1, action: "received", description: "Payment of $947.19 received for USS-1000 (Patricia Gutierrez)" },
      { customerId: customers[2].id, userId: adminUser.id, entityType: "customer", entityId: customers[2].id, action: "created", description: "New prospect added: Robert Chen (Nextdoor)" },
      { projectId: projects[4].id, customerId: customers[4].id, userId: adminUser.id, entityType: "project", entityId: projects[4].id, action: "created", description: "Project created: Whispering Oaks Restoration" },
      { projectId: projects[4].id, customerId: customers[4].id, userId: adminUser.id, entityType: "diagnosis", entityId: 3, action: "created", description: "Diagnosis completed — mildew + graying noted (Whispering Oaks)" },
      { projectId: projects[4].id, customerId: customers[4].id, userId: adminUser.id, entityType: "job", entityId: jobs[2].id, action: "completed", description: "Power wash job completed — Whispering Oaks (3.5 hrs)" },
      { projectId: projects[6].id, customerId: customers[7].id, userId: adminUser.id, entityType: "invoice", entityId: invoices[3].id, action: "paid", description: "Invoice USS-1003 paid in full — River Oaks ($1,948.50 via Zelle)" },
      { projectId: projects[1].id, customerId: customers[1].id, userId: adminUser.id, entityType: "payment", entityId: 3, action: "received", description: "Deposit of $1,500.00 received for Ridgeline Estate (USS-1004)" },
      { customerId: customers[4].id, userId: adminUser.id, entityType: "customer", entityId: customers[4].id, action: "created", description: "New active customer: Marcus Thompson (Google)" },
      { customerId: customers[5].id, userId: adminUser.id, entityType: "customer", entityId: customers[5].id, action: "created", description: "New active customer: Diane Holloway (referral — James Anderson)" },
      { projectId: projects[6].id, customerId: customers[7].id, userId: adminUser.id, entityType: "job", entityId: jobs[7].id, action: "completed", description: "River Oaks Day 2 complete — Helen Bradshaw signed off" },
      { projectId: projects[3].id, customerId: customers[3].id, userId: adminUser.id, entityType: "job", entityId: jobs[5].id, action: "completed", description: "Pecan Street seal complete — Gutierrez very satisfied" },
    ]);
    console.log("  All data seeded");
  }

  console.log("Seed complete!");
}

seed().catch(console.error).finally(() => process.exit(0));
