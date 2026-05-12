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

## Desktop Auto-Update Gap

The installed Windows desktop shell is separate from the VPS runtime. A GitHub `main` push updates the source repo and a Node-RED deploy updates the VPS, but neither action automatically creates a desktop installer update.

On the Windows workstation inspected on 2026-05-12, the installed Electron updater config was:

```yaml
provider: generic
url: https://replace-me.invalid/desktop-updates
updaterCacheDirName: behring-desktop-shell-updater
```

That means the desktop app can report "up to date" while still missing the newest workbench links, because it is checking a placeholder update feed rather than a real VPS or GitHub Releases feed.

Durable fix:

- publish signed desktop releases for Windows, macOS, and Linux
- configure the packaged desktop app's update provider to a real feed. The current release builder points to the VPS-proxied feed at `/software/desktop-updates`
- ensure the release feed contains the correct `latest.yml` / platform metadata and installer artifacts
- keep the browser fallback at `/software` as the immediate cross-platform route

Until that is done, users should use the VPS browser routes directly or install a freshly built desktop package. The desktop app's "up to date" message should not be treated as confirmation that the VPS runtime changes are packaged locally.

## Updateable Desktop Installer Builder

The repo now contains an Electron desktop builder at `apps/desktop`. Pushing a tag like `desktop-v0.2.0` runs `.github/workflows/desktop-release.yml`, which builds Windows, macOS, Linux, and legacy browser fallback packages and attaches them to the GitHub release.

The packaged app update feed is:

```text
http://217.15.167.222/software/desktop-updates
```

The VPS route redirects update metadata and installer asset requests to the matching GitHub release asset, so the VPS remains the public software hub while GitHub stores the downloadable binaries.

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
