import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

if (!process.env.VERCEL) {
  process.exit(0);
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

execSync('npm install --prefix apps/crm --include=dev', { cwd: root, stdio: 'inherit' });
execSync('npm run build --prefix apps/crm', { cwd: root, stdio: 'inherit' });
execSync('node scripts/copy-crm-dist.mjs', { cwd: root, stdio: 'inherit' });
