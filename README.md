# dsm-fram-toolkit

**A browser-based simulator suite for DSM–FRAM integration and functional resonance risk analysis**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![JOSS](https://joss.theoj.org/papers/placeholder/badge.svg)](paper.md)

---

## Overview

`dsm-fram-toolkit` provides three browser-based simulation tools that operationalise a quantitative integration between the **Design Structure Matrix (DSM)** methodology and the **Functional Resonance Analysis Method (FRAM)**. No installation is required — every simulator runs as a self-contained HTML file in any modern web browser.

The three simulators form a progressive analytical hierarchy:

| Simulator | Description | Key output |
|-----------|-------------|------------|
| **B-E Simulator v7.2** | Full Browning-Eppinger (2002) stochastic process simulation | E[S], σ[S], P[S], Interface Criticality |
| **FEBS Simulator v6** | FRAM-Extended B-E — replaces scalar weights with 6D coupling tensors | Interface Resonance Risk (IRR) |
| **FRAME-Q Simulator S29** | Network variability propagation + Saltelli (2002) global sensitivity analysis | Rnet, Sobol Sᵢ and Tᵢ |

---

## Quick Start

1. **Download** any simulator HTML file from `simulators/`
2. **Open** it in Chrome, Firefox, Edge, or Safari (no server needed)
3. **Load an example** — each simulator ships with its own preloaded case:
   - B-E: `UCAV 2002`, `MIT v2.1` or `Airport`
   - FEBS: `Airport example` (the UCAV benchmark is available via Toolkit JSON import — see `data/`)
   - FRAME-Q: `Load UCAV`
4. **Run the simulation**: follow the step-by-step wizard

That's it. No Python, no npm, no configuration.

---

## Repository Structure

```
dsm-fram-toolkit/
├── simulators/
│   ├── DSM_B-E_Simulator_v7.2.html     # Browning-Eppinger 2002 stochastic simulation
│   ├── FEBS_Simulator_v6.html          # FRAM-Extended B-E Simulation
│   └── FRAMEQ_Simulator.html           # FRAME-Q variability propagation + Sobol analysis (S29)
├── data/
│   ├── UCAV_source_verified_S12.json   # UCAV dataset verified cell-by-cell against B&E 2002
│   ├── UCAV_tensor_B_v1.json           # 6D coupling tensor, 52 pairs, documented rationales
│   ├── UCAV_FEBS_full_v1.json          # Toolkit JSON: UCAV with full tensor (FEBS-native)
│   └── UCAV_FEBS_reduction_test2.json  # Toolkit JSON: UCAV in B-E-reduction configuration
├── tests/
│   ├── sobol_saltelli_verification.py  # Analytical benchmark (Ishigami function)
│   ├── frameq_sigma_regression.js      # FRAME-Q sigma handling and non-regression suite
│   ├── be_published_replication.js     # B-E v7.2 vs published B&E (2002) results
│   └── febs_be_reduction_equivalence.js# FEBS -> B-E reduction, strong equivalence
├── .github/workflows/
│   └── draft-pdf.yml                   # JOSS paper draft compilation
├── CHANGELOG.md                        # Version history
├── README.md                           # This file
├── paper.md                            # JOSS paper
├── paper.bib                           # Bibliography
├── CITATION.cff                        # Citation metadata
└── LICENSE                             # MIT License
```

---

## Simulators

### B-E Simulator v7.2

A complete implementation of the Browning & Eppinger (2002) process simulation model.

**Features:**
- Triangular distribution sampling (BCV / MLV / WCV) with Latin Hypercube Sampling
- Cost-duration correlation via Normal copula (ρ = 0.9 default)
- First- and second-order rework propagation
- **B&E-fidelity toggles** (v7.2): *comonotone sampling* (one quantile per run, common to all activities — the sampling scheme implied by the published no-iteration reference, where σ_C equals the **sum** of the activity σᵢ) and *full-radius second-order rework* (k = j+1…n including the triggering cycle, per B&E 2002 p. 430). With both enabled, the simulator reproduces the published Table V results within pre-registered Monte Carlo tolerances (see Verification).
- All 10 schedule and cost risk metrics from Table V of Browning & Eppinger (2002)
- Interface Criticality analysis (analytic and empirical)
- Multi-architecture comparison with minimum highlighting
- Import/export in JSON and the shared Toolkit JSON format
- Three preloaded datasets: the UCAV design process (Browning, 1998; **verified cell-by-cell against the published figures**, v7.1 changelog), MIT v2.1, and an airport turnaround

### FEBS Simulator v6

Extends B-E by replacing scalar rework probabilities with six-dimensional coupling tensors.

**Features:**
- FRAME-6 structured elicitation panel for all 6 FRAM aspects per active pair
- Weighted Euclidean norm aggregation of tensor components
- Interface Resonance Risk (IRR) index per activity
- Full Monte Carlo simulation with empirical rework frequency tracking
- Export in CSV, JSON, MIT format, and the shared Toolkit JSON format; import of Toolkit JSON
- Preloaded synthetic airport turnaround case (5 functions) with full tensor M, as used in the DSM 2026 paper
- **UCAV benchmark via Toolkit JSON** (`data/UCAV_FEBS_full_v1.json` for the FRAM-native tensor, `data/UCAV_FEBS_reduction_test2.json` for the B-E-reduction configuration)
- Sobol sensitivity analysis on E[S]: forthcoming, not yet implemented

**The FRAME-6 aspects:**

For a coupling pair keyed `"i,j"` — read as *activity i depends on activity j* — each aspect asks:

| Aspect | Central question |
|--------|-----------------|
| Input (I) | Does j provide the trigger that starts or re-orients i? |
| Output (O) | Does a variation in j's output alter the technical context of i? |
| Precondition (P) | Must the state established by j exist before i can proceed? |
| Resource (R) | Do j and i share resources, or does j produce tools that i uses? |
| Control (C) | Does j define constraints on how i must carry out its work? |
| Time (T) | Is the timing of j critical for the operational window of i? |

### FRAME-Q Simulator (S29)

Implements network-level variability propagation and global sensitivity analysis.

**Features:**
- Three-level propagation: L1 (direct), L2 (two-step), L3 (network)
- Beta distribution sampling for activity variability σᵢ, with concentration ν ∈ [2, 50]
- Elicited σᵢ as a first-class input, with the duration-derived proxy as fallback (see below)
- Saltelli (2002) estimator for Sobol' first-order (Sᵢ) and total-order (Tᵢ) indices
- Ne ∈ {16, 32, 64, 128, 256, 512, 1024, 2048, 4096} sample sizes
- Network resonance index Rnet with P(Rnet > 1) exceedance probability
- Four-quadrant resonance map (V(Ofᵢ) vs Φᵢ)
- Full Sobol ranking table with bar chart visualisation
- Import/export in the shared Toolkit JSON format
- Preloaded UCAV case (14 activities, 52 active pairs, 312 tensor components). The preloaded tensor is the original Session-11 elicitation, kept as the non-regression baseline; the reviewed and rationale-documented tensor is available as `data/UCAV_tensor_B_v1.json`.

#### Two ways to obtain σᵢ

Every activity requires **either** an elicited σᵢ **or** a complete BCV/MLV/WCV duration triple.

- **Elicited σᵢ (FRAME-6)** — the intrinsic performance variability of the function, judged
  directly against a variability taxonomy. This is the quantity FRAME-Q defines.
- **Derived σᵢ (Browning-Eppinger inheritance)** — `(WCV − BCV) / (6 · MLV)`, the relative
  spread of the duration triple. Used whenever no elicited σ is supplied: this is the case for
  B-E datasets, including the bundled UCAV example.

The two modes coexist within the same model. Where an elicited σ is present, it wins.

The identity *variability = schedule dispersion* holds in B-E, whose object is schedule and cost
risk. It does not hold in general: a function's variability is not a property of how long it
takes, and functions that are not scheduled activities may have real variability and no duration
at all. Since S29, such models are first-class citizens.

`Rnet` weights follow duration share when **all** activities carry durations, and are uniform
`1/n` otherwise. `Rᵢ` and its ranking never depend on these weights — they are duration-free.
State the weighting convention in use whenever `Rnet` is reported.

---

## Verification

### Sobol estimator — analytical benchmark

The script `tests/sobol_saltelli_verification.py` benchmarks the FRAME-Q Saltelli estimator against the Ishigami function, which has known analytical Sobol' indices.

**Requirements:** Python ≥ 3.8, NumPy, SciPy

```bash
pip install numpy scipy
python tests/sobol_saltelli_verification.py
```

**Expected output (all checks at Ne = 2048):**

```
x1: Si error = 0.0009 (ok), Ti error = 0.0071 (ok)  [PASS]
x2: Si error = 0.0006 (ok), Ti error = 0.0021 (ok)  [PASS]
x3: Si error = 0.0018 (ok), Ti error = 0.0002 (ok)  [PASS]
✓ ALL CHECKS PASSED
```

The Ishigami x₃ variable (S₃ = 0.000, T₃ = 0.244) is the canonical mathematical example of the **silent multiplier** phenomenon: a parameter with zero direct effect but dominant interaction effects. The FRAME-Q UCAV analysis identifies A2 ('Create Preliminary Design Architecture') as a silent multiplier with S₂ ≈ 0.000 and T₂ = 0.741, confirming that the phenomenon occurs in real process coupling networks.

### FRAME-Q σ handling — regression suite

The script `tests/frameq_sigma_regression.js` verifies that σᵢ is taken from the elicited value when present, that the duration-derived fallback reproduces the pre-S29 behaviour exactly, and that the input guards hold. It extracts the `<script>` block from the simulator HTML and runs it in a Node vm context with a minimal DOM stub.

**Requirements:** Node ≥ 14. No dependencies, no browser.

```bash
node tests/frameq_sigma_regression.js simulators/FRAMEQ_Simulator.html
```

**Expected output:** 18 assertions across four groups — UCAV non-regression, elicited σ path, mixed mode, input guards — ending in `ALL TESTS PASSED` with exit code 0. The UCAV group asserts that σ and the Rnet weights are identical to the pre-S29 values to zero difference, and that Rnet = 1.040429 on 13 valid functions is reproduced exactly.

### B-E v7.2 — replication of the published B&E (2002) results

The script `tests/be_published_replication.js` extracts the simulator's math core verbatim from the HTML and replicates the published UCAV baseline results (Table V, architecture 1) headless, in B&E-fidelity mode (comonotone sampling + full-radius second-order rework). It first asserts the no-iteration reference (E[C]=615, σ_C=55, E[S]=133, σ_S=13) — the arithmetic signature that identifies the comonotone sampling scheme — then the full model against the published values, at pre-registered Monte Carlo tolerances (5 replicates × 5000 runs, pooled).

**Requirements:** Node ≥ 14. No dependencies, no browser.

```bash
node tests/be_published_replication.js simulators/DSM_B-E_Simulator_v7.2.html
```

**Expected output:** 8 PASS lines (4 no-iteration reference + 4 full model) ending in `✓ ALL CHECKS PASSED` with exit code 0. Note: the published input data are rounded and disguised for confidentiality by the original authors; the published outputs are nevertheless internally consistent with the published inputs, which is what this test verifies. Matching beyond the pre-registered tolerances is not a meaningful target.

### FEBS → B-E reduction — strong equivalence

The script `tests/febs_be_reduction_equivalence.js` demonstrates the FEBS→B-E reduction numerically on the UCAV case. It derives the degenerate configuration from the B-E simulator's own verified matrices (uniform tensor components = DSM1, β = 1, threshold percentile p = 1, Pbase = max DSM1), asserts that the FEBS pipeline reproduces P = DSM1 to machine precision, then runs twin Monte Carlo campaigns (5 × 5000 per engine, mirrored mechanics) and asserts strong statistical equivalence.

**Requirements:** Node ≥ 14. No dependencies, no browser.

```bash
node tests/febs_be_reduction_equivalence.js \
     simulators/FEBS_Simulator_v6.html simulators/DSM_B-E_Simulator_v7.2.html
```

**Expected output:** exact reduction mapping (max deviation ≈ 5.6e-17 over 52 active pairs), four PASS deltas (|ΔE[C]| ≤ 2, |ΔE[S]| ≤ 0.4, |Δσ_C| ≤ 1.5, |Δσ_S| ≤ 0.3), ending in `✓ ALL CHECKS PASSED — strong equivalence` with exit code 0.

---

## Shared JSON Format

A single FRAME-6 elicitation session can feed all three simulators. Every simulator imports and exports `dsm-fram-toolkit-v1`:

```json
{
  "_schema": "dsm-fram-toolkit-v1",
  "_description": "Shared format for B-E, FEBS and FRAME-Q simulators",
  "_source": "FRAME-Q",
  "timestamp": "2026-07-17T09:00:00.000Z",
  "activities": [
    { "id": 1, "name": "Prepare UCAV Preliminary DR&O", "desc": "",
      "bcv": 1.9, "mlv": 2.0, "wcv": 3.0 },
    { "id": 2, "name": "Develop procedural guidance", "desc": "",
      "sigma": 0.25 }
  ],
  "nu": 10,
  "m_pairs": {
    "2,1": [0.9, 0.7, 0.85, 0.2, 0.75, 0.5]
  },
  "binary_dsm": [[0, 0], [1, 0]]
}
```

**Key convention.** In `m_pairs`, the key `"i,j"` means **Aᵢ ← Aⱼ**: the first index is the
**receiver** (the dependent activity), the second is the **source** (the provider). So `"2,1"`
reads *A2 depends on A1*. The component order is `[cI, cO, cP, cR, cC, cT]`, matching the
FRAME-6 aspects table above. `binary_dsm[i-1][j-1] = 1` mirrors the same orientation.

**Fields.** `activities[].sigma` is the elicited σ (FRAME-Q); the duration triple
`bcv`/`mlv`/`wcv` is used by B-E and FEBS, and by FRAME-Q as the σ fallback. An activity needs
at least one of the two. `nu` is the Beta concentration used by FRAME-Q. FRAME-Q also emits an
optional `sobol_results` block after a run.

Export from FEBS → import into FRAME-Q eliminates data re-entry.

---

## The UCAV Benchmark Case

The UCAV (Unmanned Combat Air Vehicle) design process case was originally published in Browning (1998) and used as the running example in Browning & Eppinger (2002). It comprises 14 design activities with 52 active dependency pairs. As the original authors note, the published data are rounded and disguised to protect competitive information; they are nevertheless internally consistent, and all toolkit datasets trace to the published figures.

The dataset shipped in `data/UCAV_source_verified_S12.json` was extracted from the original figures (Figs. 2–4 and Table I of B&E 2002) by programmatic grid detection with per-cell OCR and visual verification, and cross-corroborated against the interface tables of Browning's 1998 thesis. It corrects two cell-transposition errors present in earlier releases of the B-E simulator — (2,8)→(2,9) and (8,11)→(8,12) in both the probability and impact planes (v7.1 changelog) — and preserves the source's documented (5,8) anomaly (nonzero probability, zero impact).

The UCAV case ships preloaded in the **B-E** and **FRAME-Q** simulators and is provided for **FEBS** as Toolkit JSON in `data/`: `UCAV_FEBS_full_v1.json` carries the reviewed 6D tensor (52 pairs, each with a documented decomposition rationale anchored to the 1998 thesis, under the constraint that the weighted tensor norm reproduces the published rework probability), and `UCAV_FEBS_reduction_test2.json` carries the B-E-reduction configuration used by the equivalence test.

Together with the verification scripts, the benchmark establishes the toolkit's validation chain: source-verified data → B-E implementation replicating the published results (pre-registered tolerances) → FEBS reduction equivalent to the B-E implementation (strong equivalence). Preloading the UCAV case directly in FEBS is planned work.

---

## Citation

If you use `dsm-fram-toolkit` in your research, please cite:

```bibtex
@article{grazzini2026toolkit,
  author  = {Grazzini, Daniele},
  title   = {dsm-fram-toolkit: A browser-based simulator suite for DSM--FRAM 
             integration and functional resonance risk analysis},
  journal = {Journal of Open Source Software},
  year    = {2026},
  doi     = {10.21105/joss.XXXXX}
}
```

See also `CITATION.cff` for full citation metadata, and `CHANGELOG.md` for version history.

---

## Related Publications

- Grazzini, D. (2026). FEBS: FRAM-Extended Browning-Eppinger Simulation for functional resonance risk assessment. *Proceedings of DSM 2026*, Milan.
- Grazzini, D., & Pourghadiri, P. (2026). FRAME-Q: Functional Resonance Analysis Method Extended and Quantified. *Working paper*.
- Grazzini, D. et al. (2024). Development of a method for comparing industrial processes using DSM: the SeatBridge patent. *Proceedings of DSM 2024*, Stuttgart.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Contributing

Issues, questions, and pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
