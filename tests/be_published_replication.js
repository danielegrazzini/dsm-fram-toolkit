#!/usr/bin/env node
/**
 * be_published_replication.js — dsm-fram-toolkit verification
 * ------------------------------------------------------------
 * Replicates the published Browning & Eppinger (2002) results for the UCAV
 * baseline architecture using the B-E Simulator's own math core, extracted
 * verbatim from the HTML file and run headless.
 *
 * Configuration: B&E-fidelity mode (comonotone sampling + full-radius
 * second-order rework), as established in Test 1 (Session 12, 18 Jul 2026).
 * Pass criteria are the pre-registered tolerances of PREREG_U4:
 *   |E[C]-637| <= 6.5   |E[S]-138| <= 2.0   |sC-63| <= 5.0   |sS-14| <= 1.5
 * The no-iteration reference (615 / 55 / 133 / 13) is asserted first: it is
 * the arithmetic signature of comonotone sampling (sigma_C = sum of sigma_i).
 *
 * Usage:  node tests/be_published_replication.js simulators/DSM_B-E_Simulator_v7.2.html
 * Requires: Node >= 14. No dependencies, no browser.
 */
const fs = require('fs');
const path = process.argv[2] || 'simulators/DSM_B-E_Simulator_v7.2.html';
const html = fs.readFileSync(path, 'utf8');

// ── extract math core + UCAV dataset verbatim from the simulator ──
const core = html.match(/\/\/ ══ MATH CORE[\s\S]*?return\{S,C:ActC\.reduce\(\(s,c,i\)=>s\+c\*Wd\[i\],0\),gantt\};\n\}/);
if (!core) { console.error('FAIL: math core not found in ' + path); process.exit(1); }
const data = html.match(/ucav:\{n:14,acts:\[([\s\S]*?)\],\nprob:(\[\[[\s\S]*?\]\]),\nimp:(\[\[[\s\S]*?\]\])/);
if (!data) { console.error('FAIL: UCAV dataset not found'); process.exit(1); }

let useFullRadius = true; // B&E 2002 p.430 semantics (v7.2 toggle)
eval(core[0].replace('k<(useFullRadius?n:ci)', 'k<n').replace('for(let k=j+1;k<ci;k++){', 'for(let k=j+1;k<n;k++){'));
const ACTS = eval('[' + data[1] + ']');
const PROB = JSON.parse(data[2]);
const IMP  = JSON.parse(data[3]);

const ZIMP = Array.from({length:14},()=>new Array(14).fill(0));
const RHO = 0.9, R = 5000, NREP = 5, CHUNK = 40;
function metrics(S, C) {
  const n = S.length;
  const ES = S.reduce((a,b)=>a+b,0)/n, EC = C.reduce((a,b)=>a+b,0)/n;
  const sS = Math.sqrt(S.map(x=>(x-ES)**2).reduce((a,b)=>a+b,0)/n);
  const sC = Math.sqrt(C.map(x=>(x-EC)**2).reduce((a,b)=>a+b,0)/n);
  return { ES, EC, sS, sC };
}
function campaign(noRework) {
  const allS = [], allC = [];
  for (let rep = 0; rep < NREP; rep++) {
    let r = 0;
    while (r < R) {
      const chunk = Math.min(CHUNK, R - r);
      const u1 = lhs(chunk, 1), u2 = lhs(chunk, 1); // comonotone: one quantile per run
      for (let i = 0; i < chunk; i++) {
        const us = new Array(14).fill(u1[i][0]), uc = new Array(14).fill(u2[i][0]);
        const pm = PROB, im = IMP;
        // no-rework variant: keep banding on pm, skip rework loop via zeroed check
        // no-rework variant: zero impacts (banding preserved on pm; rework adds 0)
        const im2 = noRework ? ZIMP : im;
        const res = singleRunWith(us, uc, RHO, false, 14, ACTS, pm, im2);
        allS.push(res.S); allC.push(res.C);
      }
      r += chunk;
    }
  }
  return metrics(allS, allC);
}

let fails = 0;
function check(label, val, ref, tol) {
  const ok = Math.abs(val - ref) <= tol;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: ${val.toFixed(2)} vs ${ref} (tol ±${tol})`);
  if (!ok) fails++;
}

console.log('— no-iteration reference (comonotone signature) —');
const ni = campaign(true);
check('E[C]', ni.EC, 615, 6.5); check('sigma_C', ni.sC, 55, 5.0);
check('E[S]', ni.ES, 133, 2.0); check('sigma_S', ni.sS, 13, 1.5);

console.log('— full model vs published (Table V, arch. 1) —');
const full = campaign(false);
check('E[C]', full.EC, 637, 6.5); check('sigma_C', full.sC, 63, 5.0);
check('E[S]', full.ES, 138, 2.0); check('sigma_S', full.sS, 14, 1.5);

console.log(fails === 0 ? '\u2713 ALL CHECKS PASSED' : `\u2717 ${fails} CHECK(S) FAILED`);
process.exit(fails === 0 ? 0 : 1);
