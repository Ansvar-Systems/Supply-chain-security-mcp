import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { getSupplyChainRegulation } from '../../src/tools/get-supply-chain-regulation.js';
import { checkCraCompliance } from '../../src/tools/check-cra-compliance.js';
import { mapEo14028 } from '../../src/tools/map-eo14028.js';

const TEST_DB_PATH = join(import.meta.dirname, '..', '..', 'data', 'test-regulation-tools.db');

describe('Regulation Tools', () => {
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

  // ─── getSupplyChainRegulation ──────────────────────────────────────

  describe('getSupplyChainRegulation', () => {
    it('returns a CRA entry by known ID', () => {
      const result = getSupplyChainRegulation(db, { regulation_id: 'CRA-ART-001' });
      expect(result.results).not.toBeNull();
      expect(result.results!.id).toBe('CRA-ART-001');
      expect(result.results!.regulation).toBe('EU_CRA');
      expect(result.results!.article_or_section).toBe('Article 1');
      expect(result.results!.title).toBe('Subject Matter and Scope');
      expect(result.results!.description).toBeTruthy();
      expect(result.results!.regulation_version).toBe('2024/2847');
    });

    it('returns an EO 14028 entry by known ID', () => {
      const result = getSupplyChainRegulation(db, { regulation_id: 'EO14028-SEC-001' });
      expect(result.results).not.toBeNull();
      expect(result.results!.id).toBe('EO14028-SEC-001');
      expect(result.results!.regulation).toBe('EO_14028');
      expect(result.results!.title).toBe('Policy');
    });

    it('returns null for non-existent ID', () => {
      const result = getSupplyChainRegulation(db, { regulation_id: 'NON-EXISTENT-999' });
      expect(result.results).toBeNull();
    });

    it('parses requirements as an array', () => {
      const result = getSupplyChainRegulation(db, { regulation_id: 'CRA-ART-001' });
      expect(result.results).not.toBeNull();
      expect(Array.isArray(result.results!.requirements)).toBe(true);
      expect(result.results!.requirements.length).toBeGreaterThan(0);
    });

    it('parses framework_mappings as an object', () => {
      const result = getSupplyChainRegulation(db, { regulation_id: 'CRA-ART-001' });
      expect(result.results).not.toBeNull();
      expect(typeof result.results!.framework_mappings).toBe('object');
      expect(result.results!.framework_mappings).not.toBeNull();
    });

    it('includes correct metadata domain', () => {
      const result = getSupplyChainRegulation(db, { regulation_id: 'CRA-ART-001' });
      expect(result._metadata.domain).toBe('supply-chain-security');
    });
  });

  // ─── checkCraCompliance ────────────────────────────────────────────

  describe('checkCraCompliance', () => {
    it('returns total_articles > 0', () => {
      const result = checkCraCompliance(db, {});
      expect(result.results.total_articles).toBeGreaterThan(0);
    });

    it('articles array is non-empty', () => {
      const result = checkCraCompliance(db, {});
      expect(result.results.articles.length).toBeGreaterThan(0);
    });

    it('all articles have regulation EU_CRA', () => {
      const result = checkCraCompliance(db, {});
      expect(result.results.articles.every((a) => a.regulation === 'EU_CRA')).toBe(true);
    });

    it('essential_requirements is non-empty', () => {
      const result = checkCraCompliance(db, {});
      expect(result.results.essential_requirements.length).toBeGreaterThan(0);
    });

    it('essential_requirements contain Annex I entries', () => {
      const result = checkCraCompliance(db, {});
      const hasAnnexI = result.results.essential_requirements.some(
        (r) => r.article_or_section.includes('Annex I'),
      );
      expect(hasAnnexI).toBe(true);
    });

    it('essential_requirements contain entries with "essential" keyword', () => {
      const result = checkCraCompliance(db, {});
      const hasEssentialKeyword = result.results.essential_requirements.some(
        (r) => r.keywords && r.keywords.toLowerCase().includes('essential'),
      );
      expect(hasEssentialKeyword).toBe(true);
    });

    it('filters by article when specified', () => {
      const result = checkCraCompliance(db, { article: 'Article 1' });
      expect(result.results.total_articles).toBe(1);
      expect(result.results.articles[0].article_or_section).toBe('Article 1');
    });

    it('total_articles matches articles array length', () => {
      const result = checkCraCompliance(db, {});
      expect(result.results.total_articles).toBe(result.results.articles.length);
    });

    it('articles contain summary fields', () => {
      const result = checkCraCompliance(db, {});
      const first = result.results.articles[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('regulation');
      expect(first).toHaveProperty('article_or_section');
      expect(first).toHaveProperty('title');
      expect(first).toHaveProperty('description');
      expect(first).toHaveProperty('keywords');
    });

    it('includes correct metadata domain', () => {
      const result = checkCraCompliance(db, {});
      expect(result._metadata.domain).toBe('supply-chain-security');
    });
  });

  // ─── mapEo14028 ────────────────────────────────────────────────────

  describe('mapEo14028', () => {
    it('returns eo_sections > 0', () => {
      const result = mapEo14028(db, {});
      expect(result.results.eo_sections.length).toBeGreaterThan(0);
    });

    it('total_sections matches eo_sections array length', () => {
      const result = mapEo14028(db, {});
      expect(result.results.total_sections).toBe(result.results.eo_sections.length);
    });

    it('all sections have regulation EO_14028', () => {
      const result = mapEo14028(db, {});
      expect(result.results.eo_sections.every((s) => s.regulation === 'EO_14028')).toBe(true);
    });

    it('filters by section when specified', () => {
      const result = mapEo14028(db, { section: 'Section 4' });
      expect(result.results.total_sections).toBe(1);
      expect(result.results.eo_sections[0].article_or_section).toBe('Section 4');
    });

    it('does not include ssdf_crosswalk when include_ssdf is false', () => {
      const result = mapEo14028(db, { include_ssdf: false });
      expect(result.results.ssdf_crosswalk).toBeUndefined();
    });

    it('includes ssdf_crosswalk when include_ssdf is true', () => {
      const result = mapEo14028(db, { include_ssdf: true });
      expect(result.results.ssdf_crosswalk).toBeDefined();
      expect(Array.isArray(result.results.ssdf_crosswalk)).toBe(true);
      expect(result.results.ssdf_crosswalk!.length).toBe(result.results.eo_sections.length);
    });

    it('ssdf_crosswalk contains related SSDF entries for Section 4', () => {
      const result = mapEo14028(db, { include_ssdf: true });
      const section4 = result.results.ssdf_crosswalk!.find(
        (c) => c.eo_section === 'Section 4',
      );
      expect(section4).toBeDefined();
      expect(section4!.related_ssdf.length).toBeGreaterThan(0);
    });

    it('ssdf_crosswalk entries have expected structure', () => {
      const result = mapEo14028(db, { include_ssdf: true });
      const entry = result.results.ssdf_crosswalk![0];
      expect(entry).toHaveProperty('eo_section');
      expect(entry).toHaveProperty('related_ssdf');
      expect(Array.isArray(entry.related_ssdf)).toBe(true);
    });

    it('eo_sections contain summary fields', () => {
      const result = mapEo14028(db, {});
      const first = result.results.eo_sections[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('regulation');
      expect(first).toHaveProperty('article_or_section');
      expect(first).toHaveProperty('title');
      expect(first).toHaveProperty('description');
      expect(first).toHaveProperty('keywords');
    });

    it('includes correct metadata domain', () => {
      const result = mapEo14028(db, {});
      expect(result._metadata.domain).toBe('supply-chain-security');
    });
  });
});
