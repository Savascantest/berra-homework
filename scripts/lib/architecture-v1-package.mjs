export const EFFECTIVE_DATE = '2026-09-18';
export const BERRA_POLICY = 'berra-lesson-evidence-first@1';
export const BERRA_TEMPLATE = 'berra-flexible-unit-workspace@1';
export const BERRA_ASSESSMENT = 'berra-formative-unit-and-final-practice@1';

const SAFE_ID = /^\d{4}-\d{2}-\d{2}-[a-z0-9]{10,24}$/;
const POLICY_FIELDS = {
  policyVersion: BERRA_POLICY,
  templateContractVersion: BERRA_TEMPLATE,
  assessmentPolicyVersion: BERRA_ASSESSMENT,
};

export function isFuturePackage(data) {
  return Boolean(data?.date && data.date >= EFFECTIVE_DATE);
}

function questionsIn(value, found = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => questionsIn(item, found));
  } else if (value && typeof value === 'object') {
    if (Array.isArray(value.options) || Array.isArray(value.choices)) found.push(value);
    Object.values(value).forEach((item) => questionsIn(item, found));
  }
  return found;
}

function validateQuestions(data) {
  const errors = [];
  const ids = new Set();
  const prompts = new Set();
  const questions = questionsIn(data.units || []);
  if (data.finalQuiz) questionsIn(data.finalQuiz, questions);
  for (const [index, question] of questions.entries()) {
    const location = `question ${index + 1}`;
    const choices = question.options || question.choices;
    if (!Array.isArray(choices) || !choices.length || choices.some((choice) => typeof choice !== 'string' || !choice.trim())) errors.push(`${location}: non-empty choices are required`);
    if (typeof question.prompt !== 'string' || !question.prompt.trim()) errors.push(`${location}: non-empty prompt is required`);
    if (question.id) {
      if (ids.has(question.id)) errors.push(`${location}: duplicate question id`);
      ids.add(question.id);
    }
    if (question.prompt) {
      if (prompts.has(question.prompt)) errors.push(`${location}: duplicate prompt`);
      prompts.add(question.prompt);
    }
    if (!Number.isInteger(question.answerIndex) || !Array.isArray(choices) || question.answerIndex < 0 || question.answerIndex >= choices.length) errors.push(`${location}: valid answerIndex is required`);
  }
  return { errors, questions };
}

function validateAnswerPositions(questions) {
  const errors = [];
  const meaningful = questions.filter((question) => Number.isInteger(question.answerIndex) && Array.isArray(question.options || question.choices) && (question.options || question.choices).length > 1);
  if (meaningful.length < 6) return errors;
  const positions = meaningful.map((question) => question.answerIndex);
  const counts = new Map();
  positions.forEach((position) => counts.set(position, (counts.get(position) || 0) + 1));
  if (counts.size === 1) errors.push('assessment: all correct answers use one position');
  if (Math.max(...counts.values()) / positions.length > 0.6) errors.push('assessment: severe answer-position dominance');
  for (let index = 0; index <= positions.length - 3; index += 1) {
    if (positions[index] === positions[index + 1] && positions[index] === positions[index + 2]) { errors.push('assessment: obvious repeated answer-position triple'); break; }
  }
  if (positions.length >= 8 && positions.every((position, index) => position === (index % 2))) errors.push('assessment: obvious fixed alternating answer-position pattern');
  return errors;
}

export function validatePrePublicExecution(execution) {
  if (execution?.outcome === 'NO_HOMEWORK') return [];
  return execution?.identityVerified === true ? [] : ['pre-public execution: identityVerified: true is required before a Berra package can be published'];
}

export function validateFuturePackage(data, folderName = data?.id) {
  const errors = [];
  if (!SAFE_ID.test(data.id || '')) errors.push(`${folderName}: future package id must use YYYY-MM-DD-<10-24 lowercase alphanumeric opaque suffix>`);
  if (folderName !== data.id) errors.push(`${folderName}: folder name must match package id`);
  for (const [key, expected] of Object.entries(POLICY_FIELDS)) if (data[key] !== expected) errors.push(`${folderName}: ${key} must be ${expected}`);
  if (!Array.isArray(data.units) || data.units.length < 1) errors.push(`${folderName}: future package needs one or more evidence-driven units`);
  if (data.assessment) {
    if (data.assessment.formative !== true || data.assessment.feedback !== true || data.assessment.retryAllowed !== true || data.assessment.resetAllowed !== true || data.assessment.scoreThreshold != null) errors.push(`${folderName}: assessment must be formative with feedback, retry/reset, and no score threshold`);
  }
  const { errors: questionErrors, questions } = validateQuestions(data);
  errors.push(...questionErrors, ...validateAnswerPositions(questions));
  return errors;
}

export function publicIndexEntry(data, folderName) {
  const entry = { id: data.id, date: data.date, title: data.title, path: `${folderName}/homework.json` };
  if (isFuturePackage(data)) Object.assign(entry, POLICY_FIELDS);
  return entry;
}
