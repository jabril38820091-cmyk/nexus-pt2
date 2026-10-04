import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {supabaseAdmin} from '@/lib/supabase/admin';
import {getStripe,priceFor,appUrl} from '@/lib/stripe/server';
export async function POST(req:NextRequest){
  try{
    const sb=createClient();const {data:{user}}=await sb.auth.getUser();
    if(!user)return NextResponse.json({error:'unauthorized'},{status:401});
    const {plan}=await req.json();
    const price=priceFor(plan);
    if(!price)return NextResponse.json({error:'plan_not_configured',detail:'Missing Stripe price ID for this plan.'},{status:400});
    const {data:company}=await sb.from('companies').select('id,name,stripe_customer_id').limit(1).maybeSingle();
    if(!company)return NextResponse.json({error:'company_not_found',detail:'Finish onboarding first.'},{status:404});
    const stripe=getStripe();
    let customer=company.stripe_customer_id as string|null;
    if(!customer){
      const c=await stripe.customers.create({email:user.email,name:company.name,metadata:{company_id:company.id}});
      customer=c.id;
      await supabaseAdmin.from('companies').update({stripe_customer_id:customer}).eq('id',company.id);
    }
    const meta={company_id:company.id,plan:String(plan)};
    const session=await stripe.checkout.sessions.create({mode:'subscription',customer,line_items:[{price,quantity:1}],
      success_url:`${appUrl()}/billing?status=success`,cancel_url:`${appUrl()}/billing?status=cancelled`,metadata:meta,subscription_data:{metadata:meta}});
    return NextResponse.json({url:session.url});
  }catch(e){return NextResponse.json({error:'checkout_failed',detail:e instanceof Error?e.message:String(e)},{status:500})}
}
