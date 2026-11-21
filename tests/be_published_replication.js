#!/usr/bin/env node
/**
 * be_published_replication.js — dsm-fram-toolkit verification
 * ------------------------------------------------------------
 * Replicates the published Browning & Eppinger (2002) results for the UCAV
 * baseline architecture with the B-E engine (engine/be_engine.js, the same
 * code as the B-E Simulator: see tests/be_engine_equivalence.js) on the UCAV
 * case data in data/UCAV_source_verified_S12.json.
 *
 * Configuration: B&E-fidelity mode (comonotone sampling + full-radius
 * second-order rework), as established in Test 1 (Session 12, 18 Jul 2026).
 * Pass criteria are the pre-registered tolerances of PREREG_U4:
 *   |E[C]-637| <= 6.5   |E[S]-138| <= 2.0   |sC-63| <= 5.0   |sS-14| <= 1.5
 * The no-iteration reference (615 / 55 / 133 / 13) is asserted first: it is
 * the arithmetic signature of comonotone sampling (sigma_C = sum of sigma_i).
 *
 * Usage:  node tests/be_published_replication.js
 * Requires: Node >= 14. No dependencies, no browser.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const BE = require('../engine/be_engine.js');

// ── UCAV case (impact of the empty cell (5,8) = 0, as in the simulator) ──
const d = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'UCAV_source_verified_S12.json'), 'utf8'));
const n = d.activities.length;
const ACTS = d.activities.map(a => ({ bs: a.bcv, ms: a.mlv, ws: a.wcv, bc: a.cost_bcv, mc: a.cost_mlv, wc: a.cost_wcv, ic: a.ic }));
const PROB = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => d.prob_pairs[`${i + 1},${j + 1}`] ?? 0));
const IMP = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => d.impact_pairs[`${i + 1},${j + 1}`] ?? 0));
const ZIMP = Array.from({ length: n }, () => new Array(n).fill(0));

const RHO = 0.9, R = 5000, NREP = 5;
// No-rework variant: zero impacts (banding preserved on the probability matrix; rework adds 0).
function campaign(noRework) {
  const allS = [], allC = [];
  for (let rep = 0; rep < NREP; rep++) {
    const res = BE.simulate({ acts: ACTS, prob: PROB, imp: noRework ? ZIMP : IMP, runs: R, rho: RHO,
      comonotone: true, useLHS: true, useStab: false, fullRadius: true });
    allS.push(...res.S); allC.push(...res.C);
  }
  return BE.summary(allS, allC);
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

console.log(fails === 0 ? '✓ ALL CHECKS PASSED' : `✗ ${fails} CHECK(S) FAILED`);
process.exit(fails === 0 ? 0 : 1);
