import 'server-only';
import {supabaseAdmin} from '@/lib/supabase/admin';
import {decrypt} from '@/lib/crypto';
import {E164,normalizePhone} from '@/lib/phone';
const SID=/^AC[a-fA-F0-9]{32}$/;
export const isSid=(s:string)=>SID.test(s);
export type SmsResult={ok:boolean;message:string};
/** Sends one text through the business's own Twilio account, with safety limits. Never throws. */
export async function sendSms(companyId:string,toRaw:string,body:string,callId?:string|null):Promise<SmsResult>{
  try{
    const to=normalizePhone(toRaw);
    if(!to)return{ok:false,message:'That phone number does not look valid. Please confirm it with the caller.'};
    const text0=String(body??'').replace(/\s+/g,' ').trim().slice(0,300);
    if(!text0)return{ok:false,message:'A text needs a message.'};
    const {data:cfg}=await supabaseAdmin.from('sms_settings').select('account_sid,auth_token_enc,from_number,enabled').eq('company_id',companyId).maybeSingle();
    if(!cfg||cfg.enabled===false)return{ok:false,message:'Texting is not set up for this business yet.'};
    if(!E164.test(cfg.from_number))return{ok:false,message:'The business texting number is not valid.'};
    const log=(status:string,error?:string)=>supabaseAdmin.from('sms_log').insert({company_id:companyId,call_id:callId??null,to_number:to,body:text0,status,error:error??null});
    // limits: 3 per call, 3 per person per day, 30 per hour per business
    if(callId){const {count}=await supabaseAdmin.from('sms_log').select('id',{count:'exact',head:true}).eq('call_id',callId).eq('status','sent');if((count??0)>=3)return{ok:false,message:'The limit of 3 texts for this call has been reached.'}}
    const day=new Date(Date.now()-86400_000).toISOString(),hour=new Date(Date.now()-3600_000).toISOString();
    const {count:perPerson}=await supabaseAdmin.from('sms_log').select('id',{count:'exact',head:true}).eq('company_id',companyId).eq('to_number',to).eq('status','sent').gte('created_at',day);
    if((perPerson??0)>=3)return{ok:false,message:'This number has already received 3 texts today.'};
    const {count:perHour}=await supabaseAdmin.from('sms_log').select('id',{count:'exact',head:true}).eq('company_id',companyId).eq('status','sent').gte('created_at',hour);
    if((perHour??0)>=30)return{ok:false,message:'The hourly text limit has been reached. Please try again later.'};
    const {data:co}=await supabaseAdmin.from('companies').select('name').eq('id',companyId).maybeSingle();
    const text=`${String(co?.name??'').slice(0,40)}: ${text0}\nReply STOP to opt out.`;
    const token=decrypt(cfg.auth_token_enc);
    const r=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${cfg.account_sid}/Messages.json`,{method:'POST',signal:AbortSignal.timeout(15000),
      headers:{Authorization:'Basic '+Buffer.from(`${cfg.account_sid}:${token}`).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({To:to,From:cfg.from_number,Body:text}).toString()});
    const j=await r.json().catch(()=>({}));
    if(!r.ok){const m=String((j as {message?:string}).message??r.status).slice(0,200);await log('failed',m);return{ok:false,message:`The text could not be sent: ${m}`}}
    await log('sent');return{ok:true,message:`Text sent to ${to}.`};
  }catch(e){return{ok:false,message:e instanceof Error?e.message:'The text could not be sent.'}}
}
