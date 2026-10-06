import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {fireEvent} from '@/lib/events';
export async function POST(req:NextRequest){
  const sb=createClient();const {data:{user}}=await sb.auth.getUser();
  if(!user)return NextResponse.json({error:'unauthorized'},{status:401});
  const {id,action}=await req.json();
  if(action!=='approve'&&action!=='dismiss')return NextResponse.json({error:'bad_action'},{status:400});
  const {data:t}=await sb.from('tasks').update({status:action==='approve'?'approved':'dismissed',updated_at:new Date().toISOString()}).eq('id',id).eq('status','needs_review').select('*').maybeSingle();
  if(!t)return NextResponse.json({error:'not_found'},{status:404});
  if(action==='approve')await fireEvent(t.company_id,'followup.approved',{task:{id:t.id,title:t.title,message:t.result}});
  return NextResponse.json({ok:true});
}
