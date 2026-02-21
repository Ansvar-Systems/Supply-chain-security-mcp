import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

interface GoldenHash {
  id: string;
  description: string;
  upstream_url: string;
  selector_hint: string;
  expected_sha256: string;
  expected_snippet: string;
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Ansvar-DriftDetect/1.0 (security@ansvar.eu)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

async function main() {
  const hashesPath = join(import.meta.dirname, '..', 'fixtures', 'golden-hashes.json');
  const hashes: GoldenHash[] = JSON.parse(readFileSync(hashesPath, 'utf-8'));

  console.log(`Checking ${hashes.length} drift detection anchors...\n`);

  let driftDetected = false;
  const results: Array<{ id: string; status: string; detail?: string }> = [];

  for (const hash of hashes) {
    try {
      const body = await fetchPage(hash.upstream_url);

      // Check if expected snippet is still present
      if (!body.includes(hash.expected_snippet)) {
        results.push({
          id: hash.id,
          status: 'DRIFT',
          detail: `Expected snippet "${hash.expected_snippet}" not found in page`,
        });
        driftDetected = true;
        continue;
      }

      // If we have a known hash, compare
      if (hash.expected_sha256 !== 'COMPUTE_ON_FIRST_INGEST') {
        const currentHash = sha256(body);
        if (currentHash !== hash.expected_sha256) {
          results.push({
            id: hash.id,
            status: 'DRIFT',
            detail: `SHA256 changed: expected ${hash.expected_sha256.slice(0, 16)}..., got ${currentHash.slice(0, 16)}...`,
          });
          driftDetected = true;
          continue;
        }
      }

      results.push({ id: hash.id, status: 'OK' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({ id: hash.id, status: 'ERROR', detail: message });
    }
  }

  // Print results
  for (const r of results) {
    const icon = r.status === 'OK' ? '✓' : r.status === 'DRIFT' ? '✗' : '!';
    console.log(`[${icon}] ${r.id}: ${r.status}${r.detail ? ` — ${r.detail}` : ''}`);
  }

  if (driftDetected) {
    console.log('\n⚠ Upstream drift detected. Review and update seed data.');
    process.exit(1);
  } else {
    console.log('\n✓ No drift detected.');
  }
}

main().catch((err) => {
  console.error('Drift detection failed:', err);
  process.exit(2);
});
