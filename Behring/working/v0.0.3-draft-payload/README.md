# Portable Reporting Middleware Prototype

This project is a portable prototype for a lab reporting workflow.

Baserow is used only as a temporary prototype source. The design deliberately keeps Baserow-specific logic isolated so the workflow can later swap to an OpenELIS adapter with minimal rewrite.

## Normalized Schema

The internal normalized schema used by the workflow is:

- `case_id`
- `patient_age_or_age_sex`
- `referrer`
- `specimen_type`
- `specimen_site`
- `orientation`
- `clinical_background`
- `status`

This normalized object is the stable interface between source adapters and reporting logic.

## Source Mapping

Current prototype mapping from Baserow to the normalized schema:

- `Internal Lab ID` or `internal lab id` -> `case_id`
- `Age` or `age` -> `patient_age_or_age_sex`
- `Referrer` or `referrer` -> `referrer`
- `Specimen type` or `specimen type` -> `specimen_type`
- `Specimen site` or `specimen site` -> `specimen_site`
- `Orientation` or `orientation` -> `orientation`
- `Brief Clinical Background` or `Brief clinical background` -> `clinical_background`
- `Status` or `status` -> `status`

See `docs/source-mapping.md` for the maintained mapping contract.

## Project Structure

```text
Documents/Behring/
├── baseline/
│   └── known-good/
├── config/
│   └── env.example
├── docs/
│   ├── README.md
│   ├── source-mapping.md
│   └── current-source-fields.txt
├── examples/
│   ├── sample-input.json
│   └── sample-output.json
├── tests/
│   └── results/
└── flows/
    └── reporting-flow.json
```

## Architecture

The flow is split into these layers:

1. source adapter
2. source-to-normalized mapping
3. normalized validation
4. normalized draft payload construction
5. destination update adapter

For the current prototype:

- source adapter: Baserow prototype
- source mapping: Baserow field names to normalized internal schema
- shared core logic: validation and draft generation using only normalized fields
- destination update adapter: Baserow update translation

The live Baserow path is already included and kept separate from the sample-input path.

## Importing Into Node-RED

1. Start Node-RED.
2. Open the Node-RED editor.
3. Open the top-right menu.
4. Choose `Import`.
5. Choose `select a file to import`.
6. Import `flows/reporting-flow.json`.
7. Deploy the flow.

Node-RED can read environment variables from function-node `env.get(...)` calls and from node properties that reference env-backed values. In this prototype, the Baserow adapter reads its runtime configuration from environment variables only.

## First Test

The first test should be sample input only.

Start with:

1. import the flow
2. deploy it
3. run the sample input inject node
4. confirm the normalized object, validation result, draft payload, and final status output

Live Baserow integration comes after the sample-input path is working cleanly.

## Where To Replace Baserow Values

Do not hardcode credentials into the flow.

Replace the Baserow runtime values in `config/env.example` or your Node-RED runtime environment.

Required variables:

- `NODE_RED_ENV`
- `SOURCE_ADAPTER`
- `BASEROW_BASE_URL`
- `BASEROW_TOKEN`
- `BASEROW_TABLE_ID`

These are the only three real values you need to insert for the live Baserow adapter:

- `BASEROW_BASE_URL`
- `BASEROW_TOKEN`
- `BASEROW_TABLE_ID`

Use `config/env.example` as a template and replace only the placeholder values:

- `NODE_RED_ENV=development`
- `SOURCE_ADAPTER=baserow_prototype`
- `BASEROW_BASE_URL=http://your-baserow-host:8080`
- `BASEROW_TOKEN=replace_me`
- `BASEROW_TABLE_ID=replace_me`

Important distinction:

- `BASEROW_TABLE_ID` is the fixed numeric identifier of the prototype table
- `rowId` is the numeric identifier of one record inside that table

The flow does not use a fixed `BASEROW_ROW_ID`.

- For the live read path, you provide `rowId` at request time to `/reporting/process-baserow-row-by-id`
- After the row is read, the flow carries that row's own numeric `id` forward as `sourceRecordId`
- The live write-back path updates that same row id in the configured table

Where they are used in the flow:

- `NODE_RED_ENV`: optional environment label for the Node-RED runtime
- `SOURCE_ADAPTER`: adapter selector for this prototype, expected to be `baserow_prototype`
- `BASEROW_BASE_URL`: base URL for the live Baserow API, for example `http://your-baserow-host:8080`
- `BASEROW_TOKEN`: Baserow API token used in the `Authorization: Token ...` header
- `BASEROW_TABLE_ID`: numeric table id for the prototype table that contains your source row and the three destination fields

The current prototype expects:

```env
NODE_RED_ENV=development
SOURCE_ADAPTER=baserow_prototype
BASEROW_BASE_URL=http://your-baserow-host:8080
BASEROW_TOKEN=replace_me
BASEROW_TABLE_ID=replace_me
```

How to provide these values depends on how Node-RED is started:

- if you start Node-RED from a shell, export the variables in that shell before running Node-RED
- if you use a service manager such as `systemd`, place the variables in the service environment configuration
- if you use Docker or Compose, pass them through the container environment section
- keep `config/env.example` as documentation or as the basis for a local non-committed env file

Optional future variables are also included for later OpenELIS or AI work:

- `OPENELIS_BASE_URL`
- `OPENELIS_API_TOKEN`
- `OPENAI_API_KEY`

## Prototype Output Fields Needed In Baserow

This milestone writes back to the existing `Status` field plus only these additional prototype fields:

- `draft report`
- `error message`
- `last processed at`

Recommended field types:

- `draft report`: long text
- `error message`: long text
- `last processed at`: date/time

These are prototype convenience fields only. They are not part of the internal normalized schema.

The live Baserow adapter expects those three fields to exist in the same table identified by `BASEROW_TABLE_ID`.

## Workflow

The current flow supports:

1. a sample prototype row from the inject node
2. POST of a full prototype row to `/reporting/process-row`
3. POST of `{ "rowId": 1 }` to `/reporting/process-baserow-row-by-id`

In that third path:

- `1` is only an example row id sent at runtime
- it is not stored in the flow as a fixed runtime configuration
- the sample-input path also uses `id: 1` only as neutral example data

Pipeline:

1. read source row
2. map source fields into normalized internal fields
3. validate normalized required fields
4. build a DRAFT-only reporting payload
5. create a normalized workflow result
6. let the active destination adapter translate that result into source-system updates

If destination update config is missing, the normalized workflow result is still preserved and returned, but the destination update is marked as skipped rather than mixed with a fake success state.

## Live Baserow Adapter Path

The flow now includes a live Baserow adapter path while keeping the sample-input path intact.

Baserow-specific responsibilities remain isolated:

- read a row:
  - `Baserow adapter: build GET`
  - `GET Baserow row`
  - `Baserow adapter: handle GET`
- map the Baserow row into normalized internal fields:
  - `Normalize row`
- update the same source row with:
  - `status`
  - `draft report`
  - `error message`
  - `last processed at`
  via:
  - `Baserow adapter: build PATCH`
  - `PATCH Baserow row`

The sample-input route remains the primary test harness and should not be removed.

The Baserow mapping layer matches the exact field labels returned by the live Baserow API. In the current prototype it accepts both the earlier lowercase labels and the title-cased labels returned by the live table. It also unwraps Baserow select objects such as `{ \"value\": \"Biopsy I/E\" }` into normalized plain-text values.

## Draft Payload Quality

This working iteration improves the draft payload so it is more useful for a real pathology reporting handoff.

The draft payload now contains:

- `normalized_case`
- `report_handoff.report_type`
- `report_handoff.report_sections`
- `report_handoff.handoff_checklist`
- `draft_report`
- `prompt_payload`

The `report_handoff.report_sections` object is shaped toward the real histopathology report layout and includes:

- `patient_name`
- `lab_number`
- `age_orientation`
- `received_on`
- `reported_on`
- `ref_by`
- `specimen_tested`
- `clinical_background`
- `macroscopic_description`
- `microscopic_description`
- `impression`
- `pathologist_signout_placeholder`

Current behavior:

- the middleware auto-fills the sections it can already support safely
- manual report sections remain blank on purpose
- the payload clearly marks that final sign-out is still manual
- no AI text generation is added in this iteration

## Sample Path Safety

In this working iteration, the sample/direct-input path is treated as a safe test harness by default.

Behavior:

- direct input still normalizes, validates, and builds the draft payload
- direct input does not write back to live Baserow by default
- destination update status becomes `Skipped - Direct Input Test Mode`

If you ever want to force write-back from direct input intentionally, that should be an explicit opt-in rather than the default behavior.

If the three Baserow runtime variables are missing:

- the live read path returns a clear configuration error
- the sample-input path still works
- processing success remains separate from destination update success

If the live Baserow path is used with a valid `rowId`, the same row is read and then updated back using that row's numeric `id` field.

## Validation Rules

Required normalized fields:

- `case_id`
- `patient_age_or_age_sex`
- `specimen_type`
- `specimen_site`
- `clinical_background`

If validation fails:

- output status = `Error`
- output a useful error message

If validation passes:

- output status = `Draft Generated`
- build a clean draft payload
- prepare a clean object for future OpenAI or API use

All generated content is explicitly draft only.

Locked source statuses in this working iteration:

- `Completed`
- `Finalized`

If a row is already in one of those statuses, the workflow does not generate a new draft and does not attempt Baserow write-back for that row.

## Status Model

The flow now separates four things clearly:

1. `config_check_result`
2. `source_read_result`
3. `processing_result`
4. `destination_update_result`
5. `final_result`

Top-level summary fields remain:

- `overall_status`
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

Behavior:

- if the sample-input path is used, `source_read_ok = true` and `source_read_status = "Direct Input Ready"`
- if the live Baserow read succeeds, `source_read_ok = true` and `source_read_status = "Live Read OK"`
- if the live Baserow read fails, processing does not pretend it succeeded
- if normalization, validation, and draft generation succeed, `processing_ok` stays `true`
- if the source row is already locked as `Completed` or `Finalized`:
  - `processing_ok = false`
  - `processing_status = "Skipped - Locked Status"`
  - `destination_update_attempted = false`
  - `destination_update_status = "Skipped - Locked Status"`
- if Baserow write-back is unavailable because config is missing, the run is not treated as a failed processing run
- missing Baserow config produces:
  - `destination_update_attempted = false`
  - `destination_update_ok = false`
  - `destination_update_status = "Skipped - Missing Config"`
  - `destination_update_result.missing_config = [...]`
- if Baserow write-back is attempted:
  - `destination_update_attempted = true`
  - `destination_update_ok` reflects the actual PATCH result
  - `destination_update_result.http_status_code` is the real update HTTP status
  - `destination_update_result.response` is the real update response payload
- `destination_update_payload_preview` shows the exact payload the adapter prepared before the PATCH attempt or skip decision

The `config_check_result` object reports:

- `source_adapter`
- `baserow_base_url_present`
- `baserow_table_id_present`
- `baserow_token_present`
- `missing_config`

The token value itself is never returned in debug output.

This avoids contradictory output where the inner workflow result says `Draft Generated` but the top-level result says `Error`.

## How This Later Swaps To An OpenELIS Adapter

The portability strategy is:

1. keep the internal normalized schema stable
2. replace the Baserow source adapter with an OpenELIS source adapter later
3. replace the Baserow mapping node with an OpenELIS-to-normalized mapping node
4. replace the Baserow update adapter with an OpenELIS update adapter
5. keep the normalized validation and draft-payload logic unchanged as long as the normalized schema remains sufficient

This prototype does not assume exact OpenELIS API endpoints. It only prepares the structure so that an OpenELIS adapter can be added later.

## Current Limits

- no AI call yet
- no PDF export yet
- Baserow is still only a prototype adapter
- OpenELIS adapter is not implemented yet

## Test Procedure

1. Import `flows/reporting-flow.json` into Node-RED and deploy it.
2. Run the `Sample input` path first and confirm the normalized object and draft payload are produced.
3. Run `Check runtime config` or call `GET /reporting/config-check` and verify:
   - `SOURCE_ADAPTER` value
   - whether `BASEROW_BASE_URL` is present
   - whether `BASEROW_TABLE_ID` is present
   - whether the token is present
4. Create one sacrificial real Baserow row using neutral placeholder content only.
5. Set the real environment variables, restart Node-RED if needed, and test `POST /reporting/process-baserow-row-by-id` with that real `rowId`.
6. Confirm the same Baserow row is updated with `Status`, `draft report`, `error message`, and `last processed at`.
7. Also test one row already marked `Completed` or `Finalized` and confirm the flow returns `Skipped - Locked Status` without overwriting that row.

## Minimal Test

1. Ensure the prototype Baserow table includes:
   - `draft report`
   - `error message`
   - `last processed at`
2. Set the environment variables.
3. Import `flows/reporting-flow.json` into Node-RED.
4. Deploy the flow.
5. Trigger the sample inject node or POST the sample JSON.
6. Confirm the normalized object, draft payload, and status update are produced as expected.

## Saved Baseline And Failure Checks

The current known-good baseline has been saved to:

- `baseline/known-good/AGENTS.md`
- `baseline/known-good/reporting-flow.json`
- `baseline/known-good/README.md`
- `baseline/known-good/source-mapping.md`
- `baseline/known-good/sample-input.json`
- `baseline/known-good/sample-output.json`

Saved failure-class test outputs:

- `tests/results/scenario-a-missing-required-field.json`
- `tests/results/scenario-b-empty-required-field.json`
- `tests/results/scenario-c-missing-baserow-config.json`

These cover:

- missing required field
- empty required field
- missing Baserow destination configuration
