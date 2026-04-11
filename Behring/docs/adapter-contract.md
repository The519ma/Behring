# Adapter Contract

This document defines the stable boundary between:

- source-specific adapters such as Baserow today
- the normalized middleware core
- future destination adapters such as OpenELIS

It is intentionally API-agnostic. It does not assume exact OpenELIS endpoints.

## Purpose

The goal is to make the prototype portable.

Only adapters should know:

- how to read from a source system
- how to interpret source-specific fields
- how to write results back into that source system

The middleware core should only know the normalized schema and workflow rules.

## Core Input Contract

The normalized middleware core expects a normalized case object with these fields:

- `case_id`
- `patient_age_or_age_sex`
- `referrer`
- `specimen_type`
- `specimen_site`
- `orientation`
- `clinical_background`
- `status`

This object is the internal source of truth for validation and draft-payload construction.

## Pathology Workflow Extension

The case-level contract remains stable, but the middleware can now carry a nested `pathology_workflow` object alongside it.

That nested object is where staged pathology entities live:

- `referral`
- `case`
- `processing_decision`
- `test_requests`
- `artifacts`
- `report`
- `image_assets`

Adapters may evolve these nested sections without changing the preserved case-level fields above.

## Source Adapter Responsibilities

A source adapter must:

1. read a source record
2. identify the source record id
3. map source fields into the normalized schema
4. preserve enough source context for a later write-back

Minimum source adapter output to the middleware core:

```json
{
  "sourceAdapter": "baserow_prototype",
  "sourceRecordId": 123,
  "sourceRecord": {},
  "normalizedCase": {
    "case_id": "LAB-001",
    "patient_age_or_age_sex": "65 / Male",
    "referrer": "Referring clinician",
    "specimen_type": "Biopsy",
    "specimen_site": "Buccal mucosa",
    "orientation": "Male",
    "clinical_background": "Prototype clinical background",
    "status": "New"
  }
}
```

Notes:

- `sourceRecordId` is the source system’s runtime record identifier
- `sourceRecord` can remain source-specific because only adapters should use it
- `normalizedCase` must be source-agnostic

## Middleware Core Responsibilities

The middleware core must:

1. validate required normalized fields
2. decide whether the row should be processed or skipped
3. build the DRAFT-only reporting payload
4. produce a normalized workflow result

Required normalized fields today:

- `case_id`
- `patient_age_or_age_sex`
- `specimen_type`
- `specimen_site`
- `clinical_background`

The middleware core must not depend on:

- Baserow field names
- Baserow response shapes
- OpenELIS field names
- OpenELIS response shapes

It may produce richer nested workflow payloads, but it should still validate the preserved stable case-level fields independently of any one source system.

## Core Output Contract

The middleware core produces a normalized workflow result shaped like:

```json
{
  "workflow_status": "Draft Generated",
  "draft_payload": {},
  "error_message": "",
  "processed_at": "2026-04-04T16:18:16.987Z"
}
```

Possible workflow-level outcomes today:

- `Draft Generated`
- `Error`
- `Skipped - Locked Status`

## Destination Adapter Responsibilities

A destination adapter must:

1. accept the normalized workflow result
2. translate it into source-system-specific update fields
3. write back to the same source record when appropriate
4. report whether the destination update was attempted and whether it succeeded

Minimum destination adapter inputs:

```json
{
  "sourceAdapter": "baserow_prototype",
  "sourceRecordId": 123,
  "sourceRecord": {},
  "normalizedWorkflowResult": {
    "workflow_status": "Draft Generated",
    "draft_payload": {},
    "error_message": "",
    "processed_at": "2026-04-04T16:18:16.987Z"
  }
}
```

## Final Status Model

The final output should keep these concerns separate:

- `source_read_ok`
- `source_read_status`
- `processing_ok`
- `processing_status`
- `destination_update_attempted`
- `destination_update_ok`
- `destination_update_status`
- `destination_update_payload_preview`
- `destination_update_http_status`
- `destination_update_response`

This separation is required so a destination adapter problem does not falsely imply that normalization or validation failed.

## Current Baserow Adapter

The current Baserow adapter owns:

- building the Baserow GET request
- handling the Baserow row response
- mapping Baserow field names to normalized fields
- building the Baserow PATCH payload
- writing:
  - `Status`
  - `Workflow snapshot JSON`
  - `error message`
  - `last processed at`

The middleware core should remain unchanged if the Baserow adapter is later replaced.

## Future OpenELIS Adapter

A future OpenELIS adapter should replace only:

1. source read logic
2. source-field mapping
3. destination update logic

It should continue to feed the same normalized schema into the middleware core and consume the same normalized workflow result from the core.

That future adapter should also be able to consume or produce these capability-level contracts:

- referral intake contract
- case handoff contract
- processing update contract
- dynamic test request contract
- label payload contract
- barcode resolution contract
- image asset contract
- report status contract

That is the portability boundary this prototype is protecting.
