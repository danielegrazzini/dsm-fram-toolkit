#!/usr/bin/env node
/**
 * be_engine_equivalence.js — dsm-fram-toolkit verification
 * ---------------------------------------------------------
 * Checks that engine/be_engine.js computes exactly what the B-E Simulator
 * computes. The simulator's own code (MATH CORE block and the sampling loop
 * of runSim) is extracted verbatim from the HTML file and run headless; the
 * module and the extracted code are fed the same seeded random sequence, and
 * every result must be identical to the last bit (no tolerance).
 *
 * Usage:  node tests/be_engine_equivalence.js [simulators/DSM_B-E_Simulator_v7.2.1.html]
 * Requires: Node >= 14. No dependencies, no browser.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const BE = require('../engine/be_engine.js');

const ROOT = path.join(__dirname, '..');
const htmlPath = process.argv[2] || path.join(ROOT, 'simulators', 'DSM_B-E_Simulator_v7.2.1.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// ── simulator code, verbatim ──────────────────────────────────────────────
const core = html.match(/\/\/ ══ MATH CORE[\s\S]*?return\{S,C:ActC\.reduce\(\(s,c,i\)=>s\+c\*Wd\[i\],0\),gantt\};\n\}/);
const loop = html.match(/const chunk=Math\.min\(CHUNK,rMax-r\);[\s\S]*?r\+=chunk;if\(useStab&&r>=2\*b&&stable\(curSimS,b,alpha\)\)stab=true;/);
if (!core || !loop) { console.error('FAIL: simulator code not found in ' + htmlPath); process.exit(1); }

// The simulator code runs in its own context, with Math.random replaced by a seeded generator.
function simulatorContext(seed, fullRadius) {
  const M = Object.create(Math); M.random = BE.seededRng(seed);
  const ctx = vm.createContext({ Math, Array, Infinity, isFinite });
  ctx.Math = M;
  vm.runInContext(`var useFullRadius = ${fullRadius};\n` + core[0] +
    `\nfunction runLoop(rMax,b,alpha,rho,n,runActs,runProb,runImp,useComono,useLHS,useStab){` +
    `const CHUNK=40;const curSimS=[],curSimC=[];let curGantt=[];let r=0,stab=false;` +
    `while(r<rMax&&!stab){${loop[0]}}return {S:curSimS,C:curSimC,runs:curSimS.length,stable:stab,gantt:curGantt};}`, ctx);
  return ctx;
}

// ── UCAV case from data/ (impact of the empty cell (5,8) = 0, as in the simulator) ──
const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'UCAV_source_verified_S12.json'), 'utf8'));
const n = d.activities.length;
const ACTS = d.activities.map(a => ({ bs: a.bcv, ms: a.mlv, ws: a.wcv, bc: a.cost_bcv, mc: a.cost_mlv, wc: a.cost_wcv, ic: a.ic }));
const PROB = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => d.prob_pairs[`${i + 1},${j + 1}`] ?? 0));
const IMP = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => d.impact_pairs[`${i + 1},${j + 1}`] ?? 0));

let fails = 0;
function check(label, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  —  ' + detail : ''}`);
  if (!ok) fails++;
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// 1. Distribution helpers on a grid of inputs
{
  const ctx = simulatorContext(1, false);
  let maxd = 0, cnt = 0;
  for (let k = 1; k < 1000; k++) {
    const u = k / 1000;
    const pairs = [
      [BE.triICDF(u, 1.9, 2, 3), ctx.triICDF(u, 1.9, 2, 3)],
      [BE.phiInv(u), ctx.phiInv(u)],
      [BE.phi(4 * u - 2), ctx.phi(4 * u - 2)],
      [BE.corrU(u, 1 - u, 0.9), ctx.corrU(u, 1 - u, 0.9)]];
    for (const [a, b] of pairs) { cnt++; if (a !== b) maxd = Math.max(maxd, Math.abs(a - b)); }
  }
  check('helpers (triICDF, phiInv, phi, corrU) identical', maxd === 0, `${cnt} values, max |delta| = ${maxd}`);
}

// 2. Latin hypercube sampling with the same seed
{
  const ctx = simulatorContext(7, false);
  const a = BE.lhs(40, 14, BE.seededRng(7)), b = ctx.lhs(40, 14);
  check('lhs(40, 14) identical with the same seed', same(a, b));
}

// 3. Single runs on the UCAV case, both rework radii
for (const fullRadius of [false, true]) {
  const ctx = simulatorContext(11, fullRadius);
  const rngB = BE.seededRng(11), uGen = BE.seededRng(99);
  let ok = true, runs = 500;
  for (let r = 0; r < runs && ok; r++) {
    const us = Array.from({ length: n }, () => uGen()), uc = Array.from({ length: n }, () => uGen());
    const a = BE.singleRunWith(us, uc, 0.9, r === 0, n, ACTS, PROB, IMP, { fullRadius, rng: rngB });
    const b = ctx.singleRunWith(us, uc, 0.9, r === 0, n, ACTS, PROB, IMP);
    if (!same(a, b)) ok = false;
  }
  check(`singleRunWith on UCAV, ${fullRadius ? 'full' : 'limited'} radius: ${runs} runs identical (S, C, Gantt)`, ok);
}

// 4. Whole Monte Carlo campaigns, every sampling mode (the last case stops on the stability criterion)
for (const [comonotone, useLHS, useStab, fullRadius, alpha] of [
  [false, true, false, false, 0.01], [true, true, false, true, 0.01], [false, false, false, false, 0.01],
  [true, false, true, true, 0.01], [false, true, true, false, 0.05]]) {
  const seed = 2026;
  const ctx = simulatorContext(seed, fullRadius);
  const a = BE.simulate({ acts: ACTS, prob: PROB, imp: IMP, runs: 1100, batch: 100, alpha, rho: 0.9,
    comonotone, useLHS, useStab, fullRadius, rng: BE.seededRng(seed) });
  const b = ctx.runLoop(1100, 100, alpha, 0.9, n, ACTS, PROB, IMP, comonotone, useLHS, useStab);
  const s = BE.summary(a.S, a.C);
  check(`simulate: comonotone=${comonotone} LHS=${useLHS} stability=${useStab} fullRadius=${fullRadius}`,
    same(a, b), `${a.runs} runs identical${a.stable ? ' (stopped by stability)' : ''}, E[S]=${s.ES.toFixed(2)} E[C]=${s.EC.toFixed(2)}`);
}

// 5. Negative control: the comparison must detect a difference when one exists
{
  const ctx = simulatorContext(2026, false);
  const a = BE.simulate({ acts: ACTS, prob: PROB, imp: IMP, runs: 200, fullRadius: true, rng: BE.seededRng(2026) });
  const b = ctx.runLoop(200, 100, 0.01, 0.9, n, ACTS, PROB, IMP, false, true, false);
  check('negative control: different rework radius is detected as a difference', !same(a, b));
}

console.log(fails === 0 ? '✓ ALL CHECKS PASSED — engine module identical to the simulator' : `✗ ${fails} CHECK(S) FAILED`);
process.exit(fails === 0 ? 0 : 1);
