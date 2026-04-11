# Windows Packaging Track

This folder is the start of the future single-click Windows installer.

For now, it does **not** produce a final `.exe` by itself. Instead, it contains the setup logic we want the eventual installer to run.

That keeps the installation behavior editable as the project evolves.

## Current Packaging Approach

The packaging track currently uses:

- `installer-manifest.json`
  - declarative placeholders for what the installer should know
- `BehringSetup.ps1`
  - PowerShell bootstrap logic for a fresh Windows machine
- `Run-Behring.cmd`
  - simple launcher wrapper for Windows users after setup

## Why Start This Way

The project is still evolving.

If we prematurely lock into a specific `.exe` builder, we will spend time rebuilding packaging every time the workflow changes.

This folder lets us:

1. keep installer behavior under version control
2. keep refining setup steps as requirements change
3. later wrap the PowerShell bootstrap into a real `.exe`

## Intended Future Behavior

When packaging is finalized, running the Windows installer should eventually:

1. unpack the project
2. ensure Node.js is available
3. install project dependencies
4. create a local runtime folder
5. copy the active flow baseline into the runtime location
6. create a local environment file from placeholders
7. provide an easy way to launch Node-RED

## Current Assumptions

This packaging scaffold assumes:

- target machine is Windows
- Node-RED will run locally on that machine
- the active baseline to package right now is:
  - `baseline/v0.0.6-ai-ready/`

## What Still Needs To Be Decided Later

- whether to bundle Node.js or require it separately
- whether to embed Node-RED or keep using local `npm install`
- where runtime data should live on the target PC
- whether the final installer should be built with:
  - Inno Setup
  - NSIS
  - `ps2exe`
  - another Windows packaging tool

## Current Recommendation

Keep updating this folder as the canonical installer logic.

Later, when the workflow is stable enough, wrap it into a real `.exe` rather than rewriting setup behavior from scratch.
