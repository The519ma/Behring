# Current State

This file is the quickest way to re-enter the project.

## Active Starting Point

The current recommended rollback and starting baseline is:

- `baseline/v0.0.6-ai-ready/`

This is the most complete stable snapshot so far because it combines:

- live Baserow prototype support
- truthful status separation
- locked-row protection
- safer sample/direct-input behavior
- report handoff structure
- deterministic draft section scaffolds
- optional OpenAI wiring without making AI required
- pathology workflow contract scaffolding
- staged case, processing, label, and image metadata in sample flow output

## What To Use Day-To-Day

If you want a stable reference, use:

- `baseline/v0.0.6-ai-ready/`

If you want to experiment, create a new working copy from:

- `baseline/v0.0.6-ai-ready/`

Recommended pattern:

1. keep `baseline/` folders read-only
2. create a new folder under `working/`
3. copy the chosen baseline into that working folder
4. make changes only in the working folder

## Current Practical Defaults

- Baserow remains the prototype source adapter only
- OpenELIS is still the intended future system of record
- reporting remains the main focus
- pathology intake-to-report orchestration is now the active expansion direction
- deterministic scaffold output is the default
- OpenAI support is present but optional

## Current Runtime Notes

- Node-RED runs from this repository on the Mac
- Baserow runs in Docker inside the Linux VM
- for tunneled access, Baserow is expected at:
  - `http://localhost:8080`
- the Node-RED runtime should use:
  - `BASEROW_BASE_URL=http://localhost:8080`

## Useful References

- `docs/README.md`
- `docs/source-mapping.md`
- `docs/adapter-contract.md`
- `docs/openelis-mapping-draft.md`
- `docs/openelis-role-decision.md`
- `docs/pathology-workflow-contract.md`
- `docs/pathology-baserow-field-mapping.md`
- `docs/v0.0.6-ai-verification.md`
