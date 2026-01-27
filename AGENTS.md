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

## Code Style
- Use `@/*` path aliases for imports (e.g., `@/lib/db/client`)
- Components organized by feature: `components/{feature}/` (history, manage, workout)
- API routes in `app/api/` using Next.js Route Handlers
- Prefer async/await, handle errors with try/catch and console.error
- Use TypeScript strict mode; avoid `any` except in generic DB query wrappers
