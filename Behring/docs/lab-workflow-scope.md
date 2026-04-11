# Lab Workflow Scope

This document describes the practical scope of the lab workflow the software is meant to support.

It is based on the current prototype direction and the stated real-world use case:

- a pathology lab
- reporting on samples and slides
- staining and IHC work
- final report generation
- local record-keeping for documentation, intake, processing, and billing

## Primary Purpose

The software is intended to support a pathology lab workflow, not just generate report text.

The system should eventually help with:

- case intake
- sample tracking
- slide and staining workflow tracking
- report drafting and final report generation
- internal documentation and local record storage
- billing support
- microscope image attachment and controlled QR access

## Current Prototype Coverage

The current prototype covers only one part of the future system:

- draft reporting middleware for one case record

It currently proves:

1. read one source record
2. normalize it
3. validate it
4. build a DRAFT-only payload
5. write the result back to the same record

That is useful, but it is only one slice of the eventual lab workflow.

## Real-World Workflow Areas

The eventual lab workflow likely needs to cover at least these areas:

### 1. Intake And Accessioning

- receive request or sample
- assign or confirm internal lab id
- capture referrer details
- capture specimen details
- capture clinical background
- register the case locally

### 2. Sample And Slide Processing

- specimen received
- gross handling or specimen preparation
- controlled gross processing method selection
- block and slide creation where applicable
- staining workflow
- IHC workflow
- repeat stain and recut workflow
- impression cytology as a processing fallback when block preparation is delayed
- internal tracking of what has been processed and what is pending

### 3. Reporting

- prepare a draft report
- review and revise report content
- finalize the report
- keep an internal archive of reports and related case data

### 4. Documentation

- retain searchable case history
- preserve timestamps and workflow steps
- keep local records even if the operational source system changes later

### 5. Billing Support

- record billable services
- connect case activity with charges
- support later invoice or billing-summary generation

## Likely Core Lab Entities

The real system will probably need to reason about more than a single flat case row.

Likely entities include:

- case
- specimen
- block
- slide
- stain
- IHC request or IHC result
- report
- billing item

The current prototype does not model all of these separately yet.

## Suggested Operational Status Areas

The eventual workflow may need statuses across multiple levels, for example:

- case received
- accessioned
- specimen processing pending
- staining pending
- IHC pending
- draft generated
- report under review
- finalized
- billed

These do not all need to be implemented now, but they should influence future design choices.

## System Boundaries

The long-term system may involve more than one responsibility:

- source-of-truth lab system
- middleware and transformation layer
- report output layer
- local documentation and archive layer
- billing support layer

OpenELIS may become the final operational source-of-truth system, but the middleware should remain modular in case some pathology-specific workflow needs a separate local layer.

## Design Implications

This scope suggests several important design choices:

1. do not overfit everything to the current Baserow prototype
2. do not assume one flat table will represent the final lab workflow
3. keep report-generation logic separate from source-system details
4. preserve a stable normalized boundary so OpenELIS can replace Baserow later
5. expect future expansion beyond just report drafting

## Immediate Practical Focus

For now, the project should stay focused on this narrow milestone:

- one case record
- normalized reporting inputs
- validation
- draft payload creation
- safe write-back

That keeps the prototype manageable while still supporting the eventual larger lab workflow.

## Near-Term Planning Questions

Before expanding the software further, the next questions to answer are:

1. what is the minimum case-level data required for final report generation?
2. what slide, stain, and IHC details must later become first-class data?
3. what documentation must be searchable locally?
4. what billing information must be captured per case?
5. which of those responsibilities belong inside OpenELIS and which may need a separate local layer?

This scope document is meant to keep future development aligned with the actual lab’s needs rather than with the temporary prototype structure.
