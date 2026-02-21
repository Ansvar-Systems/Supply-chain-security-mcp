import { describe, it, expect } from 'vitest';
import { generateResponseMetadata } from '../../src/utils/metadata.js';

describe('generateResponseMetadata', () => {
  it('returns correct domain', () => {
    const meta = generateResponseMetadata();
    expect(meta.domain).toBe('supply-chain-security');
  });

  it('includes freshness when provided', () => {
    const meta = generateResponseMetadata('2026-02-21T00:00:00Z');
    expect(meta.freshness).toBe('2026-02-21T00:00:00Z');
  });

  it('omits freshness when not provided', () => {
    const meta = generateResponseMetadata();
    expect(meta.freshness).toBeUndefined();
  });
});
