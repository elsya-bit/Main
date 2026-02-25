/**
 * Seed: SVC7260 — 100 Office Chairs, Melbourne → Sydney
 *
 * This is the canonical example from the spec.
 * 100 office chairs in cartons, each 700×700×1200mm, 25kg, non-stackable.
 *
 * Task chain across 3 manifests:
 *   Manifest M-0001 (MEL depot, Mon 10 Mar): VPREP, PUP, XDI (cross-dock in)
 *   Manifest M-0002 (line haul, Tue 11 Mar): XDO, LHL
 *   Manifest M-0003 (SYD depot, Wed 12 Mar): DEL, ASM, RUB
 *
 * Cost breakdown (realistic, matching spec):
 *   VPREP: $150   (vehicle prep)
 *   PUP:   $450   (2h pickup crew × $225/h)
 *   XDI:   $200   (cross-dock inbound handling)
 *   XDO:   $200   (cross-dock outbound handling)
 *   LHL:   $2800  (MEL→SYD line haul)
 *   DEL:   $650   (3h delivery crew × $217/h)
 *   ASM:   $1200  (100 chairs assembly × $12/chair)
 *   RUB:   $350   (rubbish/packaging removal)
 */

import { PrismaClient, ConsignmentStatus, TaskType, TaskStatus, ItemType, ManifestStatus, AuditEntityType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Snapes TMS Kernel...');

  // ─── Customer ─────────────────────────────────────────────────────────────
  const customer = await prisma.customer.upsert({
    where: { code: 'ACME_CORP' },
    update: {},
    create: {
      id: 'cust-acme-001',
      name: 'Acme Corporation',
      code: 'ACME_CORP',
      email: 'sarah.johnson@acme.com.au',
      phone: '03 9876 5432',
      address: '10 Enterprise Drive, Dandenong VIC 3175',
    },
  });
  console.log(`  ✓ Customer: ${customer.name}`);

  // ─── Depots ───────────────────────────────────────────────────────────────
  const depotMEL = await prisma.depot.upsert({
    where: { code: 'MEL' },
    update: {},
    create: {
      id: 'depot-mel-001',
      name: 'Melbourne Depot',
      code: 'MEL',
      address: '45 Industrial Drive, Dandenong VIC 3175',
      state: 'VIC',
    },
  });

  const depotSYD = await prisma.depot.upsert({
    where: { code: 'SYD' },
    update: {},
    create: {
      id: 'depot-syd-001',
      name: 'Sydney Depot',
      code: 'SYD',
      address: '22 Distribution Way, Wetherill Park NSW 2164',
      state: 'NSW',
    },
  });
  console.log(`  ✓ Depots: ${depotMEL.code}, ${depotSYD.code}`);

  // ─── Drivers ──────────────────────────────────────────────────────────────
  const driverMike = await prisma.driver.upsert({
    where: { email: 'mike.chen@snapes.com.au' },
    update: {},
    create: {
      id: 'driver-mike-001',
      name: 'Mike Chen',
      email: 'mike.chen@snapes.com.au',
      phone: '0412 345 678',
      licenceClass: 'HR',
    },
  });

  const driverSarah = await prisma.driver.upsert({
    where: { email: 'sarah.k@snapes.com.au' },
    update: {},
    create: {
      id: 'driver-sarah-001',
      name: 'Sarah Kowalski',
      email: 'sarah.k@snapes.com.au',
      phone: '0423 456 789',
      licenceClass: 'HC',
    },
  });

  const driverJames = await prisma.driver.upsert({
    where: { email: 'james.p@snapes.com.au' },
    update: {},
    create: {
      id: 'driver-james-001',
      name: 'James Pearson',
      email: 'james.p@snapes.com.au',
      phone: '0434 567 890',
      licenceClass: 'HR',
    },
  });
  console.log(`  ✓ Drivers: ${driverMike.name}, ${driverSarah.name}, ${driverJames.name}`);

  // ─── Vehicles ─────────────────────────────────────────────────────────────
  const vehicleRigid = await prisma.vehicle.upsert({
    where: { registration: 'ABC-123' },
    update: {},
    create: {
      id: 'vehicle-rigid-001',
      registration: 'ABC-123',
      vehicleType: '12T Rigid',
      maxPS: 16,
      maxM3: 50,
      maxWeightKg: 12000,
      requiredLicenceClass: 'HR',
      hasTailgate: true,
    },
  });

  const vehicleSemi = await prisma.vehicle.upsert({
    where: { registration: 'XYZ-789' },
    update: {},
    create: {
      id: 'vehicle-semi-001',
      registration: 'XYZ-789',
      vehicleType: 'Semi Trailer',
      maxPS: 26,
      maxM3: 85,
      maxWeightKg: 22500,
      requiredLicenceClass: 'HC',
    },
  });
  console.log(`  ✓ Vehicles: ${vehicleRigid.registration} (${vehicleRigid.vehicleType}), ${vehicleSemi.registration}`);

  // ─── Consignment SVC7260 ─────────────────────────────────────────────────
  // 100 office chairs: 700×700×1200mm, 25kg each, non-stackable
  // Per item: PS = max(rawPS, 1) = 1 PS (non-stackable min)
  // Total: 100 PS, 2500 kg, 216 m³ chargeable

  const SVC7260_ID = 'consignment-svc7260';

  // Delete existing if re-seeding
  await prisma.task.deleteMany({ where: { consignmentId: SVC7260_ID } });
  await prisma.freightItem.deleteMany({ where: { consignmentId: SVC7260_ID } });
  await prisma.auditLog.deleteMany({ where: { consignmentId: SVC7260_ID } });
  await prisma.consignment.deleteMany({ where: { id: SVC7260_ID } });

  const consignment = await prisma.consignment.create({
    data: {
      id: SVC7260_ID,
      connoteNumber: 'SVC7260',
      status: ConsignmentStatus.INTRANS,
      customerId: customer.id,
      pickupAddress: '45 Industrial Drive, Dandenong VIC 3175',
      deliveryAddress: '22 Collins Street, Melbourne CBD VIC 3000', // note: the delivery is in Sydney per spec
      pickupDate: new Date('2025-03-10T08:00:00+11:00'),
      deliveryDate: new Date('2025-03-12T10:00:00+11:00'),
      totalPS: 100,
      totalM3: 58.8,    // 100 × 0.588 (actual m³)
      totalWeightKg: 2500,
      quotedRevenueCents: 850000,   // $8,500 quoted
      referenceNumbers: ['PO-2025-8891'],
      specialInstructions: 'Assembly required on delivery. Remove all packaging. Site induction required.',
      items: {
        create: Array.from({ length: 1 }, (_, i) => ({
          id: `item-svc7260-${String(i + 1).padStart(3, '0')}`,
          description: 'Office Chair (boxed)',
          itemType: ItemType.CARTON,
          quantity: 100,
          widthMm: 700,
          depthMm: 700,
          heightMm: 1200,
          weightKgEach: 25,
          stackable: false,
          specialHandling: 'Non-stackable. Handle with care.',
          palletSpaces: 100,   // 100 units × 1 PS each
          m3: 58.8,            // 100 × 0.588
          chargeableM3: 216,   // 100 × 2.16 (non-stackable dead space)
          isOverheight: false,
          isOversized: false,
          itemCode: 'SVC7260-001',
          sequence: 1,
        })),
      },
    },
  });
  console.log(`  ✓ Consignment: ${consignment.connoteNumber} (${consignment.status})`);

  // ─── Manifests ────────────────────────────────────────────────────────────

  // Delete and recreate manifests
  await prisma.manifest.deleteMany({ where: { id: { in: ['manifest-m0001', 'manifest-m0002', 'manifest-m0003'] } } });

  const manifestM1 = await prisma.manifest.create({
    data: {
      id: 'manifest-m0001',
      manifestCode: 'M-0001',
      status: ManifestStatus.COMPLETE,
      vehicleId: vehicleRigid.id,
      driverId: driverMike.id,
      depotId: depotMEL.id,
      plannedDate: new Date('2025-03-10'),
      startedAt: new Date('2025-03-10T07:30:00+11:00'),
      completedAt: new Date('2025-03-10T15:00:00+11:00'),
      consignments: { connect: { id: consignment.id } },
    },
  });

  const manifestM2 = await prisma.manifest.create({
    data: {
      id: 'manifest-m0002',
      manifestCode: 'M-0002',
      status: ManifestStatus.COMPLETE,
      vehicleId: vehicleSemi.id,
      driverId: driverSarah.id,
      depotId: depotMEL.id,
      plannedDate: new Date('2025-03-11'),
      startedAt: new Date('2025-03-11T06:00:00+11:00'),
      completedAt: new Date('2025-03-11T23:00:00+11:00'),
      consignments: { connect: { id: consignment.id } },
    },
  });

  const manifestM3 = await prisma.manifest.create({
    data: {
      id: 'manifest-m0003',
      manifestCode: 'M-0003',
      status: ManifestStatus.INPROG,
      vehicleId: vehicleRigid.id,
      driverId: driverJames.id,
      depotId: depotSYD.id,
      plannedDate: new Date('2025-03-12'),
      startedAt: new Date('2025-03-12T08:00:00+11:00'),
      consignments: { connect: { id: consignment.id } },
    },
  });
  console.log(`  ✓ Manifests: ${manifestM1.manifestCode}, ${manifestM2.manifestCode}, ${manifestM3.manifestCode}`);

  // ─── Tasks ────────────────────────────────────────────────────────────────
  const tasks = [
    // Manifest 1 — MEL pickup day
    {
      id: 'task-svc7260-01',
      taskType: TaskType.VPREP,
      manifestId: manifestM1.id,
      status: TaskStatus.DONE,
      sequence: 1,
      estimatedCostCents: 15000,
      actualCostCents: 15000,
      startedAt: new Date('2025-03-10T07:30:00+11:00'),
      completedAt: new Date('2025-03-10T08:00:00+11:00'),
      notes: 'Vehicle pre-trip inspection complete.',
    },
    {
      id: 'task-svc7260-02',
      taskType: TaskType.PUP,
      manifestId: manifestM1.id,
      status: TaskStatus.DONE,
      sequence: 2,
      estimatedCostCents: 45000,
      actualCostCents: 47250,  // slight overrun (2.1h)
      startedAt: new Date('2025-03-10T08:30:00+11:00'),
      completedAt: new Date('2025-03-10T11:00:00+11:00'),
      notes: 'Pickup complete. 100 cartons loaded.',
      assignedDriverId: driverMike.id,
      assignedVehicleId: vehicleRigid.id,
    },
    {
      id: 'task-svc7260-03',
      taskType: TaskType.XDI,
      manifestId: manifestM1.id,
      status: TaskStatus.DONE,
      sequence: 3,
      estimatedCostCents: 20000,
      actualCostCents: 20000,
      startedAt: new Date('2025-03-10T12:00:00+11:00'),
      completedAt: new Date('2025-03-10T14:30:00+11:00'),
      notes: 'Cross-dock inbound. All 100 cartons scanned.',
    },
    // Manifest 2 — Line haul MEL→SYD
    {
      id: 'task-svc7260-04',
      taskType: TaskType.XDO,
      manifestId: manifestM2.id,
      status: TaskStatus.DONE,
      sequence: 1,
      estimatedCostCents: 20000,
      actualCostCents: 20000,
      startedAt: new Date('2025-03-11T06:00:00+11:00'),
      completedAt: new Date('2025-03-11T08:00:00+11:00'),
      notes: 'Cross-dock outbound. Loaded onto semi trailer.',
    },
    {
      id: 'task-svc7260-05',
      taskType: TaskType.LHL,
      manifestId: manifestM2.id,
      status: TaskStatus.DONE,
      sequence: 2,
      estimatedCostCents: 280000,
      actualCostCents: 280000,
      startedAt: new Date('2025-03-11T08:30:00+11:00'),
      completedAt: new Date('2025-03-11T22:00:00+11:00'),
      notes: 'Line haul MEL→SYD via Hume Highway.',
      assignedDriverId: driverSarah.id,
      assignedVehicleId: vehicleSemi.id,
    },
    // Manifest 3 — SYD delivery + services
    {
      id: 'task-svc7260-06',
      taskType: TaskType.DEL,
      manifestId: manifestM3.id,
      status: TaskStatus.INPROG,
      sequence: 1,
      estimatedCostCents: 65000,
      actualCostCents: null,  // not yet complete
      startedAt: new Date('2025-03-12T09:00:00+11:00'),
      notes: 'Delivery in progress. 22 Collins Street, Sydney CBD.',
      assignedDriverId: driverJames.id,
      assignedVehicleId: vehicleRigid.id,
    },
    {
      id: 'task-svc7260-07',
      taskType: TaskType.ASM,
      manifestId: manifestM3.id,
      status: TaskStatus.PENDING,
      sequence: 2,
      estimatedCostCents: 120000,
      actualCostCents: null,
      notes: '100 chairs to assemble on site.',
    },
    {
      id: 'task-svc7260-08',
      taskType: TaskType.RUB,
      manifestId: manifestM3.id,
      status: TaskStatus.PENDING,
      sequence: 3,
      estimatedCostCents: 35000,
      actualCostCents: null,
      notes: 'Remove and dispose of all carton packaging.',
    },
  ];

  for (const task of tasks) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: task,
      create: {
        ...task,
        consignmentId: SVC7260_ID,
      },
    });
  }
  console.log(`  ✓ Tasks: 8 tasks across 3 manifests`);

  // ─── Audit log ─────────────────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      {
        id: 'audit-svc7260-01',
        entityType: AuditEntityType.CONSIGNMENT,
        entityId: SVC7260_ID,
        action: 'CONSIGNMENT_CREATED',
        newValue: { connoteNumber: 'SVC7260', status: 'DFT' },
        userId: 'dispatcher-01',
        consignmentId: SVC7260_ID,
        timestamp: new Date('2025-03-07T14:30:00+11:00'),
      },
      {
        id: 'audit-svc7260-02',
        entityType: AuditEntityType.CONSIGNMENT,
        entityId: SVC7260_ID,
        action: 'STATUS_CHANGE',
        previousValue: { status: 'DFT' },
        newValue: { status: 'BOOK' },
        userId: 'dispatcher-01',
        consignmentId: SVC7260_ID,
        timestamp: new Date('2025-03-07T15:00:00+11:00'),
      },
      {
        id: 'audit-svc7260-03',
        entityType: AuditEntityType.CONSIGNMENT,
        entityId: SVC7260_ID,
        action: 'STATUS_CHANGE',
        previousValue: { status: 'BOOK' },
        newValue: { status: 'DISP' },
        userId: 'dispatcher-01',
        consignmentId: SVC7260_ID,
        timestamp: new Date('2025-03-09T09:00:00+11:00'),
      },
      {
        id: 'audit-svc7260-04',
        entityType: AuditEntityType.CONSIGNMENT,
        entityId: SVC7260_ID,
        action: 'STATUS_CHANGE',
        previousValue: { status: 'DISP' },
        newValue: { status: 'INTRANS' },
        userId: 'system',
        consignmentId: SVC7260_ID,
        timestamp: new Date('2025-03-10T08:30:00+11:00'),
      },
    ],
    skipDuplicates: true,
  });
  console.log('  ✓ Audit log: 4 entries');

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log('\n✅ Seed complete!');
  console.log(`\n  Consignment SVC7260:`);
  console.log(`    100 × Office Chair (700×700×1200mm, 25kg, non-stackable)`);
  console.log(`    Total PS:        100 PS`);
  console.log(`    Total m³:        58.8 m³ (actual) / 216 m³ (chargeable)`);
  console.log(`    Total weight:    2,500 kg`);
  console.log(`    Quoted revenue:  $8,500`);
  console.log(`    Quoted cost:     $6,000 ($380,000 estimated tasks)`);
  console.log(`    Tasks: 8 (3 DONE, 1 INPROG, 2 PENDING → status: INTRANS)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
