# OpenELIS Role Decision

This document defines the intended boundary between:

- OpenELIS as the future operational lab system
- the custom middleware prototype being built now

It is meant to prevent duplicated functionality and avoid building custom layers for tasks OpenELIS may already handle well.

## Starting Assumption

If OpenELIS already supports the final report layout, storage, and official sign-out workflow, then the custom middleware should not try to replace that final reporting function.

Instead, the middleware should focus on what happens before final sign-out or outside OpenELIS’s convenient day-to-day workflow.

## What OpenELIS Should Likely Own

Assuming OpenELIS can support it well, OpenELIS should eventually own:

- official case record
- operational source-of-truth case data
- final report storage
- final report formatting if already supported
- final sign-out workflow
- official lab status progression where appropriate

## What The Middleware Should Likely Own

The custom middleware is most useful if it focuses on:

- source-to-normalized field mapping
- validation of required reporting inputs
- draft payload preparation
- optional future draft-text assistance
- pre-report workflow support
- local convenience automation
- safe integration between temporary and future systems

## Preferred Role If OpenELIS Already Handles Final Reports

If OpenELIS already does final report generation well, then the middleware should act as:

- a pre-report preparation layer
- a structured drafting layer
- a workflow helper

It should not try to become a parallel final reporting platform.

## Practical Division Of Responsibility

### OpenELIS

- stores the official case
- stores the official final report
- stores the official final status
- acts as the long-term system of record

### Middleware

- reads case data from the active source
- normalizes it
- validates it
- prepares draft content or structured draft payloads
- returns or writes back draft-stage results where appropriate

## What Should Not Be Duplicated

The middleware should avoid duplicating these if OpenELIS already covers them adequately:

- final report template rendering
- final sign-out workflow
- official final report archive
- final report status authority

## What May Still Be Worth Building Outside OpenELIS

Even if OpenELIS handles final reports, the custom layer may still be useful for:

- faster pathology-specific draft preparation
- easier structured intake for pathology reports
- local searchable convenience views
- local billing support
- stain and IHC workflow support if those are cumbersome in the main system

## Current Decision For This Prototype

For now, the prototype should assume:

1. OpenELIS is the future operational source-of-truth target
2. the custom middleware is not yet a final-report replacement
3. the middleware should focus on draft-stage reporting support first
4. final report rendering should only be custom-built later if OpenELIS proves insufficient

## Immediate Consequence For Development

The next development steps should stay focused on:

- high-quality draft payloads
- clear report-input validation
- smooth handoff into a future OpenELIS workflow

They should not yet focus on:

- custom final report rendering
- PDF generation
- duplicating official final-report storage

## Decision Trigger For Future Reassessment

Revisit this document later only if one of these becomes true:

- OpenELIS cannot support the required pathology final report layout
- OpenELIS cannot store the required structured report content cleanly
- the lab needs local final-output generation independent of OpenELIS

Until then, the safer design is to treat OpenELIS as the future final reporting system and the middleware as the structured draft/preparation layer.
