import 'server-only';
import {createHash} from 'crypto';
import type {NextRequest} from 'next/server';
import {supabaseAdmin} from '@/lib/supabase/admin';
export async function companyFromKey(req:NextRequest):Promise<string|null>{
  const h=req.headers.get('authorization')??'';
  const key=h.startsWith('Bearer ')?h.slice(7).trim():'';
  if(!key.startsWith('nx_'))return null;
  const hash=createHash('sha256').update(key).digest('hex');
  const {data}=await supabaseAdmin.from('api_keys').select('id,company_id').eq('key_hash',hash).maybeSingle();
  if(!data)return null;
  await supabaseAdmin.from('api_keys').update({last_used_at:new Date().toISOString()}).eq('id',data.id);
  return data.company_id;
}
