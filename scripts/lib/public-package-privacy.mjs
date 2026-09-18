import { isFuturePackage, validateFuturePackage } from './architecture-v1-package.mjs';

const PROHIBITED_KEY = /^(meetinguuid|meetingid|teachernote|teachernotes|transcript|transcriptid|sourceid|sourceids|lessonrecord|lessonrecordid|routerrun|routerstate|executionreceipt|taskid|learnerstate|studentprofile|privateplanning|planningmetadata|sourcehash|sourcehashes|privatepath|filesystempath|identityverified|identityverification|identityprovenance)$/i;
const UUID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i;
const PRIVATE_PATH = /(?:^[a-z]:[\\/]|(?:^|[\\/])(?:work[\\/]private|Users|home)(?:[\\/]|$))/i;
const SAFE_ID = /^\d{4}-\d{2}-\d{2}-[a-z0-9]{10,24}$/;

function canonicalKey(key) {
  return String(key).replace(/[-_\s]/g, '').toLowerCase();
}

export function validatePublicData(value, location = 'package') {
  const errors = [];
  function visit(current, path) {
    if (Array.isArray(current)) {
      current.forEach((item, index) => visit(item, `${path}[${index}]`));
      return;
    }
    if (current && typeof current === 'object') {
      for (const [key, child] of Object.entries(current)) {
        const childPath = `${path}.${key}`;
        if (PROHIBITED_KEY.test(canonicalKey(key))) errors.push(`${childPath}: prohibited private field`);
        visit(child, childPath);
      }
      return;
    }
    if (typeof current === 'string') {
      if (UUID.test(current)) errors.push(`${path}: UUID-like private identifier is not public`);
      if (PRIVATE_PATH.test(current)) errors.push(`${path}: private filesystem path is not public`);
    }
  }
  visit(value, location);
  return errors;
}

export function validatePackage(data, folderName = data?.id) {
  const errors = validatePublicData(data, `package:${folderName}`);
  if (!data || typeof data !== 'object') return [...errors, `${folderName}: package must be an object`];
  if (!SAFE_ID.test(data.id || '')) errors.push(`${folderName}: package id must use YYYY-MM-DD-<10-24 lowercase alphanumeric opaque suffix>`);
  if (folderName !== data.id) errors.push(`${folderName}: folder name must match public package id`);
  if (isFuturePackage(data)) return [...errors, ...validateFuturePackage(data, folderName)];
  if (!Array.isArray(data.units) || data.units.length !== 3) errors.push(`${folderName}: expected three historical units`);
  for (const unit of data.units || []) {
    for (const key of ['notes', 'vocabulary', 'grammar', 'practice', 'reading', 'test']) {
      if (!unit[key] || (Array.isArray(unit[key]) && !unit[key].length)) errors.push(`${folderName}/${unit.id}: ${key} missing`);
    }
    if ((unit.test?.length || 0) < 10) errors.push(`${folderName}/${unit.id}: unit test needs at least 10 questions`);
  }
  if ((data.finalQuiz?.length || 0) < 20) errors.push(`${folderName}: final quiz needs at least 20 questions`);
  return errors;
}
