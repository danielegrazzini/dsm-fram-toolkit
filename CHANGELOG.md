# FRAME-Q Simulator — S29 (17 July 2026)

**Elicited sigma.** `sigma_i` is now a first-class input, read from the activity
definition when present. The Browning-Eppinger duration-derived proxy remains as
the fallback.

### Why

FRAME-Q defines `sigma_i` as the intrinsic performance variability of a function,
elicited through the FRAME-6 protocol against a variability taxonomy. The engine,
inherited from the B-E toolkit, instead computed it as the relative spread of the
duration triple:

```
sigma_i = (WCV_i - BCV_i) / (6 * MLV_i)
```

That identity — *variability is schedule dispersion* — is sound in B-E, whose object
is schedule and cost risk, and it was the sensible default while the reference
dataset (UCAV) carried B-E durations and no elicited judgement. It does not hold in
FRAME-Q, where a function's variability is not a property of how long it takes, and
it breaks down entirely on models whose functions are not scheduled activities: a
latent organisational function has real variability and no duration at all.

The practical consequence was worse than a wrong number. Activities carrying an
elicited `sigma` and no duration triple imported **without any error**: every
activity silently fell back to the default durations `2/3/5`, from which the engine
derived a constant `sigma = 0.1667` for all of them. The elicited judgements were
discarded in silence and the run looked entirely plausible.

### Changed

All changes are additive; the duration-derived path is untouched.

- **`calcStep1`** — `sigma_i` = elicited value when present, otherwise derived from
  the duration spread.
- **`calcStep1`** — duration triples are now optional per activity: each activity
  needs *either* an elicited `sigma` *or* a complete BCV/MLV/WCV triple. An activity
  with neither is rejected with an explicit message.
- **`calcStep1`** — bounds check tightened from `sigma < 1` to `0 < sigma < 1`.
  `Beta(sigma*nu, (1-sigma)*nu)` is undefined at either bound; the previous check let
  `sigma = 0` through (reachable in duration mode when `BCV == WCV`) and produced
  `NaN` downstream.
- **`calcStep1`** — `R_net` weights: duration share when *all* activities carry
  durations, uniform `1/n` otherwise. `R_i` and its ranking never depend on these
  weights and are unaffected in every case.
- **Toolkit JSON import** — reads `activities[].sigma`; the legacy `2/3/5` duration
  fallback now applies only when no `sigma` is given. `nu` is read from the file when
  present, instead of being left to the UI default.
- **Toolkit JSON export** — emits `sigma` and `nu`; durations are emitted only when
  present.
- **UI** — new "σ elicited" column in the activity table, placeholder `derived`;
  Step 1 and Step 3 texts describe both modes.

### Compatibility

Backward compatible. Any dataset without a `sigma` field — including the bundled
UCAV case and any B-E import — behaves exactly as in S28.

Verified by `tests/frameq_sigma_regression.js` (18 assertions, no dependencies):
on UCAV, `sigma` and the `R_net` weights are identical to the S28 values to zero
difference, and `R_net = 1.040429` on 13 valid functions is reproduced exactly.
The same suite fails on S28 with exit code 1, as it must.

```
node tests/frameq_sigma_regression.js simulators/FRAMEQ_Simulator.html
```

### Note on R_net weighting

Weighting resonance by duration share is meaningful in B-E, where long activities
dominate schedule risk. In a model whose functions are not scheduled activities,
uniform weighting is the neutral choice rather than a fallback for missing data.
State the convention in use whenever `R_net` is reported.

## [B-E Simulator v7.2] — 2026-07-18
### Added
- B&E-fidelity toggles in the parameters panel (default OFF = v7.1 behaviour):
  - **Comonotone sampling** — one quantile per run, common to all activities. Identified in
    Test 1 (S12) as the sampling scheme implied by the published no-iteration reference
    (σ_C = 55 equals the *sum* of the activity σᵢ = 53.9, unreachable under independent
    sampling, which yields ≈ 27). With this mode the no-iteration reference replicates
    615/55/133/13 and the full model passes 4/4 pre-registered replication criteria.
  - **Full-radius second-order rework** — k = j+1…n including the triggering cycle, per
    B&E 2002 p. 430 ("j, j+1, …, n"), replacing the limited-radius (1998 thesis) variant.
### Notes
- Alignment freeze (PREREG_U4, Amendment 1): no further tuning toward the published values.

## [B-E Simulator v7.1] — 2026-07-18
### Fixed
- UCAV dataset: corrected two cell transpositions vs the source figures (B&E 2002, Figs. 3–4,
  p. 431), in both the probability and impact planes:
  - prob/imp (2,8) → (2,9)
  - prob/imp (8,11) → (8,12)
  Evidence: programmatic grid detection on the rasterised source figures (S12) plus independent
  corroboration from the interface tables of Browning (1998) (A511 ← A533 "Recommended Config.
  Changes"; A532 ← A5344 "Materials, Sizing & Deformations"). Canonical dataset:
  `data/UCAV_source_verified_S12.json`. Table I values confirmed 98/98; the (5,8) anomaly
  (nonzero probability, zero impact) is a property of the source and is preserved.

## [data/] — 2026-07-18
### Added
- `UCAV_source_verified_S12.json` — UCAV dataset verified cell-by-cell against B&E 2002, with
  per-block provenance (figure, page, extraction method) and held-out published values.
- `UCAV_tensor_B_v1.json` — 6D coupling tensor, 52 pairs, reviewed with documented rationales
  anchored to Browning (1998), under the norm-reproduces-probability constraint (protocol U3-B).
- `UCAV_FEBS_full_v1.json`, `UCAV_FEBS_reduction_test2.json` — Toolkit JSON configurations for
  FEBS (FRAM-native tensor and B-E-reduction respectively).

## [tests/] — 2026-07-18
### Added
- `be_published_replication.js` — headless replication of the published B&E (2002) UCAV
  results (Table V, arch. 1) at pre-registered tolerances, including the no-iteration
  comonotone-signature reference. 8 assertions.
- `febs_be_reduction_equivalence.js` — numerical demonstration of the FEBS→B-E reduction:
  exact P = DSM1 mapping (machine precision) + strong statistical equivalence of the twin
  Monte Carlo engines (4 assertions on pooled deltas).

## [B-E Simulator v7.2] — 2026-07-18
### Added
- B&E-fidelity toggles in the parameters panel (default OFF = v7.1 behaviour):
  - **Comonotone sampling** — one quantile per run, common to all activities. Identified in
    Test 1 (S12) as the sampling scheme implied by the published no-iteration reference
    (σ_C = 55 equals the *sum* of the activity σᵢ = 53.9, unreachable under independent
    sampling, which yields ≈ 27). With this mode the no-iteration reference replicates
    615/55/133/13 and the full model passes 4/4 pre-registered replication criteria.
  - **Full-radius second-order rework** — k = j+1…n including the triggering cycle, per
    B&E 2002 p. 430 ("j, j+1, …, n"), replacing the limited-radius (1998 thesis) variant.
### Notes
- Alignment freeze (PREREG_U4, Amendment 1): no further tuning toward the published values.

## [B-E Simulator v7.1] — 2026-07-18
### Fixed
- UCAV dataset: corrected two cell transpositions vs the source figures (B&E 2002, Figs. 3–4,
  p. 431), in both the probability and impact planes:
  - prob/imp (2,8) → (2,9)
  - prob/imp (8,11) → (8,12)
  Evidence: programmatic grid detection on the rasterised source figures (S12) plus independent
  corroboration from the interface tables of Browning (1998) (A511 ← A533 "Recommended Config.
  Changes"; A532 ← A5344 "Materials, Sizing & Deformations"). Canonical dataset:
  `data/UCAV_source_verified_S12.json`. Table I values confirmed 98/98; the (5,8) anomaly
  (nonzero probability, zero impact) is a property of the source and is preserved.

## [data/] — 2026-07-18
### Added
- `UCAV_source_verified_S12.json` — UCAV dataset verified cell-by-cell against B&E 2002, with
  per-block provenance (figure, page, extraction method) and held-out published values.
- `UCAV_tensor_B_v1.json` — 6D coupling tensor, 52 pairs, reviewed with documented rationales
  anchored to Browning (1998), under the norm-reproduces-probability constraint (protocol U3-B).
- `UCAV_FEBS_full_v1.json`, `UCAV_FEBS_reduction_test2.json` — Toolkit JSON configurations for
  FEBS (FRAM-native tensor and B-E-reduction respectively).

## [tests/] — 2026-07-18
### Added
- `be_published_replication.js` — headless replication of the published B&E (2002) UCAV
  results (Table V, arch. 1) at pre-registered tolerances, including the no-iteration
  comonotone-signature reference. 8 assertions.
- `febs_be_reduction_equivalence.js` — numerical demonstration of the FEBS→B-E reduction:
  exact P = DSM1 mapping (machine precision) + strong statistical equivalence of the twin
  Monte Carlo engines (4 assertions on pooled deltas).

## [FEBS Simulator v6.0.1] — 2026-07-18
### Fixed
- Wizard dead-end after Toolkit JSON import (issue FEBS #3): the pane-4 Next button
  navigated to pane 6, skipping pane 5 (operational freq) whose confirmFreq() is the
  only unlocker of step 6. Now pane 4 → pane 5; confirmFreq() proceeds to pane 6.
  Button label corrected ("Next ›").
- nav() on a locked step now shows a status-bar warning instead of returning silently.
### Verified
- Math core byte-identical to v6; `febs_be_reduction_equivalence.js` re-passed
  against v6.0.1 (strong equivalence 4/4).

## [FEBS Simulator v6.0.2] — 2026-07-19
### Fixed
- Root cause of the 0.1667 weight convention (dual-channel finding, S13): the UI weight
  fields DEFAULTED to 0.1667. Defaults corrected to 0.166667, step="any", and a
  "UNIFORM 1/6" preset button added (issues #5).
### Added
- Self-contained results export (issue #4): sim_stats now includes sigma_S, sigma_C,
  P_S, P_C, full parameters (p, beta, Pbase, rho, rmax, weights), theta, active pairs.
### Verified
- Math core byte-identical to v6; reduction-equivalence test re-passed (4/4).

## [B-E Simulator v7.2.1] — 2026-07-19
### Added
- Project export records useComono and useFullRadius (issue #4).
### Changed
- Export button labels: "Export JSON (results)" / "Toolkit JSON (data only)"
  (ambiguity surfaced by the dual-channel campaign, S13).
### Verified
- Math core byte-identical to v7.2; published-replication test re-passed (8/8).
