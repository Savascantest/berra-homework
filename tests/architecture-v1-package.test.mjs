import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { validatePackage, validatePublicData } from '../scripts/lib/public-package-privacy.mjs';
import { BERRA_ASSESSMENT, BERRA_POLICY, BERRA_TEMPLATE, publicIndexEntry, validatePrePublicExecution } from '../scripts/lib/architecture-v1-package.mjs';

const historicalPath = new URL('../public/homeworks/2026-08-24-ddzldq4usc/homework.json', import.meta.url);
const historical = JSON.parse(await readFile(historicalPath, 'utf8'));

function question(index, answerIndex = index % 4) {
  return { id: `q-${index}`, prompt: `Question ${index}?`, options: ['one', 'two', 'three', 'four'], answerIndex };
}

function futurePackage() {
  return {
    id: '2026-09-18-berrafuture1', date: '2026-09-18', title: 'Fixture only',
    policyVersion: BERRA_POLICY, templateContractVersion: BERRA_TEMPLATE, assessmentPolicyVersion: BERRA_ASSESSMENT,
    units: [{ id: 'review', title: 'Lesson review', grammar: [{ explanation: 'Use the past form. Kısa Türkçe dilbilgisi desteği uygundur.' }], listening: { resource: 'https://example.org/audio' }, speaking: { prompt: 'Tell a partner about yesterday.' }, writing: { prompt: 'Write two sentences.' }, practice: Array.from({ length: 8 }, (_, index) => question(index)) }],
    assessment: { formative: true, feedback: true, retryAllowed: true, resetAllowed: true, scoreThreshold: null },
  };
}

const errors = (data) => validatePackage(data, data.id).join('\n');

test('historical safe package remains valid without Architecture v1 metadata or future answer rules', () => {
  assert.deepEqual(validatePackage(historical, historical.id), []);
  assert.equal(historical.policyVersion, undefined);
});

test('future package requires exact approved Berra policy metadata and rejects Gökçen IDs', () => {
  for (const [key, value] of [['policyVersion', 'wrong@1'], ['templateContractVersion', 'wrong@1'], ['assessmentPolicyVersion', 'wrong@1'], ['policyVersion', 'gokcen-lesson-based@1'], ['templateContractVersion', 'gokcen-workspace@1'], ['assessmentPolicyVersion', 'gokcen-formative@1']]) {
    const data = futurePackage(); data[key] = value;
    assert.match(errors(data), new RegExp(key));
  }
});

test('future opaque ID passes and unsafe UUID-shaped ID fails', () => {
  assert.deepEqual(validatePackage(futurePackage(), futurePackage().id), []);
  const data = futurePackage(); data.id = '2026-09-18-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  assert.match(errors(data), /future package id/);
});

test('future packages remain recursive-privacy safe and cannot publish identity provenance', () => {
  for (const value of [{ meetingUuid: 'private' }, { units: [{ nested: { teacherNote: 'private' } }] }, { identityVerified: true }]) {
    const data = { ...futurePackage(), ...value };
    assert.match(errors(data), /prohibited private field/);
  }
});

test('flexible units and optional listening, speaking, writing pass without fixed historical counts', () => {
  const data = futurePackage();
  assert.equal(data.units.length, 1);
  assert.equal(data.finalQuiz, undefined);
  assert.equal(data.units[0].test, undefined);
  assert.deepEqual(validatePackage(data, data.id), []);
});

test('formative assessments reject thresholds and require feedback, retry, and reset', () => {
  for (const change of [{ scoreThreshold: 12 }, { feedback: false }, { retryAllowed: false }, { resetAllowed: false }]) {
    const data = futurePackage(); Object.assign(data.assessment, change);
    assert.match(errors(data), /assessment must be formative/);
  }
});

test('question structure rejects duplicate IDs, prompts, empty choices, and invalid answer indexes', () => {
  for (const mutate of [
    (data) => { data.units[0].practice[1].id = data.units[0].practice[0].id; },
    (data) => { data.units[0].practice[1].prompt = data.units[0].practice[0].prompt; },
    (data) => { data.units[0].practice[0].options = []; },
    (data) => { data.units[0].practice[0].answerIndex = 8; },
  ]) { const data = futurePackage(); mutate(data); assert.match(errors(data), /duplicate question id|duplicate prompt|non-empty choices|valid answerIndex/); }
});

test('answer-position quality rejects pathological patterns and accepts deterministic mixing', () => {
  for (const positions of [Array(8).fill(0), [0, 1, 0, 1, 0, 1, 0, 1], [0, 1, 2, 2, 2, 3, 0, 1]]) {
    const data = futurePackage(); data.units[0].practice = positions.map((position, index) => question(index, position));
    assert.match(errors(data), /one position|dominance|repeated answer-position triple|alternating/);
  }
  assert.deepEqual(validatePackage(futurePackage(), futurePackage().id), []);
});

test('NO_HOMEWORK is a successful private outcome and unverified identity blocks publication preparation', () => {
  assert.deepEqual(validatePrePublicExecution({ outcome: 'NO_HOMEWORK' }), []);
  assert.match(validatePrePublicExecution({ identityVerified: false }).join('\n'), /identityVerified/);
  assert.deepEqual(validatePrePublicExecution({ identityVerified: true }), []);
});

test('future index metadata is safe and production index receives no fixture', async () => {
  const entry = publicIndexEntry(futurePackage(), futurePackage().id);
  assert.deepEqual(Object.keys(entry).sort(), ['assessmentPolicyVersion', 'date', 'id', 'path', 'policyVersion', 'templateContractVersion', 'title']);
  assert.deepEqual(validatePublicData(entry, 'index'), []);
  const index = JSON.parse(await readFile(new URL('../public/homeworks/index.json', import.meta.url), 'utf8'));
  assert.equal(index.lessons.length, 1);
  assert.equal(index.lessons.some((lesson) => lesson.id === futurePackage().id), false);
});

test('BrowserProgress stays package-scoped and separate from private LearnerState', async () => {
  const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(app, /berra-homework:\$\{hw.id\}/);
  assert.match(app, /archive\.length > 1/);
  assert.match(app, /loadPackage\(archive\.find/);
  assert.doesNotMatch(app, /LearnerState/);
});
