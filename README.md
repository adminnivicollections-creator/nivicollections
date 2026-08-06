# Nivi Collections

Storefront for handcrafted Indian occasion wear.

- **Live:** https://nivicollections.com
- **Stack:** Next.js 16 (App Router) · Supabase (Postgres, Auth, Storage) · Razorpay · Resend · Vercel

```bash
npm install
cp .env.example .env.local   # then fill in, see below
npm run dev
```

## Environment

Copy `.env.example` to `.env.local`. Values come from:

| Variable | Where |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → Data API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → API Keys → publishable (`sb_publishable_…`) |
| `SUPABASE_SECRET_KEY` | Supabase → API Keys → secret (`sb_secret_…`). **Server only, bypasses RLS.** |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay → Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | Same page, the secret half |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay → Settings → Webhooks, set when creating the webhook |
| `RESEND_API_KEY` | Resend → API Keys |
| `ORDER_EMAIL_FROM` | Must be on a domain verified in Resend |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally, the real origin in production |

To write a secret into `.env.local` without it passing through a terminal history or a chat log, copy it and run:

```bash
node scripts/set-env.mjs SUPABASE_SECRET_KEY
```

## Database

Run the files in `supabase/migrations/` **in order** via the Supabase SQL Editor:

| File | What it does |
|---|---|
| `0001_init.sql` | Tables, RLS policies, grants, storage bucket |
| `0002_revoke_anon.sql` | Revokes leftover `anon` privileges on customer tables |
| `0003_reserve_stock.sql` | `reserve_order_stock()` — **required**, or paid orders won't decrement stock |

Then seed the categories and make yourself an admin:

```bash
node --env-file=.env.local scripts/seed-categories.mjs
node --env-file=.env.local scripts/make-admin.mjs you@example.com
```

`scripts/recovery-link.mjs <email>` prints a one-time password-reset link, useful before SMTP is configured.

### Design notes

- **Money is integer paise everywhere.** No floats touch a price.
- **The cart is display-only.** `/api/checkout` receives variant ids and quantities, then re-reads every name, price and stock level from Postgres. A tampered cart cannot change what a customer is charged.
- **Stock is reserved in one guarded `UPDATE`**, so two buyers cannot both take the last piece.
- **The webhook is the source of truth for payment**, not the browser callback. It only moves `pending_payment → paid`, which makes Razorpay's retries idempotent.
- **Admin role is read from `profiles` with the service key**, never from JWT metadata — `user_metadata` is user-editable.
- All writes and all admin reads go through the service-role key server-side, which is why there are no admin RLS policies.

## Deploying

Vercel project `teamnivicollections/nivicollections`, deployed from `main`.

```bash
vercel deploy --prod
```

Set the same environment variables in Vercel → Settings → Environment Variables (Production).

### Razorpay webhook

Required, or orders stay stuck at `pending_payment` and stock never decrements.

- URL: `https://nivicollections.com/api/razorpay/webhook`
- Event: `payment.captured`
- Put the signing secret into Vercel as `RAZORPAY_WEBHOOK_SECRET`, then redeploy.

### Auth email

Supabase's built-in mailer is rate-limited and for testing only. Point it at Resend under
Project Settings → Authentication → SMTP: host `smtp.resend.com`, port `465`, user `resend`,
password = your Resend API key. Sending to addresses other than your own needs a domain
verified in Resend.

## Not built yet

- Legal pages (Terms, Privacy, Refund, Shipping, Contact) — **Razorpay requires these to activate an account**
- Admin cannot change order status or add tracking numbers
- Dispatch/shipping emails
- Product image zoom, sitemap, structured data
- Abandoned `pending_payment` orders are never cleaned up
