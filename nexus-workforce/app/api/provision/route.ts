import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {supabaseAdmin} from '@/lib/supabase/admin';
import {requireAdmin} from '@/lib/admin';
import {vapi} from '@/lib/vapi/api';
import {buildPlan,execute,type Template} from '@/lib/vapi/provision';
import {ROSTER} from '@/lib/agents/roster';
export const maxDuration=60;
export async function POST(req:NextRequest){
  try{
    const sb=createClient();const {data:{user}}=await sb.auth.getUser();
    if(!user)return NextResponse.json({error:'unauthorized'},{status:401});
    const {dryRun}=await req.json().catch(()=>({}));
    const admin=!!(await requireAdmin());
    if(dryRun&&!admin)return NextResponse.json({error:'forbidden'},{status:403});
    const {data:co}=await sb.from('companies').select('id,name,industry,website,timezone,business_hours,goals,agent_instructions,agent_mode,chosen_agent,subscription_status').limit(1).maybeSingle();
    if(!co)return NextResponse.json({error:'company_not_found'},{status:404});
    if(!admin&&co.subscription_status!=='active')return NextResponse.json({error:'plan_required',detail:'Choose a plan on the Billing page to activate your agents.'},{status:402});
    const {data:existing}=await supabaseAdmin.from('squads').select('id').eq('company_id',co.id).limit(1).maybeSingle();
    if(existing)return NextResponse.json({error:'already_provisioned',detail:'Your agents are already set up.'},{status:409});
    const tplId=process.env.TEMPLATE_SQUAD_ID;
    if(!tplId)return NextResponse.json({error:'not_configured',detail:'TEMPLATE_SQUAD_ID is not set on the server.'},{status:500});
    const {data:tplRow}=await supabaseAdmin.from('squads').select('id').eq('vapi_squad_id',tplId).limit(1).maybeSingle();
    if(!tplRow)return NextResponse.json({error:'template_missing',detail:'The template squad is not connected in the database yet.'},{status:500});
    const {data:agents}=await supabaseAdmin.from('agents').select('slug,vapi_assistant_id').eq('squad_id',tplRow.id);
    const tAgents=(agents??[]).filter(a=>a.vapi_assistant_id);
    const mode=co.agent_mode??'full';
    const selected=mode==='receptionist'?['router']:mode==='single'&&co.chosen_agent?[co.chosen_agent]:tAgents.map(a=>a.slug);
    if(!tAgents.some(a=>selected.includes(a.slug)))return NextResponse.json({error:'no_template_agent',detail:'The template squad has no agent for your choice.'},{status:500});
    const squad=await vapi('GET',`/squad/${tplId}`);
    const assistants:Record<string,Record<string,unknown>>={};
    await Promise.all(tAgents.map(async a=>{assistants[a.vapi_assistant_id]=await vapi('GET',`/assistant/${a.vapi_assistant_id}`)}));
    const template:Template={squad,assistants,agents:tAgents};
    const plan=buildPlan(template,selected,{name:co.name,industry:co.industry,website:co.website,timezone:co.timezone,hours:co.business_hours,goals:co.goals,instructions:co.agent_instructions});
    if(dryRun)return NextResponse.json({plan:{agents:plan.items.map(i=>i.slug),toolsDropped:plan.toolsDropped,destinationsKept:plan.destinationsKept,squadWillBeCreated:plan.items.length>1}});
    const {created,squadId}=await execute(plan,`${co.name} squad`.slice(0,80));
    const {data:row,error}=await supabaseAdmin.from('squads').insert({company_id:co.id,vapi_squad_id:squadId,status:'active',compiled_json:{provisioned:true,agents:created.map(c=>c.slug)}}).select('id').single();
    if(error||!row){await Promise.all([...created.map(c=>vapi('DELETE',`/assistant/${c.newId}`).catch(()=>{})),squadId?vapi('DELETE',`/squad/${squadId}`).catch(()=>{}):Promise.resolve()]);return NextResponse.json({error:'save_failed',detail:error?.message??'Could not save.'},{status:500});}
    await supabaseAdmin.from('agents').insert(created.map(c=>{const r=ROSTER.find(x=>x.id===c.slug)!;return{squad_id:row.id,vapi_assistant_id:c.newId,slug:r.id,name:r.name,department:r.department,role:r.role,system_prompt:'(managed in Vapi)',voice_id:r.voiceId,desk_index:r.deskIndex,avatar_color:r.avatarColor}}));
    return NextResponse.json({ok:true,agents:created.length});
  }catch(e){return NextResponse.json({error:'provision_failed',detail:e instanceof Error?e.message:String(e)},{status:500})}
}
