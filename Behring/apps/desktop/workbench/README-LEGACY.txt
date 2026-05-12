Behring Desktop 0.1.0 legacy web workbench

This folder was extracted from Behring Desktop-0.1.0-arm64.dmg.

Why this exists:
- The original DMG is an Apple Silicon Electron app.
- Its app metadata requires macOS 11.0 or newer.
- macOS 10 cannot run that arm64 app directly.

How to use:
1. Open index.html in a browser on the older Mac.
2. Use the workbench links against the production Behring server.

Compatibility changes in this copy:
- desktopShell is set to false.
- requireWorkbenchAuth is set to false.
- local file:// command links are blanked because they pointed to a Mac-specific path.

This is not a signed macOS app and not a replacement DMG. It is a browser-compatible fallback for older Macs.
