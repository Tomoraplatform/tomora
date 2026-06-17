# Make Extra Income with Claude AI — Course Portal

A premium, beginner-friendly mini-course portal. Students pay with **Paystack**,
get a **magic-link** (passwordless) login, and work through a calm, organized
course of videos (**Bunny Stream**) and **view-only worksheets**. Admins manage
students, content and feedback from a secure dashboard.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase
(Auth + Postgres + RLS) · Paystack · Resend/SendGrid email · Bunny Stream ·
Vercel.

> Design: soft cream background, charcoal text, warm caramel accent — Urbanist
> for UI, Lora for editorial headings.

---

## 1. Quick start (local)

```bash
npm install
cp .env.example .env.local   # then fill in real values (see §3)
npm run dev                  # http://localhost:3000
```

You also need a Supabase project (free tier is fine) with the SQL in
`supabase/migrations` applied (see §2), and Paystack **test** keys.

> **Banner image:** save your hero banner as **`public/images/course-banner.png`**.
> It renders in the right-side hero card on the landing page, above the course
> outline (responsive, rounded corners, soft border + shadow). A `README.txt`
> in that folder marks the spot.

> **Price:** the course price is fixed in code at **₦9,999** (original **₦45,000**
> shown struck through). Paystack is charged **999900 kobo**. To change it, edit
> `COURSE_PRICE_NAIRA` / `COURSE_ORIGINAL_PRICE_NAIRA` in `lib/constants.ts`.

---

## 2. Connect Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**server-only, secret**)
3. Open **SQL Editor** and run the migrations in order:
   - `supabase/migrations/0001_schema.sql` — tables, helper functions, RLS
   - `supabase/migrations/0002_seed.sql` — placeholder modules/lessons + settings
4. **Set the magic-link expiry to 10 minutes:**
   **Authentication → Sign In / Providers → Email → Email OTP Expiration** →
   set to `600` (seconds).
5. **Add the redirect URL:** **Authentication → URL Configuration → Redirect URLs**
   add `http://localhost:3000/auth/callback` (and your production URL later).
6. **Make yourself an admin** — run in SQL editor:
   ```sql
   insert into admin_users (email, role) values ('you@yourdomain.com', 'admin');
   ```
   (Or just set `ADMIN_EMAIL` in env — that email is always treated as admin.)

> RLS is enabled on every table. Students can only read their own progress and
> submit their own feedback. Course content is readable only by approved,
> authenticated students. Payments, webhook logs and admin users are reachable
> only via the server (service role). The service-role key is **never** imported
> into client code.

---

## 3. Environment variables

Copy `.env.example` → `.env.local` and fill in:

| Variable | Where it's used | Notes |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | client + server | e.g. `http://localhost:3000` or your domain |
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | safe to expose |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | bypasses RLS — keep secret |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | client | safe to expose |
| `PAYSTACK_SECRET_KEY` | **server only** | used only in API routes — never exposed |
| `EMAIL_PROVIDER` | server | `resend` (default) or `sendgrid` |
| `EMAIL_API_KEY` | server | Resend or SendGrid API key |
| `EMAIL_FROM` | server | `Course <noreply@yourdomain.com>` (verified sender) |
| `FEEDBACK_RECIPIENT_EMAIL` | server | defaults to `tommyconcept4@gmail.com` |
| `ADMIN_EMAIL` | server | always treated as an admin |
| `COURSE_PRICE` | server | fallback price (major units, e.g. `25000`) |
| `COURSE_CURRENCY` | server | `NGN` |

> Price/currency/WhatsApp link/feedback email can also be edited live from
> **Admin → Settings** (stored in `app_settings`, which overrides the env defaults).

**Security guarantees baked in:**
- `PAYSTACK_SECRET_KEY` is only read in `lib/paystack.ts` and server API routes.
- `SUPABASE_SERVICE_ROLE_KEY` is only read in `lib/supabase/admin.ts` (server).
- Only `NEXT_PUBLIC_*` variables reach the browser.

---

## 4. Add Paystack keys

1. Create a [Paystack](https://paystack.com) account.
2. **Settings → API Keys & Webhooks** → copy **test** keys:
   - Public key → `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
   - Secret key → `PAYSTACK_SECRET_KEY`
3. Locally, test with Paystack's [test cards](https://paystack.com/docs/payments/test-payments/)
   (e.g. card `4084 0840 8408 4081`, any future expiry, CVV `408`, OTP `123456`).
4. Go live later by swapping in live keys.

### Callback & webhook URLs

After deploying, set these in **Paystack → Settings → API Keys & Webhooks**:

```
Callback URL:  https://yourdomain.com/payment/success
Webhook URL:   https://yourdomain.com/api/paystack/webhook
```

- The **callback** returns the buyer to `/payment/success`, which calls
  `/api/paystack/verify` to confirm the charge and grant access.
- The **webhook** is the reliable backstop: Paystack POSTs `charge.success`,
  we verify the `x-paystack-signature` HMAC, dedupe, approve the student and
  email the magic link — even if the buyer closed the tab.

---

## 5. Email (Brevo by default — Resend / SendGrid optional)

Default is **Brevo**:
1. Create a [Brevo](https://www.brevo.com) account and verify your sender / domain.
2. Set:
   ```
   EMAIL_PROVIDER=brevo
   BREVO_API_KEY=your_brevo_api_key   # server-only, never exposed to the browser
   EMAIL_FROM=Make Extra Income with Claude AI <noreply@yourdomain.com>
   FEEDBACK_RECIPIENT_EMAIL=tommyconcept4@gmail.com
   ```

To use **Resend** or **SendGrid** instead: set `EMAIL_PROVIDER=resend` (or
`sendgrid`) and provide `EMAIL_API_KEY=...` instead of `BREVO_API_KEY`.

> Without the relevant API key, the app logs emails to the server console
> instead of sending — handy for local dev. Three templates are included:
> magic-link, payment/welcome, and the module-feedback notification.
> `BREVO_API_KEY` is read only in `lib/email.ts` (server) and never reaches the browser.

---

## 6. Add Bunny Stream videos

1. In [Bunny Stream](https://bunny.net), upload a video and open its **Embed**
   tab to get the iframe URL:
   `https://iframe.mediadelivery.net/embed/LIBRARY_ID/VIDEO_ID`
2. In **Admin → Content**, expand a module → paste the URL into the lesson's
   **Bunny Stream embed URL** field → **Save lesson**.
3. Each module has exactly one video lesson; the placeholder URL shows a
   "Video coming soon" state until you add the real embed.

---

## 7. Add view-only worksheets / PDFs

1. Host the PDF somewhere that supports a **view-only / preview** link
   (e.g. a Bunny Storage signed URL, or Google Drive **"Anyone with link → Viewer"**
   using the `/preview` URL).
2. In **Admin → Content**, paste it into the lesson's **Worksheet / PDF view URL**
   field → **Save lesson**.
3. The portal renders it in an embedded viewer with no download button, native
   PDF toolbar hidden (`#toolbar=0`), and right-click disabled, plus the note
   *"Worksheet is available to read inside this course portal."*

> Client-side viewers can't make a public file 100% un-downloadable. For the
> strongest protection use **private/signed URLs** that expire, so the link
> can't be reshared.

---

## 8. Deploy to Vercel

1. Push this folder to a Git repo and **Import** it in [Vercel](https://vercel.com).
2. Add every variable from §3 in **Project → Settings → Environment Variables**.
3. Set `NEXT_PUBLIC_APP_URL` to your production URL (e.g. `https://course.yourdomain.com`).
4. Deploy. Then:
   - Add `https://yourdomain.com/auth/callback` to Supabase **Redirect URLs**.
   - Set the Paystack **Callback** and **Webhook** URLs (§4).

---

## 9. How the flows work

**Payment → access**
1. `/checkout` → student enters name + email → `POST /api/paystack/initialize`
   (stores a pending transaction + pending student, returns Paystack URL).
2. Student pays on Paystack → redirected to `/payment/success`.
3. `/payment/success` → `POST /api/paystack/verify` confirms status, amount and
   email, marks the student **approved + paid**, and emails the welcome +
   10-minute magic link. The webhook does the same independently (deduped).
4. Student opens the magic link → `/auth/callback` exchanges it for a session →
   `/dashboard`.

**Login (returning student)**
- `/login` → enter the email you paid with → if approved, magic link is sent and
  you land on `/magic-link-sent`. If not approved, a soft message is shown.
  Request a fresh link anytime.

**Course**
- `/dashboard` shows progress (`X of Y lessons — Z%`), "Continue where you
  stopped", module cards with status, and the WhatsApp community.
- `/course/[moduleId]/[lessonId]` shows the video or worksheet, **Mark Lesson as
  Complete**, **Next Lesson**, **Back to Dashboard**. Completion is manual and
  saved to Supabase.
- Module order is **guided, not locked** — jumping ahead shows a gentle nudge.
- `/module/[moduleId]/feedback` collects Biggest takeaway / Where stuck /
  Question for the Expert, saves it, and emails `FEEDBACK_RECIPIENT_EMAIL`.
- `/complete` celebrates 100% and re-invites to the community.

**Admin** (`/admin/login` → `/admin/dashboard`)
- Add approved students manually, resend magic links, view students + progress,
  read feedback, see payments, and edit modules/lessons (titles, descriptions,
  Bunny embeds, worksheet links) and settings (WhatsApp link, price, emails).

---

## 10. Routes

**Pages:** `/` · `/checkout` · `/payment/success` · `/login` ·
`/magic-link-sent` · `/dashboard` · `/course` · `/course/[moduleId]` ·
`/course/[moduleId]/[lessonId]` · `/module/[moduleId]/feedback` · `/complete` ·
`/admin/login` · `/admin/dashboard`

**API:** `/api/paystack/initialize` · `/api/paystack/verify` ·
`/api/paystack/webhook` · `/api/auth/send-magic-link` ·
`/api/admin/add-student` · `/api/admin/resend-magic-link` ·
`/api/admin/login` · `/api/admin/update-content` · `/api/admin/update-settings` ·
`/api/feedback/send` · `/api/progress/complete-lesson`

---

## 11. Project structure

```
app/                 # routes (pages + API)
components/          # UI primitives, layout, admin panels
  ui/  layout/  admin/
lib/                # supabase clients, paystack, email, auth, course logic
supabase/migrations # schema + RLS + seed
```

---

## 12. Local development notes

- Use Paystack **test** keys and test cards.
- Placeholder Bunny Stream and worksheet URLs render friendly "coming soon"
  states until you add real links from the admin.
- Omit `EMAIL_API_KEY` to log emails to the console instead of sending.
- Paystack webhooks can't reach `localhost` directly — use a tunnel
  (e.g. `ngrok http 3000`) and point the Paystack webhook at the tunnel URL,
  or rely on the `/payment/success` verify step while developing.
```
```
