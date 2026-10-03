import {NextResponse} from 'next/server';
// Deploy flow (implement in order):
// 1 auth user  2 insert company  3 compile squad from ROSTER + industry prompts
// 4 POST https://api.vapi.ai/assistant per agent  5 build handoff tools with real assistant ids
// 6 POST /squad  7 POST /phone-number  8 insert squad+agents  9 create Stripe Checkout  10 return {checkoutUrl}
export async function POST(){return NextResponse.json({error:'not_implemented'},{status:501})}
