import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {deliver,isSafeUrl} from '@/lib/events';
export async function POST(req:NextRequest){
  const sb=createClient();const {data:{user}}=await sb.auth.getUser();
  if(!user)return NextResponse.json({error:'unauthorized'},{status:401});
  const {id}=await req.json();
  const {data:hook}=await sb.from('webhooks').select('id,url,secret').eq('id',id).maybeSingle();
  if(!hook||!isSafeUrl(hook.url))return NextResponse.json({error:'not_found'},{status:404});
  const status=await deliver(hook,'ping',{message:'Test from Nexus Workforce'});
  return NextResponse.json({status});
}
