import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { getSbomStandard } from '../../src/tools/get-sbom-standard.js';
import { searchSbomFields } from '../../src/tools/search-sbom-fields.js';
import { compareSbomFormats } from '../../src/tools/compare-sbom-formats.js';

const TEST_DB_PATH = join(import.meta.dirname, '..', '..', 'data', 'test-sbom-tools.db');

describe('SBOM Standards Tools', () => {
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

  // ─── getSbomStandard ───────────────────────────────────────────────

  describe('getSbomStandard', () => {
    it('returns an SPDX entry by known ID', () => {
      const result = getSbomStandard(db, { standard_id: 'SPDX-2.3-001' });
      expect(result.results).not.toBeNull();
      expect(result.results!.id).toBe('SPDX-2.3-001');
      expect(result.results!.format).toBe('SPDX');
      expect(result.results!.field_name).toBe('SPDXVersion');
      expect(result.results!.format_version).toBe('2.3');
      expect(result.results!.required).toBe(1);
      expect(result.results!.description).toBeTruthy();
      expect(result.results!.validation_rules).toBeTruthy();
      expect(result.results!.examples).toBeTruthy();
    });

    it('returns a CycloneDX entry by known ID', () => {
      const result = getSbomStandard(db, { standard_id: 'CDX-1.6-001' });
      expect(result.results).not.toBeNull();
      expect(result.results!.id).toBe('CDX-1.6-001');
      expect(result.results!.format).toBe('CycloneDX');
      expect(result.results!.field_name).toBe('bomFormat');
    });

    it('returns null for non-existent ID', () => {
      const result = getSbomStandard(db, { standard_id: 'NON-EXISTENT-999' });
      expect(result.results).toBeNull();
    });

    it('includes correct metadata domain', () => {
      const result = getSbomStandard(db, { standard_id: 'SPDX-2.3-001' });
      expect(result._metadata.domain).toBe('supply-chain-security');
    });
  });

  // ─── searchSbomFields ──────────────────────────────────────────────

  describe('searchSbomFields', () => {
    it('finds entries matching "license"', () => {
      const result = searchSbomFields(db, { query: 'license' });
      expect(result.results.length).toBeGreaterThan(0);
      const hasLicenseField = result.results.some(
        (r) =>
          r.field_name.toLowerCase().includes('license') ||
          r.description.toLowerCase().includes('license'),
      );
      expect(hasLicenseField).toBe(true);
    });

    it('filters by format when specified', () => {
      const result = searchSbomFields(db, { query: 'license', format: 'SPDX' });
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results.every((r) => r.format === 'SPDX')).toBe(true);
    });

    it('filters by CycloneDX format', () => {
      const result = searchSbomFields(db, { query: 'license', format: 'CycloneDX' });
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results.every((r) => r.format === 'CycloneDX')).toBe(true);
    });

    it('returns summary fields (no validation_rules or examples)', () => {
      const result = searchSbomFields(db, { query: 'version' });
      expect(result.results.length).toBeGreaterThan(0);
      const first = result.results[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('format');
      expect(first).toHaveProperty('format_version');
      expect(first).toHaveProperty('field_name');
      expect(first).toHaveProperty('field_type');
      expect(first).toHaveProperty('required');
      expect(first).toHaveProperty('description');
      expect(first).toHaveProperty('category');
      // Summary should not include full detail fields
      expect(first).not.toHaveProperty('validation_rules');
      expect(first).not.toHaveProperty('examples');
    });

    it('returns empty array for nonsense query', () => {
      const result = searchSbomFields(db, { query: 'xyzzyplugh999' });
      expect(result.results).toEqual([]);
    });

    it('includes correct metadata domain', () => {
      const result = searchSbomFields(db, { query: 'license' });
      expect(result._metadata.domain).toBe('supply-chain-security');
    });
  });

  // ─── compareSbomFormats ────────────────────────────────────────────

  describe('compareSbomFormats', () => {
    it('returns SPDX fields for "Document Creation Information"', () => {
      const result = compareSbomFormats(db, { category: 'Document Creation Information' });
      expect(result.results.spdx.length).toBeGreaterThan(0);
      expect(result.results.spdx.every((r) => r.format === 'SPDX')).toBe(true);
      expect(result.results.category).toBe('Document Creation Information');
    });

    it('returns CycloneDX fields for "Component"', () => {
      const result = compareSbomFormats(db, { category: 'Component' });
      expect(result.results.cyclonedx.length).toBeGreaterThan(0);
      expect(result.results.cyclonedx.every((r) => r.format === 'CycloneDX')).toBe(true);
      expect(result.results.category).toBe('Component');
    });

    it('returns both spdx and cyclonedx arrays for "BOM Metadata"', () => {
      const result = compareSbomFormats(db, { category: 'BOM Metadata' });
      // BOM Metadata is a CycloneDX category, so cyclonedx should have entries
      expect(result.results.cyclonedx.length).toBeGreaterThan(0);
      // SPDX may have zero for this specific category name, which is valid
      expect(Array.isArray(result.results.spdx)).toBe(true);
      expect(Array.isArray(result.results.cyclonedx)).toBe(true);
    });

    it('returns empty arrays for non-existent category', () => {
      const result = compareSbomFormats(db, { category: 'Non Existent Category' });
      expect(result.results.spdx).toEqual([]);
      expect(result.results.cyclonedx).toEqual([]);
      expect(result.results.category).toBe('Non Existent Category');
    });

    it('includes correct metadata domain', () => {
      const result = compareSbomFormats(db, { category: 'Component' });
      expect(result._metadata.domain).toBe('supply-chain-security');
    });
  });
});
