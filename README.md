# Sentinel documentation site

Public, docs-only companion to Sentinel for Pebble Time 2.

**Website:** https://andreasthinks.github.io/pebble-sentinel-docs/

**App:** https://apps.repebble.com/fe6550c8c87c49cbbc9d8cba

## Layout and publishing

The complete static site lives in `docs/`. GitHub Pages serves `main:/docs`.
Only this directory is deployed. No framework, build step, runtime dependencies,
external fonts, analytics, account, cookies or health-data upload are used by the site.
GitHub Pages may process standard hosting request information.

The application repository remains private. This repository contains only the
public website, its tests, and intentionally public app artwork. Never copy
application Git history, handoff files, credentials or real health recordings here.

## Local development

```sh
python3 -m http.server 8875 --bind 127.0.0.1 --directory docs
node --test tests/model.test.mjs
uv venv
uv pip install -r requirements-dev.txt
# Use installed Google Chrome, set CHROME_PATH, or install Playwright Chromium:
.venv/bin/playwright install chromium
.venv/bin/python tests/browser_test.py
```

`SITE_URL` points browser acceptance at a deployed site. `PROOF_DIR` changes the
screenshot output directory. Browser tests cover desktop, mobile, keyboard
controls, no-JS documentation, images, console exceptions, scenario changes,
missing/low-quality nights, calibration and recovery.

## Educational model, not firmware

`docs/model.mjs` is a deliberately limited, dependency-free explanation of the
v0.1.1 nightly baseline and episode rules. It is not the C implementation,
a simulator of sensors or a health tool. It omits sensor qualification math,
storage faults, long-gap/long-episode safeguards and notification scheduling.
The UI and detailed copy explicitly describe those boundaries. The demo uses
only synthetic values. HRV does not independently trigger its state changes.

Before changing algorithm copy, reconcile it with the current app's
`docs/ALGORITHM.md`, `src/core/sn_config.h` and detector implementation.
The tests pin the particular nightly rules the explainer teaches.

## Asset provenance

- `assets/dashboard.png`: actual v0.1.1 Store-download PBW running in an Emery
  emulator. No real person's readings. Watch frame is CSS illustration.
- `assets/icon.png`: Sentinel artwork shared with its public Store listing.
- `assets/social.png`: browser-captured hero, resized to 1200 × 630.
- The interactive graph is SVG rendered from explicitly synthetic data.

The site is an explanation of experimental wellness software, not medical advice.
Do not replace limitations with diagnosis claims, accuracy percentages or
unqualified promises of illness prediction.
