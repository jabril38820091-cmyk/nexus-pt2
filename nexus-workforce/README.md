# Nexus Workforce scaffold (existing Vapi squad)
1. `npm install`, copy `.env.example` to `.env.local` (set VAPI_API_KEY, VAPI_WEBHOOK_SECRET, Supabase, Stripe).
2. Run `supabase/migrations/0001_init.sql` in the Supabase SQL editor.
3. `npm run dev`, open `/office`: demo scenarios animate with no backend.

## Connect your existing Vapi squad
1. Name each Vapi assistant after its roster agent (e.g. "Lead Qualifier") or pass overrides.
2. Use the /onboarding page (it calls POST /api/vapi/connect for you).
   Unmatched assistants return 422 with validSlugs; resend with overrides {assistantId: slug}.
3. In Vapi, set the Server URL to https://YOUR_DOMAIN/api/webhooks/vapi with header x-vapi-secret = VAPI_WEBHOOK_SECRET,
   and enable serverMessages: status-update, assistant.started, transcript, end-of-call-report.
4. Call the number. Check Vapi's log for the assistant.started payload and adjust field names in the webhook if needed.
5. /office already loads your company and subscribes to live calls.

Flow: /signup -> email confirm -> /onboarding (create company, then connect squad) -> /office.
Supabase: Authentication > URL Configuration: add http://localhost:3000/auth/callback and your production URL/auth/callback to Redirect URLs.
Still to build: Stripe checkout.
