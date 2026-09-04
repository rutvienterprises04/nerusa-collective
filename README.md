# Return-Gift Webapp

A webapp for a return-gift business (birthdays, kids' parties, events): customers browse
products with photos, build a cart, create their profile (mobile, email, delivery address),
pay via UPI, and track their order status — with an estimated delivery time shown before
they place the order.

**Stack:** Next.js 16 (App Router) + Tailwind CSS + Supabase (Postgres, free tier).
Chosen because both have generous free tiers and nothing to self-host — cheapest to run and
maintain for a small shop.

## What's built

- **Catalog** (`/`) — public product grid, no login required
- **Cart** (`/cart`) — client-side cart (localStorage), no account needed
- **Checkout** (`/checkout`) — customer profile form (name, mobile, email, address), live
  estimated-delivery-time preview by pincode, then order placement
- **Payment** — static UPI QR code + UPI ID shown after placing the order; customer submits
  their transaction reference/UTR, order goes to "payment pending verification" until you
  confirm it manually (see `src/lib/shiprocket.ts` and checkout notes below for the upgrade
  path to Razorpay once order volume grows)
- **Order tracking** (`/track`) — customer looks up status by order number + mobile, no login
- **Admin panel** (`/admin`, password-gated) — view orders, confirm payments, advance status
  (placed → confirmed → packed → shipped → out for delivery → delivered), manage products
  (`/admin/products`)
- **Shiprocket integration** (`src/lib/shiprocket.ts`) — stubbed in **mock mode** since there's
  no Shiprocket account yet. The whole app works end-to-end against the mock; flipping to the
  real API later only means filling in three functions in that one file, nothing else changes.
- **Delivery ETA estimator** (`src/lib/eta.ts`) — shown before checkout. Starts as a flat
  default per zone; automatically switches to a real historical average once 3+ orders have
  been delivered to a given pincode (data is recorded at every order stage — placed, confirmed,
  packed, shipped, delivered — specifically so this estimate keeps improving over time). This is
  the seed of the "learns from past deliveries" feature you asked for — it's a running average
  today, upgradeable to a proper model later without touching any other file.

## One-time setup

### 1. Create a free Supabase project
1. Go to https://supabase.com → New project (free tier).
2. Open **SQL Editor** → paste the contents of [`supabase/schema.sql`](supabase/schema.sql) → Run.
3. Go to **Project Settings → API** and copy: Project URL, `anon` public key, `service_role` key.

### 2. Configure environment variables
```bash
cp .env.local.example .env.local
```
Fill in the Supabase values from step 1, plus:
- `NEXT_PUBLIC_UPI_ID` — your UPI ID customers will pay to (e.g. `yourshop@okhdfcbank`)
- `NEXT_PUBLIC_UPI_PAYEE_NAME` — name shown in the customer's UPI app
- `ADMIN_PASSWORD` — password for `/admin`

Leave the `SHIPROCKET_*` variables blank until you register with Shiprocket — the app runs in
mock mode automatically until then.

### 3. Install & run
```bash
npm install
npm run dev
```
Visit http://localhost:3000

### 4. Set up photo uploads (one-time)
Product photos are uploaded straight from the admin panel — no separate image host needed.
1. In Supabase: **Storage → New bucket** → name it exactly `product-images` → toggle **Public**
   bucket → Create.
2. That's it. The admin upload endpoint (`src/app/api/admin/products/upload-photo/route.ts`)
   stores both the original and the auto-enhanced/watermarked photo there.

### 5. Add your first products
Go to **http://localhost:3000/admin/login**, sign in with `ADMIN_PASSWORD`, then
**Manage products** (**http://localhost:3000/admin/products**) to add items:
- Upload the plain product photo — it's automatically cropped square, white-balanced,
  lightly sharpened, given a soft vignette, and stamped with your brand watermark
  (see "Product photos" below for how to go further with an AI-styled backdrop later)
- Enter price, MOQ (minimum order quantity), and stock quantity

## Payment flow today (Phase 1 — static UPI)

1. Customer places order → sees a UPI QR code + your UPI ID.
2. They pay in their own UPI app, then paste the transaction reference/UTR back into the site.
3. Order shows as "Payment Under Verification".
4. You check your bank/UPI app, confirm the payment happened, then click **"Mark Confirmed"**
   in `/admin` — this both confirms the order and creates the Shiprocket shipment (mock for now).

**Upgrade path to Razorpay** (once order volume grows, as discussed): swap the `UpiPayment`
component's manual QR+reference flow for the Razorpay Checkout/Orders API, which auto-verifies
payment via webhook instead of a human checking a UTR. Everything downstream (order status,
Shiprocket, tracking) stays the same.

## Product photos — free polish now, AI backdrop later

Uploading a photo in `/admin/products` runs it through `src/lib/imageProcessing.ts`:
square crop, auto white-balance/contrast, subtle saturation lift, sharpening, soft vignette,
and a "Nerusa Collective" watermark in the corner — all done locally with the `sharp` library,
no API cost.

When you're ready to pay for a fancier AI-generated backdrop (product placed on styled
marble/silk/soft-light scenes), open `applyLuxuryBackdrop()` in that same file and swap the
no-op body for a call to an image-editing API (e.g. a provider like Photoroom/Pebblely, or an
Anthropic/OpenAI image-editing endpoint once you pick one). Nothing else changes — the
upload route, storage, and catalog display all stay the same.

## Connecting Shiprocket (when ready)

1. Register at https://www.shiprocket.in and note your pickup location name.
2. Set `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, `SHIPROCKET_PICKUP_LOCATION` in `.env.local`.
3. Fill in the real API calls in `src/lib/shiprocket.ts` (`createShipment`, `assignAwb`,
   `getTrackingUpdates`) per https://apidocs.shiprocket.in — the mock implementations show the
   exact shape each function needs to return.
4. Optionally add a Shiprocket webhook → an API route that updates `orders.status` and
   `orders.tracking_url` automatically as the courier scans packages.

## Deploying for free

- Push this repo to GitHub, then import it on [Vercel](https://vercel.com) (free tier) —
  add the same environment variables there.
- Supabase's free tier covers the database, auth-free customer profiles, and storage for a
  small shop's order volume.

## Notes

- Money is stored as integer paise in the database to avoid floating-point rounding bugs.
- Customer "profiles" are identified by mobile number — no password/account needed, matching
  the low-friction checkout you described.
- The brand name used throughout the UI (`src/lib/siteConfig.ts`) is a placeholder — swap
  `SITE_NAME` once you've settled on one (do a quick domain + IP India trademark search first).
