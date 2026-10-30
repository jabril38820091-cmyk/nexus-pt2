import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {isSafeUrl} from '@/lib/events';
import {cleanHeaders} from '@/lib/connections';
export async function POST(req:NextRequest){
  try{
    const sb=createClient();const {data:{user}}=await sb.auth.getUser();
    if(!user)return NextResponse.json({error:'unauthorized'},{status:401});
    const b=await req.json();
    const name=String(b.name??'').trim().toLowerCase();
    if(!/^[a-z0-9_-]{2,40}$/.test(name))return NextResponse.json({error:'bad_name',detail:'Name: 2-40 letters, numbers, dashes or underscores.'},{status:400});
    if(typeof b.url!=='string'||!isSafeUrl(b.url))return NextResponse.json({error:'bad_url',detail:'Use a public https:// address.'},{status:400});
    let headers:Record<string,string>|null={};
    if(b.headers&&String(b.headers).trim()){try{headers=cleanHeaders(JSON.parse(String(b.headers)))}catch{headers=null}}
    if(!headers)return NextResponse.json({error:'bad_headers',detail:'Headers must be a JSON object like {"Authorization":"Bearer KEY"}.'},{status:400});
    const method=b.method==='GET'?'GET':'POST';
    const tpl=b.bodyTemplate?String(b.bodyTemplate).slice(0,4000):null;
    if(method==='POST'&&tpl){try{JSON.parse(tpl.split('{{input}}').join('"x"'))}catch{return NextResponse.json({error:'bad_template',detail:'The body must be valid JSON. Use {{input}} where the text goes, without quotes around it.'},{status:400})}}
    const {data:company}=await sb.from('companies').select('id').limit(1).maybeSingle();
    if(!company)return NextResponse.json({error:'company_not_found'},{status:404});
    const {count}=await sb.from('connections').select('id',{count:'exact',head:true});
    if((count??0)>=20)return NextResponse.json({error:'limit',detail:'You can have up to 20 connections.'},{status:400});
    const {error}=await sb.from('connections').insert({company_id:company.id,name,description:String(b.description??'').slice(0,300)||null,url:b.url,method,headers,body_template:tpl,response_path:b.responsePath?String(b.responsePath).slice(0,100):null});
    if(error)return NextResponse.json({error:'save_failed',detail:error.code==='23505'?'You already have a connection with that name.':error.message},{status:400});
    return NextResponse.json({ok:true});
  }catch(e){return NextResponse.json({error:'failed',detail:e instanceof Error?e.message:String(e)},{status:500})}
}
