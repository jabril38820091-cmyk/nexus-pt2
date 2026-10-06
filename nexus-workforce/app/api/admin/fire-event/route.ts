import {NextRequest,NextResponse} from 'next/server';
import {requireAdmin} from '@/lib/admin';
import {supabaseAdmin} from '@/lib/supabase/admin';
import {EVENTS,fireEvent} from '@/lib/events';
export async function POST(req:NextRequest){
  const user=await requireAdmin();
  if(!user)return NextResponse.json({error:'forbidden'},{status:403});
  const {event}=await req.json();
  if(!(EVENTS as readonly string[]).includes(event))return NextResponse.json({error:'bad_event'},{status:400});
  const {data:co}=await supabaseAdmin.from('companies').select('id').eq('owner_id',user.id).limit(1).maybeSingle();
  if(!co)return NextResponse.json({error:'no_company'},{status:404});
  const sample:Record<string,unknown>={'task.completed':{task:{id:'sample',title:'Sample task',status:'done',result:'Sample result'}},'email.sent':{to:'test@example.com',subject:'Sample email'},'call.ended':{call_id:'sample',duration_seconds:42,summary:'Sample call'}};
  await fireEvent(co.id,event,{sample:true,...(sample[event] as object)});
  return NextResponse.json({ok:true});
}
