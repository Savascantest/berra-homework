import fs from 'node:fs';
import path from 'node:path';
import { validatePackage, validatePublicData } from './lib/public-package-privacy.mjs';

const root = path.resolve('public/homeworks');
const lessons = fs.readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const file = path.join(root, entry.name, 'homework.json');
    if (!fs.existsSync(file)) return null;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const errors = validatePackage(data, entry.name);
    if (errors.length) throw new Error(`Invalid public package ${entry.name}: ${errors.join('; ')}`);
    return { id: data.id, date: data.date, title: data.title, path: `${entry.name}/homework.json` };
  })
  .filter(Boolean)
  .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

const index = { student: 'Berra', defaultLessonId: lessons[0]?.id, lessons };
const indexErrors = validatePublicData(index, 'index');
if (indexErrors.length) throw new Error(`Invalid public index: ${indexErrors.join('; ')}`);
fs.writeFileSync(path.join(root, 'index.json'), `${JSON.stringify(index, null, 2)}\n`);
console.log(`Indexed ${lessons.length} homework package(s).`);
