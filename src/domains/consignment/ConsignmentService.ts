import {
  PrismaClient,
  ConsignmentStatus,
  TaskType,
  TaskStatus,
  ItemType,
  AuditEntityType,
} from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../shared/db/client';
import { AuditLogService } from '../../shared/audit/AuditLogService';
import { Errors } from '../../shared/errors/AppError';
import {
  calculateConsignmentTotals,
  calculateItemPS,
} from '../freight/FreightMeasurementEngine';
import type { CreateConsignmentInput, AddTaskInput, TaskChainEntry, ReassignManifestDriverInput } from './types';

// Licence class hierarchy for validation
const LICENCE_HIERARCHY: Record<string, number> = {
  C: 1,   // Car
  LR: 2,  // Light Rigid
  MR: 3,  // Medium Rigid
  HR: 4,  // Heavy Rigid
  HC: 5,  // Heavy Combination
  MC: 6,  // Multi Combination
};

let _connoteCounter = 7000; // Start above seed data
function generateConnoteNumber(): string {
  return `SVC${++_connoteCounter}`;
}

let _manifestCounter = 100;
function generateManifestCode(): string {
  return `M-${String(++_manifestCounter).padStart(4, '0')}`;
}

export class ConsignmentService {
  private readonly db: PrismaClient;
  private readonly audit: AuditLogService;

  constructor(db: PrismaClient = prisma) {
    this.db = db;
    this.audit = new AuditLogService(db);
  }

  /**
   * Create a new consignment, generate connote number, compute freight totals.
   */
  async createConsignment(
    input: CreateConsignmentInput,
    userId: string
  ) {
    const connoteNumber = generateConnoteNumber();

    // Compute freight metrics
    const freightItems = input.items.map((it) => ({
      widthMm: it.widthMm ?? 1200,
      depthMm: it.depthMm ?? 1200,
      heightMm: it.heightMm ?? 1200,
      weightKgEach: it.weightKgEach ?? 0,
      quantity: it.quantity,
      stackable: it.stackable ?? true,
    }));

    const summary = calculateConsignmentTotals(freightItems);

    const consignment = await this.db.consignment.create({
      data: {
        id: uuidv4(),
        connoteNumber,
        status: ConsignmentStatus.DFT,
        customerId: input.customerId,
        pickupAddress: input.pickupAddress,
        deliveryAddress: input.deliveryAddress,
        pickupDate: input.pickupDate,
        deliveryDate: input.deliveryDate,
        totalPS: summary.totalPS,
        totalM3: summary.totalM3,
        totalWeightKg: summary.totalWeightKg,
        quotedRevenueCents: input.quotedRevenueCents ?? 0,
        specialInstructions: input.specialInstructions,
        referenceNumbers: input.referenceNumbers ?? [],
        rolloutProjectId: input.rolloutProjectId,
        rolloutWaveId: input.rolloutWaveId,
        items: {
          create: input.items.map((it, idx) => {
            const psResult = calculateItemPS({
              widthMm: it.widthMm ?? 1200,
              depthMm: it.depthMm ?? 1200,
              heightMm: it.heightMm ?? 1200,
              weightKgEach: it.weightKgEach ?? 0,
              quantity: 1,
              stackable: it.stackable ?? true,
            });
            return {
              id: uuidv4(),
              description: it.description,
              itemType: (it.itemType as ItemType) ?? ItemType.UNKNOWN,
              quantity: it.quantity,
              widthMm: it.widthMm,
              depthMm: it.depthMm,
              heightMm: it.heightMm,
              weightKgEach: it.weightKgEach,
              stackable: it.stackable ?? true,
              specialHandling: it.specialHandling,
              palletSpaces: psResult.palletSpaces,
              m3: psResult.m3,
              chargeableM3: psResult.chargeableM3,
              isOverheight: psResult.isOverheight,
              isOversized: psResult.isOversized,
              itemCode: `${connoteNumber}-${String(idx + 1).padStart(3, '0')}`,
              sequence: idx + 1,
            };
          }),
        },
      },
      include: { items: true, tasks: true },
    });

    await this.audit.log({
      entityType: AuditEntityType.CONSIGNMENT,
      entityId: consignment.id,
      action: 'CONSIGNMENT_CREATED',
      newValue: {
        connoteNumber,
        status: ConsignmentStatus.DFT,
        totalPS: summary.totalPS,
        totalM3: summary.totalM3,
        totalWeightKg: summary.totalWeightKg,
      },
      userId,
      consignmentId: consignment.id,
    });

    return consignment;
  }

  /**
   * Add a task to a consignment, optionally assigning to a manifest.
   */
  async addTask(
    consignmentId: string,
    input: AddTaskInput,
    userId: string
  ) {
    const consignment = await this.db.consignment.findUnique({
      where: { id: consignmentId },
      include: { tasks: true },
    });

    if (!consignment) throw Errors.notFound('Consignment', consignmentId);

    // Validate that COMP/FUTDEL consignments don't get new tasks
    const terminalStatuses: ConsignmentStatus[] = [ConsignmentStatus.COMP, ConsignmentStatus.FUTDEL];
    if (terminalStatuses.includes(consignment.status)) {
      throw Errors.conflict(
        `Cannot add tasks to a consignment in ${consignment.status} status`,
        { consignmentId, status: consignment.status }
      );
    }

    // If assigning to a manifest, verify it exists
    if (input.manifestId) {
      const manifest = await this.db.manifest.findUnique({
        where: { id: input.manifestId },
      });
      if (!manifest) throw Errors.notFound('Manifest', input.manifestId);
    }

    const task = await this.db.task.create({
      data: {
        id: uuidv4(),
        consignmentId,
        taskType: input.taskType,
        manifestId: input.manifestId,
        status: TaskStatus.PENDING,
        estimatedCostCents: input.estimatedCostCents,
        assignedDriverId: input.assignedDriverId,
        assignedVehicleId: input.assignedVehicleId,
        sequence: input.sequence ?? 0,
        notes: input.notes,
      },
    });

    await this.audit.log({
      entityType: AuditEntityType.CONSIGNMENT,
      entityId: consignmentId,
      action: 'TASK_ADDED',
      newValue: {
        taskId: task.id,
        taskType: input.taskType,
        manifestId: input.manifestId,
      },
      userId,
      consignmentId,
    });

    return task;
  }

  /**
   * Return all tasks for a consignment ordered by manifest planned date, then sequence.
   */
  async getTaskChain(consignmentId: string): Promise<TaskChainEntry[]> {
    const consignment = await this.db.consignment.findUnique({
      where: { id: consignmentId },
    });
    if (!consignment) throw Errors.notFound('Consignment', consignmentId);

    const tasks = await this.db.task.findMany({
      where: { consignmentId },
      include: {
        manifest: {
          select: { manifestCode: true, plannedDate: true },
        },
      },
      orderBy: [{ sequence: 'asc' }],
    });

    // Sort by manifest plannedDate, then sequence
    const sorted = tasks.sort((a, b) => {
      const dateA = a.manifest?.plannedDate?.getTime() ?? 0;
      const dateB = b.manifest?.plannedDate?.getTime() ?? 0;
      if (dateA !== dateB) return dateA - dateB;
      return a.sequence - b.sequence;
    });

    return sorted.map((t) => ({
      taskId: t.id,
      taskType: t.taskType,
      status: t.status,
      manifestId: t.manifestId,
      manifestCode: t.manifest?.manifestCode ?? null,
      manifestPlannedDate: t.manifest?.plannedDate ?? null,
      sequence: t.sequence,
      assignedDriverId: t.assignedDriverId,
      assignedVehicleId: t.assignedVehicleId,
      estimatedCostCents: t.estimatedCostCents,
      actualCostCents: t.actualCostCents,
      startedAt: t.startedAt,
      completedAt: t.completedAt,
      notes: t.notes,
    }));
  }

  /**
   * Derive the consignment status from the state of all its tasks.
   *
   * Rules:
   * - All tasks DONE → COMP
   * - Any FUTILE + no DONE → FUTDEL
   * - Some DONE + some FUTILE → PARTDEL
   * - Any INPROG → INTRANS
   * - Otherwise remains current status (DISP if assigned, BOOK if booked, etc.)
   */
  async computeConsignmentStatus(consignmentId: string): Promise<ConsignmentStatus> {
    const consignment = await this.db.consignment.findUnique({
      where: { id: consignmentId },
      include: { tasks: true },
    });

    if (!consignment) throw Errors.notFound('Consignment', consignmentId);

    const tasks = consignment.tasks;
    if (tasks.length === 0) return consignment.status;

    const hasFutile = tasks.some((t) => t.status === TaskStatus.FUTILE);
    const hasDone = tasks.some((t) => t.status === TaskStatus.DONE);
    const allDone = tasks.every((t) => t.status === TaskStatus.DONE);
    const hasInProgress = tasks.some((t) => t.status === TaskStatus.INPROG);

    let derivedStatus: ConsignmentStatus = consignment.status;

    if (allDone) {
      derivedStatus = ConsignmentStatus.COMP;
    } else if (hasFutile && !hasDone) {
      derivedStatus = ConsignmentStatus.FUTDEL;
    } else if (hasDone && hasFutile) {
      derivedStatus = ConsignmentStatus.PARTDEL;
    } else if (hasInProgress) {
      derivedStatus = ConsignmentStatus.INTRANS;
    }

    if (derivedStatus !== consignment.status) {
      await this.db.consignment.update({
        where: { id: consignmentId },
        data: { status: derivedStatus },
      });
    }

    return derivedStatus;
  }

  /**
   * Reassign all tasks on a manifest to a new driver.
   * Validates that the new driver's licence class is sufficient for the vehicle.
   */
  async reassignManifestDriver(input: ReassignManifestDriverInput): Promise<void> {
    const { manifestId, newDriverId, userId } = input;

    const manifest = await this.db.manifest.findUnique({
      where: { id: manifestId },
      include: { vehicle: true, driver: true },
    });

    if (!manifest) throw Errors.notFound('Manifest', manifestId);

    const newDriver = await this.db.driver.findUnique({
      where: { id: newDriverId },
    });

    if (!newDriver) throw Errors.notFound('Driver', newDriverId);

    // Validate licence class if a vehicle is assigned
    if (manifest.vehicle) {
      const requiredLevel = LICENCE_HIERARCHY[manifest.vehicle.requiredLicenceClass] ?? 0;
      const driverLevel = LICENCE_HIERARCHY[newDriver.licenceClass] ?? 0;

      if (driverLevel < requiredLevel) {
        throw Errors.validation(
          `Driver ${newDriver.name} has licence class ${newDriver.licenceClass} but vehicle ${manifest.vehicle.registration} requires ${manifest.vehicle.requiredLicenceClass}`,
          {
            driverLicence: newDriver.licenceClass,
            requiredLicence: manifest.vehicle.requiredLicenceClass,
          }
        );
      }
    }

    const previousDriverId = manifest.driverId;

    await this.db.$transaction([
      this.db.manifest.update({
        where: { id: manifestId },
        data: { driverId: newDriverId },
      }),
      this.db.task.updateMany({
        where: { manifestId, assignedDriverId: previousDriverId },
        data: { assignedDriverId: newDriverId },
      }),
    ]);

    await this.audit.log({
      entityType: AuditEntityType.CONSIGNMENT,
      entityId: manifestId,
      action: 'MANIFEST_DRIVER_REASSIGNED',
      previousValue: { driverId: previousDriverId },
      newValue: { driverId: newDriverId },
      userId,
    });
  }

  /**
   * Scenario 11: Mark a pickup task as futile (driver couldn't access/collect).
   * - Sets task to FUTILE
   * - Sets consignment to FUP
   * - Triggers waiting time charge (adds WTM task)
   * - Notifies customer (creates notification record)
   */
  async markFutilePickup(
    taskId: string,
    photoUrl: string | undefined,
    userId: string
  ) {
    const task = await this.db.task.findUnique({
      where: { id: taskId },
      include: { consignment: true },
    });

    if (!task) throw Errors.notFound('Task', taskId);
    if (task.taskType !== TaskType.PUP) {
      throw Errors.validation('Only PUP (pickup) tasks can be marked as futile pickup', { taskId, taskType: task.taskType });
    }

    const previous = { taskStatus: task.status, consignmentStatus: task.consignment.status };

    await this.db.$transaction(async (tx) => {
      // Mark task futile
      await tx.task.update({
        where: { id: taskId },
        data: {
          status: TaskStatus.FUTILE,
          completedAt: new Date(),
          notes: photoUrl ? `Futile pickup. Photo: ${photoUrl}` : 'Futile pickup.',
        },
      });

      // Set consignment to FUP
      await tx.consignment.update({
        where: { id: task.consignmentId },
        data: { status: ConsignmentStatus.FUP },
      });

      // Add waiting time task
      await tx.task.create({
        data: {
          id: uuidv4(),
          consignmentId: task.consignmentId,
          taskType: TaskType.WTM,
          status: TaskStatus.PENDING,
          manifestId: task.manifestId,
          sequence: task.sequence + 1,
          notes: 'Auto-generated: waiting time charge for futile pickup',
        },
      });

      // Create customer notification
      await tx.notification.create({
        data: {
          id: uuidv4(),
          userId: 'customer-notify', // Would be resolved to actual contact
          subject: `Futile Pickup — ${task.consignment.connoteNumber}`,
          body: `We were unable to collect your consignment ${task.consignment.connoteNumber}. Our driver attended but could not complete the pickup. A waiting time charge has been applied. Please contact us to rebook.`,
          channel: 'EMAIL',
          relatedType: 'CONSIGNMENT',
          relatedId: task.consignmentId,
        },
      });
    });

    await this.audit.log({
      entityType: AuditEntityType.CONSIGNMENT,
      entityId: task.consignmentId,
      action: 'FUTILE_PICKUP',
      previousValue: previous,
      newValue: { taskStatus: TaskStatus.FUTILE, consignmentStatus: ConsignmentStatus.FUP },
      userId,
      consignmentId: task.consignmentId,
    });

    return { taskId, consignmentId: task.consignmentId, status: ConsignmentStatus.FUP };
  }

  /**
   * Scenario 13: Record a partial delivery.
   * Creates split POD record, sets consignment to PARTDEL.
   */
  async recordPartialDelivery(
    taskId: string,
    deliveredItemIds: string[],
    returnedItemIds: string[],
    userId: string
  ) {
    const task = await this.db.task.findUnique({
      where: { id: taskId },
      include: { consignment: true },
    });

    if (!task) throw Errors.notFound('Task', taskId);
    if (task.taskType !== TaskType.DEL) {
      throw Errors.validation('Only DEL (delivery) tasks can record partial delivery', { taskId });
    }

    await this.db.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: taskId },
        data: {
          status: TaskStatus.DONE,
          completedAt: new Date(),
          notes: `Partial delivery. Delivered: ${deliveredItemIds.join(', ')}. Returned: ${returnedItemIds.join(', ')}.`,
        },
      });

      await tx.consignment.update({
        where: { id: task.consignmentId },
        data: { status: ConsignmentStatus.PARTDEL },
      });

      // Create return-to-depot task for undelivered items
      if (returnedItemIds.length > 0) {
        await tx.task.create({
          data: {
            id: uuidv4(),
            consignmentId: task.consignmentId,
            taskType: TaskType.RTD,
            status: TaskStatus.PENDING,
            manifestId: task.manifestId,
            sequence: task.sequence + 1,
            notes: `Return to depot: items ${returnedItemIds.join(', ')}`,
          },
        });
      }
    });

    await this.audit.log({
      entityType: AuditEntityType.CONSIGNMENT,
      entityId: task.consignmentId,
      action: 'PARTIAL_DELIVERY',
      newValue: {
        deliveredItemIds,
        returnedItemIds,
        status: ConsignmentStatus.PARTDEL,
      },
      userId,
      consignmentId: task.consignmentId,
    });

    return {
      taskId,
      consignmentId: task.consignmentId,
      status: ConsignmentStatus.PARTDEL,
      deliveredItemIds,
      returnedItemIds,
    };
  }

  /**
   * Scenario 16: Add an ad-hoc service task mid-shift.
   */
  async addAdHocServiceTask(
    manifestId: string,
    taskType: TaskType,
    capturedMinutes: number,
    consignmentId: string,
    userId: string
  ) {
    const manifest = await this.db.manifest.findUnique({ where: { id: manifestId } });
    if (!manifest) throw Errors.notFound('Manifest', manifestId);

    const serviceTaskTypes: TaskType[] = [
      TaskType.ASM, TaskType.STC, TaskType.RUB, TaskType.PLC,
      TaskType.WRP, TaskType.WTM, TaskType.SIN, TaskType.DBR,
      TaskType.TGT, TaskType.UNP,
    ];

    if (!serviceTaskTypes.includes(taskType)) {
      throw Errors.validation(`Task type ${taskType} is not an ad-hoc service task`, { taskType });
    }

    const task = await this.db.task.create({
      data: {
        id: uuidv4(),
        consignmentId,
        taskType,
        manifestId,
        status: TaskStatus.INPROG,
        startedAt: new Date(Date.now() - capturedMinutes * 60000),
        notes: `Ad-hoc service task. Captured: ${capturedMinutes} minutes.`,
        sequence: 999, // appended to end
      },
    });

    await this.audit.log({
      entityType: AuditEntityType.CONSIGNMENT,
      entityId: consignmentId,
      action: 'ADHOC_SERVICE_ADDED',
      newValue: { taskId: task.id, taskType, capturedMinutes, manifestId },
      userId,
      consignmentId,
    });

    // Signal that a charge should be created (in production this would trigger billing)
    return {
      task,
      chargePrompt: {
        taskId: task.id,
        taskType,
        capturedMinutes,
        estimatedChargeCents: capturedMinutes * 150, // $1.50/min placeholder rate
        requiresApproval: true,
      },
    };
  }
}

export const consignmentService = new ConsignmentService();
