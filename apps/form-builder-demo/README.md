# Form Builder Demo Application

This directory is reserved for the interactive demo that will consume the form engine package.
Future steps in the implementation plan will scaffold the actual application code.

## Previewing the grid layout

The demo schema now includes a flag-gated grid layout configuration. The feature remains disabled by default.
To preview it locally, start the dev server with the grid flag enabled:

```bash
export NEXT_PUBLIC_FLAGS="gridLayout=1"
npm run dev
```

Unset or omit the flag to return to the single-column renderer.
