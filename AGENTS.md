# AGENTS.md

## Commands
- `npm run dev` - Start dev server
- `npm run build` - Build for production (also typechecks)
- `npm run lint` - Run ESLint
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database

## Architecture
- **Next.js 16** app with App Router (React 19, TypeScript strict mode)
- **Database**: Vercel Postgres (`@vercel/postgres`), queries in `lib/db/queries.ts`
- **Auth**: iron-session for session management (`lib/auth/`)
- **UI**: Radix UI primitives + Tailwind CSS 4 + shadcn/ui components (`components/ui/`)
- **Validation**: Zod for schema validation
- **Types**: Defined in `lib/types/`

## Dev-Only Magic Login

- Endpoint: `POST /api/auth/dev/magic-sign-in` (only in non-production)
- Requires env flags (do not commit secrets):
  - `MAGIC_LOGIN_ENABLED="true"`
  - `MAGIC_LOGIN_EMAIL="andrei@nicolaeandrei.com"`
  - `MAGIC_LOGIN_PASSWORD="..."` or leave unset to derive from `BETTER_AUTH_SECRET`
- Implementation: [lib/auth/magic-login.ts](file:///Users/andrei-mihai.nicolae/Documents/iron/lib/auth/magic-login.ts)

## Code Style
- Use `@/*` path aliases for imports (e.g., `@/lib/db/client`)
- Components organized by feature: `components/{feature}/` (history, manage, workout)
- API routes in `app/api/` using Next.js Route Handlers
- Prefer async/await, handle errors with try/catch and console.error
- Use TypeScript strict mode; avoid `any` except in generic DB query wrappers

## Testing with Visual Feedback Loops

When implementing UI features, use Chrome DevTools MCP to verify your work:

1. **Understand expectations**: Pick up visual requirements from the conversation (descriptions, mockups, or iterative discussion)
2. **Launch Chrome DevTools MCP**: Start browser automation to capture the app state
3. **Implement incrementally**: Make small changes, then verify each step
4. **Take screenshots**: After each significant change, capture a screenshot
5. **Compare to expectations**: Check layout, spacing, colors, interactions against what was discussed
6. **Iterate**: If the result doesn't match, adjust and re-verify before moving on

This prevents drift between what was discussed and what gets built, catching issues early.
