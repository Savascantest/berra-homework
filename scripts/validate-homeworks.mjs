import fs from 'node:fs';
import path from 'node:path';
import { validatePackage, validatePublicData } from './lib/public-package-privacy.mjs';

const root = path.resolve('public/homeworks');
const index = JSON.parse(fs.readFileSync(path.join(root, 'index.json'), 'utf8'));
const errors = [];
errors.push(...validatePublicData(index, 'index'));
for (const lesson of index.lessons || []) {
  const file = path.join(root, lesson.path);
  if (!fs.existsSync(file)) { errors.push(`${lesson.id}: package missing`); continue; }
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  errors.push(...validatePackage(data, lesson.id));
}
if (errors.length) { console.error(`Validation failed:\n- ${errors.join('\n- ')}`); process.exit(1); }
console.log(`Validated ${index.lessons.length} public package(s) and privacy boundary.`);
