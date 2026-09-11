# Tomora

A no-code website builder SaaS for small businesses, personal brands, NGOs,
churches, schools, coaches and creators — built for African businesses.

Next.js 14 (App Router) · Tailwind CSS · shadcn/ui · Lucide React · Supabase ·
Paystack · Vercel (wildcard subdomains).

---

## 1. Install

```bash
npm install
```

## 2. Environment variables

Copy `.env.example` to `.env.local` and fill in real values:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PAYSTACK_SECRET_KEY=
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
PAYSTACK_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_DOMAIN=tomora.com
NAMECHEAP_API_KEY=
```

## 3. Database

Run the SQL migrations in `supabase/migrations` (in order) from the Supabase
SQL editor, or with the Supabase CLI:

```bash
supabase db push
```

This creates all tables (`profiles`, `sites`, `subscriptions`, `products`,
`orders`, `domains`), enables RLS with policies, adds the `branding` and
`products` public storage buckets, and installs a trigger that auto-creates a
profile on signup.

### Make yourself an admin

```sql
update public.profiles set is_admin = true where email = 'you@example.com';
```

Admins can reach `/admin`.

## 4. Run

```bash
npm run dev
```

- Marketing site: `http://localhost:3000`
- Published tenant sites in dev: `http://<subdomain>.localhost:3000`
  (most browsers resolve `*.localhost` automatically).

## 5. Paystack

- **Platform billing** uses your platform `PAYSTACK_SECRET_KEY`. Set the
  webhook URL in the Paystack dashboard to
  `https://<app-domain>/api/webhooks/paystack` and the signing secret as
  `PAYSTACK_WEBHOOK_SECRET`.
- **Storefront checkout** uses each merchant's own Paystack public key (set in
  Dashboard → Payouts), so funds settle directly into the merchant's account.

## 6. Deploy (Vercel)

- Add all env vars in the Vercel project.
- Add a wildcard domain `*.tomora.com` and `tomora.com` to the project so
  subdomains and custom domains resolve to the same deployment.
- Custom domains: users add a `CNAME` for `www` → `cname.tomora.com`
  (apex via ALIAS/ANAME). `/api/domain/verify` polls DNS and flips
  `domain_status` to `active`.

---

## Plans and billing

Plans live in `PLANS` in `lib/constants.ts`. Anyone without an active
subscription is on the Free plan. Paid plans renew monthly; the One-Time plan
renews yearly. `lib/plan-pricing.ts` decides what a renewal costs and
`lib/billing.ts` (`applyPlatformPayment`) records it. `billing_cycle_position`
is left over from Pro's old 3-month cycle and is always written as 0.

## Transaction fee

Some plans take a fee on each online sale or donation:
`fee = round(subtotal × percent / 100) + flat`. The customer pays
`subtotal + fee`. The fee is sent to Paystack as `transaction_charge` on the
split, so it lands in Tomora's main account; `bearer` stays `subaccount`, so
the merchant keeps paying Paystack's own fee as before.

- Defaults: `transactionFeePercent` / `transactionFeeFlat` on each plan.
- Live values: the `plan_fees` table (admin → Transaction fees), no redeploy.
- Merchants paying before the fee launched carry a 0% override on their
  subscription (`fee_percent_override`, `fee_flat_override`).
- Each payment's make-up is stored in `payment_charges`, including Paystack's
  reported split once it is paid.
- Plans with a fee take online payment only (`allowBankTransfer: false`).
- Nothing is charged until migration `0047_plan_fees.sql` has run.

See `lib/platform-fee.ts`, `lib/plan-fees.ts` and `lib/payment-charges.ts`.

## Project layout

```
app/
  page.tsx                     Marketing landing page
  (auth)/                      Login, signup, forgot password
  onboarding/                  5-step setup wizard
  dashboard/(panel)/           Dashboard, brand, billing, domain, products,
                               orders, payouts, account (sidebar shell)
  dashboard/editor/            Full-screen site editor
  admin/                       Admin dashboard (is_admin only)
  sites/[type]/[value]/        Published tenant sites (via middleware rewrite)
  api/                         checkout, billing, domain verify, Paystack webhook
components/
  templates/                   The 8 templates + renderer + edit/store contexts
  marketing/ onboarding/ editor/ dashboard/ admin/ published/ ui/
lib/                           supabase clients, constants, billing, site-data…
supabase/migrations/           SQL schema + RLS + storage
middleware.ts                  Auth gating + wildcard subdomain routing
```

## Templates

| Template   | Category                  |
|------------|---------------------------|
| Clarity    | Business & Services       |
| Prestige   | Business & Services       |
| Luxe       | E-commerce & Shop         |
| Vivid      | E-commerce & Shop         |
| Editorial  | Brand & Creator           |
| Studio     | Brand & Creator           |
| Mission    | Organization & Community  |
| Foundation | Organization & Community  |

Each is a component taking `siteData` + `brandColor`, rendered by
`components/templates/index.tsx` in both the editor preview and published sites.

> Note: a brand `tomora-logo.svg` is included in `/public`. Drop a real
> `tomora-logo.png` there to override the mark if you have one.
