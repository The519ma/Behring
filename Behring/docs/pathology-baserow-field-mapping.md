# Pathology Baserow Field Mapping Draft

This draft extends the current prototype Baserow mapping for pathology intake.

It is still adapter-specific and should not leak into core workflow logic after normalization.

## Preserved Case-Level Fields

These existing mappings remain valid:

| Baserow field | Internal field |
|---|---|
| `Internal Lab ID` | `case_id` |
| `Age` | `patient_age_or_age_sex` |
| `Referrer` | `referrer` |
| `Specimen type` | `specimen_type` |
| `Specimen site` | `specimen_site` |
| `Orientation` | `orientation` |
| `Brief Clinical Background` | `clinical_background` |
| `Status` | `status` |

## Pathology Intake Extensions

These fields should stay Baserow-side until normalized into `pathology_workflow`.

| Suggested Baserow field | Normalized target |
|---|---|
| `Patient identifier` | `pathology_workflow.referral.patient_identifier` |
| `Patient name` | `pathology_workflow.referral.patient_name` |
| `First Name` | Identifier scaffold input and patient display support |
| `Last Name` | Patient display support when full name is derived in middleware |
| `Gender` | Identifier scaffold input |
| `Date of Birth` | Identifier scaffold input |
| `Identifier suffix` | Preferred scaffold suffix input when generated in Baserow |
| `Referral attachment URLs` | `pathology_workflow.referral.attachment_urls` |
| `OpenELIS case id` | `pathology_workflow.case.openelis_case_id` |
| `Program` | `pathology_workflow.case.program` |
| `Accessioned at` | `pathology_workflow.case.accessioned_at` |
| `Grossing owner` | `pathology_workflow.case.grossing_owner` |
| `Reporting owner` | `pathology_workflow.case.reporting_owner` |
| `Gross processing method` | `pathology_workflow.processing_decision.primary_method` |
| `Gross processing notes` | `pathology_workflow.processing_decision.notes` |
| `Post-review requests` | `pathology_workflow.test_requests` |
| `Block ID` | `pathology_workflow.artifacts.block_id` |
| `Slide ID` | `pathology_workflow.artifacts.slide_id` |
| `Slide barcode` | `pathology_workflow.artifacts.slide_barcode` |
| `Report barcode` | `pathology_workflow.artifacts.report_barcode` |
| `Lab record barcode` | `pathology_workflow.artifacts.lab_record_barcode` |
| `Draft report text` | `pathology_workflow.report.draft_text` |
| `Report review status` | `pathology_workflow.report.status` |
| `Microscope image URLs` | `pathology_workflow.image_assets` |

## Notes

- Array-like fields may arrive from Baserow as arrays or delimiter-separated text, so the adapter should normalize both forms.
- Do not make Baserow the source of truth for final sign-out status.
- If `Program` is absent, default intake should assume `Histopathology`.
- If no explicit sample type override is supplied later, default OpenELIS sample creation should assume `Histopathology specimen`.
- If `Identifier suffix` is present, the middleware uses it first when building `PAT-*` and `LAB-*` identifiers.
- If `Patient identifier` is blank, the middleware scaffolds `PAT-YYYY-GXXXX` from `Date of Birth`, `Gender`, and `First Name`.
- If `Internal Lab ID` is blank, the middleware scaffolds `LAB-YYYY-GXXXX` using the same suffix as the patient identifier.
- If `Patient name` is blank, the middleware derives it from `First Name` and `Last Name` when both are available.
- Example scaffold for a male patient born in 1997 with first name `Varshith`: `PAT-1997-MVARS` and `LAB-1997-MVARS`.
- If the scaffold inputs are incomplete, the middleware falls back to a temporary suffix like `TEMP-00042`, producing IDs such as `PAT-TEMP-00042` and `LAB-TEMP-00042`.
- Use `Draft report text` only for plain-text pathology draft content.
- Use `Workflow snapshot JSON` for the full machine-readable workflow payload written back by Node-RED. Do not reuse that field as pathology report text.
