# Inventory System Documentation

## Overview
This document centralizes project documentation: database schema, environment, coding standards, and operational notes.

## Tech Stack
- Next.js 15, React 19, TypeScript 5
- TailwindCSS 3
- Supabase (PostgreSQL + RLS)

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Create a `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Database Schema (Supabase)
See `Corrected Supabase schema script` provided in chat. Key entities:
- `products_simplified`: LPG items with QR code tracking and status
- `stock_movements_simplified`: records status changes
- `user_profiles`: user information and roles
- `suppliers`: source info

## Coding Standards
- Follow Clean Code: descriptive names, early returns, minimal nesting.
- Strong typing for shared entities (see `lib/supabase.ts` `Product`).
- Avoid inline comments; add concise docstrings above complex functions.
- Keep components presentational and hooks stateful/async.

## Project Structure
- `app/*`: Next.js routes and pages
- `components/*`: UI and feature components
- `lib/*`: shared utilities, Supabase client
- `hooks/*`: data and UI hooks
- `scripts/*`: SQL scripts and maintenance

## Data Access
- Use `lib/supabase.ts` for client and helper functions.
- Prefer server-side where possible; client-side used here for simplicity.

## Testing & Linting
- Type-check: `pnpm tsc --noEmit`
- Lint: `pnpm lint`

## Deployment
- Ensure Supabase schema is applied.
- Configure environment variables in hosting platform.

## Future Improvements
- Tighten RLS to per-user policies.
- Server Actions for data mutations.
- Add unit/integration tests.