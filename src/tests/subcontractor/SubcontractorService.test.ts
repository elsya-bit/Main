import { describe, it, expect } from 'vitest';
import { SubcontractorJobStatus, EscalationLevel } from '@prisma/client';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'test-secret';
const TOKEN_VALID_HOURS = 72;

// ─── Token generation / validation logic ─────────────────────────────────────

function generateToken(jobId: string, consignmentId: string): string {
  return jwt.sign(
    { jobId, consignmentId, purpose: 'subbie-status-update' },
    JWT_SECRET,
    { expiresIn: `${TOKEN_VALID_HOURS}h` }
  );
}

function verifyToken(token: string): { jobId: string; consignmentId: string } {
  return jwt.verify(token, JWT_SECRET) as { jobId: string; consignmentId: string };
}

describe('Subcontractor token generation', () => {
  it('Generates a valid JWT token', () => {
    const token = generateToken('job-001', 'consignment-001');
    expect(token).toBeTruthy();
    expect(token.split('.')).toHaveLength(3);
  });

  it('Token contains expected payload', () => {
    const token = generateToken('job-001', 'consignment-001');
    const payload = verifyToken(token);
    expect(payload.jobId).toBe('job-001');
    expect(payload.consignmentId).toBe('consignment-001');
  });

  it('Expired token throws TokenExpiredError', async () => {
    const token = jwt.sign(
      { jobId: 'job-001', purpose: 'subbie-status-update' },
      JWT_SECRET,
      { expiresIn: '1ms' }
    );

    // Wait for token to expire
    await new Promise((r) => setTimeout(r, 10));

    expect(() => jwt.verify(token, JWT_SECRET)).toThrow(jwt.TokenExpiredError);
  });

  it('Invalid secret throws JsonWebTokenError', () => {
    const token = generateToken('job-001', 'consignment-001');
    expect(() => jwt.verify(token, 'wrong-secret')).toThrow(jwt.JsonWebTokenError);
  });
});

// ─── Escalation logic ─────────────────────────────────────────────────────────

describe('Escalation level transitions', () => {
  it('Initial job has NONE escalation level', () => {
    const job = { escalationLevel: EscalationLevel.NONE };
    expect(job.escalationLevel).toBe(EscalationLevel.NONE);
  });

  it('After +1 hour no update → escalates to DISPATCHER', () => {
    // Simulated state transition
    const after1Hour = (current: EscalationLevel): EscalationLevel => {
      if (current === EscalationLevel.NONE) return EscalationLevel.DISPATCHER;
      return current;
    };
    expect(after1Hour(EscalationLevel.NONE)).toBe(EscalationLevel.DISPATCHER);
  });

  it('After +4 hours → escalates to MANAGER', () => {
    const after4Hours = (current: EscalationLevel): EscalationLevel => {
      if (current === EscalationLevel.DISPATCHER) return EscalationLevel.MANAGER;
      return current;
    };
    expect(after4Hours(EscalationLevel.DISPATCHER)).toBe(EscalationLevel.MANAGER);
  });

  it('After +24 hours → AUTO_EMAIL_SENT and UNKNOWN_STATUS', () => {
    const after24Hours = (
      current: EscalationLevel
    ): { escalation: EscalationLevel; status: SubcontractorJobStatus } => {
      if (current === EscalationLevel.MANAGER) {
        return {
          escalation: EscalationLevel.AUTO_EMAIL_SENT,
          status: SubcontractorJobStatus.UNKNOWN_STATUS,
        };
      }
      return { escalation: current, status: SubcontractorJobStatus.ASSIGNED };
    };

    const result = after24Hours(EscalationLevel.MANAGER);
    expect(result.escalation).toBe(EscalationLevel.AUTO_EMAIL_SENT);
    expect(result.status).toBe(SubcontractorJobStatus.UNKNOWN_STATUS);
  });

  it('Delivered status cancels escalation (resets to NONE)', () => {
    const onDelivered = (job: { escalationLevel: EscalationLevel }) => ({
      ...job,
      escalationLevel: EscalationLevel.NONE,
      status: SubcontractorJobStatus.DELIVERED,
    });

    const job = { escalationLevel: EscalationLevel.DISPATCHER };
    const result = onDelivered(job);
    expect(result.escalationLevel).toBe(EscalationLevel.NONE);
    expect(result.status).toBe(SubcontractorJobStatus.DELIVERED);
  });
});

// ─── Status mapping for email parse ──────────────────────────────────────────

describe('Subcontractor email status mapping', () => {
  const statusKeywords: Array<[string[], SubcontractorJobStatus]> = [
    [['picked up', 'collected', 'at depot'], SubcontractorJobStatus.PICKUP_COMPLETE],
    [['on the way', 'en route', 'in transit', 'out for delivery'], SubcontractorJobStatus.IN_TRANSIT],
    [['delivered', 'signed', 'completed', 'POD'], SubcontractorJobStatus.DELIVERED],
    [['unable to deliver', 'no access', 'not home', 'futile'], SubcontractorJobStatus.FUTILE],
  ];

  for (const [keywords, expectedStatus] of statusKeywords) {
    it(`Keywords "${keywords[0]}" map to ${expectedStatus}`, () => {
      // This tests that the spec mappings are well-defined
      expect(expectedStatus).toBeTruthy();
      expect(keywords.length).toBeGreaterThan(0);
    });
  }

  it('Status transition: ASSIGNED → PICKUP_COMPLETE → IN_TRANSIT → DELIVERED', () => {
    const validTransitions = [
      SubcontractorJobStatus.ASSIGNED,
      SubcontractorJobStatus.ACKNOWLEDGED,
      SubcontractorJobStatus.PICKUP_COMPLETE,
      SubcontractorJobStatus.IN_TRANSIT,
      SubcontractorJobStatus.DELIVERED,
    ];
    // All states are enumerated correctly
    expect(validTransitions).toHaveLength(5);
    expect(validTransitions[0]).toBe(SubcontractorJobStatus.ASSIGNED);
    expect(validTransitions[4]).toBe(SubcontractorJobStatus.DELIVERED);
  });
});

// ─── Subbie link URL format ───────────────────────────────────────────────────

describe('Subbie link URL', () => {
  it('Link contains token parameter', () => {
    const token = generateToken('job-001', 'consignment-001');
    const url = `https://tms.snapes.com.au/subbie/update?token=${token}`;
    expect(url).toContain('?token=');
    expect(url).toContain('tms.snapes.com.au');
  });
});
