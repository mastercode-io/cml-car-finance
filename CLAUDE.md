# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **dual-purpose monorepo** containing:

1. **CML Car Finance Application** - A Next.js 14 production app for car finance claims with Netlify Functions backend
2. **Form Engine Package** (`packages/form-engine`) - A schema-driven, JSON Schema-based form rendering system under active development (Phase 3)

The repository uses npm workspaces to manage both the Next.js app and the form-engine package.

## Essential Commands

### Development

```bash
# Primary development command - starts both Next.js and Netlify Functions
npx netlify dev
# Access at: http://localhost:8888 (NOT port 3000)
# Next.js runs on :3000 internally, proxied through Netlify Dev on :8888

# Alternative: Next.js only (without serverless functions)
npm run dev

# Build everything (typecheck + workspace builds + Next.js)
npm run build

# Type checking across all packages
npm run typecheck

# Linting
npm run lint

# Code formatting
npm run format

# Testing
npm test                # Run Jest tests
npm run test:ci        # CI mode
npm run test:e2e       # Playwright E2E tests

# Form engine specific
cd packages/form-engine
npm run build          # Build the form-engine package
npm run size           # Check bundle size
```

### Utility Scripts

```bash
./scripts/start-dev.zsh      # Automated dev server startup
./scripts/reset-node.zsh     # Clean node_modules reinstall
./scripts/git-push.zsh       # Git push workflow
```

## Architecture

### Monorepo Structure

This is an **npm workspaces** monorepo with two main concerns:

1. **Next.js Application** (`/app`, `/components`, `/netlify/functions`)
   - Serverless JAMstack architecture
   - Next.js 14 App Router + React 18 + TypeScript
   - Netlify Functions for backend API (JavaScript)
   - shadcn/ui component library built on Radix UI
   - Client-side session management via localStorage

2. **Form Engine Package** (`/packages/form-engine`)
   - Standalone TypeScript package
   - JSON Schema-driven form system
   - React Hook Form + AJV validation
   - XState for state machines
   - Web Workers for validation
   - Currently in Phase 3 development (layout system, review flow, advanced widgets)

### Key Directories

```
├── app/                          # Next.js App Router pages
├── components/                   # Next.js app components
│   └── ui/                      # shadcn/ui components (53 files)
├── netlify/functions/           # Serverless API endpoints (JavaScript)
├── packages/
│   └── form-engine/            # Form engine package
│       ├── src/
│       │   ├── core/           # Field registry, schema composition, versioning
│       │   ├── components/     # Field components (TextField, SelectField, etc.)
│       │   ├── renderer/       # FormRenderer, StepProgress, ErrorSummary
│       │   ├── validation/     # AJV setup, RHF resolver, Web Worker
│       │   ├── rules/          # Rule engine, visibility controller, XState
│       │   ├── persistence/    # Draft recovery, autosave, conflict resolution
│       │   ├── computed/       # Computed field engine
│       │   ├── analytics/      # Form analytics tracking
│       │   ├── migration/      # Zod/React Form migrators
│       │   └── hooks/          # React hooks
│       └── tests/              # Jest tests
├── apps/form-builder-demo/     # Demo app consuming form-engine
├── utils/                       # App utilities (session.ts)
├── lib/                         # Shared libraries (utils.ts)
├── docs/                        # Documentation
│   ├── form-builder/           # Form engine PRDs and plans
│   └── (other docs)
└── scripts/                     # Development scripts
```

### TypeScript Configuration

The project uses **multiple TypeScript configs** for different purposes:

- `tsconfig.json` - Main config for Next.js app and IDE
- `tsconfig.build.json` - Build-time config for `npm run typecheck`
- `tsconfig.form-engine.json` - Form engine specific config
- `packages/form-engine/tsconfig.json` - Form engine package build config

**Path aliases** (configured in `tsconfig.json`):
- `@/*` - Project root
- `@form-engine/*` - Form engine package source
- `@testing/*` - Form engine tests

## Form Engine Package Architecture

The form-engine is a **JSON Schema-driven** form system with these key features:

### Core Systems

1. **Schema & Validation**
   - JSON Schema as source of truth
   - AJV for validation (with ajv-errors, ajv-formats, ajv-keywords)
   - Web Worker-based validation for performance
   - React Hook Form integration via custom resolver

2. **Field Registry** (`core/field-registry.ts`)
   - Centralized field type definitions
   - Maps JSON Schema types to React components
   - Supports custom field types

3. **Rule Engine** (`rules/`)
   - Visibility rules via `visibility-controller.ts`
   - XState integration for complex state machines
   - Expression evaluation for computed fields

4. **Renderer** (`renderer/FormRenderer.tsx`)
   - Multi-step form support
   - Layout system (Phase 3: responsive grid)
   - Review step with validation flow
   - Error summary and step progress

5. **Persistence** (`persistence/`)
   - Auto-save with debouncing
   - Draft recovery
   - Conflict resolution
   - LocalForage for storage

6. **Analytics** (`analytics/FormAnalytics.ts`)
   - Field interaction tracking
   - Validation error metrics
   - Performance monitoring
   - PII redaction

### Phase 3 Development (Current)

The form engine is currently in **Phase 3** development focused on:

- **Layout V1**: Responsive grid system with multi-column support, section headers, breakpoints
- **Review Step Contract**: Declarative review flow with `allowReviewIfInvalid` flag
- **Validation Strategy**: Support for `onChange`, `onBlur`, `onSubmit` strategies with debouncing
- **Widget Enhancements**: MultiSelect, Time/DateTime, UK Address Lookup

See `docs/form-builder/PRD-Phase-3.md` for detailed specs.

## Next.js Application Patterns

### Serverless Functions

All backend logic is in `/netlify/functions/` as individual **JavaScript** files (not TypeScript).

**Standard pattern:**
```javascript
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Main logic here

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(response)
  };
};
```

**Important notes:**
- All functions must handle CORS
- Each function is a separate endpoint (single-purpose)
- Functions use axios for external API calls
- Zoho API integration for CRM operations

### Form Handling

The Next.js app uses **React Hook Form + Zod** validation:

- Forms define Zod schemas for validation
- Components use `useForm` hook
- API calls to Netlify Functions
- Example: `components/credit-search-form.tsx`, `components/login-form.tsx`

### Session Management

Client-side session handling via `utils/session.ts`:
- localStorage-based
- 30-minute expiration
- Automatic renewal on activity
- Bearer token for API calls

## Testing

### Current Setup

- **Jest** configured for form-engine package tests
- Test files in `packages/form-engine/tests/`
- **Playwright** for E2E tests
- **jsdom** test environment
- Coverage collection from form-engine source

### Running Tests

```bash
npm test                    # Run all tests
npm run test:ci            # CI mode (no watch)
npm run test:e2e           # Playwright E2E tests

# Form engine tests only
cd packages/form-engine
npm test
```

### Important Testing Notes

- Main Next.js app **lacks automated tests** - relies on manual testing
- Form engine has comprehensive unit tests
- Web Worker validation uses mocks in tests (`tests/__mocks__/worker-client.ts`)

## Development Workflow

### Port Configuration

**CRITICAL:** Always use Netlify Dev proxy for full functionality:

```bash
npx netlify dev
# ✅ Access at http://localhost:8888 (Netlify proxy)
# ❌ DO NOT access http://localhost:3000 directly
```

**Port setup** (from `netlify.toml`):
- `port: 8888` - Netlify Dev proxy (use this)
- `targetPort: 3000` - Next.js internal server
- These **must be different** values

### Before Starting Dev Server

1. **Check for port conflicts:**
   ```bash
   lsof -i :8888,3000 | grep LISTEN
   ```

2. **ASK before killing processes** - never assume it's safe

3. **Start with Netlify Dev:**
   ```bash
   npx netlify dev
   ```

### Working with Form Engine

When modifying the form-engine package:

1. **Build the package:**
   ```bash
   cd packages/form-engine
   npm run build
   ```

2. **Check bundle size:**
   ```bash
   npm run size
   ```

3. **Run tests:**
   ```bash
   npm test
   ```

4. **Type check:**
   ```bash
   cd ../..  # Back to root
   npm run typecheck
   ```

### Build Configuration Notes

- ESLint errors **ignored** in production builds (`next.config.mjs`)
- TypeScript errors **ignored** in builds
- This is intentional but review linting output manually
- Images set to `unoptimized: true` for Netlify

## Important Considerations

1. **Dual Build System**
   - Next.js app builds with Next.js bundler
   - Form engine builds with TypeScript compiler
   - Root `npm run build` orchestrates both

2. **No Global State Management**
   - Next.js app uses local state + localStorage
   - Form engine uses React Hook Form state
   - No Redux, Zustand, or similar

3. **Phase 3 Development**
   - Form engine under active development
   - Layout system being built
   - Check `docs/form-builder/PHASE-3-Tracker.md` for current status
   - Feature flags in `context/features.tsx`

4. **Netlify Functions**
   - Must be JavaScript (not TypeScript)
   - Single-purpose functions (not multipurpose routers)
   - All functions handle CORS
   - Test via `http://localhost:8888/.netlify/functions/[function-name]`

5. **External APIs**
   - Zoho Creator (EU region) for CRM
   - Address lookup services
   - OTP/SMS services
   - Environment variables in Netlify dashboard

6. **Component Library**
   - Next.js app uses shadcn/ui (in `/components/ui/`)
   - Form engine has its own shadcn/ui copies (in `/packages/form-engine/src/components/ui/`)
   - These are separate and intentional for package independence

## Common Patterns

### Adding a New Field Type to Form Engine

1. Create component in `packages/form-engine/src/components/fields/`
2. Register in `core/field-registry.ts`
3. Add type definitions to `types/schema.types.ts`
4. Add tests in `tests/`

### Adding a New Netlify Function

1. Create file in `netlify/functions/[name].js`
2. Use standard CORS pattern (see above)
3. Export `handler` function
4. Test at `http://localhost:8888/.netlify/functions/[name]`

### Adding a New Next.js Page

1. Create route in `app/[route]/page.tsx`
2. Follow App Router conventions
3. Use existing components from `/components` and `/components/ui`
4. Add session protection if needed (see `utils/session.ts`)

## Environment Variables

Set in Netlify dashboard (not in code):
- Zoho API credentials
- OTP service configuration
- Third-party API keys
- Never commit secrets to repository

## Documentation

- **Project overview**: `PROJECT_OVERVIEW.md`
- **Development guidelines**: `docs/development-guidelines.md`
- **CORS guide**: `docs/netlify-cors-guide.md`
- **Form builder PRDs**: `docs/form-builder/`
- **Form engine README**: `packages/form-engine/docs/README.md`

## Git Branch Strategy

- Current branch: `codex-form-builder-phase-3`
- Form engine development happens in feature branches
- See recent commits for Phase 3 progress
