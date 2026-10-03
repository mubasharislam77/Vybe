# VYBE

Pakistani streetwear with a western tarka. An immersive, scroll-driven landing
experience where a 3D figure rotates to reveal a hoodie's premium details.

- **`apps/web`** — Next.js 15 (App Router, TS, Tailwind) + React Three Fiber. The landing page.
- **`apps/api`** — Nest.js 11 (TS). Products + newsletter endpoints.
- npm workspaces monorepo (no pnpm needed).

## Run it

```bash
npm install                 # once, from the repo root

npm run dev:api             # terminal 1 → http://localhost:3001
npm run dev:web             # terminal 2 → http://localhost:3000
```

The web app reads `NEXT_PUBLIC_API_URL` (`apps/web/.env.local`, default
`http://localhost:3001`). If the API is down, the catalog falls back to local
data so the page still works.

> Don't run `npm run build` while `npm run dev` is live for the same app — they
> share `.next` and the dev server will throw transient module errors. Stop dev first.

## The signature "reveal" (centerpiece)

`apps/web/src/components/reveal/` — a pinned, scroll-scrubbed R3F scene. Scroll
progress rotates the figure through reveal "stops"; annotation markers (fabric,
stitching, print, fit) fade in at each angle.

### Swap in a real free 3D model

Currently a procedural mannequin (`Mannequin.tsx`) so it works with zero assets.
To use a real model: drop `hoodie.glb` in `apps/web/public/models/`, then use
`Model.tsx` in place of `Mannequin` (see `public/models/README.md` for free sources).

## API

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/health` | health check |
| GET | `/products` | catalog |
| GET | `/products/:id` | one product |
| POST | `/newsletter/subscribe` | `{ email }` → join list (validated) |
| GET | `/newsletter/count` | subscriber count |

Data is in-memory for now — swap `ProductsService` / `NewsletterService` for a
DB (e.g. Prisma + Postgres) without touching the controllers or the frontend.

## Roadmap

- [ ] Real 3D garment model + brand photography
- [ ] Product detail pages + cart/checkout
- [ ] Persist catalog & subscribers (DB) + email provider integration
- [ ] CMS for drops
