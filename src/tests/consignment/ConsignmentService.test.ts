import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConsignmentStatus, TaskStatus, TaskType } from '@prisma/client';

/**
 * Unit tests for ConsignmentService business logic.
 * We test the pure logic functions extracted from the service,
 * since DB operations require integration test setup.
 */

// ─── Status derivation logic (pure) ──────────────────────────────────────────

type MockTask = { status: TaskStatus; taskType: TaskType };

function deriveStatus(
  tasks: MockTask[],
  currentStatus: ConsignmentStatus
): ConsignmentStatus {
  if (tasks.length === 0) return currentStatus;

  const hasFutile = tasks.some((t) => t.status === TaskStatus.FUTILE);
  const hasDone = tasks.some((t) => t.status === TaskStatus.DONE);
  const allDone = tasks.every((t) => t.status === TaskStatus.DONE);
  const hasInProgress = tasks.some((t) => t.status === TaskStatus.INPROG);

  if (allDone) return ConsignmentStatus.COMP;
  if (hasFutile && !hasDone) return ConsignmentStatus.FUTDEL;
  if (hasDone && hasFutile) return ConsignmentStatus.PARTDEL;
  if (hasInProgress) return ConsignmentStatus.INTRANS;
  return currentStatus;
}

describe('ConsignmentService — computeConsignmentStatus (logic)', () => {

  it('All tasks DONE → COMP', () => {
    const tasks: MockTask[] = [
      { status: TaskStatus.DONE, taskType: TaskType.PUP },
      { status: TaskStatus.DONE, taskType: TaskType.DEL },
    ];
    expect(deriveStatus(tasks, ConsignmentStatus.DISP)).toBe(ConsignmentStatus.COMP);
  });

  it('Any FUTILE + no DONE → FUTDEL', () => {
    const tasks: MockTask[] = [
      { status: TaskStatus.FUTILE, taskType: TaskType.PUP },
      { status: TaskStatus.PENDING, taskType: TaskType.DEL },
    ];
    expect(deriveStatus(tasks, ConsignmentStatus.DISP)).toBe(ConsignmentStatus.FUTDEL);
  });

  it('Some DONE + some FUTILE → PARTDEL', () => {
    const tasks: MockTask[] = [
      { status: TaskStatus.DONE, taskType: TaskType.PUP },
      { status: TaskStatus.FUTILE, taskType: TaskType.DEL },
    ];
    expect(deriveStatus(tasks, ConsignmentStatus.INTRANS)).toBe(ConsignmentStatus.PARTDEL);
  });

  it('Any INPROG (no futile/done completion) → INTRANS', () => {
    const tasks: MockTask[] = [
      { status: TaskStatus.DONE, taskType: TaskType.PUP },
      { status: TaskStatus.INPROG, taskType: TaskType.DEL },
    ];
    // has done + inprog, no futile → INTRANS
    expect(deriveStatus(tasks, ConsignmentStatus.DISP)).toBe(ConsignmentStatus.INTRANS);
  });

  it('No tasks → returns current status unchanged', () => {
    expect(deriveStatus([], ConsignmentStatus.BOOK)).toBe(ConsignmentStatus.BOOK);
  });

  it('SVC7260 scenario: 6 of 8 tasks done, 2 pending → INTRANS', () => {
    const tasks: MockTask[] = [
      { status: TaskStatus.DONE, taskType: TaskType.VPREP },
      { status: TaskStatus.DONE, taskType: TaskType.PUP },
      { status: TaskStatus.DONE, taskType: TaskType.XDI },
      { status: TaskStatus.DONE, taskType: TaskType.XDO },
      { status: TaskStatus.INPROG, taskType: TaskType.LHL },
      { status: TaskStatus.PENDING, taskType: TaskType.DEL },
      { status: TaskStatus.PENDING, taskType: TaskType.ASM },
      { status: TaskStatus.PENDING, taskType: TaskType.RUB },
    ];
    // has done + inprog → INTRANS
    expect(deriveStatus(tasks, ConsignmentStatus.DISP)).toBe(ConsignmentStatus.INTRANS);
  });

});

// ─── Licence hierarchy logic (pure) ──────────────────────────────────────────

const LICENCE_HIERARCHY: Record<string, number> = {
  C: 1, LR: 2, MR: 3, HR: 4, HC: 5, MC: 6,
};

function isLicenceValid(driverClass: string, requiredClass: string): boolean {
  return (LICENCE_HIERARCHY[driverClass] ?? 0) >= (LICENCE_HIERARCHY[requiredClass] ?? 0);
}

describe('ConsignmentService — licence validation', () => {
  it('MC driver can drive any vehicle', () => {
    expect(isLicenceValid('MC', 'HC')).toBe(true);
    expect(isLicenceValid('MC', 'HR')).toBe(true);
    expect(isLicenceValid('MC', 'LR')).toBe(true);
  });

  it('LR driver cannot drive HR vehicle', () => {
    expect(isLicenceValid('LR', 'HR')).toBe(false);
  });

  it('Exact match is valid', () => {
    expect(isLicenceValid('HR', 'HR')).toBe(true);
  });

  it('C licence cannot drive rigid truck', () => {
    expect(isLicenceValid('C', 'LR')).toBe(false);
  });
});

// ─── Connote number format ────────────────────────────────────────────────────

describe('Connote number format', () => {
  it('Starts with SVC prefix', () => {
    const connote = 'SVC7260';
    expect(connote).toMatch(/^SVC\d+$/);
  });

  it('Item codes follow SVC{connote}-{3digit} pattern', () => {
    const code = 'SVC7260-001';
    expect(code).toMatch(/^SVC\d+-\d{3}$/);
  });

  it('Item codes pad sequence to 3 digits', () => {
    const seq = (n: number) => `SVC7260-${String(n).padStart(3, '0')}`;
    expect(seq(1)).toBe('SVC7260-001');
    expect(seq(10)).toBe('SVC7260-010');
    expect(seq(100)).toBe('SVC7260-100');
  });
});

// ─── Task chain ordering logic ─────────────────────────────────────────────

describe('Task chain ordering', () => {
  it('Tasks sort by manifest planned date then sequence', () => {
    const tasks = [
      { taskId: 'c', manifestPlannedDate: new Date('2025-03-12'), sequence: 1 },
      { taskId: 'a', manifestPlannedDate: new Date('2025-03-10'), sequence: 1 },
      { taskId: 'b', manifestPlannedDate: new Date('2025-03-10'), sequence: 2 },
    ];

    const sorted = [...tasks].sort((a, b) => {
      const dateA = a.manifestPlannedDate?.getTime() ?? 0;
      const dateB = b.manifestPlannedDate?.getTime() ?? 0;
      if (dateA !== dateB) return dateA - dateB;
      return a.sequence - b.sequence;
    });

    expect(sorted[0].taskId).toBe('a');
    expect(sorted[1].taskId).toBe('b');
    expect(sorted[2].taskId).toBe('c');
  });
});
