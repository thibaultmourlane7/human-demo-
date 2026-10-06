import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const ignored = new Set(['.git', 'node_modules', 'dist']);
const forbiddenPaths = ['supabase/migrations', 'supabase/functions', 'server/private', 'internal'];
const forbiddenPatterns = [
  /sb_secret_[a-z0-9_-]+/i,
  /service[_-]?role/i,
  /SUPABASE_SERVICE_ROLE_KEY/,
  /DATABASE_URL/,
  /POSTGRES_PASSWORD/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];

const failures = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (ignored.has(name)) continue;
    const full = join(dir, name);
    const rel = relative(root, full).replaceAll('\\', '/');
    const info = statSync(full);
    if (info.isDirectory()) {
      if (forbiddenPaths.some((value) => rel.includes(value))) failures.push(`Chemin privé interdit: ${rel}`);
      walk(full);
      continue;
    }
    if (rel === 'scripts/check-public-boundary.mjs') continue;
    const text = readFileSync(full, 'utf8');
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(text)) failures.push(`Motif sensible ${pattern} détecté dans ${rel}`);
    }
  }
}

walk(root);

if (failures.length) {
  console.error('ÉCHEC — frontière public/privé non respectée');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('OK — aucun secret ou chemin privé détecté dans human-demo.');
