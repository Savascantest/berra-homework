import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { validatePackage, validatePublicData } from '../scripts/lib/public-package-privacy.mjs';

const packagePath = new URL('../public/homeworks/2026-08-24-ddzldq4usc/homework.json', import.meta.url);
const indexPath = new URL('../public/homeworks/index.json', import.meta.url);
const historical = JSON.parse(await readFile(packagePath, 'utf8'));
const index = JSON.parse(await readFile(indexPath, 'utf8'));
const clone = () => structuredClone(historical);
const errors = (value) => validatePublicData(value).join('\n');

test('repaired historical package validates with Turkish grammar and public HTTPS resources', () => {
  const data = clone();
  data.units[0].grammar[0].rule = 'Türkçe grammar support remains learner-facing.';
  data.units[0].reading.resource = 'https://example.org/listening';
  assert.deepEqual(validatePackage(data, data.id), []);
});

test('safe public package id is required and old UUID-derived id is rejected', () => {
  assert.match(historical.id, /^2026-08-24-[a-z0-9]{10,24}$/);
  const data = clone(); data.id = '2026-08-24-A322BBDD';
  assert.match(validatePackage(data, data.id).join('\n'), /package id/);
});

for (const [name, value] of [
  ['meetingUuid', { meetingUuid: 'private' }],
  ['teacherNote', { teacherNote: { applied: true } }],
  ['nested LessonRecord', { nested: { lessonRecord: 'private' } }],
  ['nested router state', { nested: { routerState: 'private' } }],
  ['ExecutionReceipt', { executionReceipt: {} }],
  ['private planning', { privatePlanning: {} }],
  ['source hash', { sourceHash: 'abc' }],
  ['private filesystem path', { path: 'C:\\work\\private\\lesson.json' }],
]) test(`rejects ${name}`, () => assert.match(errors(value), /prohibited private field|private filesystem path/));

test('index contains the preserved historical package and safe Architecture v1 packages', () => {
  assert.equal(index.lessons.length, 5);
  const historicalEntry = index.lessons.find((lesson) => lesson.id === historical.id);
  assert.equal(historicalEntry.path, `${historical.id}/homework.json`);
  for (const id of ['2026-09-08-c4m9q7z2kp', '2026-09-14-v8d1n6r3xt', '2026-09-16-p5k2w9m7qs', '2026-10-15-r8v2m4k7q9']) assert.equal(index.lessons.some((lesson) => lesson.id === id), true);
  assert.deepEqual(validatePublicData(index, 'index'), []);
  assert.equal(JSON.stringify(index).includes('A322BBDD'), false);
});

test('BrowserProgress remains browser-local and the non-sensitive theme key is preserved', async () => {
  const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(app, /localStorage\.setItem\(lessonKey\(hw\)/);
  assert.match(app, /berra-homework:dark/);
  assert.doesNotMatch(app, /LearnerState/);
});
