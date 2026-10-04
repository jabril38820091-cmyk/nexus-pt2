import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {supabaseAdmin} from '@/lib/supabase/admin';
import {readExistingSquad} from '@/lib/vapi/connect';
import {ROSTER} from '@/lib/agents/roster';
/** POST {companyId, squadId, phoneNumberId, overrides?} - links an existing Vapi squad to a company. */
eximport {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {supabaseAdmin} from '@/lib/supabase/admin';
import {readExistingSquad} from '@/lib/vapi/connect';
import {ROSTER} from '@/lib/agents/roster';
const msg=(e:unknown)=>{const m=(e as {message?:string})?.message;return m??JSON.stringify(e)};
export async function POST(req:NextRequest){
 try{
  const sb=createClient();const {data:{user}}=await sb.auth.getUser();
  if(!user)return NextResponse.json({error:'unauthorized'},{status:401});
  const {companyId,squadId,phoneNumberId,overrides}=await req.json();
  const {data:company}=await sb.from('companies').select('id').eq('id',companyId).eq('owner_id',user.id).maybeSingle();
  if(!company)return NextResponse.json({error:'company_not_found'},{status:404});
  const {squad,mapped}=await readExistingSquad(squadId,overrides??{});
  const unmatched=mapped.filter(m=>!m.slug);
  if(unmatched.length)return NextResponse.json({error:'unmatched_assistants',unmatched,validSlugs:ROSTER.map(r=>r.id)},{status:422});
  const {data:row,error}=await supabaseAdmin.from('squads').insert({company_id:companyId,vapi_squad_id:squadId,vapi_phone_number_id:phoneNumberId,status:'active',compiled_json:squad}).select('id').single();
  if(error)return NextResponse.json({error:'save_squad_failed',detail:msg(error)},{status:500});
  const agents=mapped.map(m=>{const r=ROSTER.find(x=>x.id===m.slug)!;
   return{squad_id:row.id,vapi_assistant_id:m.assistantId,slug:r.id,name:r.name,department:r.department,role:r.role,system_prompt:'(managed in Vapi)',voice_id:r.voiceId,desk_index:r.deskIndex,avatar_color:r.avatarColor}});
  const {error:e2}=await supabaseAdmin.from('agents').insert(agents);
  if(e2)return NextResponse.json({error:'save_agents_failed',detail:msg(e2)},{status:500});
  return NextResponse.json({ok:true,squadRowId:row.id,agents:agents.length});
 }catch(e){return NextResponse.json({error:'connect_failed',detail:msg(e)},{status:500})}}port async function POST(req:NextRequest){
 try{
  const sb=createClient();const {data:{user}}=await sb.auth.getUser();
  if(!user)return NextResponse.json({error:'unauthorized'},{status:401});
  const {companyId,squadId,phoneNumberId,overrides}=await req.json();
  const {data:company}=await sb.from('companies').select('id').eq('id',companyId).eq('owner_id',user.id).maybeSingle();
  if(!company)return NextResponse.json({error:'company_not_found'},{status:404});
  const {squad,mapped}=await readExistingSquad(squadId,overrides??{});
  const unmatched=mapped.filter(m=>!m.slug);
  if(unmatched.length)return NextResponse.json({error:'unmatched_assistants',unmatched,validSlugs:ROSTER.map(r=>r.id)},{status:422});
  const {data:row,error}=await supabaseAdmin.from('squads').insert({company_id:companyId,vapi_squad_id:squadId,vapi_phone_number_id:phoneNumberId,status:'active',compiled_json:squad}).select('id').single();
  if(error)throw error;
  const agents=mapped.map(m=>{const r=ROSTER.find(x=>x.id===m.slug)!;
   return{squad_id:row.id,vapi_assistant_id:m.assistantId,slug:r.id,name:r.name,department:r.department,role:r.role,system_prompt:'(managed in Vapi)',voice_id:r.voiceId,desk_index:r.deskIndex,avatar_color:r.avatarColor}});
  const {error:e2}=await supabaseAdmin.from('agents').insert(agents);
  if(e2)throw e2;
  return NextResponse.json({ok:true,squadRowId:row.id,agents:agents.length});
 }catch(e){return NextResponse.json({error:'connect_failed',detail:e instanceof Error?e.message:String(e)},{status:500})}}
