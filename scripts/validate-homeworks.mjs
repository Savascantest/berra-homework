import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('public/homeworks');
const index = JSON.parse(fs.readFileSync(path.join(root, 'index.json'), 'utf8'));
const errors = [];
for (const lesson of index.lessons || []) {
  const file = path.join(root, lesson.path);
  if (!fs.existsSync(file)) { errors.push(`${lesson.id}: package missing`); continue; }
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (data.meetingUuid !== lesson.meetingUuid) errors.push(`${lesson.id}: meeting UUID mismatch`);
  if (data.units?.length !== 3) errors.push(`${lesson.id}: teacher note requires exactly 3 units`);
  for (const unit of data.units || []) {
    for (const key of ['notes', 'vocabulary', 'grammar', 'practice', 'reading', 'test']) {
      if (!unit[key] || (Array.isArray(unit[key]) && !unit[key].length)) errors.push(`${lesson.id}/${unit.id}: ${key} missing`);
    }
    if ((unit.test?.length || 0) < 10) errors.push(`${lesson.id}/${unit.id}: unit test needs at least 10 questions`);
  }
  if ((data.finalQuiz?.length || 0) < 20) errors.push(`${lesson.id}: final quiz needs at least 20 questions`);
  if (!data.teacherNote?.applied) errors.push(`${lesson.id}: teacher-only end note not marked applied`);
}
if (errors.length) { console.error(`Validation failed:\n- ${errors.join('\n- ')}`); process.exit(1); }
console.log(`Validated ${index.lessons.length} package(s), all tabs, 3 units, and teacher-note requirements.`);
