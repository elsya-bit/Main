import { describe, it, expect } from 'vitest';
import { buildExtractionPrompt } from '../../domains/intake/ExtractionPrompt';

const SARAH_CHAIR_EMAIL = `
Hi Snapes team,

We need to book a delivery of 100 office chairs from our warehouse to a client site.

Pickup: 45 Industrial Drive, Dandenong VIC 3175
Delivery: 22 Collins Street, Melbourne CBD VIC 3000

The chairs are boxed, each carton is approximately 700mm wide x 700mm deep x 1200mm high, 25kg each.
They need to be assembled on site after delivery.
There are 3 flights of stairs at the delivery address.
Please also remove the packaging waste afterwards.

Requested pickup date: Monday 10 March 2025
Required delivery: Tuesday 11 March 2025

PO Number: PO-2025-8891

Please also note site induction is required before delivery.

Thanks,
Sarah Johnson
Office Manager — Acme Corp
`;

describe('buildExtractionPrompt', () => {
  it('includes the email text in the prompt', () => {
    const prompt = buildExtractionPrompt(SARAH_CHAIR_EMAIL);
    expect(prompt).toContain('Sarah Johnson');
    expect(prompt).toContain('100 office chairs');
    expect(prompt).toContain('Dandenong');
  });

  it('includes schema definition', () => {
    const prompt = buildExtractionPrompt(SARAH_CHAIR_EMAIL);
    expect(prompt).toContain('customer');
    expect(prompt).toContain('pickupAddress');
    expect(prompt).toContain('deliveryAddress');
    expect(prompt).toContain('detectedServices');
    expect(prompt).toContain('uncertainFields');
  });

  it('includes attachment text when provided', () => {
    const prompt = buildExtractionPrompt('Email body', 'Attachment content here');
    expect(prompt).toContain('=== EMAIL BODY ===');
    expect(prompt).toContain('=== ATTACHMENT ===');
    expect(prompt).toContain('Attachment content here');
  });

  it('does not include attachment section when no attachment', () => {
    const prompt = buildExtractionPrompt('Email body only');
    expect(prompt).not.toContain('=== ATTACHMENT ===');
  });

  it('instructs to return JSON without markdown fences', () => {
    const prompt = buildExtractionPrompt('test');
    expect(prompt).toMatch(/no markdown/i);
    expect(prompt).toContain('Return ONLY');
  });

  it('includes all service types to detect', () => {
    const prompt = buildExtractionPrompt('test');
    expect(prompt).toContain('assembly');
    expect(prompt).toContain('rubbish');
    expect(prompt).toContain('stairs');
    expect(prompt).toContain('tailgate');
    expect(prompt).toContain('placement');
    expect(prompt).toContain('induction');
    expect(prompt).toContain('after hours');
  });

  it('specifies ISO 8601 date format', () => {
    const prompt = buildExtractionPrompt('test');
    expect(prompt).toContain('YYYY-MM-DD');
  });

  it('specifies Australian context', () => {
    const prompt = buildExtractionPrompt('test');
    expect(prompt).toContain('Snapes Project Logistics');
    expect(prompt).toContain('Australian');
  });
});
