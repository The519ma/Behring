# Source Mapping: Prototype Baserow -> Internal Schema

This document defines the current prototype field mapping from Baserow to the normalized internal reporting schema.

The purpose is to keep source-system details isolated so the middleware can later move from Baserow to OpenELIS with minimal rewrite.

## Normalized Internal Schema

Stable internal fields used by the reporting workflow:

- `case_id`
- `patient_age_or_age_sex`
- `referrer`
- `specimen_type`
- `specimen_site`
- `orientation`
- `clinical_background`
- `status`

## Current Prototype Mapping

The adapter now prefers the live field labels returned by Baserow and also tolerates the earlier prototype labels where they differ only by capitalization.

The adapter also normalizes Baserow select values to plain text by using their `.value` property.

| Prototype Baserow field | Internal normalized field | Notes |
|---|---|---|
| `Internal Lab ID` or `internal lab id` | `case_id` | Primary case identifier |
| `Age` or `age` | `patient_age_or_age_sex` | Broad enough for age or age/sex values |
| `Referrer` or `referrer` | `referrer` | Optional in first version |
| `Specimen type` or `specimen type` | `specimen_type` | Required |
| `Specimen site` or `specimen site` | `specimen_site` | Required |
| `Orientation` or `orientation` | `orientation` | Optional in first version |
| `Brief Clinical Background` or `Brief clinical background` | `clinical_background` | Required |
| `Status` or `status` | `status` | Workflow status |

## Prototype-Only Fields Not Yet Used In The Internal Schema

These remain available in the prototype source but are not required by the first normalized workflow:

- `created on`
- `folder URL`
- `QR URL`
- `Barcode value`

If they become required later, add them deliberately to the internal schema rather than silently coupling the workflow to prototype fields.

## Why This Helps Migration

The middleware should not reason in Baserow field names after the adapter layer.

The intended split is:

1. source adapter reads source data
2. source mapping converts source fields to normalized internal fields
3. validation and draft generation run only on normalized internal fields
4. destination adapter translates normalized workflow results back into the active source system

## What Is Baserow-Specific Today

These concerns are intentionally isolated as Baserow-specific:

- reading a live row from Baserow
- building the Baserow GET request from `BASEROW_BASE_URL`, `BASEROW_TOKEN`, and `BASEROW_TABLE_ID`
- interpreting the Baserow row payload shape
- unwrapping Baserow select objects into plain-text values for the normalized schema
- mapping Baserow field names into normalized internal fields
- translating normalized workflow results back into Baserow update fields:
  - `Status` or `status`
  - `Draft report` / `draft report`
  - `Error message` / `error message`
  - `Last processed at` / `last processed at`

Only these three additional Baserow destination fields are required for this milestone:

- `draft report`
- `error message`
- `last processed at`

The normalized validation and draft-generation logic should not depend on these Baserow details.

## Future OpenELIS Adapter

Not implemented in this prototype.

When the OpenELIS adapter is built later, create a new mapping from OpenELIS fields into the same normalized schema:

| OpenELIS field/path | Internal normalized field | Notes |
|---|---|---|
| `REPLACE_LATER` | `case_id` | |
| `REPLACE_LATER` | `patient_age_or_age_sex` | |
| `REPLACE_LATER` | `referrer` | |
| `REPLACE_LATER` | `specimen_type` | |
| `REPLACE_LATER` | `specimen_site` | |
| `REPLACE_LATER` | `orientation` | |
| `REPLACE_LATER` | `clinical_background` | |
| `REPLACE_LATER` | `status` | |

If that mapping is done cleanly, the normalized validation and draft payload logic should not need major rewrite.

The intended replacement strategy is:

1. remove or bypass the Baserow read adapter nodes
2. replace the Baserow-to-normalized mapping with an OpenELIS-to-normalized mapping
3. replace the Baserow update adapter with an OpenELIS update adapter
4. keep normalized validation and draft payload generation unchanged
