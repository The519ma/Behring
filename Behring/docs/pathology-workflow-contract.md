# Pathology Workflow Contract

This document defines the next-step pathology workflow contract for Behring.

It extends the earlier flat case-level prototype into a staged workflow that still preserves a stable case-level boundary for adapters.

## System Roles

- `Baserow` owns referral intake and triage only.
- `Behring / Node-RED` owns workflow orchestration, label payload generation, barcode-resolution helpers, and integration contracts.
- `OpenELIS` is the intended operational case system and official report/sign-out home.

## Core Case Contract

The stable case-level fields remain:

- `case_id`
- `patient_age_or_age_sex`
- `referrer`
- `specimen_type`
- `specimen_site`
- `orientation`
- `clinical_background`
- `status`

These fields continue to support portable validation and draft generation.

## Pathology Workflow Contract

The normalized workflow now adds a nested `pathology_workflow` object.

```json
{
  "case_id": "LAB-001",
  "patient_age_or_age_sex": "54 / Female",
  "referrer": "Referring clinician",
  "specimen_type": "Biopsy",
  "specimen_site": "Cervix",
  "orientation": "",
  "clinical_background": "Postmenopausal bleeding.",
  "status": "Accepted",
  "pathology_workflow": {
    "referral": {},
    "case": {},
    "processing_decision": {},
    "test_requests": [],
    "artifacts": {},
    "report": {},
    "image_assets": []
  }
}
```

## Nested Entities

### `referral`

Captures intake-only referral details from Baserow:

- `referral_id`
- `intake_status`
- `patient_identifier`
- `patient_name`
- `referrer`
- `specimen_description`
- `clinical_background`
- `attachment_urls`
- `originally_requested_tests`

### `case`

Operational case identity and ownership:

- `accession_id`
- `openelis_case_id`
- `program`
- `default_sample_type`
- `workflow_state`
- `grossing_owner`
- `reporting_owner`
- `accessioned_at`

### `processing_decision`

Primary gross-processing choice:

- `primary_method`
- `notes`
- `selected_at`
- `selected_by`

Allowed primary methods currently expected:

- `routine processing`
- `wax/paraffin block processing`
- `impression cytology`
- `frozen section`
- `cell block`
- `special handling / other`

### `test_requests`

Each request is a separate structured object:

- `request_id`
- `request_source`
  - `referral`
  - `post_review`
- `category`
  - `routine_stain`
  - `special_stain`
  - `ihc_marker`
  - `repeat_stain`
  - `repeat_section_recut`
- `requested_test`
- `requested_by_role`
- `requested_by_user`
- `requested_at`
- `reason`
- `status`

### `artifacts`

Case-linked operational identifiers:

- `block_id`
- `slide_id`
- `slide_barcode`
- `report_barcode`
- `lab_record_barcode`
- `label_reprint_required`

### `report`

Reporting and sign-out state:

- `draft_text`
- `status`
  - `draft`
  - `finalized_pending`
  - `countersigned`
- `finalized_at`
- `countersigned_at`
- `countersigned_by`

### `image_assets`

Case-linked microscope image metadata:

- `image_id`
- `image_type`
- `uploaded_by`
- `uploaded_at`
- `storage_key`
- `portal_token`
- `portal_url`
- `qr_target_url`

## Integration Contracts

### Referral intake contract

Transforms a Baserow referral row into:

- stable case-level normalized fields
- `pathology_workflow.referral`
- a minimal initial `pathology_workflow.case`

### Case handoff contract

Transforms a normalized referral into a future OpenELIS case payload with:

- accession identifier
- patient identifiers
- program
- default sample type
- specimen and clinical details
- processing context

### Processing update contract

Represents a gross-processing selection event:

- one primary controlled method
- optional notes
- user and timestamp

### Dynamic test request contract

Represents add-on and repeat requests after review:

- source of request
- category
- who requested it
- why it was requested
- current fulfillment status

### Label payload contract

Produces three label payloads per accessioned case:

- `slide_label`
- `report_label`
- `lab_record_label`

Each label payload contains:

- human-readable lines
- canonical identifiers
- a barcode value
- a barcode resolution URL

### Barcode resolution contract

Resolves a scanned barcode into:

- `barcode_value`
- `case_id`
- `openelis_case_id`
- `case_detail_route`
- `preferred_target_system`

The route may later resolve directly into OpenELIS or via a Behring redirect/helper view.

### Image asset contract

Turns uploaded microscope image metadata into:

- case-linked storage metadata
- a private portal URL
- a QR-safe target URL for the report

### Report status contract

Tracks report lifecycle as:

- `draft`
- `finalized_pending`
- `countersigned`

## Defaults

- Labels are produced at accessioning.
- Later slide-specific reprints are allowed.
- Referral-requested tests are visible but not final.
- Post-review test changes are allowed for pathologist and senior tech roles.
- QR links must target a private portal page, not raw files.
- Default intake mapping should use `Histopathology` program and `Histopathology specimen` sample type unless a referral is clearly cytology- or IHC-specific.
