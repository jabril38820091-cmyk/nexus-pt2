import {NextRequest,NextResponse} from 'next/server';import Stripe from 'stripe';import {supabaseAdmin} from '@/lib/supabase/admin';
const stripe=new Stripe(process.env.STRIPE_SECRET_KEY!);
export async function POST(req:NextRequest){
 const raw=await req.text();const sig=req.headers.get('stripe-signature');
 let ev:Stripe.Event;
 try{ev=stripe.webhooks.constructEvent(raw,sig!,process.env.STRIPE_WEBHOOK_SECRET!)}catch{return NextResponse.json({error:'bad_signature'},{status:400})}
 try{
  const {error}=await supabaseAdmin.from('stripe_events').insert({event_id:ev.id,event_type:ev.type});
  if(error)return NextResponse.json({ok:true,duplicate:true});
  if(ev.type==='checkout.session.completed'){const s=ev.data.object as Stripe.Checkout.Session;
   await supabaseAdmin.from('companies').update({stripe_subscription_id:s.subscription as string,subscription_status:'active'}).eq('stripe_customer_id',s.customer as string);
   await supabaseAdmin.from('squads').update({status:'active'}).in('company_id',(await supabaseAdmin.from('companies').select('id').eq('stripe_customer_id',s.customer as string)).data?.map(c=>c.id)??[]);}
  if(ev.type==='customer.subscription.deleted'){const s=ev.data.object as Stripe.Subscription;
   await supabaseAdmin.from('companies').update({subscription_status:'canceled'}).eq('stripe_customer_id',s.customer as string);}
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:'handler_failed'},{status:500})}}
