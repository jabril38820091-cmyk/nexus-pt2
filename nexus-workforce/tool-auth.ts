import 'server-only';
import {timingSafeEqual} from 'crypto';
import type {NextRequest} from 'next/server';
import {supabaseAdmin} from '@/lib/supabase/admin';
const same=(a:string,b:string)=>{const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)};
/** True when a Vapi tool call carries our shared secret (header or ?secret=). */
export function toolAuthorized(req:NextRequest):boolean{
  const secret=process.env.VAPI_WEBHOOK_SECRET??'';
  const given=req.headers.get('x-vapi-secret')??new URL(req.url).searchParams.get('secret')??'';
  return !!secret&&same(given,secret);
}
/** Finds which business a call belongs to, from the phone number or the assistant. */
export async function companyForCall(call:{phoneNumberId?:string;assistantId?:string}):Promise<string|null>{
  if(call.phoneNumberId){const {data}=await supabaseAdmin.from('squads').select('company_id').eq('vapi_phone_number_id',call.phoneNumberId).maybeSingle();if(data)return data.company_id}
  if(call.assistantId){
    const {data:a}=await supabaseAdmin.from('agents').select('squad_id').eq('vapi_assistant_id',call.assistantId).limit(1).maybeSingle();
    if(a){const {data:s}=await supabaseAdmin.from('squads').select('company_id').eq('id',a.squad_id).maybeSingle();if(s)return s.company_id}
  }
  return null;
}
