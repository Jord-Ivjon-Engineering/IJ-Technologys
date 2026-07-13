import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'apps', 'crm', 'dist');
const dest = path.join(root, 'frontend', 'crm');

if (!fs.existsSync(path.join(src, 'index.html'))) {
  console.error('CRM build output missing at apps/crm/dist. Run vite build first.');
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log('Copied CRM dist to frontend/crm');
