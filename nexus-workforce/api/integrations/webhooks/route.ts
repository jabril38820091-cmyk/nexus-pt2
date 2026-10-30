import {NextRequest,NextResponse} from 'next/server';
import {randomBytes} from 'crypto';
import {createClient} from '@/lib/supabase/server';
import {EVENTS,isSafeUrl} from '@/lib/events';
export async function POST(req:NextRequest){
  try{
    const sb=createClient();const {data:{user}}=await sb.auth.getUser();
    if(!user)return NextResponse.json({error:'unauthorized'},{status:401});
    const {url,events}=await req.json();
    if(typeof url!=='string'||!isSafeUrl(url))return NextResponse.json({error:'bad_url',detail:'Use a public https:// address.'},{status:400});
    const ev=(Array.isArray(events)?events:[]).filter((e:string)=>(EVENTS as readonly string[]).includes(e));
    if(!ev.length)return NextResponse.json({error:'no_events',detail:'Pick at least one event.'},{status:400});
    const {data:company}=await sb.from('companies').select('id').limit(1).maybeSingle();
    if(!company)return NextResponse.json({error:'company_not_found'},{status:404});
    const {count}=await sb.from('webhooks').select('id',{count:'exact',head:true});
    if((count??0)>=10)return NextResponse.json({error:'limit',detail:'You can have up to 10 webhooks.'},{status:400});
    const {data,error}=await sb.from('webhooks').insert({company_id:company.id,url,events:ev,secret:randomBytes(24).toString('hex')}).select('*').single();
    if(error)return NextResponse.json({error:'save_failed',detail:error.message},{status:500});
    return NextResponse.json({webhook:data});
  }catch(e){return NextResponse.json({error:'failed',detail:e instanceof Error?e.message:String(e)},{status:500})}
}
