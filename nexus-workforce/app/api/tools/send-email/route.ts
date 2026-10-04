import {NextRequest,NextResponse} from 'next/server';
import {timingSafeEqual} from 'crypto';
import {supabaseAdmin} from '@/lib/supabase/admin';
type TC={id:string;name?:string;arguments?:unknown;function?:{name?:string;arguments?:unknown}};
type Call={phoneNumberId?:string;assistantId?:string;id?:string};
const same=(a:string,b:string)=>{const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)};
const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const one=(s:string)=>s.replace(/\s+/g,' ').trim();
async function companyFor(call:Call):Promise<string|null>{
  if(call.phoneNumberId){
    const {data}=await supabaseAdmin.from('squads').select('company_id').eq('vapi_phone_number_id',call.phoneNumberId).maybeSingle();
    if(data)return data.company_id;
  }
  if(call.assistantId){
    const {data:a}=await supabaseAdmin.from('agents').select('squad_id').eq('vapi_assistant_id',call.assistantId).limit(1).maybeSingle();
    if(a){const {data:s}=await supabaseAdmin.from('squads').select('company_id').eq('id',a.squad_id).maybeSingle();if(s)return s.company_id}
  }
  return null;
}
async function run(tc:TC,companyId:string|null,callId:string|null):Promise<string>{
  const name=tc.function?.name??tc.name;
  if(name!=='send_email')return'Unknown tool.';
  let args=tc.function?.arguments??tc.arguments??{};
  if(typeof args==='string'){try{args=JSON.parse(args)}catch{return'The email details were not readable.'}}
  const {to,subject,body}=args as {to?:string;subject?:string;body?:string};
  if(!to||!EMAIL.test(to.trim()))return'That email address does not look valid. Please confirm it with the caller.';
  if(!subject||!body)return'An email needs a subject and a message.';
  if(!companyId)return'I could not find the business account for this call.';
  const to2=to.trim(),sub=subject.slice(0,200),text=body.slice(0,5000);
  if(callId){
    const {count}=await supabaseAdmin.from('email_log').select('id',{count:'exact',head:true}).eq('call_id',callId).eq('status','sent');
    if((count??0)>=3)return'The limit of 3 emails for this call has been reached.';
  }
  const since=new Date(Date.now()-3600_000).toISOString();
  const {count:hour}=await supabaseAdmin.from('email_log').select('id',{count:'exact',head:true}).eq('company_id',companyId).eq('status','sent').gte('created_at',since);
  if((hour??0)>=20)return'The hourly email limit has been reached. Please try again later.';
  const log=(status:string,error?:string)=>supabaseAdmin.from('email_log').insert({company_id:companyId,call_id:callId,to_email:to2,subject:sub,body:text,status,error:error??null});
  if(!process.env.RESEND_API_KEY){await log('failed','RESEND_API_KEY not set');return'Email is not set up yet.'}
  try{
    const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({from:process.env.EMAIL_FROM??'Nexus <onboarding@resend.dev>',to:[to2],subject:sub,text,...(process.env.EMAIL_REPLY_TO?{reply_to:process.env.EMAIL_REPLY_TO}:{})})});
    if(!r.ok){const j=await r.json().catch(()=>({}));const msg=one(String((j as {message?:string}).message??r.status));await log('failed',msg);return`The email could not be sent: ${msg}`}
    await log('sent');return`Email sent to ${to2}.`;
  }catch(e){const msg=e instanceof Error?e.message:String(e);await log('failed',msg);return'The email could not be sent right now.'}
}
export async function POST(req:NextRequest){
  const secret=process.env.VAPI_WEBHOOK_SECRET??'';
  const given=req.headers.get('x-vapi-secret')??new URL(req.url).searchParams.get('secret')??'';
  if(!secret||!same(given,secret))return NextResponse.json({error:'unauthorized'},{status:401});
  try{
    const {message:m}=await req.json();
    const list:TC[]=m?.toolCallList??[];
    const call:Call=m?.call??{};
    const companyId=await companyFor(call);
    const results:{toolCallId:string;result:string}[]=[];
    for(const tc of list)results.push({toolCallId:tc.id,result:one(await run(tc,companyId,call.id??null))});
    return NextResponse.json({results});
  }catch{return NextResponse.json({error:'bad_request'},{status:400})}
}
