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
- `products`: LPG items; stock tracked via `quantity`. View `products_with_stock` exposes `current_stock` for compatibility.
- `suppliers`: source info.
- `stock_movements`: records stock changes; trigger applies to `products.quantity`.
- `inventory_logs`: detailed logs for audits.
- `qr_codes`: per-product QR data.

### Stock Update Flow
- Insert into `stock_movements` with `movement_type` in `['incoming','outgoing','expired','damaged','adjustment']`.
- DB trigger `apply_stock_movement` adjusts `products.quantity` accordingly.

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

## QR Codes
- Table: `qr_codes(qr_data unique)`
- Use helpers: `getQRCodes`, `generateQRCode`, `createQRCode`, `deleteQRCode`, `getProductByQRData`.

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
