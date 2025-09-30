# Form Builder Demo Application

This directory is reserved for the interactive demo that will consume the form engine package.
Future steps in the implementation plan will scaffold the actual application code.

## Previewing the grid layout

The demo schema defines multi-section grid layout metadata for the early steps (contact details, employment, experience, etc.), but the runtime keeps the feature flag turned off by default.【F:src/demo/DemoFormSchema.ts†L357-L520】【F:packages/form-engine/src/context/features.tsx†L13-L177】 Enable the layout locally by exporting the flag before running the dev server:

```bash
export NEXT_PUBLIC_FLAGS="gridLayout=1"
npm run dev
```

When the flag is active and the schema requests `ui.layout.type: "grid"`, `FormRenderer` switches over to the grid renderer so you can inspect responsive columns and section landmarks; otherwise the demo falls back to the single-column stack so existing flows stay unchanged.【F:packages/form-engine/src/renderer/FormRenderer.tsx†L1104-L1108】【F:packages/form-engine/tests/integration/formrenderer.grid-layout.test.tsx†L92-L106】 Unset or omit the flag to return to the single-column renderer.
