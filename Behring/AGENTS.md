# AGENTS.md

## Repo Purpose

This repository contains a portable prototype for a lab reporting workflow.

Current prototype source:

- Baserow

Intended final target:

- OpenELIS

The repository must stay structured so that Baserow is only a temporary adapter layer and not the permanent system of record.

## Project Structure

```text
.
├── AGENTS.md
├── config/
│   └── env.example
├── docs/
│   ├── README.md
│   ├── current-source-fields.txt
│   └── source-mapping.md
├── examples/
│   ├── sample-input.json
│   └── sample-output.json
└── flows/
    └── reporting-flow.json
```

## Internal Source Of Truth

The normalized schema is the internal source of truth:

- `case_id`
- `patient_age_or_age_sex`
- `referrer`
- `specimen_type`
- `specimen_site`
- `orientation`
- `clinical_background`
- `status`

All validation and draft-building logic should operate on normalized fields, not raw Baserow fields.

## Do-Not Rules

- No hardcoded secrets.
- No machine-specific paths.
- No silent extra fields.
- No pseudocode in deliverables.
- Keep Baserow-specific code isolated.
- Normalized schema is the internal source of truth.
- Do not assume exact OpenELIS API endpoints unless explicitly documented and sourced later.
- Do not add PDF export in this prototype phase.

## Adapter Rules

- Baserow-specific source reading belongs only in the Baserow adapter layer.
- Baserow-to-normalized mapping belongs only in the Baserow mapping layer.
- Baserow-specific write-back field translation belongs only in the Baserow destination/update adapter.
- Future OpenELIS work should replace the adapter layers, not the normalized validation and draft logic.

## Done Criteria

A task is done when:

- the Node-RED flow imports successfully
- the sample input path works
- the workflow outputs:
  - normalized object
  - validation result
  - draft payload
  - final status
- JSON files are valid
- no secrets or machine-specific paths are introduced

## Verification Steps

Use these checks after changes:

1. Validate JSON files:
   - `jq empty flows/reporting-flow.json`
   - `jq empty examples/sample-input.json`
   - `jq empty examples/sample-output.json`
2. Search for machine-specific paths or localhost assumptions:
   - `rg -n "/Users/|file://|vscode://|localhost|127\\.0\\.0\\.1" .`
3. Search for likely hardcoded secrets:
   - `rg -n "sk-|Token [A-Za-z0-9]|Bearer " .`
4. Import `flows/reporting-flow.json` into Node-RED and test the sample input path first.

## Working Style For Future Codex Runs

- Prefer minimal, working increments.
- Document any optional extra fields explicitly before depending on them.
- Keep docs and examples aligned with the flow behavior.
- When editing files, preserve the adapter/core separation.
