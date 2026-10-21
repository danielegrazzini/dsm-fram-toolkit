# Roadmap — dsm-fram-toolkit

Planned work from October 2026 to the JOSS submission (January 2027).
One small, self-contained step per week. Each step is tracked as a GitHub issue and closed by the commit that completes it (`Fixes #N` in the commit message).

Status legend: ⬜ planned · 🟨 in progress · ✅ done

| # | Week of | Step | Files | Suggested commit message | Status |
|---|---|---|---|---|---|
| 0 | 12 Oct 2026 | Publish this roadmap | `ROADMAP.md` | `docs: add development roadmap to JOSS submission` | ✅ |
| 1 | 12 Oct 2026 | Point the test scripts' default paths to the current simulator versions (v7.2.1, v6.0.2), so the README commands run as written | `tests/be_published_replication.js`, `tests/febs_be_reduction_equivalence.js` | `tests: default paths to B-E v7.2.1 and FEBS v6.0.2` | ✅ |
| 2 | 19 Oct 2026 | Correct bibliography metadata: DOIs (Browning & Eppinger 2002, Falegnami et al. 2020, Patriarca et al. 2017), titles and DOIs of the DSM 2024/2026 papers, co-author names; remove or cite unused entries | `paper.bib`, `CITATION.cff` | `paper: correct DOIs and bibliographic metadata` | ✅ |
| 3 | 19 Oct 2026 | Correct a collaborator affiliation in the acknowledgements | `paper.md` | `paper: fix affiliation in acknowledgements` | ⬜ |
| 4 | 26 Oct 2026 | Continuous integration: run the four verification scripts on every push and pull request; make the Python script exit non-zero on failure; add a CI badge | `.github/workflows/tests.yml`, `tests/sobol_saltelli_verification.py`, `README.md` | `ci: run verification suite on push and PR` | ⬜ |
| 5 | 2 Nov 2026 | Connect the repository to Zenodo and publish the first versioned release (semantic versioning) with an archive DOI | `CITATION.cff`, `CHANGELOG.md` | `release: v1.0.0` (tag `v1.0.0`) | ⬜ |
| 6 | 9 Nov 2026 | Community guidelines: how to contribute, report problems and ask for support; issue templates; code of conduct; governance note | `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `.github/ISSUE_TEMPLATE/`, `README.md` | `docs: add contributing guidelines and issue templates` | ⬜ |
| 7 | 16 Nov 2026 | Document the shared JSON format and add a validator script for it | `docs/json-format.md`, `tests/validate_json.js` | `docs: specify shared JSON format and add validator` | ⬜ |
| 8 | 23 Nov 2026 | Extract the B-E computation engine into a standalone module used by both the HTML simulator and the tests (no more extraction from HTML) | `engine/be_engine.js`, `simulators/DSM_B-E_Simulator_*.html`, tests | `refactor: B-E engine as standalone module` | ⬜ |
| 9 | 30 Nov 2026 | Same for the FEBS engine (norm, threshold, probability, IRR) | `engine/febs_engine.js`, `simulators/FEBS_Simulator_*.html`, tests | `refactor: FEBS engine as standalone module` | ⬜ |
| 10 | 7 Dec 2026 | Unit tests for the FEBS pipeline (weighted norm, dormancy threshold, probability normalisation) and a regression test on the structural IRR ranking of the UCAV case | `tests/febs_pipeline_unit.js`, `tests/febs_irr_regression.js` | `tests: FEBS pipeline unit tests and IRR regression` | ⬜ |
| 11 | 14 Dec 2026 | User guide with a step-by-step worked example on the UCAV case (B-E → FEBS → FRAME-Q) | `docs/user-guide.md`, `README.md` | `docs: add user guide with UCAV worked example` | ⬜ |
| 12 | 21 Dec 2026 | Paper update: state of the field (quantitative FRAM tools, coupling-specification literature, verifiable DSM tools), role of each coupling aspect, AI usage disclosure with model versions; single long form of the IRR acronym across README, paper and simulators | `paper.md`, `paper.bib`, `README.md`, `simulators/FEBS_Simulator_*.html` | `paper: update state of the field and AI disclosure` | ⬜ |
| 13 | 4 Jan 2027 | Second release (archived on Zenodo as a new version); self-check against the JOSS review checklist; build the paper PDF with the JOSS action | `CHANGELOG.md`, `CITATION.cff` | `release: v1.1.0` (tag `v1.1.0`) | ⬜ |
| 14 | 11 Jan 2027 | Submit to the Journal of Open Source Software (repository public since 4 July 2026) | — | — | ⬜ |

## Working rules

- **One issue per step.** Open it at the start of the week, close it with the commit (`Fixes #N`).
- **Small, meaningful commits.** A step can take several commits; no batching of many weeks into one.
- **Every change goes in `CHANGELOG.md`.**
- **Tests must pass** before closing a step (from step 4 onwards, CI checks this automatically).
- **Weeks 21 Dec – 4 Jan** are deliberately light because of the holidays; steps can slide by a week without affecting the submission date.
