import { AuditEntityType, Prisma, PrismaClient } from '@prisma/client';
import prisma from '../db/client';

export interface AuditLogInput {
  entityType: AuditEntityType;
  entityId: string;
  action: string;
  previousValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  userId: string;
  consignmentId?: string;
}

export class AuditLogService {
  private readonly db: PrismaClient;

  constructor(db: PrismaClient = prisma) {
    this.db = db;
  }

  async log(input: AuditLogInput): Promise<void> {
    await this.db.auditLog.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        previousValue: input.previousValue
          ? (input.previousValue as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        newValue: input.newValue
          ? (input.newValue as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        userId: input.userId,
        consignmentId: input.consignmentId,
      },
    });
  }

  async getHistory(entityType: AuditEntityType, entityId: string) {
    return this.db.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { timestamp: 'asc' },
    });
  }

  async getConsignmentHistory(consignmentId: string) {
    return this.db.auditLog.findMany({
      where: { consignmentId },
      orderBy: { timestamp: 'asc' },
    });
  }
}

export const auditLogService = new AuditLogService();
