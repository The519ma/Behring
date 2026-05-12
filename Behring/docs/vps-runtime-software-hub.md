# VPS Runtime Software Hub

Date: 2026-05-12

Behring should run VPS-first. Local Windows, macOS, and Linux machines are clients only: they open the VPS web app, install an optional desktop shell, or print/download label data from VPS-served pages.

## Live VPS Routes

- Web app / queue: `http://217.15.167.222/queue/new-cases/view`
- Referral intake: `http://217.15.167.222/orders/manual/view`
- Referral landing page: `http://217.15.167.222/orders/manual/view?mode=landing`
- Software hub: `http://217.15.167.222/software`
- Software manifest: `http://217.15.167.222/software/manifest`
- Label set template: `http://217.15.167.222/labels/set/:caseId`
- Report label template: `http://217.15.167.222/labels/report/:caseId`
- Slide label template: `http://217.15.167.222/labels/slide/:caseId`
- Lab record label template: `http://217.15.167.222/labels/lab-record/:caseId`

## Referral Form Fix

The previous `/orders/manual/view` page embedded the Baserow public form inside an iframe. Baserow dropdown menus could be clipped or hidden by that wrapper, blocking referral entry.

The live VPS Node-RED flow now redirects `/orders/manual/view` directly to the Baserow form so the form opens full-window. This avoids iframe clipping and lets dropdown overlays render normally. The landing page remains available at `/orders/manual/view?mode=landing` for navigation and fallback links.

## Software Hub

The live VPS now serves `/software` and `/downloads` from Node-RED. The page is a cross-platform launch point for:

- Behring browser app as the universal fallback
- Windows desktop installer slot
- macOS desktop installer slot
- Linux desktop installer slot
- Brother P-touch Editor official installer/download links
- VPS-generated label templates

The JSON manifest at `/software/manifest` defines the expected release artifact names:

- `Behring-Desktop-win-x64.exe`
- `Behring-Desktop-mac-universal.dmg`
- `Behring-Desktop-linux-x64.AppImage`
- `Behring-Desktop-legacy-web-workbench.zip`

## Label / P-touch Strategy

The live label route no longer depends on a workstation-local helper at `127.0.0.1`. Instead, `/labels/:labelType/:caseId` serves a VPS-hosted label page that:

- fetches case template data from `/reports/:caseId/template-data`
- renders printable browser labels with Code39-style barcode SVGs
- supports `set`, `report`, `slide`, `lab-record`, and `lab-note`
- lets the user download CSV data for Brother P-touch Editor merge templates

Browser printing is the legacy/cross-platform path. P-touch Editor remains a workstation application, but the data and templates are VPS-originated so Windows, macOS, and Linux clients can all work from the same case routes.

## Verification Run On 2026-05-12

These routes returned successfully after the live flow patch:

- `/orders/manual/view` returned `302` to the Baserow form
- `/orders/manual/view?mode=landing` returned `200`
- `/software` returned `200`
- `/software/manifest` returned `200`
- `/labels/set/LAB-1921-MSHAN` returned `200`
- `/reports/LAB-1921-MSHAN/template-data` returned `200`
