import { describe, it, expect } from 'vitest';
import { sanitizeFtsInput, buildFtsQueryVariants } from '../../src/utils/fts-query.js';

describe('sanitizeFtsInput', () => {
  it('strips special characters', () => {
    expect(sanitizeFtsInput('hello@world!')).toBe('hello world');
  });

  it('collapses whitespace', () => {
    expect(sanitizeFtsInput('  a   b  ')).toBe('a b');
  });
});

describe('buildFtsQueryVariants', () => {
  it('returns empty for empty input', () => {
    expect(buildFtsQueryVariants('')).toEqual([]);
  });

  it('returns word + prefix for single word', () => {
    expect(buildFtsQueryVariants('sbom')).toEqual(['sbom', 'sbom*']);
  });

  it('returns phrase + AND + prefix variants for multi-word', () => {
    const variants = buildFtsQueryVariants('supply chain');
    expect(variants).toHaveLength(3);
    expect(variants[0]).toBe('"supply chain"');
    expect(variants[1]).toBe('supply AND chain');
    expect(variants[2]).toBe('supply AND chain*');
  });
});
