import 'server-only';
import Stripe from 'stripe';
import type {PlanKey} from '@/lib/plans';
export const getStripe=()=>new Stripe(process.env.STRIPE_SECRET_KEY as string);
export const priceFor=(plan:string):string|undefined=>({
  starter:process.env.STRIPE_PRICE_STARTER,growth:process.env.STRIPE_PRICE_GROWTH,full:process.env.STRIPE_PRICE_FULL} as Record<PlanKey,string|undefined>)[plan as PlanKey];
export const appUrl=()=>(process.env.NEXT_PUBLIC_APP_URL??'').replace(/\/$/,'');
export function mapStatus(s:string):'active'|'past_due'|'canceled'|'inactive'{
  if(s==='active'||s==='trialing')return'active';
  if(s==='past_due'||s==='unpaid')return'past_due';
  if(s==='canceled'||s==='incomplete_expired')return'canceled';
  return'inactive';
}
