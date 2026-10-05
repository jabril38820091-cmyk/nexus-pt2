import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {runConnection} from '@/lib/connections';
export async function POST(req:NextRequest){
  const sb=createClient();const {data:{user}}=await sb.auth.getUser();
  if(!user)return NextResponse.json({error:'unauthorized'},{status:401});
  const {id,input}=await req.json();
  const {data:c}=await sb.from('connections').select('id,name,url,method,headers,body_template,response_path').eq('id',id).maybeSingle();
  if(!c)return NextResponse.json({error:'not_found'},{status:404});
  return NextResponse.json(await runConnection(c,String(input??'Hello').slice(0,2000)));
}
