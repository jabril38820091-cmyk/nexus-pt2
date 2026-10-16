import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {requireAdmin} from '@/lib/admin';
import {vapiChat} from '@/lib/vapi/chat';
import {allowedAgents} from '@/lib/agents/access';
import {buildContext,buildPrompt,startOfDay} from '@/lib/ask';
export const maxDuration=60;
const PREFER=['chief-of-staff','performance-analyst','strategy-advisor','router'];
export async function POST(req:NextRequest){
  try{
    const sb=createClient();const {data:{user}}=await sb.auth.getUser();
    if(!user)return NextResponse.json({error:'unauthorized'},{status:401});
    const {request}=await req.json();
    const text=String(request??'').trim();
    if(text.length<3)return NextResponse.json({error:'too_short',detail:'Type what you would like your team to do.'},{status:400});
    if(text.length>1000)return NextResponse.json({error:'too_long',detail:'Please keep requests under 1,000 characters.'},{status:400});
    const {data:co}=await sb.from('companies').select('id,name,industry,timezone,goals,agent_instructions,track_revenue,agent_mode,chosen_agent,plan,subscription_status').limit(1).maybeSingle();
    if(!co)return NextResponse.json({error:'company_not_found'},{status:404});
    const hourAgo=new Date(Date.now()-3600_000).toISOString();
    const {count:recent}=await sb.from('tasks').select('id',{count:'exact',head:true}).like('instructions','[ask]%').gte('created_at',hourAgo);
    if((recent??0)>=20)return NextResponse.json({error:'rate_limited',detail:'You have reached 20 requests this hour. Please try again later.'},{status:429});
    const admin=!!(await requireAdmin());
    const allowed=allowedAgents(co.agent_mode,co.chosen_agent,admin?null:co.plan,co.subscription_status);
    const {data:agents}=await sb.from('agents').select('slug,vapi_assistant_id');
    const usable=(agents??[]).filter(a=>a.vapi_assistant_id&&allowed.has(a.slug));
    const pick=PREFER.map(s=>usable.find(a=>a.slug===s)).find(Boolean)??usable[0];
    if(!pick)return NextResponse.json({error:'no_agent',detail:'You have no active agents yet. Activate your agents on the Home page first.'},{status:404});
    const start=startOfDay(co.timezone).toISOString();const weekAgo=new Date(Date.now()-7*86400_000).toISOString();
    const [calls,week,tasks,emails,texts,drafts]=await Promise.all([
      sb.from('calls').select('caller_number,duration_seconds,outcome,revenue_cents,created_at').gte('created_at',start).order('created_at',{ascending:false}).limit(200),
      sb.from('calls').select('duration_seconds,revenue_cents').gte('created_at',weekAgo).limit(2000),
      sb.from('tasks').select('title,status,created_at').gte('created_at',start).not('instructions','like','[ask]%').order('created_at',{ascending:false}).limit(30),
      sb.from('email_log').select('subject,created_at').eq('status','sent').gte('created_at',start).limit(50),
      sb.from('sms_log').select('created_at').eq('status','sent').gte('created_at',start).limit(50),
      sb.from('tasks').select('title').eq('status','needs_review').limit(20)]);
    const w=week.data??[];
    const context=buildContext({company:{name:co.name,industry:co.industry,timezone:co.timezone,goals:co.goals,instructions:co.agent_instructions,trackRevenue:co.track_revenue!==false},now:new Date(),
      today:{calls:calls.data??[],tasks:tasks.data??[],emails:emails.data??[],texts:texts.data??[]},
      week:{calls:w.length,minutes:w.reduce((s,x)=>s+(x.duration_seconds??0),0)/60,revenueCents:w.reduce((s,x)=>s+(x.revenue_cents??0),0)},drafts:(drafts.data??[]).map(d=>d.title)});
    const {text:reply}=await vapiChat(pick.vapi_assistant_id,buildPrompt(context,text));
    await sb.from('tasks').insert({company_id:co.id,agent_slug:pick.slug,title:`Ask: ${text.slice(0,100)}`,instructions:`[ask] ${text}`,status:'done',result:reply});
    return NextResponse.json({reply,agent:pick.slug});
  }catch(e){return NextResponse.json({error:'ask_failed',detail:e instanceof Error?e.message:String(e)},{status:500})}
}
