# Shared JSON format (`dsm-fram-toolkit-v1`)

The three simulators — B-E, FEBS and FRAME-Q — read and write one shared JSON
format, so that a project built or elicited in one of them can be opened in the
others without re-entering data. This document specifies that format as the
simulators implement it (B-E v7.2.1, FEBS v6.0.2, FRAME-Q S29), and
`tests/validate_json.js` checks files against it.

## 1. Conventions

- **Activities are numbered from 1** in the order of the `activities` array.
- **Pairs are written as the string `"i,j"`**, where `i` is the **receiving**
  activity (the one that depends on, or is reworked by, the other) and `j` is the
  **providing** activity. Example: `"5,3"` means activity 5 depends on activity 3.
- In matrices, `M[i-1][j-1]` holds the value of pair `"i,j"`: **the row depends on
  the column** (process-DSM convention). With activities listed in time order,
  entries above the diagonal are feedback dependencies.
- **The six FRAM aspects** are always in the order
  `[I, O, P, R, C, T]` = Input, Output, Precondition, Resource, Control, Time.
- All probabilities, impacts and aspect values are in `[0, 1]`.

## 2. Minimal example

The first two activities of the UCAV case and their one dependency (values from
`data/UCAV_FEBS_full_v1.json`):

```json
{
  "_schema": "dsm-fram-toolkit-v1",
  "activities": [
    { "id": 1, "name": "Prepare UCAV Preliminary DR&O", "bcv": 1.9, "mlv": 2.0, "wcv": 3.0,
      "cost_bcv": 8.6, "cost_mlv": 9.0, "cost_wcv": 13.5, "ic": 0.35 },
    { "id": 2, "name": "Create UCAV Preliminary Design Architecture", "bcv": 4.75, "mlv": 5.0, "wcv": 8.75,
      "cost_bcv": 5.3, "cost_mlv": 5.63, "cost_wcv": 9.84, "ic": 0.2 }
  ],
  "binary_dsm": [[0, 0],
                 [1, 0]],
  "m_pairs":      { "2,1": [0.520067, 0.404496, 0.491174, 0.11557, 0.433389, 0.288926] },
  "impact_pairs": { "2,1": 0.5 }
}
```

## 3. Top-level fields

| Field | Type | Required | Read by | Meaning |
|---|---|---|---|---|
| `_schema` | string | **yes** | all | Must be exactly `"dsm-fram-toolkit-v1"`; every simulator rejects any other value. |
| `activities` | array of objects | **yes** | all | The activities (at least 2). See §4. |
| `binary_dsm` | n×n matrix of 0/1 | recommended | all | Dependency structure: 1 if row activity depends on column activity; diagonal 0. If absent, B-E and FEBS rebuild it from the keys of `m_pairs`. |
| `m_pairs` | object `"i,j"` → 6 numbers | for FEBS / FRAME-Q | all | Six-aspect coupling vector `[I, O, P, R, C, T]` of each dependency. A dependency without a vector gets the neutral seed `0.5` on all aspects in FEBS. |
| `impact_pairs` | object `"i,j"` → number | for B-E / FEBS | B-E, FEBS | Rework impact of each dependency (fraction of the activity redone). A dependency without a value gets the default `0.5`. |
| `be_matrices` | object | no | B-E | Lossless B-E data: `prob`, `impact`, `binary_dsm` as n×n matrices. Written by B-E; when present, B-E reads rework probabilities and impacts from here. |
| `nu` | number | no | FRAME-Q | Concentration parameter ν of the Beta distributions (FRAME-Q accepts 2–50). |
| `_source` | string | no | (shown) | Simulator that wrote the file: `"B-E"`, `"FEBS"`, `"FRAME-Q"`. |
| `_description`, `_note`, `timestamp` | string | no | — | Free documentation; ignored on import. |

Result blocks written on export and **ignored on import**: `irr_results`,
`sim_stats` (FEBS, with `_type: "IRR_results"`), `sobol_results` (FRAME-Q).

Data-record fields used in `data/` and **not read by the current simulators**:
`prob_pairs` (published rework probabilities by pair), `held_out_published`
(published results used as test targets), `_provenance`, `_test2_settings_*`.

## 4. Activity fields

| Field | Type | Read by | Meaning |
|---|---|---|---|
| `id` | integer | — | Position in the array, from 1 (informative; the array order is what counts). |
| `name` | string | all | Activity name. |
| `desc` | string | FEBS | Optional description. |
| `bcv`, `mlv`, `wcv` | numbers > 0 | all | Duration: best-case, most-likely and worst-case values (triangular distribution); `bcv ≤ mlv ≤ wcv`. |
| `cost_bcv`, `cost_mlv`, `cost_wcv` | numbers ≥ 0 | B-E, FEBS | Cost triple, same ordering. If absent, costs default to the durations. |
| `ic` | number in [0, 1] | B-E, FEBS | Learning-curve factor: fraction of the original work needed when the activity is repeated. |
| `sigma` | number in (0, 1) | FRAME-Q | Elicited variability of the activity; if absent, FRAME-Q derives it from the duration triple. |

For compatibility with older exports, the simulators also accept the short names
`bs`, `ms`, `ws` (durations) and `bc`, `mc`, `wc` (costs).

## 5. What each simulator writes

| Exported by | Writes | Note |
|---|---|---|
| B-E | `activities`, `binary_dsm`, `impact_pairs`, `m_pairs` (neutral seed 0.5), `be_matrices` | The neutral `m_pairs` are a starting point for FRAME-6 elicitation. |
| FEBS | `activities`, `binary_dsm`, `impact_pairs`, `m_pairs` (elicited tensor) | |
| FRAME-Q | `activities` (with `sigma` and/or durations), `binary_dsm`, `m_pairs`, `nu` | No costs and no impacts. |

**Rework probabilities.** B-E reads rework probabilities only from
`be_matrices.prob`. A file without `be_matrices` (for example one exported by FEBS
or FRAME-Q) is imported with all rework probabilities set to 0.3, and B-E says so
in its status bar: they must be reviewed in the Probability matrix.

## 6. Other formats in `data/`

`UCAV_tensor_B_v1.json` uses the record format `dsm-fram-toolkit-tensorB-v0`: for
each of the 52 interfaces it stores the elicited profile, the unit direction, the
published probability, the scale factor, the rescaled vector and the rationale.
It documents how the coupling tensor was built and is **not a simulator input**;
its rescaled vectors are the `m_pairs` of `UCAV_FEBS_full_v1.json`.

## 7. Validating a file

```
node tests/validate_json.js                 # every file in data/
node tests/validate_json.js my_project.json # one or more files
node tests/validate_json.js --self-test     # the validator checks itself on broken examples
```

The validator reports **errors** (the file breaks this specification) and
**warnings** (the file is valid, but a simulator will fill in a default value).
It exits with status 1 if any file has errors. It runs automatically on every
push, together with the other verification scripts.
