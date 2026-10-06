'use client';
import {useCallback,useEffect,useState} from 'react';
import Link from 'next/link';
import {AppShell} from '@/components/app-shell';
import {ActivateCard} from '@/components/activate-card';
import {CountUp} from '@/components/count-up';
import {useCompany} from '@/lib/use-company';
import {createClient} from '@/lib/supabase/client';
type Call={id:string;caller_number:string|null;duration_seconds:number|null;outcome:string|null;revenue_cents:number|null;created_at:string};
type Draft={id:string;title:string;result:string|null;created_at:string};
type Hub={calls:Call[];drafts:Draft[];done:number;pb:Record<string,boolean>;hooks:number;keys:number;squad:{id:string;phone_number:string|null}|null};
const PLAYBOOKS=[
  {key:'call_followup',title:'Follow up after every call',desc:'When a call ends, an agent drafts a short follow-up. You approve it with one click.',live:true},
  {key:'invoice_chase',title:'Chase overdue invoices',desc:'Polite reminders for unpaid invoices.',live:false},
  {key:'win_back',title:'Win back quiet customers',desc:'Reach out to customers who have gone silent.',live:false},
  {key:'reviews',title:'Ask happy customers for reviews',desc:'Request a review after a good call.',live:false}];
const card='rounded-2xl border border-slate-700 bg-slate-900/60 p-5';
const mk=(n:number,out:string,rev:number,dur:number):Call=>({id:'s'+n,caller_number:`+1 (555) 010-01${String(n).padStart(2,'0')}`,duration_seconds:dur,outcome:out,revenue_cents:rev,created_at:new Date(Date.now()-n*3600e3).toISOString()});
const SAMPLE:Hub={calls:[mk(1,'New customer won',50000,214),mk(2,'Question answered',0,96),mk(3,'Customer kept',15000,180),mk(4,'Invoice collected',30000,75),mk(5,'New customer won',50000,260),mk(6,'Appointment requested',0,140),mk(7,'Question answered',0,60),mk(8,'New customer won',50000,198),mk(9,'Invoice collected',30000,88),mk(10,'Customer kept',15000,205),mk(11,'Question answered',0,70),mk(12,'New customer won',50000,240)],
  drafts:[{id:'sd1',title:'Follow-up for +1 (555) 010-0101',result:'Hi! Thanks for calling today. Here is a quick recap of what we talked about and the next step. Reply here any time if you have questions.',created_at:new Date().toISOString()},{id:'sd2',title:'Follow-up for +1 (555) 010-0105',result:'Thanks again for calling. I have noted what you asked about and someone will confirm the details shortly.',created_at:new Date().toISOString()}],
  done:9,pb:{call_followup:true},hooks:1,keys:0,squad:{id:'s',phone_number:'+1 (555) 010-0000'}};
export default function HubPage(){
  const {company,isAdmin}=useCompany();
  const [real,setHub]=useState<Hub|null>(null);const [sample,setSample]=useState(false);const [note,setNote]=useState('');
  const hub=sample?SAMPLE:real;
  const load=useCallback(async()=>{
    const sb=createClient();const start=new Date();start.setDate(1);start.setHours(0,0,0,0);const s=start.toISOString();
    const [calls,drafts,done,pb,hooks,keys,squad]=await Promise.all([
      sb.from('calls').select('id,caller_number,duration_seconds,outcome,revenue_cents,created_at').gte('created_at',s).order('created_at',{ascending:false}).limit(500),
      sb.from('tasks').select('id,title,result,created_at').eq('status','needs_review').order('created_at',{ascending:false}).limit(20),
      sb.from('tasks').select('id',{count:'exact',head:true}).eq('status','done').gte('created_at',s),
      sb.from('playbooks').select('key,enabled'),
      sb.from('webhooks').select('id',{count:'exact',head:true}),
      sb.from('api_keys').select('id',{count:'exact',head:true}),
      sb.from('squads').select('id,phone_number').limit(1).maybeSingle()]);
    setHub({calls:calls.data??[],drafts:drafts.data??[],done:done.count??0,pb:Object.fromEntries((pb.data??[]).map(p=>[p.key,p.enabled])),hooks:hooks.count??0,keys:keys.count??0,squad:squad.data??null});
  },[]);
  useEffect(()=>{load()},[load]);
  async function toggle(key:string,on:boolean){
    if(sample)return;
    setHub(h=>h&&{...h,pb:{...h.pb,[key]:on}});
    const r=await fetch('/api/hub/playbooks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,enabled:on})});
    if(!r.ok){setNote('Could not save that. Try again.');load()}
  }
  async function decide(id:string,action:'approve'|'dismiss'){
    if(sample){setNote('This is sample data, so nothing was sent.');return}
    const r=await fetch('/api/hub/approve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,action})});
    setNote(r.ok?(action==='approve'?'Approved. If you have a webhook connected, it was sent on.':'Dismissed.'):'Could not update that.');load();
  }
  const revenue=(hub?.calls??[]).reduce((s,c)=>s+(c.revenue_cents??0),0)/100;
  const callMins=(hub?.calls??[]).reduce((s,c)=>s+(c.duration_seconds??0),0)/3600;
  const hours=callMins+(hub?.done??0)*0.25;
  const tips:[string,string,string][]=[];
  if(hub){
    if(company&&company.subscription_status!=='active')tips.push(['Choose a plan to go live','Your agents are in test mode until a plan is active.','/billing']);
    if(!hub.pb.call_followup)tips.push(['Turn on follow-ups','Never let a call go cold. Agents draft the message, you approve.','#autopilot']);
    if(hub.hooks===0)tips.push(['Connect a tool','Send approved follow-ups to your CRM, texting app or spreadsheet.','/integrations']);
    if(hub.calls.length===0)tips.push(['Run your first call','Open the office and click an agent, or run a demo call.','/office']);
  }
  return(<AppShell>
    <div className="mb-6 overflow-hidden rounded-3xl border border-emerald-700/40 p-6" style={{background:'radial-gradient(900px 300px at 20% 0%,#064e3b 0%,#0f172a 70%)'}}>
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-emerald-300/80">{company?.name?`${company.name} · this month`:'This month'}</p>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={sample} onChange={e=>setSample(e.target.checked)} className="accent-emerald-500"/>Preview with sample data</label></div>
      {sample&&<p role="status" className="mt-2 rounded bg-amber-500/15 px-3 py-1 text-xs text-amber-300">Sample data. These numbers are examples to show how the page looks. They are not your results.</p>}
      <div className="mt-1 text-5xl font-bold text-emerald-400 md:text-6xl">{hub?<CountUp value={revenue} prefix="$"/>:'$0'}</div>
      <p className="text-slate-300">captured by your agents</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[['Calls handled',hub?.calls.length??0,0],['Hours saved',hours,1],['Tasks done',hub?.done??0,0]].map(([l,v,d])=>(<div key={l as string} className="rounded-xl bg-black/25 p-3"><div className="text-2xl font-semibold"><CountUp value={v as number} decimals={d as number}/></div><div className="text-xs text-slate-400">{l}</div></div>))}
      </div>
      <p className="mt-3 text-xs text-slate-500">Hours saved = total call time plus 15 minutes for each completed task. Revenue is what your agents record on calls.</p>
    </div>
    {note&&<p role="status" className="mb-4 rounded border border-slate-700 bg-slate-900 p-3 text-sm">{note}</p>}
    {hub&&!sample&&<ActivateCard squad={hub.squad} isAdmin={isAdmin} mode={company?.agent_mode??'full'} onDone={load}/>}
    <div className="grid gap-6 lg:grid-cols-2">
      <section className={card}><h2 className="mb-1 text-lg font-semibold">Needs your OK {hub&&hub.drafts.length>0&&<span className="ml-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs text-black">{hub.drafts.length}</span>}</h2>
        <p className="mb-3 text-sm text-slate-400">Drafts your agents wrote. One click to approve.</p>
        {hub&&hub.drafts.length===0&&<p className="rounded border border-dashed border-slate-700 p-4 text-sm text-slate-500">Nothing waiting. Turn on follow-ups below and drafts appear here after calls.</p>}
        <ul className="space-y-3">{hub?.drafts.map(d=>(<li key={d.id} className="rounded-xl border border-slate-700 p-3"><div className="text-sm font-medium">{d.title}</div>
          <p className="my-2 whitespace-pre-wrap text-sm text-slate-300">{d.result}</p>
          <div className="flex gap-2"><button onClick={()=>decide(d.id,'approve')} className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium">Approve</button><button onClick={()=>decide(d.id,'dismiss')} className="rounded border border-slate-600 px-3 py-1.5 text-sm">Dismiss</button></div></li>))}</ul></section>
      <section id="autopilot" className={card}><h2 className="mb-1 text-lg font-semibold">Autopilot</h2>
        <p className="mb-3 text-sm text-slate-400">Switch on playbooks and your agents do the work. You only approve.</p>
        <ul className="space-y-3">{PLAYBOOKS.map(p=>{const on=!!hub?.pb[p.key];return(<li key={p.key} className="flex items-start justify-between gap-3 rounded-xl border border-slate-700 p-3">
          <div><div className="text-sm font-medium">{p.title}{!p.live&&<span className="ml-2 rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-slate-300">Coming soon</span>}</div><p className="text-xs text-slate-400">{p.desc}</p></div>
          <button role="switch" aria-checked={on} aria-label={p.title} disabled={!p.live||!hub} onClick={()=>toggle(p.key,!on)} className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-40 ${on?'bg-emerald-500':'bg-slate-600'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on?'left-[22px]':'left-0.5'}`}/></button></li>)})}</ul></section>
      <section className={card}><h2 className="mb-3 text-lg font-semibold">Do this next</h2>
        {hub&&tips.length===0&&<p className="text-sm text-emerald-300">You're all set. Your agents are working.</p>}
        <ul className="space-y-2">{tips.map(([t,d,h])=>(<li key={t}><Link href={h} className="block rounded-xl border border-slate-700 p-3 hover:bg-slate-800"><div className="text-sm font-medium">{t} →</div><div className="text-xs text-slate-400">{d}</div></Link></li>))}</ul></section>
      <section className={card}><h2 className="mb-3 text-lg font-semibold">Recent calls</h2>
        {hub&&hub.calls.length===0&&<p className="text-sm text-slate-500">No calls yet this month.</p>}
        <ul className="divide-y divide-slate-800">{hub?.calls.slice(0,8).map(c=>(<li key={c.id} className="flex items-center justify-between py-2 text-sm"><span>{c.caller_number??'Unknown'}<span className="block text-xs text-slate-500">{c.outcome??'No outcome recorded'}</span></span>
          <span className={c.revenue_cents?'font-semibold text-emerald-400':'text-slate-500'}>{c.revenue_cents?`+$${(c.revenue_cents/100).toLocaleString()}`:'—'}</span></li>))}</ul></section>
    </div>
  </AppShell>);
}
