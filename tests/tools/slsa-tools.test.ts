import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { getSlsaLevel } from '../../src/tools/get-slsa-level.js';
import { searchSlsaRequirements } from '../../src/tools/search-slsa-requirements.js';
import { assessSlsaPosture } from '../../src/tools/assess-slsa-posture.js';

const TEST_DB_PATH = join(import.meta.dirname, '..', '..', 'data', 'test-slsa-tools.db');

describe('SLSA Framework Tools', () => {
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

  // ─── getSlsaLevel ──────────────────────────────────────────────────

  describe('getSlsaLevel', () => {
    it('returns a requirement by known requirement_id', () => {
      const result = getSlsaLevel(db, { requirement_id: 'L1.provenance-exists' });
      expect(result.results).not.toBeNull();
      expect(result.results!.id).toBe('SLSA-L1-001');
      expect(result.results!.level).toBe(1);
      expect(result.results!.requirement_id).toBe('L1.provenance-exists');
      expect(result.results!.title).toBe('Provenance Exists');
      expect(result.results!.description).toBeTruthy();
      expect(result.results!.verification_criteria).toBeTruthy();
      expect(result.results!.build_system_guidance).toBeTruthy();
      expect(result.results!.category).toBe('Provenance');
    });

    it('parses evidence_types as an array', () => {
      const result = getSlsaLevel(db, { requirement_id: 'L1.provenance-exists' });
      expect(result.results).not.toBeNull();
      expect(Array.isArray(result.results!.evidence_types)).toBe(true);
      expect(result.results!.evidence_types.length).toBeGreaterThan(0);
      expect(result.results!.evidence_types).toContain('build_log');
    });

    it('parses framework_mappings as an object', () => {
      const result = getSlsaLevel(db, { requirement_id: 'L1.provenance-exists' });
      expect(result.results).not.toBeNull();
      expect(typeof result.results!.framework_mappings).toBe('object');
      expect(result.results!.framework_mappings).not.toBeNull();
      expect(result.results!.framework_mappings).toHaveProperty('SSDF');
    });

    it('returns null for non-existent requirement_id', () => {
      const result = getSlsaLevel(db, { requirement_id: 'NON-EXISTENT-999' });
      expect(result.results).toBeNull();
    });

    it('includes correct metadata domain', () => {
      const result = getSlsaLevel(db, { requirement_id: 'L1.provenance-exists' });
      expect(result._metadata.domain).toBe('supply-chain-security');
    });
  });

  // ─── searchSlsaRequirements ─────────────────────────────────────────

  describe('searchSlsaRequirements', () => {
    it('finds entries matching "provenance"', () => {
      const result = searchSlsaRequirements(db, { query: 'provenance' });
      expect(result.results.length).toBeGreaterThan(0);
      const hasProvenance = result.results.some(
        (r) =>
          r.title.toLowerCase().includes('provenance') ||
          r.description.toLowerCase().includes('provenance'),
      );
      expect(hasProvenance).toBe(true);
    });

    it('filters by level when specified', () => {
      const result = searchSlsaRequirements(db, { query: 'build', level: 2 });
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results.every((r) => r.level === 2)).toBe(true);
    });

    it('returns summary fields only', () => {
      const result = searchSlsaRequirements(db, { query: 'provenance' });
      expect(result.results.length).toBeGreaterThan(0);
      const first = result.results[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('level');
      expect(first).toHaveProperty('requirement_id');
      expect(first).toHaveProperty('title');
      expect(first).toHaveProperty('description');
      expect(first).toHaveProperty('category');
      // Summary should not include full detail fields
      expect(first).not.toHaveProperty('evidence_types');
      expect(first).not.toHaveProperty('framework_mappings');
      expect(first).not.toHaveProperty('verification_criteria');
      expect(first).not.toHaveProperty('build_system_guidance');
    });

    it('returns empty array for nonsense query', () => {
      const result = searchSlsaRequirements(db, { query: 'xyzzyplugh999' });
      expect(result.results).toEqual([]);
    });

    it('includes correct metadata domain', () => {
      const result = searchSlsaRequirements(db, { query: 'provenance' });
      expect(result._metadata.domain).toBe('supply-chain-security');
    });
  });

  // ─── assessSlsaPosture ──────────────────────────────────────────────

  describe('assessSlsaPosture', () => {
    it('returns all levels when no level filter is specified', () => {
      const result = assessSlsaPosture(db, {});
      expect(result.results.levels.length).toBe(4);
      expect(result.results.levels[0].level).toBe(1);
      expect(result.results.levels[1].level).toBe(2);
      expect(result.results.levels[2].level).toBe(3);
      expect(result.results.levels[3].level).toBe(4);
    });

    it('has total_requirements > 0', () => {
      const result = assessSlsaPosture(db, {});
      expect(result.results.total_requirements).toBeGreaterThan(0);
    });

    it('levels array has counts matching requirements length', () => {
      const result = assessSlsaPosture(db, {});
      for (const level of result.results.levels) {
        expect(level.count).toBe(level.requirements.length);
        expect(level.count).toBeGreaterThan(0);
      }
    });

    it('total_requirements equals sum of all level counts', () => {
      const result = assessSlsaPosture(db, {});
      const sum = result.results.levels.reduce((acc, l) => acc + l.count, 0);
      expect(result.results.total_requirements).toBe(sum);
    });

    it('filters to a single level when level is specified', () => {
      const result = assessSlsaPosture(db, { level: 3 });
      expect(result.results.levels.length).toBe(1);
      expect(result.results.levels[0].level).toBe(3);
      expect(result.results.levels[0].count).toBeGreaterThan(0);
      expect(result.results.total_requirements).toBe(result.results.levels[0].count);
    });

    it('requirements contain summary fields', () => {
      const result = assessSlsaPosture(db, { level: 1 });
      const req = result.results.levels[0].requirements[0];
      expect(req).toHaveProperty('id');
      expect(req).toHaveProperty('level');
      expect(req).toHaveProperty('requirement_id');
      expect(req).toHaveProperty('title');
      expect(req).toHaveProperty('description');
      expect(req).toHaveProperty('category');
    });

    it('includes correct metadata domain', () => {
      const result = assessSlsaPosture(db, {});
      expect(result._metadata.domain).toBe('supply-chain-security');
    });
  });
});
