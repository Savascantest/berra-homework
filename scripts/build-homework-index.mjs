import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('public/homeworks');
const lessons = fs.readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const file = path.join(root, entry.name, 'homework.json');
    if (!fs.existsSync(file)) return null;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return { id: data.id, date: data.date, title: data.title, meetingUuid: data.meetingUuid, path: `${entry.name}/homework.json` };
  })
  .filter(Boolean)
  .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

fs.writeFileSync(path.join(root, 'index.json'), `${JSON.stringify({ student: 'Berra', defaultLessonId: lessons[0]?.id, lessons }, null, 2)}\n`);
console.log(`Indexed ${lessons.length} homework package(s).`);
