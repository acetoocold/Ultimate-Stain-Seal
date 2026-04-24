import { db, usersTable, customersTable, propertiesTable, projectsTable, diagnosesTable, invoicesTable, invoiceLineItemsTable, paymentsTable, jobsTable, materialsTable, inventoryItemsTable, activityTable, settingsTable, pricingRulesTable } from "@workspace/db";
import { createHash } from "crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "uss-ops-salt").digest("hex");
}

async function seed() {
  console.log("Seeding database...");

  // Settings
  const existingSettings = await db.select().from(settingsTable).limit(1);
  let settings;
  if (existingSettings.length === 0) {
    [settings] = await db.insert(settingsTable).values({
      companyName: "Ultimate Stain & Seal",
      companyPhone: "(555) 867-5309",
      companyEmail: "ops@ultimatestainnseal.com",
      companyAddress: "1247 Woodcraft Lane, Austin, TX 78701",
      defaultTaxRate: "0.0825",
      defaultLaborRate: "45.00",
      defaultCoverageRate: "100",
      softDisclaimerText: "Note: Weather conditions may affect drying time. USS is not responsible for re-staining needs due to extreme weather events within 30 days of service.",
      hardDisclaimerText: "DISCLAIMER: Customer acknowledges that wood surfaces expand and contract naturally with temperature and humidity changes. USS provides no warranty for color matching on previously stained wood. This invoice constitutes an agreement between USS and the customer. Customer signature is required before work begins.",
      invoicePrefix: "USS",
      glideEnabled: false,
    }).returning();
    console.log("  Settings created");
  }

  // Admin user
  const existingAdmin = await db.select().from(usersTable).limit(1);
  let adminUser;
  if (existingAdmin.length === 0) {
    [adminUser] = await db.insert(usersTable).values({
      email: "admin@ussops.com",
      passwordHash: hashPassword("admin123"),
      firstName: "Chad",
      lastName: "Morrison",
      role: "admin",
      phone: "(555) 100-0001",
      isActive: true,
    }).returning();

    await db.insert(usersTable).values([
      {
        email: "sarah@ussops.com",
        passwordHash: hashPassword("sarah123"),
        firstName: "Sarah",
        lastName: "Jenkins",
        role: "office",
        phone: "(555) 100-0002",
        isActive: true,
      },
      {
        email: "mike@ussops.com",
        passwordHash: hashPassword("mike123"),
        firstName: "Mike",
        lastName: "Torres",
        role: "crew",
        phone: "(555) 100-0003",
        isActive: true,
      },
    ]);
    console.log("  Users created");
  } else {
    adminUser = existingAdmin[0];
  }

  // Pricing rules
  const existingRules = await db.select().from(pricingRulesTable).limit(1);
  if (existingRules.length === 0) {
    await db.insert(pricingRulesTable).values([
      {
        name: "Cedar Fence - Stain & Seal",
        serviceType: "stain_seal",
        fenceType: "cedar",
        pricePerSqFt: "0.65",
        minimumCharge: "350.00",
        laborRatePerHour: "45.00",
        notes: "Standard cedar panel stain & seal. Both sides included.",
        isActive: true,
      },
      {
        name: "Pressure Treated - Stain & Seal",
        serviceType: "stain_seal",
        fenceType: "pressure_treated",
        pricePerSqFt: "0.55",
        minimumCharge: "300.00",
        laborRatePerHour: "45.00",
        notes: "PT lumber. Must be dried minimum 6 months before staining.",
        isActive: true,
      },
      {
        name: "Cedar Fence - Seal Only",
        serviceType: "seal",
        fenceType: "cedar",
        pricePerSqFt: "0.40",
        minimumCharge: "250.00",
        laborRatePerHour: "45.00",
        notes: "Clear seal only, no colorant.",
        isActive: true,
      },
      {
        name: "Gate - Standard",
        serviceType: "stain_seal",
        fenceType: "gate",
        pricePerSqFt: null,
        minimumCharge: "75.00",
        laborRatePerHour: "45.00",
        notes: "Per gate, standard size (4x7 ft). Includes both sides.",
        isActive: true,
      },
    ]);
    console.log("  Pricing rules created");
  }

  // Materials
  const existingMaterials = await db.select().from(materialsTable).limit(1);
  let material1: typeof materialsTable.$inferSelect;
  if (existingMaterials.length === 0) {
    const mats = await db.insert(materialsTable).values([
      {
        name: "TWP 100 Series Cedar Stain",
        sku: "TWP-101",
        category: "stain",
        brand: "TWP",
        description: "Total Wood Preservative cedar tone, 1 gallon",
        unitType: "gallon",
        unitCost: "42.00",
        retailPrice: "54.99",
        homeDepotPrice: "49.99",
        coveragePerUnit: "100",
        coverageUnit: "sq_ft",
        isActive: true,
      },
      {
        name: "TWP 100 Series Rustic Oak",
        sku: "TWP-115",
        category: "stain",
        brand: "TWP",
        description: "Total Wood Preservative rustic oak tone, 1 gallon",
        unitType: "gallon",
        unitCost: "42.00",
        retailPrice: "54.99",
        homeDepotPrice: "49.99",
        coveragePerUnit: "100",
        coverageUnit: "sq_ft",
        isActive: true,
      },
      {
        name: "Armstrong Clark Cedar Naturaltone",
        sku: "AC-NC",
        category: "stain",
        brand: "Armstrong Clark",
        description: "Semi-transparent cedar naturaltone, 1 gallon",
        unitType: "gallon",
        unitCost: "38.00",
        retailPrice: "52.99",
        homeDepotSku: "1234567",
        coveragePerUnit: "150",
        coverageUnit: "sq_ft",
        isActive: true,
      },
      {
        name: "Defy Extreme Wood Stain",
        sku: "DEFY-EXT",
        category: "stain",
        brand: "Defy",
        description: "Water-based semi-transparent, 1 gallon",
        unitType: "gallon",
        unitCost: "35.00",
        retailPrice: "49.99",
        coveragePerUnit: "75",
        coverageUnit: "sq_ft",
        isActive: true,
      },
      {
        name: "Purdy Brush 4in",
        sku: "PURDY-4",
        category: "equipment",
        brand: "Purdy",
        description: "4 inch natural bristle brush for stain application",
        unitType: "each",
        unitCost: "14.00",
        retailPrice: "18.99",
        isActive: true,
      },
      {
        name: "Chapin Pump Sprayer 2gal",
        sku: "CHAPIN-2G",
        category: "equipment",
        brand: "Chapin",
        description: "2 gallon pump sprayer for stain application",
        unitType: "each",
        unitCost: "28.00",
        retailPrice: "34.99",
        isActive: true,
      },
    ]).returning();
    material1 = mats[0];

    // Inventory
    await db.insert(inventoryItemsTable).values([
      { materialId: mats[0].id, quantityOnHand: "24", reorderPoint: "8", reorderQuantity: "12" },
      { materialId: mats[1].id, quantityOnHand: "12", reorderPoint: "6", reorderQuantity: "12" },
      { materialId: mats[2].id, quantityOnHand: "6", reorderPoint: "4", reorderQuantity: "8" },
      { materialId: mats[3].id, quantityOnHand: "3", reorderPoint: "4", reorderQuantity: "8" },
      { materialId: mats[4].id, quantityOnHand: "15", reorderPoint: "5", reorderQuantity: "10" },
      { materialId: mats[5].id, quantityOnHand: "4", reorderPoint: "2", reorderQuantity: "4" },
    ]);
    console.log("  Materials & inventory created");
  } else {
    material1 = existingMaterials[0];
  }

  // Customers
  const existingCustomers = await db.select().from(customersTable).limit(1);
  if (existingCustomers.length === 0) {
    const customers = await db.insert(customersTable).values([
      {
        firstName: "James",
        lastName: "Anderson",
        email: "james.anderson@gmail.com",
        phone: "(512) 555-2341",
        altPhone: "(512) 555-9876",
        status: "active",
        leadSource: "referral",
        notes: "Excellent customer. Referred by the Smiths next door. Prefers cedar stain.",
        address: "4521 Oak Hollow Dr",
        city: "Austin",
        state: "TX",
        zip: "78746",
      },
      {
        firstName: "Linda",
        lastName: "Weaver",
        email: "lweaver@yahoo.com",
        phone: "(512) 555-7732",
        status: "active",
        leadSource: "google",
        notes: "Has a large property with 450 LF of cedar fence. Very particular about color.",
        address: "892 Ridgeline Blvd",
        city: "Austin",
        state: "TX",
        zip: "78733",
      },
      {
        firstName: "Robert",
        lastName: "Chen",
        email: "robert.chen@outlook.com",
        phone: "(512) 555-4488",
        status: "prospect",
        leadSource: "nextdoor",
        notes: "Interested in full fence replacement + stain. Getting multiple quotes.",
        address: "1632 Crestwood Lane",
        city: "Round Rock",
        state: "TX",
        zip: "78681",
      },
      {
        firstName: "Patricia",
        lastName: "Gutierrez",
        email: "pgutierrez@gmail.com",
        phone: "(512) 555-3319",
        status: "completed",
        leadSource: "repeat",
        notes: "Returning customer, 2nd project. Happy with previous work. Ready to schedule.",
        address: "744 Pecan Street",
        city: "Cedar Park",
        state: "TX",
        zip: "78613",
      },
    ]).returning();

    // Properties
    const props = await db.insert(propertiesTable).values([
      {
        customerId: customers[0].id,
        nickname: "Main Residence",
        address: "4521 Oak Hollow Dr",
        city: "Austin",
        state: "TX",
        zip: "78746",
        propertyType: "residential",
        fenceType: "cedar",
        fenceAge: 8,
        fenceCondition: "good",
        totalLinearFeet: "210",
        averageHeight: "6",
        numberOfGates: 2,
        lastTreatedDate: new Date("2018-04-15"),
        notes: "Board-on-board cedar, mostly north-facing. Good shade coverage.",
      },
      {
        customerId: customers[1].id,
        nickname: "Main Property",
        address: "892 Ridgeline Blvd",
        city: "Austin",
        state: "TX",
        zip: "78733",
        propertyType: "residential",
        fenceType: "cedar",
        fenceAge: 12,
        fenceCondition: "fair",
        totalLinearFeet: "450",
        averageHeight: "6",
        numberOfGates: 4,
        lastTreatedDate: new Date("2016-06-01"),
        notes: "Large estate fence. Mix of board-on-board and picket. Some sections need repair.",
      },
      {
        customerId: customers[3].id,
        nickname: "Home",
        address: "744 Pecan Street",
        city: "Cedar Park",
        state: "TX",
        zip: "78613",
        propertyType: "residential",
        fenceType: "cedar",
        fenceAge: 5,
        fenceCondition: "excellent",
        totalLinearFeet: "175",
        averageHeight: "6",
        numberOfGates: 1,
        notes: "New cedar fence, first treatment.",
      },
    ]).returning();

    // Projects
    const proj1Date = new Date("2026-04-10");
    const proj2Date = new Date("2026-04-20");
    const proj3Date = new Date("2026-05-05");
    const proj4Date = new Date("2026-03-15");

    const projects = await db.insert(projectsTable).values([
      {
        customerId: customers[0].id,
        propertyId: props[0].id,
        projectName: "Oak Hollow Fence Stain & Seal",
        projectType: "stain_seal",
        status: "in_progress",
        priority: "high",
        scheduledDate: proj1Date,
        estimatedCost: "1650.00",
        totalSqFt: "2520",
        linearFeet: "210",
        fenceType: "cedar",
        stainProduct: "TWP 100 Cedar",
        coatsApplied: 2,
        notes: "Two coats. Customer wants to match original cedar color. Check gate hinges.",
        assignedToId: adminUser!.id,
      },
      {
        customerId: customers[1].id,
        propertyId: props[1].id,
        projectName: "Ridgeline Estate Full Restoration",
        projectType: "stain_seal",
        status: "pending",
        priority: "high",
        scheduledDate: proj2Date,
        estimatedCost: "4200.00",
        totalSqFt: "5400",
        linearFeet: "450",
        fenceType: "cedar",
        stainProduct: "Armstrong Clark Rustic",
        coatsApplied: 2,
        notes: "Large job. Will need 2-day scheduling. Confirm product availability.",
        assignedToId: adminUser!.id,
      },
      {
        customerId: customers[2].id,
        projectName: "Crestwood Fence Quote",
        projectType: "stain_seal",
        status: "pending",
        priority: "medium",
        scheduledDate: proj3Date,
        estimatedCost: "1100.00",
        notes: "Customer still getting quotes. Follow up by 4/30.",
      },
      {
        customerId: customers[3].id,
        propertyId: props[2].id,
        projectName: "Pecan Street New Fence Seal",
        projectType: "seal",
        status: "completed",
        priority: "medium",
        scheduledDate: proj4Date,
        completedDate: new Date("2026-03-18"),
        estimatedCost: "875.00",
        finalCost: "875.00",
        totalSqFt: "2100",
        linearFeet: "175",
        fenceType: "cedar",
        stainProduct: "Defy Extreme Clear",
        coatsApplied: 1,
        notes: "Single coat seal on new cedar. Customer very happy.",
        assignedToId: adminUser!.id,
      },
    ]).returning();

    // Diagnoses
    await db.insert(diagnosesTable).values([
      {
        projectId: projects[0].id,
        customerId: customers[0].id,
        propertyId: props[0].id,
        diagnosedById: adminUser!.id,
        totalLinearFeet: "210",
        averageHeight: "6",
        totalSqFt: "2520",
        fenceCondition: "good",
        fenceAge: 8,
        fenceType: "cedar",
        numberOfGates: 2,
        numberOfPosts: 28,
        previouslyStained: true,
        previousProduct: "Cabot Australian Timber Oil",
        lastTreatedYear: 2018,
        surfaceMoisture: "dry",
        mildewPresent: false,
        grayingPresent: true,
        crackingPresent: false,
        recommendedTreatment: "stain_seal",
        recommendedCoats: 2,
        recommendedProduct: "TWP 100 Cedar",
        estimatedProductGallons: "50.40",
        estimatedLaborHours: "18.4",
        estimatedMaterialCost: "2520.00",
        estimatedLaborCost: "828.00",
        estimatedTotal: "1648.00",
        diagnosedAt: new Date("2026-04-08"),
        notes: "Cedar is in good shape but needs color refresh. Both sides need treatment.",
        photoUrls: [],
        disclaimerMode: "soft",
      },
      {
        projectId: projects[3].id,
        customerId: customers[3].id,
        propertyId: props[2].id,
        diagnosedById: adminUser!.id,
        totalLinearFeet: "175",
        averageHeight: "6",
        totalSqFt: "2100",
        fenceCondition: "excellent",
        fenceAge: 5,
        fenceType: "cedar",
        numberOfGates: 1,
        numberOfPosts: 23,
        previouslyStained: false,
        surfaceMoisture: "dry",
        mildewPresent: false,
        grayingPresent: false,
        crackingPresent: false,
        recommendedTreatment: "seal",
        recommendedCoats: 1,
        recommendedProduct: "Defy Extreme Clear",
        estimatedProductGallons: "21",
        estimatedLaborHours: "10",
        estimatedMaterialCost: "735.00",
        estimatedLaborCost: "450.00",
        estimatedTotal: "875.00",
        diagnosedAt: new Date("2026-03-14"),
        notes: "Brand new cedar. Single coat seal to protect. No stain needed yet.",
        photoUrls: [],
        disclaimerMode: "hard",
      },
    ]);

    // Invoices + line items
    const inv1 = await db.insert(invoicesTable).values([
      {
        projectId: projects[0].id,
        customerId: customers[0].id,
        invoiceNumber: "USS-1001",
        status: "sent",
        subtotal: "1485.00",
        taxRate: "0.0825",
        taxAmount: "122.51",
        discountAmount: "0",
        totalAmount: "1607.51",
        paidAmount: "0",
        balanceDue: "1607.51",
        dueDate: new Date("2026-05-10"),
        notes: "2-coat cedar stain & seal — Oak Hollow Dr",
        softDisclaimerText: "Note: Weather conditions may affect drying time. USS is not responsible for re-staining needs due to extreme weather events within 30 days of service.",
        disclaimerMode: "soft",
      },
      {
        projectId: projects[3].id,
        customerId: customers[3].id,
        invoiceNumber: "USS-1000",
        status: "paid",
        subtotal: "875.00",
        taxRate: "0.0825",
        taxAmount: "72.19",
        discountAmount: "0",
        totalAmount: "947.19",
        paidAmount: "947.19",
        balanceDue: "0",
        dueDate: new Date("2026-04-15"),
        notes: "Single coat clear seal — Pecan Street",
        disclaimerMode: "hard",
      },
    ]).returning();

    await db.insert(invoiceLineItemsTable).values([
      { invoiceId: inv1[0].id, description: "Fence Stain & Seal — 210 LF cedar board-on-board", quantity: "1", unitPrice: "1260.00", lineTotal: "1260.00", category: "labor" },
      { invoiceId: inv1[0].id, description: "TWP 100 Series Cedar Stain (26 gal)", quantity: "26", unitPrice: "42.00", lineTotal: "1092.00", category: "materials" },
      { invoiceId: inv1[0].id, description: "Gate Treatment (2 gates)", quantity: "2", unitPrice: "75.00", lineTotal: "150.00", category: "labor" },
      { invoiceId: inv1[1].id, description: "Fence Clear Seal — 175 LF cedar picket", quantity: "1", unitPrice: "700.00", lineTotal: "700.00", category: "labor" },
      { invoiceId: inv1[1].id, description: "Defy Extreme Clear (21 gal)", quantity: "21", unitPrice: "35.00", lineTotal: "735.00", category: "materials" },
    ]);

    // Payment for completed project
    await db.insert(paymentsTable).values({
      invoiceId: inv1[1].id,
      customerId: customers[3].id,
      amount: "947.19",
      paymentMethod: "check",
      paymentDate: new Date("2026-03-20"),
      referenceNumber: "CHK-4421",
      notes: "Check received at completion of job.",
    });

    // Jobs
    await db.insert(jobsTable).values([
      {
        projectId: projects[0].id,
        customerId: customers[0].id,
        assignedToId: adminUser!.id,
        jobName: "Prep & First Coat — Oak Hollow",
        status: "scheduled",
        jobType: "application",
        scheduledDate: new Date("2026-04-28"),
        scheduledTimeStart: "07:30",
        scheduledTimeEnd: "13:00",
        estimatedHours: "5.5",
        crewSize: 2,
        notes: "Start on south fence panel. Apply light power wash first, let dry 2 hours.",
      },
      {
        projectId: projects[0].id,
        customerId: customers[0].id,
        assignedToId: adminUser!.id,
        jobName: "Second Coat & Finish — Oak Hollow",
        status: "scheduled",
        jobType: "application",
        scheduledDate: new Date("2026-04-29"),
        scheduledTimeStart: "07:30",
        scheduledTimeEnd: "12:00",
        estimatedHours: "4.5",
        crewSize: 2,
        notes: "Second coat. Focus on gates and posts. Take completion photos.",
      },
    ]);

    // Activity
    await db.insert(activityTable).values([
      { projectId: projects[0].id, customerId: customers[0].id, userId: adminUser!.id, entityType: "project", entityId: projects[0].id, action: "created", description: "Project created: Oak Hollow Fence Stain & Seal" },
      { projectId: projects[0].id, customerId: customers[0].id, userId: adminUser!.id, entityType: "diagnosis", entityId: 1, action: "created", description: "Fence diagnosis completed for Oak Hollow" },
      { projectId: projects[0].id, customerId: customers[0].id, userId: adminUser!.id, entityType: "invoice", entityId: inv1[0].id, action: "sent", description: `Invoice ${inv1[0].invoiceNumber} sent to customer` },
      { projectId: projects[3].id, customerId: customers[3].id, userId: adminUser!.id, entityType: "payment", entityId: 1, action: "received", description: "Payment of $947.19 received for USS-1000" },
      { customerId: customers[2].id, userId: adminUser!.id, entityType: "customer", entityId: customers[2].id, action: "created", description: "New prospect added: Robert Chen" },
    ]);

    console.log("  Customers, properties, projects, diagnoses, invoices, jobs, and activity seeded");
  }

  console.log("Seed complete!");
}

seed().catch(console.error).finally(() => process.exit(0));
