import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { getSigningPattern } from '../../src/tools/get-signing-pattern.js';
import { searchVerificationMethods } from '../../src/tools/search-verification-methods.js';

const TEST_DB_PATH = join(import.meta.dirname, '..', '..', 'data', 'test-signing-tools.db');

describe('Signing & Attestation Tools', () => {
  let db: Database.Database;

  beforeAll(async () => {
    const { buildDatabase } = await import('../../scripts/build-db.js');
    buildDatabase(TEST_DB_PATH);
    db = new Database(TEST_DB_PATH);
  });

  afterAll(() => {
    if (db) db.close();
    if (existsSync(TEST_DB_PATH)) unlinkSync(TEST_DB_PATH);
  });

  // ─── getSigningPattern ──────────────────────────────────────────

  describe('getSigningPattern', () => {
    it('returns a pattern by known ID', () => {
      const result = getSigningPattern(db, { pattern_id: 'SIGN-SIG-001' });
      expect(result.results).not.toBeNull();
      expect(result.results!.id).toBe('SIGN-SIG-001');
      expect(result.results!.tool_name).toBe('Cosign');
      expect(result.results!.description).toBeTruthy();
      expect(result.results!.use_case).toBeTruthy();
    });

    it('returns null for non-existent ID', () => {
      const result = getSigningPattern(db, { pattern_id: 'NON-EXISTENT-999' });
      expect(result.results).toBeNull();
    });

    it('parses verification_steps as an array', () => {
      const result = getSigningPattern(db, { pattern_id: 'SIGN-SIG-001' });
      expect(result.results).not.toBeNull();
      expect(Array.isArray(result.results!.verification_steps)).toBe(true);
      expect(result.results!.verification_steps.length).toBeGreaterThan(0);
    });

    it('parses integration_patterns as an array', () => {
      const result = getSigningPattern(db, { pattern_id: 'SIGN-SIG-001' });
      expect(result.results).not.toBeNull();
      expect(Array.isArray(result.results!.integration_patterns)).toBe(true);
      expect(result.results!.integration_patterns.length).toBeGreaterThan(0);
    });

    it('includes specification_url and key_management', () => {
      const result = getSigningPattern(db, { pattern_id: 'SIGN-SIG-001' });
      expect(result.results).not.toBeNull();
      expect(result.results!.specification_url).toBeTruthy();
      expect(result.results!.key_management).toBeTruthy();
    });

    it('includes correct metadata domain', () => {
      const result = getSigningPattern(db, { pattern_id: 'SIGN-SIG-001' });
      expect(result._metadata.domain).toBe('supply-chain-security');
    });
  });

  // ─── searchVerificationMethods ────────────────────────────────

  describe('searchVerificationMethods', () => {
    it('finds entries matching "cosign"', () => {
      const result = searchVerificationMethods(db, { query: 'cosign' });
      expect(result.results.length).toBeGreaterThan(0);
      const hasMatch = result.results.some(
        (r) =>
          r.tool_name.toLowerCase().includes('cosign') ||
          r.description.toLowerCase().includes('cosign') ||
          r.use_case.toLowerCase().includes('cosign'),
      );
      expect(hasMatch).toBe(true);
    });

    it('returns summary fields without verification_steps or integration_patterns', () => {
      const result = searchVerificationMethods(db, { query: 'cosign' });
      expect(result.results.length).toBeGreaterThan(0);
      const first = result.results[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('tool_name');
      expect(first).toHaveProperty('description');
      expect(first).toHaveProperty('use_case');
      expect(first).toHaveProperty('ecosystem');
      // Summary should not include full detail fields
      expect(first).not.toHaveProperty('verification_steps');
      expect(first).not.toHaveProperty('integration_patterns');
      expect(first).not.toHaveProperty('key_management');
      expect(first).not.toHaveProperty('specification_url');
    });

    it('filters by ecosystem when specified', () => {
      const result = searchVerificationMethods(db, { query: 'signing', ecosystem: 'Kubernetes' });
      expect(result.results.length).toBeGreaterThan(0);
      expect(
        result.results.every((r) => r.ecosystem?.toLowerCase().includes('kubernetes')),
      ).toBe(true);
    });

    it('returns empty array for nonsense query', () => {
      const result = searchVerificationMethods(db, { query: 'xyzzyplugh999' });
      expect(result.results).toEqual([]);
    });

    it('includes correct metadata domain', () => {
      const result = searchVerificationMethods(db, { query: 'cosign' });
      expect(result._metadata.domain).toBe('supply-chain-security');
    });
  });
});
