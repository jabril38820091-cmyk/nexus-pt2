import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {supabaseAdmin} from '@/lib/supabase/admin';
import {profileBlock} from '@/lib/vapi/profile';
import {syncProfile} from '@/lib/vapi/sync';
export const maxDuration=60;
export async function POST(){
  try{
    const sb=createClient();const {data:{user}}=await sb.auth.getUser();
    if(!user)return NextResponse.json({error:'unauthorized'},{status:401});
    const {data:co}=await sb.from('companies').select('id,name,industry,website,timezone,business_hours,goals,agent_instructions').limit(1).maybeSingle();
    if(!co)return NextResponse.json({error:'company_not_found'},{status:404});
    const block=profileBlock({name:co.name,industry:co.industry,website:co.website,timezone:co.timezone,hours:co.business_hours,goals:co.goals,instructions:co.agent_instructions});
    const tpl=process.env.TEMPLATE_SQUAD_ID;
    const {data:squads}=await supabaseAdmin.from('squads').select('id,vapi_squad_id,compiled_json').eq('company_id',co.id);
    // Only assistants we created for this customer are edited. Never the template, never a squad they connected themselves.
    const ours=(squads??[]).filter(s=>s.compiled_json?.provisioned===true&&!(tpl&&s.vapi_squad_id===tpl));
    if(!ours.length)return NextResponse.json({error:'not_managed',detail:'Your agents were connected from your own Vapi account, so we do not edit their instructions. Copy the text below into your assistants instead.',block},{status:409});
    const {data:agents}=await supabaseAdmin.from('agents').select('vapi_assistant_id').in('squad_id',ours.map(s=>s.id));
    const ids=(agents??[]).map(a=>a.vapi_assistant_id).filter(Boolean) as string[];
    const r=await syncProfile(ids,block);
    return NextResponse.json({ok:true,updated:r.updated,failed:r.errors.length,errors:r.errors.slice(0,3)});
  }catch(e){return NextResponse.json({error:'sync_failed',detail:e instanceof Error?e.message:String(e)},{status:500})}
}
