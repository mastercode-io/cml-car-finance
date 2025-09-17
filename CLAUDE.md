# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CML Car Finance is a Next.js 14 application with Netlify Functions backend, providing car finance search and management capabilities. The application uses TypeScript, React Hook Form with Zod validation, and shadcn/ui components built on Radix UI primitives.

## Essential Commands

### Development
```bash
# Primary development command - starts both Next.js and Netlify Functions
npx netlify dev

# Alternative: Next.js only (without serverless functions)
npm run dev

# Access points:
# - Netlify Dev: http://localhost:8888 (use this)
# - Next.js: http://localhost:3000 (internal, proxied)
```

### Build & Deploy
```bash
# Build for production
npm run build

# Lint code
npm run lint

# Clean install (if issues with dependencies)
rm -rf node_modules .next
npm install
```

### Utility Scripts
```bash
# Automated dev server startup
./scripts/start-dev.zsh

# Reset node modules
./scripts/reset-node.zsh

# Git push workflow
./scripts/git-push.zsh
```

## Architecture

### Directory Structure
- `/app/` - Next.js App Router pages and routes
- `/components/` - React components including shadcn/ui in `/components/ui/`
- `/netlify/functions/` - Serverless API endpoints (JavaScript)
- `/lib/` - Shared utilities and configurations
- `/utils/` - Helper functions including session management

### Key Architectural Patterns

1. **Serverless Functions**: All backend logic is in `/netlify/functions/` as individual JavaScript files. Each function handles CORS and returns JSON responses.

2. **Form Handling**: Uses React Hook Form + Zod for validation. Forms typically follow this pattern:
   - Schema definition with Zod
   - Form component with `useForm` hook
   - API calls to Netlify Functions

3. **Session Management**: Client-side session handling via `utils/session.ts` using localStorage.

4. **Component Library**: shadcn/ui components are in `/components/ui/`. When adding new UI components, check existing patterns in this directory first.

## API Integration

### Netlify Functions Pattern
Functions follow this structure:
```javascript
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle OPTIONS
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

### External APIs
- Zoho API integration through proxy functions
- Environment variables required (check Netlify dashboard)

## Important Considerations

1. **No Test Setup**: Project currently lacks testing infrastructure. Manual testing required for changes.

2. **ESLint Warnings**: Build configuration ignores ESLint errors/warnings in production (`next.config.mjs`). Review linting output manually.

3. **CORS Configuration**: All Netlify Functions must handle CORS. See `/docs/CORS Implementation in Netlify Functions.md` for details.

4. **TypeScript Path Aliases**: Use `@/` for imports from project root (configured in `tsconfig.json`).

5. **Form Components**: When creating forms, follow existing patterns in `/components/credit-search-form.tsx` or `/components/login-form.tsx`.

6. **State Management**: No global state management library. Components use local state and props. Session data stored in localStorage via `/utils/session.ts`.

## Development Workflow

1. Always use `npx netlify dev` for full functionality (includes serverless functions)
2. Check `/docs/` directory for specific implementation guides
3. Follow existing component patterns in `/components/ui/`
4. Maintain TypeScript types for all new code
5. Test serverless functions via the Netlify Dev proxy at `http://localhost:8888/.netlify/functions/[function-name]`