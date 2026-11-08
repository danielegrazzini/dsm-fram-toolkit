# Contributing to dsm-fram-toolkit

Thank you for your interest in `dsm-fram-toolkit`. This document explains how to
report a problem, how to ask for support and how to contribute changes.

## Reporting a problem

Open an issue using the **Bug report** template. Please include:

- the simulator and its version (e.g. `FEBS_Simulator_v6.0.2.html`);
- the browser and operating system you used;
- the input file (JSON) that reproduces the problem, or a minimal version of it;
- what you expected and what happened instead (screenshots or exported results help).

If the problem concerns a number reported in a publication, please also say which
publication, table and value.

## Asking for support

Questions about using the simulators, the JSON format or the methods (B-E, FEBS,
FRAME-Q) are welcome. Open an issue using the **Question / support** template.
Please check the README first: it describes each simulator, the shared JSON format
and the verification suite.

## Suggesting a feature

Open an issue using the **Feature request** template and describe the use case.
For larger changes, please discuss them in an issue before writing code.

## Contributing changes

1. Fork the repository and create a branch from `main`.
2. Make your change. Keep the simulators self-contained (a single HTML file that
   runs in the browser without installation or a build step).
3. Run the verification suite locally (see *Verification* in the README):

   ```
   node tests/be_published_replication.js
   node tests/febs_be_reduction_equivalence.js
   node tests/frameq_sigma_regression.js
   python tests/sobol_saltelli_verification.py
   ```

4. Add a short entry to `CHANGELOG.md` under `[Unreleased]`.
5. Open a pull request that explains what changed and why, and links the related
   issue. The same tests run automatically on every pull request (GitHub Actions)
   and must pass before merging.

### Rules for the simulator files

Published results in the literature were produced with specific simulator files,
whose SHA-256 fingerprints are listed in the README (*Verified simulator
versions*). To keep that link verifiable:

- a released simulator file is **never modified in place**: any change, even to a
  label, goes into a **new file with a new version number** (e.g. `v6.0.2` →
  `v6.0.3`), with a CHANGELOG entry and a new fingerprint in the README;
- a change that alters any computed value must say so explicitly in the pull
  request and in the CHANGELOG, and the verification tests must be updated
  accordingly.

## Governance

The project is maintained by Daniele Grazzini, who reviews issues and pull
requests and decides on releases. Development is planned in public in
`ROADMAP.md`; every change is tracked by an issue and recorded in `CHANGELOG.md`.
Issues and pull requests are answered on a best-effort basis, usually within two
weeks.

## Licence

By contributing, you agree that your contributions are released under the MIT
licence of this repository.

## Code of conduct

Everyone taking part in this project is expected to follow the
[Code of Conduct](CODE_OF_CONDUCT.md).
