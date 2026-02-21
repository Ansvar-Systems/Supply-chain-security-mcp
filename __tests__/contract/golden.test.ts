import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { readFileSync, existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

import { getSbomStandard } from '../../src/tools/get-sbom-standard.js';
import { searchSbomFields } from '../../src/tools/search-sbom-fields.js';
import { compareSbomFormats } from '../../src/tools/compare-sbom-formats.js';
import { getSlsaLevel } from '../../src/tools/get-slsa-level.js';
import { searchSlsaRequirements } from '../../src/tools/search-slsa-requirements.js';
import { getSupplyChainRegulation } from '../../src/tools/get-supply-chain-regulation.js';
import { checkCraCompliance } from '../../src/tools/check-cra-compliance.js';
import { mapEo14028 } from '../../src/tools/map-eo14028.js';
import { getSupplyChainAttack } from '../../src/tools/get-supply-chain-attack.js';
import { searchAttackPatterns } from '../../src/tools/search-attack-patterns.js';
import { assessCompositionRisk } from '../../src/tools/assess-composition-risk.js';
import { getSigningPattern } from '../../src/tools/get-signing-pattern.js';
import { searchVerificationMethods } from '../../src/tools/search-verification-methods.js';

interface GoldenTest {
  id: string;
  category: string;
  tool: string;
  input: Record<string, unknown>;
  assertions: {
    not_empty?: boolean;
    text_contains?: string[];
    fields_present?: string[];
    min_results?: number;
    handles_gracefully?: boolean;
    result_null_or_empty?: boolean;
  };
}

const CONTRACT_DB_PATH = join(import.meta.dirname, '..', '..', 'data', 'test-contract.db');

const toolFunctions: Record<string, (db: Database.Database, params: any) => any> = {
  get_sbom_standard: getSbomStandard,
  search_sbom_fields: searchSbomFields,
  compare_sbom_formats: compareSbomFormats,
  get_slsa_level: getSlsaLevel,
  search_slsa_requirements: searchSlsaRequirements,
  get_supply_chain_regulation: getSupplyChainRegulation,
  check_cra_compliance: checkCraCompliance,
  map_eo14028: mapEo14028,
  get_supply_chain_attack: getSupplyChainAttack,
  search_attack_patterns: searchAttackPatterns,
  assess_composition_risk: assessCompositionRisk,
  get_signing_pattern: getSigningPattern,
  search_verification_methods: searchVerificationMethods,
};

describe('Golden Contract Tests', () => {
  let db: Database.Database;
  let goldenTests: GoldenTest[];

  beforeAll(async () => {
    const { buildDatabase } = await import('../../scripts/build-db.js');
    buildDatabase(CONTRACT_DB_PATH);
    db = new Database(CONTRACT_DB_PATH);

    goldenTests = JSON.parse(
      readFileSync(join(import.meta.dirname, '..', '..', 'fixtures', 'golden-tests.json'), 'utf-8'),
    );
  });

  afterAll(() => {
    if (db) db.close();
    if (existsSync(CONTRACT_DB_PATH)) unlinkSync(CONTRACT_DB_PATH);
  });

  it('should load golden tests fixture', () => {
    expect(goldenTests.length).toBe(16);
  });

  // Dynamically generate tests from golden-tests.json
  describe.each([
    'sc-001', 'sc-002', 'sc-003', 'sc-004', 'sc-005', 'sc-006',
    'sc-007', 'sc-008', 'sc-009', 'sc-010', 'sc-011', 'sc-012',
    'sc-013', 'sc-014', 'sc-015', 'sc-016',
  ])('Golden test %s', (testId) => {
    it(`passes contract assertions`, () => {
      const test = goldenTests.find((t) => t.id === testId);
      expect(test).toBeDefined();
      if (!test) return;

      const toolFn = toolFunctions[test.tool];
      expect(toolFn, `Tool function ${test.tool} not found`).toBeDefined();

      const response = toolFn(db, test.input);
      expect(response).toBeDefined();
      expect(response._metadata).toBeDefined();

      const { assertions } = test;
      const result = response.results;

      if (assertions.result_null_or_empty) {
        const isEmpty = result === null || result === undefined ||
          (Array.isArray(result) && result.length === 0);
        expect(isEmpty, `Expected null or empty result for ${testId}`).toBe(true);
        return;
      }

      if (assertions.not_empty) {
        if (Array.isArray(result)) {
          expect(result.length, `Expected non-empty array for ${testId}`).toBeGreaterThan(0);
        } else {
          expect(result, `Expected non-null result for ${testId}`).not.toBeNull();
        }
      }

      if (assertions.fields_present && result && !Array.isArray(result)) {
        for (const field of assertions.fields_present) {
          expect(result, `Expected field ${field} in ${testId}`).toHaveProperty(field);
        }
      }

      if (assertions.fields_present && Array.isArray(result) && result.length > 0) {
        for (const field of assertions.fields_present) {
          expect(result[0], `Expected field ${field} in first result of ${testId}`).toHaveProperty(field);
        }
      }

      if (assertions.text_contains && result) {
        const json = JSON.stringify(result).toLowerCase();
        for (const text of assertions.text_contains) {
          expect(json, `Expected ${testId} to contain "${text}"`).toContain(text.toLowerCase());
        }
      }

      if (assertions.min_results && Array.isArray(result)) {
        expect(result.length, `Expected at least ${assertions.min_results} results for ${testId}`).toBeGreaterThanOrEqual(assertions.min_results);
      }
    });
  });
});
