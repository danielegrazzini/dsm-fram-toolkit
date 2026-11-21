/**
 * be_engine.js — Browning-Eppinger (2002) stochastic process-model engine
 * ----------------------------------------------------------------------
 * Part of dsm-fram-toolkit (MIT licence).
 *
 * This module is the computation engine of the B-E Simulator
 * (simulators/DSM_B-E_Simulator_v7.2.1.html, "MATH CORE" block and the
 * sampling loop of runSim), written as a standalone module so that it can be
 * used from code and tested directly. It is a faithful transcription with two
 * changes of form only:
 *   - the random-number generator is a parameter (`rng`, default Math.random),
 *     so that runs can be made reproducible with a seeded generator;
 *   - the "full-radius second-order rework" switch is an option
 *     (`fullRadius`) instead of the global variable `useFullRadius`.
 * Given the same sequence of random numbers it produces exactly the same
 * results as the simulator: tests/be_engine_equivalence.js checks this.
 *
 * Conventions: activities are objects {bs, ms, ws, bc, mc, wc, ic}
 * (duration and cost triples, learning-curve factor); prob[i][j] and
 * imp[i][j] are the rework probability and impact of activity i caused by
 * activity j (row depends on column), 0-based.
 *
 * Works in Node (require) and in the browser (global `BEEngine`).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BEEngine = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ── distributions and helpers ─────────────────────────────────────────────
  function triICDF(u, a, b, c) { const F = (b - a) / (c - a); return u <= F ? a + Math.sqrt(u * (b - a) * (c - a)) : c - Math.sqrt((1 - u) * (c - a) * (c - b)); }
  function phiInv(p) { p = Math.max(1e-10, Math.min(1 - 1e-10, p)); const a = [2.515517, 0.802853, 0.010328], b = [1.432788, 0.189269, 0.001308]; const t = p < 0.5 ? Math.sqrt(-2 * Math.log(p)) : Math.sqrt(-2 * Math.log(1 - p)); const z = t - (a[0] + a[1] * t + a[2] * t * t) / (1 + b[0] * t + b[1] * t * t + b[2] * t * t * t); return p < 0.5 ? -z : z; }
  function erf(x) { const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911; const s = x < 0 ? -1 : 1; x = Math.abs(x); const t = 1 / (1 + p * x); return s * (1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)); }
  function phi(z) { return 0.5 * (1 + erf(z / Math.SQRT2)); }
  /** Cost quantile correlated with the schedule quantile us (Gaussian copula, correlation rho). */
  function corrU(us, uc, rho) { return phi(rho * phiInv(us) + Math.sqrt(1 - rho * rho) * phiInv(uc)); }

  /** Latin hypercube sample: n points in k dimensions, as an n x k array. */
  function lhs(n, k, rng = Math.random) {
    const c = [];
    for (let j = 0; j < k; j++) {
      const col = Array.from({ length: n }, (_, i) => (i + rng()) / n);
      for (let i = col.length - 1; i > 0; i--) { const j2 = Math.floor(rng() * (i + 1)); [col[i], col[j2]] = [col[j2], col[i]]; }
      c.push(col);
    }
    return Array.from({ length: n }, (_, i) => c.map(col => col[i]));
  }
  function skew(v, m, s) { return s ? v.reduce((a, x) => a + (x - m) ** 3, 0) / (v.length * s ** 3) : 0; }
  /** Stability criterion on the last 2*b values: relative change of mean and variance below a. */
  function stable(S, b, a) {
    const r = S.length; if (r < 2 * b) return false;
    const rc = S.slice(-b), pv = S.slice(-2 * b, -b);
    const mr = rc.reduce((a, x) => a + x, 0) / b, mp = pv.reduce((a, x) => a + x, 0) / b;
    if (!mp || Math.abs(mr - mp) / mp >= a) return false;
    const vr = rc.reduce((a, x) => a + (x - mr) ** 2, 0) / b, vp = pv.reduce((a, x) => a + (x - mp) ** 2, 0) / b;
    return !vp || Math.abs(vr - vp) / vp < a;
  }

  // ── B-E process model ─────────────────────────────────────────────────────
  /** Contiguous banding: marks in WN the activities that can work concurrently. */
  function bandingWith(W, WN, pm, n) {
    for (let i = 0; i < n; i++) WN[i] = false;
    let f = -1;
    for (let i = 0; i < n; i++) { if (W[i] > 0) { WN[i] = true; f = i; break; } }
    if (f < 0) return;
    for (let j = f + 1; j < n; j++) {
      if (W[j] > 0) { let ok = true; for (let k = f; k < j; k++) { if (pm[j][k] > 0 && W[k] > 0) { ok = false; break; } } if (ok) WN[j] = true; else break; }
    }
  }

  /**
   * One run of the process model.
   * u_s, u_c: per-activity quantiles for duration and cost; rho: duration-cost
   * correlation; rec: record the Gantt trace; n: number of activities;
   * actsA, pm, im: activities, probability and impact matrices.
   * opts.fullRadius: second-order rework over k = j+1..n-1 (B&E 2002 p.430)
   * instead of the limited radius k = j+1..ci-1; opts.rng: random generator.
   * Returns {S, C, gantt}: duration, cost, Gantt trace (or null).
   */
  function singleRunWith(u_s, u_c, rho, rec, n, actsA, pm, im, opts = {}) {
    const rng = opts.rng || Math.random, fullRadius = !!opts.fullRadius;
    const W = new Array(n).fill(1), WN = new Array(n).fill(false);
    const ActS = actsA.map((a, i) => triICDF(u_s[i], a.bs, a.ms, a.ws));
    const ActC = actsA.map((a, i) => triICDF(corrU(u_s[i], u_c[i], rho), a.bc, a.mc, a.wc));
    const Wd = new Array(n).fill(0);
    let S = 0, gantt = rec ? Array.from({ length: n }, () => []) : null;
    const maxS = ActS.reduce((a, b) => a + b, 0) * 30;
    while (W.some(w => w > 0) && S < maxS) {
      bandingWith(W, WN, pm, n);
      let minDt = Infinity;
      for (let i = 0; i < n; i++) { if (WN[i] && ActS[i] > 0) { const rem = W[i] * ActS[i]; if (rem < minDt) minDt = rem; } }
      if (!isFinite(minDt)) break;
      S += minDt;
      const completed = [];
      for (let i = 0; i < n; i++) {
        if (WN[i]) { const frac = minDt / ActS[i]; W[i] = Math.max(0, W[i] - frac); Wd[i] += frac; if (W[i] < 0.001) { W[i] = 0; completed.push(i); } }
        if (gantt) gantt[i].push(WN[i] ? +W[i].toFixed(3) : null);
      }
      for (const ci of completed) {
        for (let j = 0; j < ci; j++) {
          if (pm[j][ci] > 0 && rng() <= pm[j][ci]) {
            W[j] += im[j][ci] * actsA[j].ic; if (W[j] > 1) W[j] = 0.9;
            // Second-order rework: limited radius (k strictly between j and ci,
            // Browning 1998 Ch. 6) or full radius (k up to n-1, B&E 2002 p.430).
            for (let k = j + 1; k < (fullRadius ? n : ci); k++) {
              if (pm[k][j] > 0 && rng() <= pm[k][j]) {
                if (W[k] === 1) W[k] = 2; W[k] += im[k][j] * actsA[k].ic; if (W[k] >= 2) W[k] = 1; if (W[k] > 1) W[k] = 0.9;
              }
            }
          }
        }
      }
    }
    return { S, C: ActC.reduce((s, c, i) => s + c * Wd[i], 0), gantt };
  }

  // ── Monte Carlo campaign (sampling loop of the simulator's runSim) ───────
  /**
   * Runs a Monte Carlo campaign as the simulator does.
   * options: acts, prob, imp (required); runs (max runs, default 1100);
   * batch (default 100) and alpha (default 0.01) for the stability stop;
   * rho (default 0.9); useLHS (default true); useStab (default false);
   * comonotone (default false): one quantile per run shared by all activities;
   * fullRadius (default false); rng (default Math.random).
   * Returns {S, C, runs, stable, gantt}: arrays of durations and costs, the
   * number of runs, whether the stability criterion stopped the campaign, and
   * the Gantt trace of the first run.
   */
  function simulate(options) {
    const { acts, prob, imp } = options;
    const rMax = options.runs ?? 1100, b = options.batch ?? 100, alpha = options.alpha ?? 0.01;
    const rho = options.rho ?? 0.9, useLHS = options.useLHS ?? true, useStab = options.useStab ?? false;
    const comonotone = !!options.comonotone, rng = options.rng || Math.random;
    const opts = { fullRadius: !!options.fullRadius, rng };
    const CHUNK = 40, n = acts.length;
    const S = [], C = []; let gantt = [];
    let r = 0, stab = false;
    while (r < rMax && !stab) {
      const chunk = Math.min(CHUNK, rMax - r);
      let us, uc;
      if (comonotone) {
        const u1 = useLHS ? lhs(chunk, 1, rng) : Array.from({ length: chunk }, () => [rng()]);
        const u2 = useLHS ? lhs(chunk, 1, rng) : Array.from({ length: chunk }, () => [rng()]);
        us = u1.map(v => new Array(n).fill(v[0])); uc = u2.map(v => new Array(n).fill(v[0]));
      } else {
        us = useLHS ? lhs(chunk, n, rng) : Array.from({ length: chunk }, () => Array.from({ length: n }, () => rng()));
        uc = useLHS ? lhs(chunk, n, rng) : Array.from({ length: chunk }, () => Array.from({ length: n }, () => rng()));
      }
      for (let i = 0; i < chunk; i++) {
        const res = singleRunWith(us[i], uc[i], rho, r + i === 0, n, acts, prob, imp, opts);
        S.push(res.S); C.push(res.C); if (r + i === 0) gantt = res.gantt || [];
      }
      r += chunk; if (useStab && r >= 2 * b && stable(S, b, alpha)) stab = true;
    }
    return { S, C, runs: S.length, stable: stab, gantt };
  }

  /** Mean and (population) standard deviation of durations and costs. */
  function summary(S, C) {
    const n = S.length;
    const ES = S.reduce((a, b) => a + b, 0) / n, EC = C.reduce((a, b) => a + b, 0) / n;
    const sS = Math.sqrt(S.reduce((a, x) => a + (x - ES) ** 2, 0) / n);
    const sC = Math.sqrt(C.reduce((a, x) => a + (x - EC) ** 2, 0) / n);
    return { ES, EC, sS, sC };
  }

  /** Mulberry32: small seeded generator, for reproducible runs. */
  function seededRng(seed) {
    let a = seed >>> 0;
    return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  return { triICDF, phiInv, phi, erf, corrU, lhs, skew, stable, bandingWith, singleRunWith, simulate, summary, seededRng };
}));
