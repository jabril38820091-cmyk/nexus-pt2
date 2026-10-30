# Nexus Workforce: project notes

Everything needed to rebuild, run and set up this project, so no one has to start over.

## Where the real copies live
1. **GitHub** (`nexus-pt2`, folder `nexus-workforce`): the source of truth. To get a copy: open the repo, click Code, then Download ZIP.
2. **Vercel**: the live site, built from GitHub.
3. **Supabase**: the database. It is separate from the code, so redeploying never touches customer data.
4. **Backups from the assistant**: `nexus-complete.zip` and dated `nexus-backup-*.zip` files in your downloads.

## To rebuild locally
`npm install`, then `npm run build`. Needs Node 18 or newer.

## Database (Supabase SQL Editor)
Run `supabase/migrations/0001_init.sql` once, then `supabase/migrations/all_updates_safe.sql`. The second file is safe to run again.

## Vercel environment variables
| Name | Type | Used for |
| --- | --- | --- |
| NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY | Config | Browser access to the database |
| SUPABASE_SERVICE_ROLE_KEY | Secret | Server-only database access |
| VAPI_API_KEY | Secret | Voice agents, chat, tasks |
| VAPI_WEBHOOK_SECRET | Secret | Proves Vapi calls are real |
| NEXT_PUBLIC_VAPI_PUBLIC_KEY | Config | Voice calls in the browser |
| TEMPLATE_SQUAD_ID | Config | The squad copied for each new customer |
| ADMIN_EMAILS | Secret | Who sees the Admin page |
| APP_ENCRYPTION_KEY | Secret | Encrypts saved Twilio passwords. Never change it once used. |
| STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET | Secret | Payments |
| STRIPE_PRICE_RECEPTIONIST, _STARTER, _GROWTH, _FULL | Config | The four plans |
| NEXT_PUBLIC_APP_URL | Config | The site address, no trailing slash |
| RESEND_API_KEY, EMAIL_FROM | Secret, Config | Agent and notification emails |
| NEXT_PUBLIC_LEGAL_NAME, _CONTACT_EMAIL, _LEGAL_ADDRESS, _GOVERNING_LAW | Config | Terms and Privacy pages |
| GOOGLE_SERVICE_ACCOUNT_JSON | Secret | Calendar booking |

Rule: a name starting with NEXT_PUBLIC_ must be type Config. Anything private must not start with it. Variables only apply after a redeploy.

## Vapi setup
- Server URL: `https://YOUR-SITE/api/webhooks/vapi`, header `x-vapi-secret`.
- Server messages on: status-update, assistant.started, transcript, end-of-call-report.
- Function tools (Server URL ends with `?secret=YOUR_WEBHOOK_SECRET`):
  - `send_email` to `/api/tools/send-email`
  - `send_text` to `/api/tools/send-sms`
  - `check_availability` and `book_appointment` to `/api/tools/calendar`
  - `use_connected_app` to `/api/tools/connected-app`

## Stripe setup
Webhook address `/api/webhooks/stripe`, snapshot payloads. Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed.

## Known gaps
- Call minutes are listed on plans but not measured.
- Changing plans locks or unlocks agents in the app but does not add or remove the real Vapi agents.
- Custom-connection keys are stored without extra encryption (Twilio tokens are encrypted).
- Phone numbers from Vapi's API are web (SIP) addresses; real numbers must be attached in Vapi.

## Tests
`tests/booking.test.js` checks time zones, open slots, Google sign-in and every booking path. Run it with Node from the project folder.
