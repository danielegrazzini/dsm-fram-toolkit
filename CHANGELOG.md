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
