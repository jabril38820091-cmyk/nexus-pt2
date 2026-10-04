import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {vapiChat} from '@/lib/vapi/chat';
export async function POST(req:NextRequest){
  try{
    const sb=createClient();const {data:{user}}=await sb.auth.getUser();
    if(!user)return NextResponse.json({error:'unauthorized'},{status:401});
    const {slug,input,previousChatId}=await req.json();
    if(!slug||!input)return NextResponse.json({error:'missing_fields'},{status:400});
    const {data:agent}=await sb.from('agents').select('vapi_assistant_id').eq('slug',slug).limit(1).maybeSingle();
    if(!agent?.vapi_assistant_id)return NextResponse.json({error:'agent_not_connected'},{status:404});
    const {text,chatId}=await vapiChat(agent.vapi_assistant_id,String(input),previousChatId);
    return NextResponse.json({reply:text,chatId});
  }catch(e){return NextResponse.json({error:'chat_failed',detail:e instanceof Error?e.message:String(e)},{status:500})}
}
