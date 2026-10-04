import {NextRequest,NextResponse} from 'next/server';
import type Stripe from 'stripe';
import {supabaseAdmin} from '@/lib/supabase/admin';
import {getStripe,mapStatus} from '@/lib/stripe/server';
export async function POST(req:NextRequest){
  const raw=await req.text();const sig=req.headers.get('stripe-signature');
  let ev:Stripe.Event;
  try{ev=getStripe().webhooks.constructEvent(raw,sig as string,process.env.STRIPE_WEBHOOK_SECRET as string)}
  catch{return NextResponse.json({error:'bad_signature'},{status:400})}
  const {error:dup}=await supabaseAdmin.from('stripe_events').insert({event_id:ev.id,event_type:ev.type});
  if(dup)return NextResponse.json({ok:true,duplicate:true});
  try{
    if(ev.type==='checkout.session.completed'){
      const s=ev.data.object as Stripe.Checkout.Session;const id=s.metadata?.company_id;
      if(id&&s.mode==='subscription'){
        await supabaseAdmin.from('companies').update({stripe_customer_id:s.customer as string,stripe_subscription_id:s.subscription as string,plan:s.metadata?.plan??'starter',subscription_status:'active'}).eq('id',id);
        await supabaseAdmin.from('squads').update({status:'active'}).eq('company_id',id);
      }
    }
    if(ev.type==='customer.subscription.updated'||ev.type==='customer.subscription.deleted'){
      const sub=ev.data.object as Stripe.Subscription;const id=sub.metadata?.company_id;
      const status=ev.type==='customer.subscription.deleted'?'canceled':mapStatus(sub.status);
      const patch={subscription_status:status,current_period_end:new Date(sub.current_period_end*1000).toISOString()};
      const q=supabaseAdmin.from('companies').update(patch);
      const {data:rows}=await (id?q.eq('id',id):q.eq('stripe_subscription_id',sub.id)).select('id');
      for(const r of rows??[])await supabaseAdmin.from('squads').update({status:status==='active'?'active':'paused'}).eq('company_id',r.id);
    }
    if(ev.type==='invoice.payment_failed'){
      const inv=ev.data.object as Stripe.Invoice;
      if(inv.customer)await supabaseAdmin.from('companies').update({subscription_status:'past_due'}).eq('stripe_customer_id',inv.customer as string);
    }
    return NextResponse.json({ok:true});
  }catch{
    await supabaseAdmin.from('stripe_events').delete().eq('event_id',ev.id);
    return NextResponse.json({error:'handler_failed'},{status:500});
  }
}
