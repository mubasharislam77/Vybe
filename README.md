# VybeTheBrand

Pakistani streetwear ecommerce app — Next.js (App Router) + MongoDB, single
app (no separate API service: Server Components and Server Actions call
services directly).

**Status: foundation + commerce engine + catalog browsing are built and
tested against a real database. Product detail page, cart/checkout UI,
account pages, and the admin panel are not yet built.** See "What's left"
below before treating this as deployable.

## Quick start (local dev)

```bash
npm install

# 1. A local MongoDB replica set (transactions require a replica set, even
#    single-node). If you don't have one already:
mkdir -p .devdb
mongod --dbpath .devdb --port 27117 --bind_ip 127.0.0.1 --replSet rs0 \
  --logpath .devdb/mongod.log --fork
mongosh --port 27117 --eval "rs.initiate()"

# 2. .env.local (already present in this checkout for local dev):
#    MONGODB_URI=mongodb://127.0.0.1:27117/?replicaSet=rs0&directConnection=true
#    MONGODB_DB_NAME=vybe_dev
#    AUTH_SECRET=<32+ char secret>
#    NEXT_PUBLIC_SITE_URL=http://localhost:3000
#    CRON_SECRET=<any string>

npm run db:indexes        # create indexes (idempotent, safe to re-run)
npm run db:seed           # 48 sample products, categories, collections, coupons
npm run provision:admin -- --name="You" --email=you@vybe.pk --password=Password123

npm run dev                # http://localhost:3000
npm run test                # vitest integration suite (uses a separate vybe_test DB)
npm run typecheck
```

## Architecture

```
src/
  app/                      Routes (App Router). Server Components call
                             lib/services and lib/repositories directly —
                             no internal fetch() to our own API.
  auth.ts                   Auth.js v5 config (JWT sessions, two Credentials
                             providers: customer and staff).
  middleware.ts             Edge-safe role gate for /admin and /account
                             (defense in depth — every page/action also
                             checks the session server-side itself).
  lib/
    env.ts                  Core env vars validated eagerly; integration
                             credentials (Cloudinary, WhatsApp) validated
                             lazily so their absence never crashes the app.
    db/                     Mongo client singleton, typed collection
                             accessors, all index definitions in one file.
    validation/              Zod schemas (input validation at every
                             boundary: admin forms, checkout, auth, reviews).
    repositories/            One file per collection. Only place that talks
                             to MongoDB directly.
    services/                 Business logic: checkout.service (the
                             transaction), order.service (fulfillment state
                             machine + compensation), inventory, cart,
                             catalog.
    notifications/whatsapp/   Cloud API client, template selection,
                             transactional-outbox worker, signed document
                             token for the "large order" document template.
    actions/                  'use server' actions called from client
                             components (checkout, cart sync, registration).
  components/
    ui/                       Design-system primitives (Button, FormField,
                             ProductCard, Badge, PriceTag, ...).
    shop/                     Listing page + filters/sort/pagination,
                             shared by every catalog route.
scripts/                     create-indexes.ts, seed.ts, provision-admin.ts
                             — all safe/idempotent, documented in each file.
```

### Why these specific choices

- **Auth**: Auth.js v5, JWT session strategy, no DB adapter — our own
  `customers`/`staff_users` collections are the source of truth; Auth.js
  only signs the session cookie. Two separate `Credentials` providers
  (`customer`, `staff`) so a customer login can never authenticate as
  staff even by guessing a provider id.
- **Rate limiting**: a Mongo collection with a TTL index (fixed window),
  not Redis — one less service to configure. Swap for Upstash Redis if
  request volume ever makes the extra Mongo round-trip matter.
- **Money**: every amount is an integer in paisa (1 PKR = 100 paisa),
  formatted to PKR only at display time (`lib/utils/money.ts`).
- **Pagination**: keyset/cursor, not skip — `cursor` encodes the last
  item's sort value + `_id` tiebreaker. "Previous" is a bounded stack of
  prior cursors carried in the URL (`prevCursors`), not unlimited
  deep-skip.
- **Variant price/filter semantics** (`products.repo.ts`): size, color,
  price-range, and availability filters are combined into a *single*
  per-variant match condition, not independent per-field checks — so a
  product only shows as matching "Black, size M, under 3000" if ONE
  variant satisfies all three at once, and the price shown is that same
  variant's price, not an unrelated one's.

## What's built and verified

- **Checkout transaction** (`checkout.service.ts`): single MongoDB
  transaction per order — re-reads price/stock from the DB (never trusts
  client-sent prices), atomically claims stock (`$elemMatch` +
  `arrayFilters`, conditioned on `stock >= qty`), atomically claims coupon
  usage against its limit, computes shipping from store settings
  (per-city zones, COD eligibility, free-shipping threshold), and writes
  the order + a WhatsApp notification outbox row in the same commit.
  Idempotent via a unique index on `idempotencyKey` — a retried/doubled
  request returns the already-committed order instead of erroring.
- **Order fulfillment state machine** (`order.service.ts`): validated
  transitions (pending → confirmed → processing → shipped → delivered,
  plus cancelled/returned), enforced as an atomic conditional update, not
  read-then-write. Cancelling restocks + refunds coupon usage; returning
  restocks but leaves coupon usage spent (the sale happened).
- **WhatsApp Cloud API pipeline**: transactional outbox → worker (claims
  with a lock, backoff + retry) → template selection (single-message vs.
  document-header for large orders, with a signed short-lived token so
  Meta's servers can fetch the detail document without a session) →
  webhook for delivery-status callbacks. Missing credentials leave
  notifications visibly "pending", never silently failed.
- **Catalog listing**: `/shop`, `/category/[slug]`, `/collections/[slug]`,
  `/new-arrivals`, `/best-sellers`, `/sale`, `/search` — server-side
  filtering (size/color/price/availability/audience/tag/onSale),
  sorting (newest/price/best-selling/relevance), search (MongoDB text
  index baseline; Atlas Search upgrade path documented below), and
  cursor pagination, all stated in the URL.
- **Cart**: dual-mode — localStorage for guests, Mongo-backed for logged-in
  customers, merged once per login session. Every line is re-resolved
  against the live catalog on render (price/availability/title/image),
  not trusted from the client cache.

19 integration tests run against a real local MongoDB (needed since
transactions require a replica set) covering: correct server-side
pricing, idempotent replay, over-quantity rejection with full rollback,
**concurrent purchase of the last unit of stock** (exactly one winner),
made-to-order items not capped by `stock`, the full fulfillment
state-machine walk, both compensation paths, notification outbox
enqueue/pending-when-unconfigured, template size branching, parameter
sanitization, and signed-token forgery/expiry.

## What's left

Not started yet, in roughly the order I'd build them:

1. **Product detail page** (gallery, size guide, variant selection,
   reviews) — `getProductBySlug` / `listApprovedReviews` already exist.
2. **Cart drawer + `/cart` page, `/checkout`, `/checkout/confirmation`,
   order tracking page** — `checkout.actions.submitCheckout`,
   `cart.service.resolveCartView`, and `findOrderByTrackingToken` already
   exist; this is UI wiring.
3. **Account pages** (`/account/login`, `/register`, addresses, order
   history) — `auth.actions.registerCustomer` and the repositories exist;
   login itself is `signIn('customer', ...)` from `next-auth/react`.
4. **Homepage** real data wiring — it currently still renders the
   original landing page's static fallback product data
   (`src/lib/api.ts`), not the seeded catalog. The 3D hoodie-reveal hero
   and photography are kept; they need re-pointing at real products plus
   the featured-categories/lookbook/shopping-info sections the spec asks
   for.
5. **Admin panel** (`/admin/**`) — entirely unbuilt: product/category/
   collection/coupon CRUD forms, order management + status updates,
   dashboard, media upload (Cloudinary signing helper already exists at
   `lib/media/cloudinary.ts`), notification health/retry, staff roles,
   audit log display (the repo already records entries — nothing calls
   it yet from admin actions).
6. **Static pages**: about, contact, size guide, shipping, returns,
   privacy, terms, wishlist page, branded 404/error/empty states.
7. **SEO**: structured data, sitemap/robots, canonical URLs,
   noindex on checkout/account/admin.
8. **Reviews submission UI** (schema + repo exist, no form yet).
9. **10,000-product benchmark run** (`npm run db:seed:bench`) with actual
   p50/p95 measurements — not yet executed.

## External services you'll need for production

- **MongoDB Atlas** — `MONGODB_URI` in `.env.example`.
- **Cloudinary** (product media) — `CLOUDINARY_*` vars. Until set, admin
  media upload is disabled but nothing else breaks.
- **Resend** (email order notifications — the recommended/default
  channel) — see below. No card required for the free tier.
- **Meta WhatsApp Cloud API** (optional second notification channel) —
  see below, and read the warning first.
- **Upstash QStash (recommended if using WhatsApp)** — triggers the
  notification worker in near-real-time. Vercel's own Cron Jobs are
  daily-only on the Hobby plan, which is too slow for order alerts;
  `vercel.json`'s cron is a 5-minute backstop sweep that needs a Pro plan
  to actually run that often. Not needed for email-only notifications if
  a few minutes' delay is acceptable.

### Email setup (Resend) — recommended, start here

Orders enqueue a notification on **both** channels unconditionally
(`checkout.service.ts`); whichever isn't configured just sits "pending"
harmlessly, so you can run email-only, WhatsApp-only, both, or neither
without touching code.

1. Sign up at [resend.com](https://resend.com) — email/GitHub login,
   **no payment method required** for the free tier (3,000 emails/month).
2. Dashboard → API Keys → create one, copy it into `RESEND_API_KEY`.
3. Set `ADMIN_NOTIFICATION_EMAIL` to the same email address you signed up
   to Resend with. This isn't arbitrary: Resend's free tier, without a
   verified sending domain, only allows sending **to the account owner's
   own address** from their shared `onboarding@resend.dev` sender — which
   is exactly this use case. Verifying your own domain later (still free)
   lifts that restriction for a branded From address, but isn't required.
4. That's it — no webhook, no template approval, no review process.

### WhatsApp setup (optional)

**Read this before adding a card anywhere in Meta Business Manager.**
Meta's WhatsApp Business Platform requires a payment method on the
Business Portfolio before it will send *any* message (even within the
free monthly tier) — and adding one can trigger a real authorization
charge attempt on your card, not a token $0–1 hold. This happened during
development of this project: adding a card produced an attempted charge
of several thousand PKR. It failed only because the card lacked funds at
that moment — it was not a deliberate small "verification" amount. If you
go down this path, use a card/virtual card you're comfortable with being
charged a non-trivial amount, or skip WhatsApp and run email-only.

1. Create a Meta Business app with the WhatsApp product, get a phone
   number ID and a permanent access token.
2. In Meta Business Manager, submit two message templates for approval
   (category: Utility, language: English):
   - `vybe_new_order` — body with 9 `{{n}}` placeholders: order number,
     placed-at time, customer name, phone, city/province, item summary,
     total, payment method+status, admin order link.
   - `vybe_new_order_document` — a header of type **Document**, plus a
     shorter body (order number, time, name, phone, city/province, item
     count, total, link). Used automatically for orders with many line
     items; see `lib/notifications/whatsapp/templates.ts`.
3. Add a payment method under Business Settings → Payment Settings (see
   warning above), then set `WHATSAPP_CLOUD_API_TOKEN`,
   `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`,
   `WHATSAPP_ADMIN_NOTIFICATION_NUMBER` (your own number, E.164).
4. Subscribe your app's webhook to `messages` at
   `https://<your-domain>/api/whatsapp/webhook`, with
   `WHATSAPP_WEBHOOK_VERIFY_TOKEN` matching your `.env` value, and set
   `WHATSAPP_APP_SECRET` from the app dashboard (used to verify
   `X-Hub-Signature-256`).
5. Point a scheduler at `POST /api/cron/notification-worker` with an
   `Authorization: Bearer <CRON_SECRET>` header — Vercel adds this
   automatically for its own Cron Jobs once `CRON_SECRET` is set; for
   QStash, configure the same header manually. This single endpoint
   drains both the WhatsApp and email outbox channels.

**Known limitation**: delivery is at-least-once, not exactly-once, for
both channels. If a send succeeds but the response is lost before we
record it, the worker's lock expires and a retry can re-send the same
order notification. This is inherent to any provider integration without
a two-phase commit; it's a duplicate alert, not a duplicate order (the
order itself is protected by the checkout idempotency key, which this
doesn't touch).

### Search setup

The baseline is a standard MongoDB text index (`products.repo.ts`'s
`$text` query) — works identically on Atlas and self-hosted MongoDB, no
extra setup. For better relevance/typo-tolerance, create an Atlas Search
index named to match and switch the query branch in `products.repo.ts`
to `$search` (left as a documented upgrade path, not implemented, since
it requires a live Atlas cluster to verify).

## Known gaps / honesty notes

- The homepage has not been re-wired to the seeded MongoDB catalog yet
  (see "What's left" #4) — don't judge the storefront's final look from
  it today.
- Dependency audit: `tailwindcss@3`, `vitest@2`, and Next's bundled
  `postcss` have known advisories in their dev-only tooling paths
  (chokidar/braces, esbuild dev server, postcss sourcemap handling) —
  none exploitable in the deployed app itself. Fixing them means Tailwind
  4 / Vitest 5 / Next 16, all breaking changes not attempted here.
- Atlas Search, the 10k-product benchmark, and live WhatsApp send/webhook
  round-trips are implemented but unverified — they need real external
  credentials this environment doesn't have.
