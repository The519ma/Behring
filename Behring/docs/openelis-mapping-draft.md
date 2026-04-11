# OpenELIS Mapping Draft

This document is a planning draft for a future OpenELIS adapter.

It does not assume exact OpenELIS API endpoints, exact resource names, or exact field paths yet.

Its purpose is to identify what the future OpenELIS adapter will need to supply to the normalized middleware core and what it may need to accept back from the middleware for write-back.

## Status

- planning only
- no OpenELIS code implemented yet
- no endpoint assumptions locked in

## Goal

Keep the existing middleware core unchanged by mapping OpenELIS data into the same normalized schema already used by the Baserow prototype.

The pathology extension also expects the future OpenELIS adapter to carry nested workflow data for:

- gross processing method and notes
- dynamic stain, IHC, and repeat requests
- artifacts such as slide and label identifiers
- report status progression
- case-linked microscope image metadata

## Normalized Internal Schema To Preserve

The future OpenELIS adapter should still feed these normalized fields into the middleware core:

- `case_id`
- `patient_age_or_age_sex`
- `referrer`
- `specimen_type`
- `specimen_site`
- `orientation`
- `clinical_background`
- `status`

## Likely OpenELIS Data Domains

Without assuming exact implementation details, the future OpenELIS adapter will probably need to read from some combination of:

- case or accession metadata
- patient demographics
- order or request details
- specimen details
- clinical notes or history
- workflow or report status
- gross-processing or specimen-workflow notes
- stain or IHC request history
- report review and countersign state
- image references or linked attachments if supported

## Draft Mapping Questions

These are the key questions the OpenELIS mapping must answer later:

1. Where does the accession or case identifier come from?
2. Where do age and sex live?
3. Where does the referrer or requesting clinician live?
4. Where do program, specimen type, and specimen site live?
5. Where does the clinical background or history live?
6. Which OpenELIS status should map to normalized `status`?
7. What OpenELIS field or note area is appropriate for draft middleware output?

## Draft Mapping Table

This is intentionally a planning table, not a final implementation contract.

| Needed normalized field | Likely OpenELIS source area | Mapping notes |
|---|---|---|
| `case_id` | case or accession identifier | Must become the stable case key for middleware processing |
| `patient_age_or_age_sex` | patient demographics or request summary | May be composed from age and sex if OpenELIS stores them separately |
| `referrer` | order/requesting clinician | Optional in prototype, but should be mapped if available |
| `specimen_type` | specimen record | Required for middleware validation |
| `specimen_site` | specimen record or collection details | Required for middleware validation |
| `orientation` | local prototype meaning currently used for sex | This may need later semantic cleanup if OpenELIS uses a true specimen orientation field separately |
| `clinical_background` | clinical notes, history, or indication | Required for middleware validation |
| `status` | order/case/report workflow status | Must support later lock/skip rules |

## Draft Destination Write-Back Questions

The future OpenELIS destination adapter will need a safe answer to these questions:

1. Where should a draft middleware result be stored?
2. Should draft output live in a note, comment, report draft, or intermediate review field?
3. How should middleware processing errors be recorded?
4. How should the equivalent of `last processed at` be stored, if at all?
5. Which OpenELIS statuses should be treated as locked and skipped?
6. Where should gross processing decisions live?
7. How should post-review stain and IHC requests be represented?
8. Where should a finalized-pending versus countersigned report state live?
9. How should case-linked image references be stored if raw images stay on local Behring storage?

## Minimal Destination Capabilities Needed

To match the current middleware behavior, the future OpenELIS adapter should eventually support some equivalent to:

- draft payload storage
- error message storage
- processed timestamp storage
- workflow status inspection

The exact OpenELIS fields are intentionally left undefined until the real schema is inspected.

## Recommended Discovery Order

When OpenELIS work begins, answer these in order:

1. identify the real OpenELIS source entities for one specimen/case
2. locate the fields that map to the normalized schema
3. locate the workflow status field(s)
4. identify any locked/final statuses
5. identify the safest place for draft middleware write-back
6. only then implement an OpenELIS adapter

## Non-Goals For This Draft

- no guessed OpenELIS endpoint paths
- no guessed request payloads
- no guessed authentication details
- no code changes to the current prototype flow

This draft exists so the migration from Baserow to OpenELIS starts from a defined boundary instead of from scratch.
