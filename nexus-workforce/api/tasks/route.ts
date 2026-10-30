import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {vapiChat} from '@/lib/vapi/chat';
import {fireEvent} from '@/lib/events';
export const maxDuration=60;
export async function POST(req:NextRequest){
  try{
    const sb=createClient();const {data:{user}}=await sb.auth.getUser();
    if(!user)return NextResponse.json({error:'unauthorized'},{status:401});
    const {agentSlug,title,instructions}=await req.json();
    if(!agentSlug||!title)return NextResponse.json({error:'missing_fields'},{status:400});
    const {data:company}=await sb.from('companies').select('id').limit(1).maybeSingle();
    if(!company)return NextResponse.json({error:'company_not_found'},{status:404});
    const {data:agent}=await sb.from('agents').select('vapi_assistant_id').eq('slug',agentSlug).limit(1).maybeSingle();
    if(!agent?.vapi_assistant_id)return NextResponse.json({error:'agent_not_connected'},{status:404});
    const {data:task,error}=await sb.from('tasks').insert({company_id:company.id,agent_slug:agentSlug,title,instructions,status:'running'}).select('*').single();
    if(error)return NextResponse.json({error:'save_failed',detail:error.message},{status:500});
    let patch:{status:string;result:string};
    try{
      const {text}=await vapiChat(agent.vapi_assistant_id,`Task: ${title}\n\n${instructions??''}\n\nComplete this task and reply with the result.`);
      patch={status:'done',result:text};
    }catch(e){patch={status:'failed',result:e instanceof Error?e.message:String(e)}}
    const {data:done}=await sb.from('tasks').update({...patch,updated_at:new Date().toISOString()}).eq('id',task.id).select('*').single();
    await fireEvent(company.id,'task.completed',{task:done});
    return NextResponse.json({task:done});
  }catch(e){return NextResponse.json({error:'task_failed',detail:e instanceof Error?e.message:String(e)},{status:500})}
}
