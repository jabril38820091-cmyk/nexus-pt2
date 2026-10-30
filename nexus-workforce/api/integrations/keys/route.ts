import {NextRequest,NextResponse} from 'next/server';
import {createHash,randomBytes} from 'crypto';
import {createClient} from '@/lib/supabase/server';
import {supabaseAdmin} from '@/lib/supabase/admin';
export async function POST(req:NextRequest){
  try{
    const sb=createClient();const {data:{user}}=await sb.auth.getUser();
    if(!user)return NextResponse.json({error:'unauthorized'},{status:401});
    const {name}=await req.json();
    if(!name||typeof name!=='string')return NextResponse.json({error:'missing_name'},{status:400});
    const {data:company}=await sb.from('companies').select('id').limit(1).maybeSingle();
    if(!company)return NextResponse.json({error:'company_not_found'},{status:404});
    const {count}=await sb.from('api_keys').select('id',{count:'exact',head:true});
    if((count??0)>=10)return NextResponse.json({error:'limit',detail:'You can have up to 10 keys.'},{status:400});
    const key='nx_'+randomBytes(24).toString('hex');
    const {error}=await supabaseAdmin.from('api_keys').insert({company_id:company.id,name:name.slice(0,60),key_prefix:key.slice(0,8),key_hash:createHash('sha256').update(key).digest('hex')});
    if(error)return NextResponse.json({error:'save_failed',detail:error.message},{status:500});
    return NextResponse.json({key});
  }catch(e){return NextResponse.json({error:'failed',detail:e instanceof Error?e.message:String(e)},{status:500})}
}
