# Nexus Workforce
SaaS where businesses deploy 20 AI voice agents in 6 departments. Hero screen: live visual office (/office).
Stack: Next.js 14 App Router, TypeScript strict, Tailwind, Framer Motion, Supabase (auth, RLS, Realtime), Vapi, Stripe, Zustand.
## Rules
- Service-role key and VAPI_API_KEY are server-only. Never call Vapi from the browser.
- Verify Stripe webhook signature on the raw body before parsing; dedupe via stripe_events.
- Only the Stripe webhook grants access, never success_url.
- Every desk has data-agent-id (handoff layer reads it). New agents go in lib/agents/roster.ts.
- Industry scripts and defaults live in lib/industries.ts.
- No `any` unless unavoidable. Run `npm run typecheck` after each phase.
## Build order
1 schema -> 2 auth/middleware -> 3 roster -> 4 office -> 5 realtime -> 6 vapi provision -> 7 wizard -> 8 stripe -> 9 demo
