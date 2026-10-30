import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {sendSms} from '@/lib/sms';
export async function POST(req:NextRequest){
  const sb=createClient();const {data:{user}}=await sb.auth.getUser();
  if(!user)return NextResponse.json({error:'unauthorized'},{status:401});
  const {to}=await req.json();
  const {data:co}=await sb.from('companies').select('id').limit(1).maybeSingle();
  if(!co)return NextResponse.json({error:'company_not_found'},{status:404});
  const r=await sendSms(co.id,String(to??''),'This is a test text from your Nexus Workforce account.');
  return NextResponse.json({ok:r.ok,message:r.message},{status:r.ok?200:400});
}
