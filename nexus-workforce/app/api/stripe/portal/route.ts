import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {getStripe,appUrl} from '@/lib/stripe/server';
export async function POST(){
  try{
    const sb=createClient();const {data:{user}}=await sb.auth.getUser();
    if(!user)return NextResponse.json({error:'unauthorized'},{status:401});
    const {data:company}=await sb.from('companies').select('stripe_customer_id').limit(1).maybeSingle();
    if(!company?.stripe_customer_id)return NextResponse.json({error:'no_customer',detail:'No subscription yet.'},{status:404});
    const s=await getStripe().billingPortal.sessions.create({customer:company.stripe_customer_id,return_url:`${appUrl()}/billing`});
    return NextResponse.json({url:s.url});
  }catch(e){return NextResponse.json({error:'portal_failed',detail:e instanceof Error?e.message:String(e)},{status:500})}
}
