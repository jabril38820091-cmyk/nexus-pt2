import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {PLAYBOOK_KEYS} from '@/lib/playbooks';
export async function POST(req:NextRequest){
  const sb=createClient();const {data:{user}}=await sb.auth.getUser();
  if(!user)return NextResponse.json({error:'unauthorized'},{status:401});
  const {key,enabled}=await req.json();
  if(!(PLAYBOOK_KEYS as readonly string[]).includes(key))return NextResponse.json({error:'unknown_playbook'},{status:400});
  const {data:co}=await sb.from('companies').select('id').limit(1).maybeSingle();
  if(!co)return NextResponse.json({error:'company_not_found'},{status:404});
  const {error}=await sb.from('playbooks').upsert({company_id:co.id,key,enabled:!!enabled},{onConflict:'company_id,key'});
  if(error)return NextResponse.json({error:'save_failed',detail:error.message},{status:500});
  return NextResponse.json({ok:true});
}
