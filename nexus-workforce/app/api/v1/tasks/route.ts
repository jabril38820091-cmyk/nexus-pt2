import {NextRequest,NextResponse} from 'next/server';
import {supabaseAdmin} from '@/lib/supabase/admin';
import {companyFromKey} from '@/lib/api-auth';
import {vapiChat} from '@/lib/vapi/chat';
import {fireEvent} from '@/lib/events';
import {allowedAgents} from '@/lib/agents/access';
export const maxDuration=60;
export async function GET(req:NextRequest){
  const companyId=await companyFromKey(req);
  if(!companyId)return NextResponse.json({error:'unauthorized'},{status:401});
  const {data}=await supabaseAdmin.from('tasks').select('id,agent_slug,title,status,result,created_at').eq('company_id',companyId).order('created_at',{ascending:false}).limit(20);
  return NextResponse.json({tasks:data??[]});
}
export async function POST(req:NextRequest){
  try{
    const companyId=await companyFromKey(req);
    if(!companyId)return NextResponse.json({error:'unauthorized'},{status:401});
    const {agent,title,instructions}=await req.json();
    if(!agent||!title)return NextResponse.json({error:'missing_fields',detail:'Send agent and title.'},{status:400});
    const {data:co}=await supabaseAdmin.from('companies').select('agent_mode,chosen_agent').eq('id',companyId).maybeSingle();
    if(!allowedAgents(co?.agent_mode,co?.chosen_agent).has(agent))return NextResponse.json({error:'agent_not_available'},{status:403});
    const {data:squads}=await supabaseAdmin.from('squads').select('id').eq('company_id',companyId);
    const {data:a}=await supabaseAdmin.from('agents').select('vapi_assistant_id').in('squad_id',(squads??[]).map(s=>s.id)).eq('slug',agent).limit(1).maybeSingle();
    if(!a?.vapi_assistant_id)return NextResponse.json({error:'agent_not_connected'},{status:404});
    const {data:task}=await supabaseAdmin.from('tasks').insert({company_id:companyId,agent_slug:agent,title:String(title).slice(0,200),instructions:instructions?String(instructions).slice(0,5000):null,status:'running'}).select('*').single();
    let patch:{status:string;result:string};
    try{const {text}=await vapiChat(a.vapi_assistant_id,`Task: ${title}\n\n${instructions??''}\n\nComplete this task and reply with the result.`);patch={status:'done',result:text}}
    catch(e){patch={status:'failed',result:e instanceof Error?e.message:String(e)}}
    const {data:done}=await supabaseAdmin.from('tasks').update({...patch,updated_at:new Date().toISOString()}).eq('id',task.id).select('*').single();
    await fireEvent(companyId,'task.completed',{task:done});
    return NextResponse.json({task:done});
  }catch(e){return NextResponse.json({error:'failed',detail:e instanceof Error?e.message:String(e)},{status:500})}
}
