// Creates (or re-invites) an ADMIN account and prints a one-time link to set
// its password. This is how the very first admin is made: the website itself
// has no public sign-up. Later admins add people from the dashboard.
//
//   npm.cmd run admin:invite -- you@example.com            (local test database)
//   npm.cmd run admin:invite -- you@example.com --remote   (live site)
//   add  --name "Munira"  to set a display name
import { createHash, randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const remote = args.includes('--remote');
const email = args.find((a) => !a.startsWith('--') && a.includes('@'));
const nameIdx = args.indexOf('--name');
const name = nameIdx >= 0 ? (args[nameIdx + 1] ?? '') : '';

if (!email || !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
  console.error('Usage: npm.cmd run admin:invite -- you@example.com [--remote] [--name "Your name"]');
  process.exit(1);
}
if (!/^[\p{L}\p{N} .'-]{0,80}$/u.test(name)) {
  console.error('Please use only letters, numbers, spaces, dots and dashes in the name.');
  process.exit(1);
}

const b64url = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const token = b64url(randomBytes(32));
const tokenHash = b64url(createHash('sha256').update(token).digest());
const now = Math.floor(Date.now() / 1000);
const expires = now + 7 * 86400;
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;

const sql =
  `INSERT INTO users (email, name, role, created_at, invite_hash, invite_expires) ` +
  `VALUES (${q(email)}, ${q(name)}, 'admin', ${now}, ${q(tokenHash)}, ${expires}) ` +
  `ON CONFLICT (email) DO UPDATE SET role = 'admin', disabled = 0, locked_until = 0, failed = 0, ` +
  `invite_hash = excluded.invite_hash, invite_expires = excluded.invite_expires;`;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const wrangler = path.join(root, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const res = spawnSync(process.execPath, [wrangler, 'd1', 'execute', 'islaah', remote ? '--remote' : '--local', '--command', sql], {
  cwd: root,
  stdio: ['inherit', 'pipe', 'inherit'],
  encoding: 'utf8',
});
if (res.status !== 0) {
  console.error('\nCould not write to the database (see the error above).');
  process.exit(1);
}

const base = remote ? 'https://islaah.co.ke' : 'http://localhost:8787';
console.log(`\nAdmin account ready for ${email}.`);
console.log('Open this link to choose a password. It works once and expires in 7 days:\n');
console.log(`  ${base}/admin/#/invite/${token}\n`);
