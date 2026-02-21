import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { getSupplyChainAttack } from '../../src/tools/get-supply-chain-attack.js';
import { searchAttackPatterns } from '../../src/tools/search-attack-patterns.js';
import { assessCompositionRisk } from '../../src/tools/assess-composition-risk.js';

const TEST_DB_PATH = join(import.meta.dirname, '..', '..', 'data', 'test-threat-tools.db');

describe('Threat Intelligence Tools', () => {
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

  // ─── getSupplyChainAttack ────────────────────────────────────────

  describe('getSupplyChainAttack', () => {
    it('returns an attack by known ID', () => {
      const result = getSupplyChainAttack(db, { attack_id: 'SCA-DEP-001' });
      expect(result.results).not.toBeNull();
      expect(result.results!.id).toBe('SCA-DEP-001');
      expect(result.results!.attack_name).toBe('Internal Package Name Collision via Public Registry');
      expect(result.results!.attack_vector).toBe('dependency_confusion');
      expect(result.results!.description).toBeTruthy();
    });

    it('returns null for non-existent ID', () => {
      const result = getSupplyChainAttack(db, { attack_id: 'NON-EXISTENT-999' });
      expect(result.results).toBeNull();
    });

    it('parses detection_methods as an array', () => {
      const result = getSupplyChainAttack(db, { attack_id: 'SCA-DEP-001' });
      expect(result.results).not.toBeNull();
      expect(Array.isArray(result.results!.detection_methods)).toBe(true);
      expect(result.results!.detection_methods.length).toBeGreaterThan(0);
    });

    it('parses mitigations as an array', () => {
      const result = getSupplyChainAttack(db, { attack_id: 'SCA-DEP-001' });
      expect(result.results).not.toBeNull();
      expect(Array.isArray(result.results!.mitigations)).toBe(true);
      expect(result.results!.mitigations.length).toBeGreaterThan(0);
    });

    it('includes MITRE ATT&CK and CAPEC references', () => {
      const result = getSupplyChainAttack(db, { attack_id: 'SCA-DEP-001' });
      expect(result.results).not.toBeNull();
      expect(result.results!.mitre_attack_id).toBe('T1195.002');
      expect(result.results!.capec_id).toBe('CAPEC-437');
    });

    it('includes correct metadata domain', () => {
      const result = getSupplyChainAttack(db, { attack_id: 'SCA-DEP-001' });
      expect(result._metadata.domain).toBe('supply-chain-security');
    });
  });

  // ─── searchAttackPatterns ────────────────────────────────────────

  describe('searchAttackPatterns', () => {
    it('finds entries matching "dependency confusion"', () => {
      const result = searchAttackPatterns(db, { query: 'dependency confusion' });
      expect(result.results.length).toBeGreaterThan(0);
      const hasMatch = result.results.some(
        (r) =>
          r.attack_name.toLowerCase().includes('dependency') ||
          r.attack_vector === 'dependency_confusion' ||
          r.description.toLowerCase().includes('dependency confusion'),
      );
      expect(hasMatch).toBe(true);
    });

    it('returns summary fields without detection_methods or mitigations', () => {
      const result = searchAttackPatterns(db, { query: 'typosquatting' });
      expect(result.results.length).toBeGreaterThan(0);
      const first = result.results[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('attack_name');
      expect(first).toHaveProperty('description');
      expect(first).toHaveProperty('attack_vector');
      expect(first).toHaveProperty('mitre_attack_id');
      expect(first).toHaveProperty('mitre_tactic');
      expect(first).toHaveProperty('affected_ecosystem');
      // Summary should not include full detail fields
      expect(first).not.toHaveProperty('detection_methods');
      expect(first).not.toHaveProperty('mitigations');
      expect(first).not.toHaveProperty('case_study');
    });

    it('filters by ecosystem when specified', () => {
      const result = searchAttackPatterns(db, { query: 'attack', ecosystem: 'npm' });
      expect(result.results.length).toBeGreaterThan(0);
      expect(
        result.results.every((r) => r.affected_ecosystem?.toLowerCase().includes('npm')),
      ).toBe(true);
    });

    it('returns empty array for nonsense query', () => {
      const result = searchAttackPatterns(db, { query: 'xyzzyplugh999' });
      expect(result.results).toEqual([]);
    });

    it('includes correct metadata domain', () => {
      const result = searchAttackPatterns(db, { query: 'dependency confusion' });
      expect(result._metadata.domain).toBe('supply-chain-security');
    });
  });

  // ─── assessCompositionRisk ───────────────────────────────────────

  describe('assessCompositionRisk', () => {
    it('returns risk_types array with counts', () => {
      const result = assessCompositionRisk(db, {});
      expect(result.results.risk_types.length).toBeGreaterThan(0);
      for (const group of result.results.risk_types) {
        expect(group).toHaveProperty('risk_type');
        expect(group).toHaveProperty('risks');
        expect(group).toHaveProperty('count');
        expect(group.count).toBe(group.risks.length);
        expect(group.count).toBeGreaterThan(0);
      }
    });

    it('total_risks is greater than 0', () => {
      const result = assessCompositionRisk(db, {});
      expect(result.results.total_risks).toBeGreaterThan(0);
    });

    it('total_risks equals the sum of all group counts', () => {
      const result = assessCompositionRisk(db, {});
      const sumOfCounts = result.results.risk_types.reduce((sum, g) => sum + g.count, 0);
      expect(result.results.total_risks).toBe(sumOfCounts);
    });

    it('filters by risk_type', () => {
      const result = assessCompositionRisk(db, { risk_type: 'dependency_confusion' });
      expect(result.results.risk_types.length).toBe(1);
      expect(result.results.risk_types[0].risk_type).toBe('dependency_confusion');
      expect(result.results.risk_types[0].count).toBeGreaterThan(0);
    });

    it('filters by severity', () => {
      const result = assessCompositionRisk(db, { severity: 'critical' });
      expect(result.results.total_risks).toBeGreaterThan(0);
      for (const group of result.results.risk_types) {
        expect(group.risks.every((r) => r.severity === 'critical')).toBe(true);
      }
    });

    it('parses JSON fields in risk entries', () => {
      const result = assessCompositionRisk(db, { risk_type: 'dependency_confusion' });
      const firstRisk = result.results.risk_types[0].risks[0];
      expect(Array.isArray(firstRisk.detection_methods)).toBe(true);
      expect(Array.isArray(firstRisk.prevention_measures)).toBe(true);
      expect(Array.isArray(firstRisk.real_world_examples)).toBe(true);
      expect(Array.isArray(firstRisk.affected_ecosystems)).toBe(true);
      expect(firstRisk.detection_methods.length).toBeGreaterThan(0);
      expect(firstRisk.prevention_measures.length).toBeGreaterThan(0);
    });

    it('includes correct metadata domain', () => {
      const result = assessCompositionRisk(db, {});
      expect(result._metadata.domain).toBe('supply-chain-security');
    });
  });
});
