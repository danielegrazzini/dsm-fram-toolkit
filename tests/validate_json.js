#!/usr/bin/env node
/*
 * validate_json.js — checks files in the shared dsm-fram-toolkit JSON format
 * (schema "dsm-fram-toolkit-v1", specified in docs/json-format.md).
 *
 * Usage:
 *   node tests/validate_json.js                 validate every data/*.json file
 *   node tests/validate_json.js file1.json ...  validate the given files
 *   node tests/validate_json.js --self-test     check that the validator detects
 *                                               known errors in broken examples
 *
 * Exit status: 0 if no file has errors, 1 otherwise. Warnings do not fail.
 * No dependencies: plain Node.js.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const SCHEMA = 'dsm-fram-toolkit-v1';
const isNum = v => typeof v === 'number' && Number.isFinite(v);
const in01 = v => isNum(v) && v >= 0 && v <= 1;

function validate(data) {
  const errors = [], warnings = [], notes = [];
  const E = m => errors.push(m), W = m => warnings.push(m), N = m => notes.push(m);

  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    E('top level must be a JSON object'); return { errors, warnings, notes, skipped: false };
  }
  if (data._schema !== SCHEMA) {
    if (typeof data._schema === 'string' && data._schema.startsWith('dsm-fram-toolkit-')) {
      N(`record format "${data._schema}", not a simulator input: skipped`);
      return { errors, warnings, notes, skipped: true };
    }
    E(`_schema must be "${SCHEMA}" (found ${JSON.stringify(data._schema)})`);
    return { errors, warnings, notes, skipped: false };
  }

  // activities
  const acts = data.activities;
  if (!Array.isArray(acts) || acts.length < 2) {
    E('activities must be an array with at least 2 elements');
    return { errors, warnings, notes, skipped: false };
  }
  const n = acts.length;
  acts.forEach((a, k) => {
    const tag = `activities[${k}]`;
    if (a === null || typeof a !== 'object') { E(`${tag} must be an object`); return; }
    if (typeof a.name !== 'string' || !a.name.trim()) E(`${tag}.name must be a non-empty string`);
    if (a.id !== undefined && a.id !== k + 1) E(`${tag}.id must be ${k + 1} (1-based position), found ${a.id}`);
    const b = a.bcv ?? a.bs, m = a.mlv ?? a.ms, w = a.wcv ?? a.ws;
    const hasDur = b !== undefined || m !== undefined || w !== undefined;
    if (hasDur) {
      if (![b, m, w].every(v => isNum(v) && v > 0)) E(`${tag}: duration triple bcv/mlv/wcv must be three positive numbers`);
      else if (!(b <= m && m <= w)) E(`${tag}: durations must satisfy bcv <= mlv <= wcv (found ${b}, ${m}, ${w})`);
    }
    if (a.sigma !== undefined && !(isNum(a.sigma) && a.sigma > 0 && a.sigma < 1)) E(`${tag}.sigma must be a number with 0 < sigma < 1`);
    if (!hasDur && a.sigma === undefined) W(`${tag}: no duration triple and no sigma (simulators will use default values)`);
    const cb = a.cost_bcv, cm = a.cost_mlv, cw = a.cost_wcv;
    if (cb !== undefined || cm !== undefined || cw !== undefined) {
      if (![cb, cm, cw].every(v => isNum(v) && v >= 0)) E(`${tag}: cost triple cost_bcv/cost_mlv/cost_wcv must be three non-negative numbers`);
      else if (!(cb <= cm && cm <= cw)) E(`${tag}: costs must satisfy cost_bcv <= cost_mlv <= cost_wcv (found ${cb}, ${cm}, ${cw})`);
    }
    if (a.ic !== undefined && !in01(a.ic)) E(`${tag}.ic (learning curve) must be in [0, 1]`);
  });

  // square 0/1 matrix helper
  const checkMatrix = (M, name, cell) => {
    if (!Array.isArray(M) || M.length !== n || !M.every(r => Array.isArray(r) && r.length === n)) {
      E(`${name} must be a ${n}x${n} matrix`); return false;
    }
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const msg = cell(M[i][j], i, j);
      if (msg) { E(`${name}[${i}][${j}]: ${msg}`); return false; }
    }
    return true;
  };

  // binary_dsm
  let B = null;
  if (data.binary_dsm !== undefined) {
    const ok = checkMatrix(data.binary_dsm, 'binary_dsm', (v, i, j) =>
      (v !== 0 && v !== 1) ? 'entries must be 0 or 1' : (i === j && v === 1) ? 'diagonal must be 0' : null);
    if (ok) B = data.binary_dsm;
  }

  // pair dictionaries
  const parseKey = (key, name) => {
    const m = /^(\d+),(\d+)$/.exec(key);
    if (!m) { E(`${name}: key "${key}" must have the form "i,j"`); return null; }
    const i = +m[1], j = +m[2];
    if (i < 1 || i > n || j < 1 || j > n) { E(`${name}: key "${key}" outside 1..${n}`); return null; }
    if (i === j) { E(`${name}: key "${key}" is on the diagonal`); return null; }
    return [i, j];
  };
  const pairDict = (name, checkValue) => {
    const P = data[name];
    if (P === undefined) return null;
    if (P === null || typeof P !== 'object' || Array.isArray(P)) { E(`${name} must be an object of "i,j" keys`); return null; }
    const keys = new Set();
    for (const [key, v] of Object.entries(P)) {
      const ij = parseKey(key, name); if (!ij) continue;
      const msg = checkValue(v); if (msg) E(`${name}["${key}"]: ${msg}`);
      keys.add(key);
      if (B && B[ij[0] - 1][ij[1] - 1] !== 1) E(`${name}["${key}"]: pair is not a dependency in binary_dsm`);
    }
    return keys;
  };
  const mKeys = pairDict('m_pairs', v =>
    (!Array.isArray(v) || v.length !== 6) ? 'must be an array of 6 numbers [I, O, P, R, C, T]'
      : v.every(in01) ? null : 'each of the 6 aspect values must be in [0, 1]');
  const iKeys = pairDict('impact_pairs', v => in01(v) ? null : 'impact must be in [0, 1]');
  const pKeys = pairDict('prob_pairs', v => in01(v) ? null : 'probability must be in [0, 1]');
  if (pKeys) N('prob_pairs is a data-record field: the current simulators do not read it (B-E reads rework probabilities from be_matrices.prob)');

  // be_matrices (B-E lossless block)
  if (data.be_matrices !== undefined) {
    const bm = data.be_matrices;
    if (bm === null || typeof bm !== 'object') E('be_matrices must be an object');
    else {
      checkMatrix(bm.prob, 'be_matrices.prob', v => in01(v) ? null : 'must be in [0, 1]');
      checkMatrix(bm.impact, 'be_matrices.impact', v => in01(v) ? null : 'must be in [0, 1]');
      checkMatrix(bm.binary_dsm, 'be_matrices.binary_dsm', v => (v === 0 || v === 1) ? null : 'must be 0 or 1');
    }
  }

  // coverage of the dependencies
  if (!B && !mKeys) W('neither binary_dsm nor m_pairs: the file defines no dependencies');
  if (B) {
    const missM = [], missI = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (B[i][j] === 1) {
      const key = `${i + 1},${j + 1}`;
      if (mKeys && !mKeys.has(key)) missM.push(key);
      if (iKeys && !iKeys.has(key)) missI.push(key);
    }
    if (missM.length) W(`dependencies without m_pairs entry (FEBS uses the neutral seed 0.5): ${missM.join(' ')}`);
    if (missI.length) W(`dependencies without impact_pairs entry (B-E and FEBS default the impact to 0.5): ${missI.join(' ')}`);
  }
  return { errors, warnings, notes, skipped: false };
}

function report(label, res) {
  const status = res.errors.length ? 'FAIL' : res.skipped ? 'SKIP' : res.warnings.length ? 'PASS (with warnings)' : 'PASS';
  console.log(`${status}  ${label}`);
  res.errors.forEach(m => console.log(`   error:   ${m}`));
  res.warnings.forEach(m => console.log(`   warning: ${m}`));
  res.notes.forEach(m => console.log(`   note:    ${m}`));
  return res.errors.length === 0;
}

function selfTest() {
  const base = () => ({
    _schema: SCHEMA,
    activities: [
      { id: 1, name: 'A', bcv: 1, mlv: 2, wcv: 3, cost_bcv: 1, cost_mlv: 2, cost_wcv: 3, ic: 0.5 },
      { id: 2, name: 'B', bcv: 1, mlv: 2, wcv: 3, cost_bcv: 1, cost_mlv: 2, cost_wcv: 3, ic: 0.5 }],
    binary_dsm: [[0, 0], [1, 0]],
    m_pairs: { '2,1': [0.5, 0.5, 0.5, 0.5, 0.5, 0.5] },
    impact_pairs: { '2,1': 0.4 }
  });
  const cases = [
    ['valid minimal file', d => d, 0],
    ['wrong _schema', d => { d._schema = 'other'; }, 1],
    ['one activity only', d => { d.activities.pop(); }, 1],
    ['durations not ordered', d => { d.activities[0].mlv = 5; }, 1],
    ['ic outside [0,1]', d => { d.activities[1].ic = 1.5; }, 1],
    ['diagonal dependency', d => { d.binary_dsm[0][0] = 1; }, 1],
    ['m_pairs vector of 5 values', d => { d.m_pairs['2,1'] = [0.5, 0.5, 0.5, 0.5, 0.5]; }, 1],
    ['aspect value above 1', d => { d.m_pairs['2,1'][0] = 1.2; }, 1],
    ['pair not in binary_dsm', d => { d.m_pairs['1,2'] = [0, 0, 0, 0, 0, 0]; }, 1],
    ['key outside 1..n', d => { d.impact_pairs['3,1'] = 0.1; }, 1],
    ['impact above 1', d => { d.impact_pairs['2,1'] = 2; }, 1],
    ['missing impact (warning only)', d => { delete d.impact_pairs['2,1']; }, 0]
  ];
  let ok = true;
  console.log('Validator self-test');
  for (const [name, mutate, expectErrors] of cases) {
    const d = base(); mutate(d);
    const res = validate(d);
    const got = res.errors.length > 0 ? 1 : 0;
    const pass = got === expectErrors;
    if (!pass) ok = false;
    console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name} — expected ${expectErrors ? 'errors' : 'no errors'}, got ${res.errors.length} error(s)`);
  }
  console.log(ok ? '✓ SELF-TEST PASSED' : '✗ SELF-TEST FAILED');
  return ok;
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--self-test')) process.exit(selfTest() ? 0 : 1);
  let files = args;
  if (!files.length) {
    const dir = path.join(__dirname, '..', 'data');
    files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().map(f => path.join(dir, f));
  }
  let allOk = true;
  for (const f of files) {
    let data;
    try { data = JSON.parse(fs.readFileSync(f, 'utf8')); }
    catch (e) { console.log(`FAIL  ${path.basename(f)}\n   error:   not valid JSON (${e.message})`); allOk = false; continue; }
    if (!report(path.basename(f), validate(data))) allOk = false;
  }
  console.log(allOk ? '✓ ALL FILES VALID' : '✗ SOME FILES HAVE ERRORS');
  process.exit(allOk ? 0 : 1);
}

if (require.main === module) main();
module.exports = { validate };
