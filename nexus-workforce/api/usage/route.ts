import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {usageFor} from '@/lib/usage-server';
export async function GET(){
  const sb=createClient();const {data:{user}}=await sb.auth.getUser();
  if(!user)return NextResponse.json({error:'unauthorized'},{status:401});
  const {data:co}=await sb.from('companies').select('id').limit(1).maybeSingle();
  if(!co)return NextResponse.json({error:'company_not_found'},{status:404});
  const u=await usageFor(co.id);
  return u?NextResponse.json(u):NextResponse.json({error:'company_not_found'},{status:404});
}
