import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {fireEvent} from '@/lib/events';
import {sendSms} from '@/lib/sms';
import {callerFromNotes} from '@/lib/phone';
export async function POST(req:NextRequest){
  const sb=createClient();const {data:{user}}=await sb.auth.getUser();
  if(!user)return NextResponse.json({error:'unauthorized'},{status:401});
  const {id,action}=await req.json();
  if(action!=='approve'&&action!=='approve_text'&&action!=='dismiss')return NextResponse.json({error:'bad_action'},{status:400});
  let note='';
  if(action==='approve_text'){
    const {data:d}=await sb.from('tasks').select('company_id,result,instructions').eq('id',id).eq('status','needs_review').maybeSingle();
    if(!d)return NextResponse.json({error:'not_found'},{status:404});
    const to=callerFromNotes(d.instructions);
    if(!to)return NextResponse.json({error:'no_number',detail:'This draft has no phone number to text.'},{status:400});
    const r=await sendSms(d.company_id,to,d.result??'');
    if(!r.ok)return NextResponse.json({error:'text_failed',detail:r.message},{status:502});
    note=r.message;
  }
  const {data:t}=await sb.from('tasks').update({status:action==='dismiss'?'dismissed':'approved',updated_at:new Date().toISOString()}).eq('id',id).eq('status','needs_review').select('*').maybeSingle();
  if(!t)return NextResponse.json({error:'not_found'},{status:404});
  if(action!=='dismiss')await fireEvent(t.company_id,'followup.approved',{task:{id:t.id,title:t.title,message:t.result}});
  return NextResponse.json({ok:true,note});
}
