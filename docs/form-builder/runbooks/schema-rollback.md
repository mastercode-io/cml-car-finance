# Form Schema Rollback Runbook (P2-09)

> Minimal, low-risk procedure for pinning and rolling back GA form schemas served from the CDN.

## Overview

- **Artifacts**: Each published schema is uploaded to `s3://cml-form-schemas/<formId>/<version>.json` and surfaced via `schema-manifest.json`.
- **Retention**: Keep the latest _N_ versions (default **5**) plus any pinned override.
- **Toggle**: Runtime checks `pinnedVersion` from the manifest (or `FORM_SCHEMA_VERSION_PIN` env override) before falling back to `currentVersion`.
- **Flip-back**: `scripts/pin-form-schema-version.js` patches the manifest locally (with retention) and can be used with `aws s3 cp` to push the update.

## Prerequisites

1. **AWS credentials** with write access to `s3://cml-form-schemas` (or equivalent CDN bucket).
2. **AWS CLI** installed locally or in CI (required for upload + cache busting).
3. `schema-manifest.json` downloaded locally prior to edits:
   ```bash
   aws s3 cp s3://cml-form-schemas/claims-intake/schema-manifest.json ./schema-manifest.json
   ```
4. Optional environment override for extreme cases:
   ```bash
   # Forces the renderer to load a specific version regardless of manifest
   export FORM_SCHEMA_VERSION_PIN="2024.09.2"
   ```

## Manifest structure

```json
{
  "formId": "claims-intake",
  "currentVersion": "2024.09.3",
  "pinnedVersion": null,
  "versions": [
    { "version": "2024.09.3", "url": "https://cdn.example/forms/claims-intake/2024.09.3.json" },
    { "version": "2024.09.2", "url": "https://cdn.example/forms/claims-intake/2024.09.2.json" },
    { "version": "2024.09.1", "url": "https://cdn.example/forms/claims-intake/2024.09.1.json" }
  ]
}
```

## Release flow (normal publish)

1. Export the new schema bundle (JSON + UI config) from the form builder CI job.
2. Upload with cache-busting headers:
   ```bash
   aws s3 cp dist/claims-intake-2024.09.4.json \
     s3://cml-form-schemas/claims-intake/2024.09.4.json \
     --cache-control "public, max-age=300"
   ```
3. Append the new entry to `schema-manifest.json` (`versions[0]`) and bump `currentVersion`.
4. Run the retention helper to keep the last five copies and push the manifest:

   ```bash
   node scripts/pin-form-schema-version.js \
     --manifest ./schema-manifest.json \
     --pin 2024.09.4 \
     --keep 5 \
     --dry-run > /tmp/schema-manifest.preview.json

   mv /tmp/schema-manifest.preview.json schema-manifest.json
   aws s3 cp schema-manifest.json s3://cml-form-schemas/claims-intake/schema-manifest.json \
     --cache-control "no-cache"
   ```

5. Invalidate CDN cache (CloudFront example):
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id E1ABC23XYZ \
     --paths "/claims-intake/schema-manifest.json"
   ```
6. Smoke test the form (`/demo`) to confirm the new version is served.

## Emergency rollback / pinning

1. Download the live manifest and inspect available versions.
2. Choose the last known-good version (e.g., `2024.09.2`).
3. Pin via the helper script (retention handled automatically):
   ```bash
   node scripts/pin-form-schema-version.js \
     --manifest ./schema-manifest.json \
     --pin 2024.09.2 \
     --keep 5
   ```
4. Upload the manifest back to the bucket and invalidate CDN caches as above.
5. Monitor analytics + error trackers for 15 minutes to confirm stability.
6. **Follow-up**: Create an RCA and plan a fix-forward release.

### Clearing a pin

Once the issue is fixed:

```bash
node scripts/pin-form-schema-version.js \
  --manifest ./schema-manifest.json \
  --clear \
  --keep 5
aws s3 cp schema-manifest.json s3://cml-form-schemas/claims-intake/schema-manifest.json \
  --cache-control "no-cache"
```

## Validation checklist

- [ ] `schema-manifest.json` contains the desired `pinnedVersion` (or `null`).
- [ ] Retained versions ≤ configured `--keep` (default 5) while always including the pinned build.
- [ ] CDN invalidation completed (CloudFront/Netlify/Cloudflare).
- [ ] Portal health checks (smoke test + metrics) pass post-change.
- [ ] Tracker updated with rollback timestamp & follow-up ticket.

## Script reference

`node scripts/pin-form-schema-version.js --help`

Key behaviours:

- Validates the requested version exists in `versions`.
- Enforces retention, ensuring the pinned build remains even if it falls outside the keep window.
- Emits the updated manifest to stdout when `--dry-run` is present (safe for previews/CI).
- Stamps `lastRollbackAt` when a pin occurs to aid audit logs.

## Testing the runbook

Run the unit test suite (Jest) to cover helper logic:

```bash
npm run test -- --runInBand --runTestsByPath \
  packages/form-engine/tests/unit/runbooks/pin-form-schema-version.test.ts
```

Use `--dry-run` during rehearsals to avoid mutating the production manifest.
