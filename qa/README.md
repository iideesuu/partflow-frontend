# Container QA — 2026-09-17

All builds, Node tests and Chromium execution ran in Docker. No host Node/Python installation was used.

## Results

- Vite production build: passed, 24 modules.
- Node tests: 9/9 passed (upload recovery and BOM editing contracts).
- Chromium, 1366 and 1920 widths: create/edit/delete, 6-decimal quantity, stale-write rejection and reload, viewer read-only controls, no page overflow; passed.
- Part pending-release button sends `action=release` with `If-Match`; passed.
- Import/export controls match viewer/reviewer/publisher/engineer/sysadmin roles; passed.
- No browser runtime errors in the BOM scenarios. Screenshots: `artifacts/bom-workspace-1366.png`, `artifacts/bom-workspace-1920.png`.
- Source/template strict plaintext check: 11/11 matched, including encrypted sources.
- Deployed frontend health, index and proxied CSRF endpoint: HTTP 200. Service remains running.

The browser tests intercept APIs using isolated fixtures. Backend API behavior is separately covered by the Django suite; these tests do not constitute real LDAP/MinIO, 5 GiB upload or the full V16 browser matrix acceptance.

## Reproduce

```powershell
powershell -ExecutionPolicy Bypass -File scripts/sync_runtime_templates.ps1 -Check
docker build --target build -t partflow-frontend-build:qa .
docker run --rm partflow-frontend-build:qa node --test tests/upload-contract.test.mjs tests/bom-edit.test.mjs
docker build -f qa/Dockerfile -t partflow-frontend-browser:qa .
docker run --rm partflow-frontend-browser:qa
```

This run used `https://registry.npmmirror.com` for the temporary QA container because the default npm registry timed out. Set `--build-arg NPM_REGISTRY=...` if required. Application lockfile/dependency registry configuration was unchanged.
