'use client';
import {useEffect,useState} from 'react';
import {createClient} from '@/lib/supabase/client';
type Cfg={calendar_id:string;verify_code:string|null;verified:boolean;duration_minutes:number;buffer_minutes:number;min_notice_hours:number;max_days_ahead:number;enabled:boolean};
const box='mt-1 w-full rounded border border-slate-600 bg-slate-950 p-2 text-sm';
export function Booking({hasHours}:{hasHours:boolean}){
  const [svc,setSvc]=useState<string|null|undefined>(undefined);
  const [cfg,setCfg]=useState<Cfg|null|undefined>(undefined);
  const [cal,setCal]=useState('');const [msg,setMsg]=useState('');const [busy,setBusy]=useState(false);const [copied,setCopied]=useState(false);
  const [v,setV]=useState({duration:30,buffer:0,minNotice:2,maxDays:30,enabled:true});
  const load=()=>createClient().from('booking_settings').select('calendar_id,verify_code,verified,duration_minutes,buffer_minutes,min_notice_hours,max_days_ahead,enabled').limit(1).maybeSingle().then(({data})=>{
    setCfg(data as Cfg|null);if(data)setV({duration:data.duration_minutes,buffer:data.buffer_minutes,minNotice:data.min_notice_hours,maxDays:data.max_days_ahead,enabled:data.enabled!==false})});
  useEffect(()=>{fetch('/api/integrations/booking').then(r=>r.json()).then(j=>setSvc(j.serviceEmail??null)).catch(()=>setSvc(null));load()},[]);
  async function call(body:object){
    setBusy(true);setMsg('');
    const r=await fetch('/api/integrations/booking',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json();setBusy(false);
    if(!r.ok){setMsg(j.detail??j.error);return null}
    return j;
  }
  async function connect(e:React.FormEvent){e.preventDefault();const j=await call({action:'connect',calendarId:cal});if(j){setCal('');setMsg('Connected. One last step: prove the calendar is yours (see step 3).');load()}}
  async function verify(){const j=await call({action:'verify'});if(j){setMsg('Verified. Your agents can now book appointments.');load()}}
  async function save(){const j=await call({action:'save',...v});if(j)setMsg('Saved.')}
  async function test(){const j=await call({action:'test',date:'today'});if(j)setMsg(j.text)}
  async function disconnect(){if(!confirm('Disconnect your calendar? Agents will stop booking appointments.'))return;await fetch('/api/integrations/booking',{method:'DELETE'});setCfg(null);setMsg('Disconnected.')}
  if(svc===undefined||cfg===undefined)return<p className="text-sm text-slate-500">Loading…</p>;
  if(!svc)return<p className="text-sm text-slate-400">Calendar booking isn't switched on for this site yet. The site owner needs to add a Google service account first.</p>;
  const sel=(val:number,set:(n:number)=>void,opts:[number,string][])=><select value={val} onChange={e=>set(Number(e.target.value))} className={box}>{opts.map(([n,l])=><option key={n} value={n}>{l}</option>)}</select>;
  return(<div className="space-y-4">
    <p className="text-sm text-slate-400">Let your agents check your Google Calendar and book appointments during calls. They use your business hours and time zone from the Business profile section.</p>
    {!hasHours&&<p className="rounded border border-amber-600/50 bg-amber-950/40 p-3 text-sm text-amber-300">Set your business hours first, in the Business profile section above. Without them, agents can't tell when you're open.</p>}
    {cfg?.verified&&<p className="rounded border border-emerald-700/50 bg-emerald-950/30 p-3 text-sm text-emerald-200">Connected to {cfg.calendar_id}.</p>}
    {!cfg&&<div className="space-y-3 text-sm">
      <p><b>Step 1.</b> In Google Calendar, open your calendar's settings, then "Share with specific people", and add this address with permission "Make changes to events":</p>
      <p className="flex flex-wrap items-center gap-2"><code className="break-all rounded bg-slate-950 p-2">{svc}</code><button onClick={async()=>{try{await navigator.clipboard.writeText(svc);setCopied(true)}catch{/* ignore */}}} className="rounded border border-slate-600 px-3 py-1 text-xs">{copied?'Copied':'Copy'}</button></p>
      <form onSubmit={connect} className="space-y-2"><p><b>Step 2.</b> Paste your Calendar ID. You'll find it under "Integrate calendar" in the same settings. It looks like an email address.</p>
        <input required value={cal} onChange={e=>setCal(e.target.value)} placeholder="yourname@gmail.com" aria-label="Calendar ID" className={box}/>
        <button disabled={busy} className="rounded bg-emerald-600 px-4 py-2 font-medium disabled:opacity-50">Connect</button></form></div>}
    {cfg&&!cfg.verified&&<div className="space-y-2 text-sm">
      <p><b>Step 3.</b> To prove the calendar is yours, create an event titled <code className="rounded bg-slate-950 px-2 py-1">{cfg.verify_code}</code> on {cfg.calendar_id}, at any time in the next few weeks. Then click Verify. You can delete the event afterwards.</p>
      <div className="flex gap-2"><button disabled={busy} onClick={verify} className="rounded bg-emerald-600 px-4 py-2 font-medium disabled:opacity-50">Verify</button><button onClick={disconnect} className="rounded border border-slate-600 px-4 py-2">Start over</button></div></div>}
    {cfg?.verified&&<div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Appointment length{sel(v.duration,n=>setV({...v,duration:n}),[[15,'15 minutes'],[30,'30 minutes'],[45,'45 minutes'],[60,'1 hour'],[90,'1.5 hours'],[120,'2 hours']])}</label>
        <label className="text-sm">Gap between appointments{sel(v.buffer,n=>setV({...v,buffer:n}),[[0,'None'],[5,'5 minutes'],[10,'10 minutes'],[15,'15 minutes'],[30,'30 minutes']])}</label>
        <label className="text-sm">Earliest booking from now{sel(v.minNotice,n=>setV({...v,minNotice:n}),[[0,'No notice needed'],[1,'1 hour'],[2,'2 hours'],[4,'4 hours'],[24,'1 day'],[48,'2 days']])}</label>
        <label className="text-sm">How far ahead callers can book{sel(v.maxDays,n=>setV({...v,maxDays:n}),[[7,'1 week'],[14,'2 weeks'],[30,'30 days'],[60,'60 days'],[90,'90 days']])}</label></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.enabled} onChange={e=>setV({...v,enabled:e.target.checked})} className="accent-emerald-500"/>Booking is on</label>
      <div className="flex flex-wrap gap-2"><button disabled={busy} onClick={save} className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium disabled:opacity-50">Save</button>
        <button disabled={busy} onClick={test} className="rounded border border-slate-600 px-4 py-2 text-sm disabled:opacity-50">Show today's open times</button>
        <button onClick={disconnect} className="rounded border border-red-900 px-4 py-2 text-sm text-red-300">Disconnect</button></div></div>}
    {msg&&<p role="status" className="text-sm text-slate-200">{msg}</p>}
    <details className="text-xs text-slate-400"><summary className="cursor-pointer text-slate-300">Set up your agents to book</summary>
      <p className="mt-2">In Vapi, create two Function tools with this Server URL: <code>{typeof location!=='undefined'?location.origin:''}/api/tools/calendar?secret=YOUR_WEBHOOK_SECRET</code></p>
      <ul className="mt-2 list-disc space-y-1 pl-5"><li><code>check_availability</code> with one optional text field, <code>date</code> (for example "tomorrow" or 2026-10-20).</li><li><code>book_appointment</code> with text fields <code>start</code> (the exact time offered, like 2026-10-20 09:00), <code>name</code>, <code>phone</code> and <code>reason</code>.</li><li>Attach both to the assistants that should book, and add to their prompts: "Always check availability before offering times. Offer at most three. Confirm the caller's name and number before booking."</li></ul></details>
  </div>);
}
