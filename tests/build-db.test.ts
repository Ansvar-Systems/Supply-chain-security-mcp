import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const TEST_DB_PATH = join(import.meta.dirname, '..', 'data', 'test.db');

describe('build-db schema', () => {
  let db: Database.Database;

  beforeAll(async () => {
    const { buildDatabase } = await import('../scripts/build-db.js');
    buildDatabase(TEST_DB_PATH);
    db = new Database(TEST_DB_PATH);
  });

  afterAll(() => {
    if (db) db.close();
    if (existsSync(TEST_DB_PATH)) unlinkSync(TEST_DB_PATH);
  });

  it('should create sbom_standards table with correct columns', () => {
    const columns = db.pragma('table_info(sbom_standards)') as Array<{ name: string }>;
    const names = columns.map((c) => c.name);
    expect(names).toContain('id');
    expect(names).toContain('format');
    expect(names).toContain('format_version');
    expect(names).toContain('field_name');
    expect(names).toContain('field_type');
    expect(names).toContain('required');
    expect(names).toContain('description');
    expect(names).toContain('validation_rules');
    expect(names).toContain('examples');
    expect(names).toContain('equivalent_field');
    expect(names).toContain('category');
    expect(names).toContain('keywords');
    expect(names).toContain('last_updated');
  });

  it('should create slsa_requirements table with correct columns', () => {
    const columns = db.pragma('table_info(slsa_requirements)') as Array<{ name: string }>;
    const names = columns.map((c) => c.name);
    expect(names).toContain('id');
    expect(names).toContain('level');
    expect(names).toContain('requirement_id');
    expect(names).toContain('title');
    expect(names).toContain('description');
    expect(names).toContain('evidence_types');
    expect(names).toContain('verification_criteria');
    expect(names).toContain('build_system_guidance');
    expect(names).toContain('category');
    expect(names).toContain('framework_mappings');
    expect(names).toContain('keywords');
  });

  it('should create supply_chain_regulations table with correct columns', () => {
    const columns = db.pragma('table_info(supply_chain_regulations)') as Array<{ name: string }>;
    const names = columns.map((c) => c.name);
    expect(names).toContain('id');
    expect(names).toContain('regulation');
    expect(names).toContain('regulation_version');
    expect(names).toContain('article_or_section');
    expect(names).toContain('title');
    expect(names).toContain('description');
    expect(names).toContain('requirements');
    expect(names).toContain('applicability');
    expect(names).toContain('effective_date');
    expect(names).toContain('enforcement');
    expect(names).toContain('framework_mappings');
    expect(names).toContain('keywords');
  });

  it('should create supply_chain_attacks table with correct columns', () => {
    const columns = db.pragma('table_info(supply_chain_attacks)') as Array<{ name: string }>;
    const names = columns.map((c) => c.name);
    expect(names).toContain('id');
    expect(names).toContain('attack_name');
    expect(names).toContain('description');
    expect(names).toContain('attack_vector');
    expect(names).toContain('mitre_attack_id');
    expect(names).toContain('mitre_tactic');
    expect(names).toContain('capec_id');
    expect(names).toContain('case_study');
    expect(names).toContain('affected_ecosystem');
    expect(names).toContain('impact');
    expect(names).toContain('detection_methods');
    expect(names).toContain('mitigations');
    expect(names).toContain('keywords');
  });

  it('should create signing_verification table with correct columns', () => {
    const columns = db.pragma('table_info(signing_verification)') as Array<{ name: string }>;
    const names = columns.map((c) => c.name);
    expect(names).toContain('id');
    expect(names).toContain('tool_name');
    expect(names).toContain('description');
    expect(names).toContain('use_case');
    expect(names).toContain('specification_url');
    expect(names).toContain('key_management');
    expect(names).toContain('verification_steps');
    expect(names).toContain('integration_patterns');
    expect(names).toContain('ecosystem');
    expect(names).toContain('keywords');
  });

  it('should create composition_risks table with correct columns', () => {
    const columns = db.pragma('table_info(composition_risks)') as Array<{ name: string }>;
    const names = columns.map((c) => c.name);
    expect(names).toContain('id');
    expect(names).toContain('risk_type');
    expect(names).toContain('title');
    expect(names).toContain('description');
    expect(names).toContain('attack_mechanism');
    expect(names).toContain('detection_methods');
    expect(names).toContain('prevention_measures');
    expect(names).toContain('real_world_examples');
    expect(names).toContain('affected_ecosystems');
    expect(names).toContain('severity');
    expect(names).toContain('keywords');
  });

  it('should create regulation_versions (premium) table', () => {
    const columns = db.pragma('table_info(regulation_versions)') as Array<{ name: string }>;
    const names = columns.map((c) => c.name);
    expect(names).toContain('id');
    expect(names).toContain('regulation_id');
    expect(names).toContain('version_label');
    expect(names).toContain('effective_date');
    expect(names).toContain('body_text');
    expect(names).toContain('scraped_at');
    expect(names).toContain('change_summary');
    expect(names).toContain('diff_from_previous');
  });

  it('should create all 6 FTS5 virtual tables', () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%fts%'")
      .all() as Array<{ name: string }>;
    const names = tables.map((t) => t.name);
    expect(names).toContain('sbom_standards_fts');
    expect(names).toContain('slsa_requirements_fts');
    expect(names).toContain('supply_chain_regulations_fts');
    expect(names).toContain('supply_chain_attacks_fts');
    expect(names).toContain('signing_verification_fts');
    expect(names).toContain('composition_risks_fts');
  });

  it('should have db_metadata table with required keys', () => {
    const meta = db.prepare('SELECT key, value FROM db_metadata').all() as Array<{ key: string; value: string }>;
    const keys = meta.map((m) => m.key);
    expect(keys).toContain('tier');
    expect(keys).toContain('schema_version');
    expect(keys).toContain('built_at');
    expect(keys).toContain('domain');

    const domainRow = meta.find((m) => m.key === 'domain');
    expect(domainRow?.value).toBe('supply-chain-security');
  });
});
