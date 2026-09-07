# Handover: `combos-from-products`

Everything below is what is outstanding on this branch. Work through it in order.
Delete a line once it is done.

Branch state: 250 commits ahead of `main`, nothing merged. `main` is untouched.

## 1. Get the code

```bash
git clone https://github.com/Tomoraplatform/tomora.git
cd tomora
git checkout combos-from-products
npm install
```

## 2. Get the secrets

Secrets are never in git. `.env*.local` is ignored, and it stays that way.
Pull them from Vercel instead, which is the only copy that is guaranteed current:

```bash
npx vercel login
npx vercel link
npx vercel env pull .env.local
```

`vercel link` is needed because `.vercel/` is ignored too, so the second machine
does not know which project this is until you tell it.

`.env.example` lists every variable the code reads, with a note on what each one
turns on. Nothing in it is a real value.

## 3. Run the outstanding migrations

All four outstanding migrations are combined, in order, into
`supabase/apply-outstanding.sql`. Paste that one file into the Supabase SQL
editor and run it once. It is idempotent, so re-running it changes nothing, and
the editor runs it as a single transaction, so a failure leaves the database
exactly as it was.

The numbered files below are the source of truth. The combined file is generated
from them.

- [ ] `supabase/migrations/0041_plan_coupons.sql`, subscription coupon codes
- [ ] `supabase/migrations/0042_tomora_live.sql`, WhatsApp commerce tables
- [x] `supabase/migrations/0043_paid_renewal_clears_comp.sql`, applied
- [ ] `supabase/migrations/0044_direct_settlement.sql`, `settled_direct` on orders and donations
- [ ] `supabase/migrations/0045_creator_subaccounts.sql`, `academy_creators.paystack_subaccount`

To see which ones are already in, run this in the SQL editor:

```sql
select table_name, column_name
from information_schema.columns
where (table_name = 'orders'            and column_name in ('channel', 'settled_direct'))
   or (table_name = 'donations'         and column_name = 'settled_direct')
   or (table_name = 'academy_creators'  and column_name = 'paystack_subaccount')
   or (table_name = 'plan_coupons')
order by table_name, column_name;
```

`orders.channel` means 0042 is in. `settled_direct` on both tables means 0044 is
in. `academy_creators.paystack_subaccount` means 0045 is in. Any `plan_coupons`
row at all means 0041 is in.

The code runs correctly without 0044 and 0045: it falls back to the old
behaviour rather than failing. That is why nothing is visibly broken yet. But
until they are applied, sales and donations keep settling into Tomora's Paystack
balance instead of the owner's bank, and creators have no subaccount to be paid
into.

## 4. Fix the production alias

The last deploy went out but its alias step failed, so production may still be
serving the commit before the creator payout change. Check first:

```bash
npx vercel ls tomora
```

If the deployment behind `tomora.vercel.app` is not the newest one:

```bash
npx vercel alias set tomora-fiatchykn-tomoraplatforms-projects.vercel.app tomora.vercel.app
```

Deploys on this project go out through the Vercel CLI, not through GitHub:

```bash
npx vercel --prod --yes
```

## 5. Environment variables still to set in Vercel

None of these block a deploy. Each one turns a feature on.

- [ ] `TIKTOK_ACCESS_TOKEN`, the server half of the TikTok pixel. The browser
      half already works, this is the Events API side.
- [ ] Tomora Live, all of these together, and none of them work alone:
      `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`,
      `WHATSAPP_VERIFY_TOKEN`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `CRON_SECRET`.
      They come out of Meta's WhatsApp Business setup. Point the webhook at
      `https://www.tomora.com.ng/api/webhooks/whatsapp` and use the same string
      for `WHATSAPP_VERIFY_TOKEN` there as in Vercel.

Live is written to stay dormant while these are unset, so shipping without them
changes nothing for anyone.

## 6. Housekeeping

- [ ] `npx vercel project rm scratchpad`. A stray project from an earlier
      session. It asks for confirmation, which is why it is yours to run.
- [ ] Decide whether this branch merges into `main`. It has not been, and the
      gap is now 250 commits.

## What shipped on this branch

Short list, for orientation:

- Subscription coupon codes, created in the admin portal, redeemable at
  subscribe and at renewal
- Admin portal made usable on a phone
- Tomora Live, WhatsApp commerce on one shared number, 3% per order
- Paid renewal brings a site back online by itself, with no admin step
- Edge caching on published sites, invalidated on every write
- Gift counts on donation sites update on every paid donation, offline gifts
  included
- Sales and donations settle to the owner's own bank through Paystack split
- Creators keep the price they set, with the 3% added on top of what the student
  pays

Full detail is in the commit messages.
