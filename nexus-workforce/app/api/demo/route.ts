import {NextRequest,NextResponse} from 'next/server';
import {createHash} from 'crypto';
import {supabaseAdmin} from '@/lib/supabase/admin';
import {validateDemo,looksAutomated} from '@/lib/demo';
const THANKS={ok:true};
export async function POST(req:NextRequest){
  try{
    const b=await req.json().catch(()=>({}));
    // Automated submissions get the same success reply, so spammers learn nothing.
    if(looksAutomated(b))return NextResponse.json(THANKS);
    const v=validateDemo(b);
    if('errors' in v)return NextResponse.json({error:'invalid',errors:v.errors},{status:400});
    const ip=(req.headers.get('x-forwarded-for')??'').split(',')[0].trim()||'unknown';
    const ipHash=createHash('sha256').update(ip+(process.env.VAPI_WEBHOOK_SECRET??'')).digest('hex').slice(0,32);
    const hourAgo=new Date(Date.now()-3600_000).toISOString(),dayAgo=new Date(Date.now()-86400_000).toISOString();
    const [{count:byIp},{count:byEmail}]=await Promise.all([
      supabaseAdmin.from('demo_requests').select('id',{count:'exact',head:true}).eq('ip_hash',ipHash).gte('created_at',hourAgo),
      supabaseAdmin.from('demo_requests').select('id',{count:'exact',head:true}).eq('email',v.value.email).gte('created_at',dayAgo)]);
    if((byIp??0)>=5)return NextResponse.json({error:'rate_limited',errors:['Too many requests from this connection. Please try again later.']},{status:429});
    if((byEmail??0)>=1)return NextResponse.json(THANKS);
    const d=v.value;
    const {error}=await supabaseAdmin.from('demo_requests').insert({name:d.name,business:d.business,email:d.email,phone:d.phone,business_type:d.businessType,message:d.message,source:d.source,ip_hash:ipHash});
    if(error)return NextResponse.json({error:'save_failed',errors:['Something went wrong. Please try again.']},{status:500});
    const admins=(process.env.ADMIN_EMAILS??'').split(',').map(s=>s.trim()).filter(Boolean);
    if(process.env.RESEND_API_KEY&&admins.length){
      const base=(process.env.NEXT_PUBLIC_APP_URL??'').replace(/\/$/,'');
      await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},
        body:JSON.stringify({from:process.env.EMAIL_FROM??'Nexus <onboarding@resend.dev>',to:admins,reply_to:d.email,subject:`New demo request: ${d.business}`,
          text:`Name: ${d.name}\nBusiness: ${d.business}\nType: ${d.businessType}\nEmail: ${d.email}\nPhone: ${d.phone??'not given'}\nCame from: ${d.source??'direct'}\n\nMessage:\n${d.message??'(none)'}\n\nSee all requests: ${base}/admin\nReply to this email to answer them directly.`})}).catch(()=>{});
    }
    return NextResponse.json(THANKS);
  }catch{return NextResponse.json({error:'failed',errors:['Something went wrong. Please try again.']},{status:500})}
}
