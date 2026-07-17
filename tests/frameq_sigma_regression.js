#!/usr/bin/env node
/**
 * FRAME-Q — regression test for the "elicited sigma" patch (S29)
 * ============================================================================
 * Verifies that sigma_i is taken from the elicited value when present, that the
 * Browning-Eppinger duration-derived fallback still reproduces the previous
 * behaviour exactly, and that the input guards hold.
 *
 * The test extracts the <script> block from the simulator HTML and runs it in a
 * Node vm context with a minimal DOM stub. No dependencies, no browser.
 *
 *   Usage:  node tests/frameq_sigma_regression.js [path/to/FRAMEQ_Simulator.html]
 *   Exit:   0 = all tests passed, 1 = at least one failure
 *
 * Reference values for the non-regression test (T1) were produced by S28, the
 * version in which sigma was always derived as (WCV-BCV)/(6*MLV).
 *
 * MIT License — Daniele Grazzini, 2026
 */
'use strict';
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const HTML = process.argv[2] || path.join(__dirname, '..', 'simulators', 'FRAMEQ_Simulator.html');

// ── minimal DOM stub ─────────────────────────────────────────────────────────
const store = {};
const el = id => store[id] || (store[id] = {
  id, value: id === 'nu-inp' ? '10' : '', textContent: '', innerHTML: '',
  style: {}, className: '', disabled: false, width: 300, height: 200,
  classList: { add() {}, remove() {}, contains() { return false; } },
  appendChild() {}, addEventListener() {},
  getBoundingClientRect() { return { width: 300, height: 200, left: 0, top: 0 }; },
  getContext() { return new Proxy({}, { get: () => (() => ({})) }); }
});

function makeContext() {
  const ctx = vm.createContext({
    document: { getElementById: el, createElement: () => el('tmp'), body: { appendChild() {} } },
    window: {}, alert() {}, console, Math, JSON, Float64Array, Set, Object, Array,
    Number, String, Date, isNaN, parseFloat, parseInt, setTimeout,
    requestAnimationFrame: f => f(), performance: { now: () => 0 }
  });
  const html = fs.readFileSync(HTML, 'utf8');
  const blocks = html.match(/<script>([\s\S]*?)<\/script>/g) || [];
  if (!blocks.length) throw new Error('No <script> block found in ' + HTML);
  const js = blocks.map(b => b.replace(/^<script>/, '').replace(/<\/script>$/, ''))
                   .sort((a, b) => b.length - a.length)[0];
  vm.runInContext(js, ctx);
  return ctx;
}

// ── tiny assertion harness ───────────────────────────────────────────────────
let failures = 0;
const check = (name, cond, detail) => {
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  —  ' + detail : ''}`);
  if (!cond) failures++;
};
const maxAbs = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));

const ctx = makeContext();
const R = code => vm.runInContext(code, ctx);

// ── T1 — non-regression: UCAV has no sigma field, must behave exactly as S28 ──
console.log('\nT1 — UCAV legacy path (no elicited sigma): must reproduce S28 exactly');
R(`acts = UCAV_DEFAULT.acts.map(a => ({...a}));
   mActive = new Set(); mData = {};
   Object.entries(UCAV_DEFAULT.m_pairs).forEach(([k, v]) => { mActive.add(k); mData[k] = [...v]; });
   computed = { step1: null, step3: null }; calcStep1();`);
const s1 = R('computed.step1');
const ucav = R('UCAV_DEFAULT.acts');
const expSigma = ucav.map(a => (a.wcv - a.bcv) / (6 * a.mlv));      // the S28 formula
const sumD = ucav.reduce((s, a) => s + a.mlv, 0);
const expW = ucav.map(a => a.mlv / sumD);                            // the S28 weights
check('step 1 completes', s1 !== null);
check('sigma identical to the duration-derived formula', maxAbs(s1.sigMu, expSigma) === 0,
      'max|delta| = ' + maxAbs(s1.sigMu, expSigma));
check('R_net weights identical to the duration share', maxAbs(s1.wDur, expW) === 0,
      'max|delta| = ' + maxAbs(s1.wDur, expW));
check('duration mode detected', s1.allDur === true && s1.nSig === 0);
R('calcStep2(); calcStep3();');
const rnet = R('computed.step3.Rnet');
const valid = R('computed.step3.valid');
check('R_net matches the S28 reference value 1.040429', Math.abs(rnet - 1.040429) < 5e-7,
      'R_net = ' + rnet.toFixed(6) + ' on ' + valid + ' valid functions');

// ── T2 — elicited sigma, no durations at all ─────────────────────────────────
console.log('\nT2 — elicited sigma path (no duration triples)');
R(`acts = [
     { nm: 'F1', sigma: 0.25 }, { nm: 'F2', sigma: 0.60 }, { nm: 'F3', sigma: 0.45 },
     { nm: 'F4', sigma: 0.65 }, { nm: 'F5', sigma: 0.30 }
   ];
   mActive = new Set(['1,2', '2,3', '3,4', '4,5', '2,5']);
   mData = { '1,2': [0.7,0,0,0,0,0], '2,3': [0,0,0.8,0,0,0], '3,4': [0,0,0,0,0.6,0],
             '4,5': [0.5,0,0,0.4,0,0], '2,5': [0,0,0,0,0.55,0] };
   computed = { step1: null, step3: null }; calcStep1();`);
const s2 = R('computed.step1');
const elicited = [0.25, 0.60, 0.45, 0.65, 0.30];
check('step 1 completes without durations', s2 !== null);
check('sigma taken from the elicited values', s2 && maxAbs(s2.sigMu, elicited) === 0,
      s2 ? 'max|delta| = ' + maxAbs(s2.sigMu, elicited) : '');
check('all activities flagged as elicited', s2 && s2.nSig === 5 && s2.allDur === false);
check('R_net weights fall back to uniform 1/n', s2 && Math.abs(s2.wDur[0] - 1 / 5) < 1e-12
      && Math.abs(s2.wDur.reduce((a, b) => a + b, 0) - 1) < 1e-12);
R('calcStep2(); calcStep3();');
check('propagation runs end to end', R('computed.step3') !== null,
      'R_net = ' + R('computed.step3.Rnet').toFixed(6));

// ── T3 — mixed mode: elicited sigma and durations side by side ───────────────
console.log('\nT3 — mixed mode (some elicited, some derived)');
R(`acts = [{ nm: 'A', sigma: 0.4 }, { nm: 'B', bcv: 2, mlv: 4, wcv: 8 }, { nm: 'C', sigma: 0.55 }];
   mActive = new Set(); mData = {}; computed = { step1: null }; calcStep1();`);
const s3 = R('computed.step1');
check('elicited value wins where present', s3 && Math.abs(s3.sigMu[0] - 0.40) < 1e-12);
check('derived value used where sigma is absent', s3 && Math.abs(s3.sigMu[1] - 0.25) < 1e-12,
      '(8-2)/(6*4) = 0.25');
check('second elicited value preserved', s3 && Math.abs(s3.sigMu[2] - 0.55) < 1e-12);
check('weights uniform when durations are incomplete', s3 && s3.allDur === false);

// ── T4 — input guards ────────────────────────────────────────────────────────
console.log('\nT4 — input guards');
const guard = setup => { R(setup + ' computed = { step1: null }; calcStep1();'); return R('computed.step1') === null; };
check('sigma >= 1 rejected',
      guard(`acts = [{nm:'X',sigma:1.2},{nm:'Y',sigma:0.3},{nm:'Z',sigma:0.4}];`));
check('sigma = 0 rejected (Beta undefined at the bounds)',
      guard(`acts = [{nm:'X',sigma:0},{nm:'Y',sigma:0.3},{nm:'Z',sigma:0.4}];`));
check('activity with neither sigma nor a duration triple rejected',
      guard(`acts = [{nm:'X'},{nm:'Y',sigma:0.3},{nm:'Z',sigma:0.4}];`));
check('BCV > MLV still rejected in duration mode',
      guard(`acts = [{nm:'X',bcv:5,mlv:2,wcv:8},{nm:'Y',sigma:0.3},{nm:'Z',sigma:0.4}];`));

// ── summary ──────────────────────────────────────────────────────────────────
console.log(`\n${failures === 0 ? 'ALL TESTS PASSED' : failures + ' TEST(S) FAILED'}\n`);
process.exit(failures === 0 ? 0 : 1);
