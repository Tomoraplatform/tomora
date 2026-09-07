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

Done. All of 0041 to 0045 are applied to production. Nothing here is outstanding
any more; it is kept as the record of how it was done.

They were applied by pasting two files into the Supabase SQL editor, in this
order:

1. `supabase/apply-outstanding-step1.sql`, one statement, run alone
2. `supabase/apply-outstanding.sql`, everything else

The split is not optional. Postgres refuses `ALTER TYPE ... ADD VALUE` inside a
transaction block and the SQL editor runs a pasted file as one transaction, so
batching 0042's enum change with the rest fails and silently rolls back every
migration in the paste.

The numbered files are the source of truth. The two above are generated from
them, and are idempotent.

- [x] `supabase/migrations/0041_plan_coupons.sql`, applied
- [x] `supabase/migrations/0042_tomora_live.sql`, applied
- [x] `supabase/migrations/0043_paid_renewal_clears_comp.sql`, applied
- [x] `supabase/migrations/0044_direct_settlement.sql`, applied
- [x] `supabase/migrations/0045_creator_subaccounts.sql`, applied

To confirm the state of a database, run this in the SQL editor. Four `true`
values is a fully migrated database.

```sql
select
  to_regclass('public.plan_coupons')                    is not null as m0041_coupons,
  to_regclass('public.live_accounts')                   is not null as m0042_live,
  (select count(*) = 2 from information_schema.columns
     where column_name = 'settled_direct'
       and table_name in ('orders','donations'))              as m0044_direct,
  (select count(*) = 1 from information_schema.columns
     where table_name = 'academy_creators'
       and column_name = 'paystack_subaccount')              as m0045_creators;
```

Worth knowing when reading this back: the code runs without 0044 and 0045, and
falls back to the old behaviour rather than failing. So a database missing them
looks healthy while quietly settling sales and donations into Tomora's balance
instead of the owner's bank. Absence of errors is not evidence they are applied.
Run the query.

## 4. Production alias

Done, and it turned out never to have been broken. The alias command reported a
tool error but had already taken effect. Verified with:

```bash
npx vercel inspect tomora.vercel.app
```

`tomora-fiatchykn-...`, built from commit `5aebd94`, is the production
deployment and holds every alias: `tomora.com.ng`, `www.tomora.com.ng`,
`*.tomora.com.ng`, `tomora.vercel.app`, and the customer domains
`giveabiblewithflc.com.ng` and `www.artommy.tomora.com.ng`.

Everything committed after `5aebd94` is documentation and SQL. No runtime code
has changed, so nothing is waiting to be deployed.

Two things about deploying here, both easy to get wrong:

- Production goes out through the CLI, `npx vercel --prod --yes`, not through
  GitHub.
- GitHub is still connected, and a push to this branch does build. It builds a
  **Preview**, not production. Seeing a fresh deployment appear after a push is
  not evidence that production moved.

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
