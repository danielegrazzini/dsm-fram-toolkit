#!/usr/bin/env node
/**
 * febs_be_reduction_equivalence.js — dsm-fram-toolkit verification
 * -----------------------------------------------------------------
 * Demonstrates the FEBS -> B-E reduction (FEBS paper Sec. 3.7) numerically on
 * the UCAV case: with uniform tensor components equal to the B-E rework
 * probabilities, beta = 1, threshold percentile p = 1 and Pbase = max(DSM1),
 * the FEBS pipeline reproduces P_ij = DSM1_ij exactly and the FEBS Monte
 * Carlo engine is statistically equivalent to the B-E engine.
 *
 * The reduction dataset is derived from the B-E simulator's own (verified)
 * UCAV matrices — no external data file is needed. Mirror configuration and
 * strong-equivalence thresholds follow PREREG_U4, Amendment 1 (18 Jul 2026):
 *   |dE[C]| <= 2.0   |dE[S]| <= 0.4   |d sigma_C| <= 1.5   |d sigma_S| <= 0.3
 *
 * Usage:
 *   node tests/febs_be_reduction_equivalence.js \
 *        simulators/FEBS_Simulator_v6.html simulators/DSM_B-E_Simulator_v7.2.html
 * Requires: Node >= 14. No dependencies, no browser.
 */
const fs = require('fs');
const febsPath = process.argv[2] || 'simulators/FEBS_Simulator_v6.html';
const bePath   = process.argv[3] || 'simulators/DSM_B-E_Simulator_v7.2.html';
const febsHtml = fs.readFileSync(febsPath, 'utf8');
const beHtml   = fs.readFileSync(bePath, 'utf8');

// ── extract both cores verbatim ──
const febsCore = febsHtml.match(/\/\/ ═══ FEBS MATH CORE[\s\S]*?return\{S,C,gantt,freq:freq_run\};\n\}/);
const helpers = ['triICDF','phiInv','phi','erf','corrU','lhs']
  .map(f => (febsHtml.match(new RegExp('function ' + f + '\\(.*?\\n')) || [null])[0])
  .join('\n');
const beCore = beHtml.match(/function bandingWith[\s\S]*?return\{S,C:ActC\.reduce\(\(s,c,i\)=>s\+c\*Wd\[i\],0\),gantt\};\n\}/);
const beData = beHtml.match(/ucav:\{n:14,acts:\[([\s\S]*?)\],\nprob:(\[\[[\s\S]*?\]\]),\nimp:(\[\[[\s\S]*?\]\])/);
if (!febsCore || !beCore || !beData) { console.error('FAIL: extraction failed'); process.exit(1); }

let useFullRadius = true; // mirror: full radius including the triggering cycle (FEBS semantics)
eval(helpers);
eval(febsCore[0]);
eval(beCore[0].replace('k<(useFullRadius?n:ci)', 'k<n').replace('for(let k=j+1;k<ci;k++){', 'for(let k=j+1;k<n;k++){'));
function getWeights(){ return [1/6,1/6,1/6,1/6,1/6,1/6]; }

// ── reduction dataset derived from B-E matrices ──
let N = 14;
const fns = eval('[' + beData[1] + ']');
const PROB = JSON.parse(beData[2]);
const impactM = JSON.parse(beData[3]);           // (5,8) impact is 0 in the verified data
const tensorM = Array.from({length:14}, (_,i) =>
  Array.from({length:14}, (_,j) => PROB[i][j] > 0 ? new Array(6).fill(PROB[i][j]) : null));
const dsmB = PROB.map(row => row.map(v => v > 0 ? 1 : 0));

// ── FEBS pipeline in degenerate configuration ──
const cfg = febsInit(1, 1.0, 0.5);
const P2D = Array.from({length:14}, () => new Array(14).fill(0));
Object.entries(cfg.P).forEach(([k,v]) => { const [a,b] = k.split(',').map(Number); P2D[a][b] = v; });
let maxdev = 0;
for (let a = 0; a < 14; a++) for (let b = 0; b < 14; b++) maxdev = Math.max(maxdev, Math.abs(P2D[a][b] - PROB[a][b]));
console.log(`P(FEBS reduced) vs DSM1: max deviation = ${maxdev.toExponential(2)} (must be < 1e-12) — active pairs: ${cfg.activePairs}`);
if (maxdev >= 1e-12) { console.error('FAIL: reduction mapping is not exact'); process.exit(1); }

// ── twin Monte Carlo campaigns ──
const RHO = 0.9, R = 5000, NREP = 5;
function metrics(S, C) {
  const n = S.length;
  const ES = S.reduce((a,b)=>a+b,0)/n, EC = C.reduce((a,b)=>a+b,0)/n;
  const sS = Math.sqrt(S.map(x=>(x-ES)**2).reduce((a,b)=>a+b,0)/n);
  const sC = Math.sqrt(C.map(x=>(x-EC)**2).reduce((a,b)=>a+b,0)/n);
  return { ES, EC, sS, sC };
}
function campaign(engine) {
  const allS = [], allC = [];
  for (let rep = 0; rep < NREP; rep++) {
    const us = lhs(R, 14), uc = lhs(R, 14);   // independent per-activity sampling (both sides)
    for (let i = 0; i < R; i++) {
      const res = engine === 'febs'
        ? singleRun(P2D, us[i], uc[i], RHO, false)
        : singleRunWith(us[i], uc[i], RHO, false, 14, fns, PROB, impactM);
      allS.push(res.S); allC.push(res.C);
    }
  }
  return metrics(allS, allC);
}
const A = campaign('febs'), B = campaign('be');

let fails = 0;
function check(label, d, tol) {
  const ok = Math.abs(d) <= tol;
  console.log(`${ok ? 'PASS' : 'FAIL'}  delta ${label} = ${d >= 0 ? '+' : ''}${d.toFixed(3)} (tol ±${tol})`);
  if (!ok) fails++;
}
console.log(`FEBS reduced : E[C]=${A.EC.toFixed(2)} sC=${A.sC.toFixed(2)} E[S]=${A.ES.toFixed(2)} sS=${A.sS.toFixed(3)}`);
console.log(`B-E mirror   : E[C]=${B.EC.toFixed(2)} sC=${B.sC.toFixed(2)} E[S]=${B.ES.toFixed(2)} sS=${B.sS.toFixed(3)}`);
check('E[C]', A.EC - B.EC, 2.0);
check('E[S]', A.ES - B.ES, 0.4);
check('sigma_C', A.sC - B.sC, 1.5);
check('sigma_S', A.sS - B.sS, 0.3);
console.log(fails === 0 ? '\u2713 ALL CHECKS PASSED — strong equivalence' : `\u2717 ${fails} CHECK(S) FAILED`);
process.exit(fails === 0 ? 0 : 1);
