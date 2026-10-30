import {NextRequest,NextResponse} from 'next/server';
import {timingSafeEqual} from 'crypto';
import {supabaseAdmin} from '@/lib/supabase/admin';
import {runConnection} from '@/lib/connections';
type TC={id:string;name?:string;arguments?:unknown;function?:{name?:string;arguments?:unknown}};
type Call={phoneNumberId?:string;assistantId?:string};
const same=(a:string,b:string)=>{const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)};
const one=(s:string)=>s.replace(/\s+/g,' ').trim();
async function companyFor(call:Call):Promise<string|null>{
  if(call.phoneNumberId){const {data}=await supabaseAdmin.from('squads').select('company_id').eq('vapi_phone_number_id',call.phoneNumberId).maybeSingle();if(data)return data.company_id}
  if(call.assistantId){
    const {data:a}=await supabaseAdmin.from('agents').select('squad_id').eq('vapi_assistant_id',call.assistantId).limit(1).maybeSingle();
    if(a){const {data:s}=await supabaseAdmin.from('squads').select('company_id').eq('id',a.squad_id).maybeSingle();if(s)return s.company_id}
  }
  return null;
}
async function run(tc:TC,companyId:string|null):Promise<string>{
  if((tc.function?.name??tc.name)!=='use_connected_app')return'Unknown tool.';
  if(!companyId)return'I could not find the business account for this call.';
  let args=tc.function?.arguments??tc.arguments??{};
  if(typeof args==='string'){try{args=JSON.parse(args)}catch{return'The request was not readable.'}}
  const {app,input}=args as {app?:string;input?:string};
  const {data:all}=await supabaseAdmin.from('connections').select('id,name,description,url,method,headers,body_template,response_path').eq('company_id',companyId);
  const list=all??[];
  if(!list.length)return'No apps are connected yet.';
  const c=list.find(x=>x.name===String(app??'').trim().toLowerCase());
  if(!c)return`I could not find that app. Available apps: ${list.map(x=>x.name+(x.description?` (${x.description})`:'')).join(', ')}.`;
  const since=new Date(Date.now()-3600_000).toISOString();
  const {count}=await supabaseAdmin.from('connections').select('id',{count:'exact',head:true}).eq('company_id',companyId).gte('last_at',since);
  if((count??0)>=200)return'The hourly limit for connected apps has been reached.';
  const r=await runConnection(c,String(input??'').slice(0,4000));
  return r.text;
}
export async function POST(req:NextRequest){
  const secret=process.env.VAPI_WEBHOOK_SECRET??'';
  const given=req.headers.get('x-vapi-secret')??new URL(req.url).searchParams.get('secret')??'';
  if(!secret||!same(given,secret))return NextResponse.json({error:'unauthorized'},{status:401});
  try{
    const {message:m}=await req.json();
    const list:TC[]=m?.toolCallList??[];
    const companyId=await companyFor(m?.call??{});
    const results:{toolCallId:string;result:string}[]=[];
    for(const tc of list)results.push({toolCallId:tc.id,result:one(await run(tc,companyId))});
    return NextResponse.json({results});
  }catch{return NextResponse.json({error:'bad_request'},{status:400})}
}
