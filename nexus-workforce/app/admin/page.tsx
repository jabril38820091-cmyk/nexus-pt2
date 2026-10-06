'use client';
import {useCallback,useEffect,useState} from 'react';
import {AppShell} from '@/components/app-shell';
import {useCompany} from '@/lib/use-company';
type Row={id:string;name:string;industry:string;agent_mode:string|null;subscription_status:string|null;plan:string|null;created_at:string};
type Over={counts:Record<string,number>;companies:Row[]};
const card='rounded-xl border border-slate-700 bg-slate-900/60 p-4';
const btn='rounded border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800 disabled:opacity-50';
export default function Admin(){
  const {isAdmin,loading}=useCompany();
  const [over,setOver]=useState<Over|null>(null);const [msg,setMsg]=useState('');const [busy,setBusy]=useState(false);
  const load=useCallback(async()=>{const r=await fetch('/api/admin/overview');if(r.ok)setOver(await r.json())},[]);
  useEffect(()=>{if(isAdmin)load()},[isAdmin,load]);
  async function call(url:string,body:object,ok:string){
    setBusy(true);setMsg('Working…');
    try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const j=await r.json();setMsg(r.ok?ok:(j.detail??j.error??'Failed'))}
    catch{setMsg('Request failed')}
    setBusy(false);load();
  }
  if(loading)return<AppShell><p className="text-slate-500">Loading…</p></AppShell>;
  if(!isAdmin)return<AppShell><h1 className="text-xl font-semibold">Not authorized</h1><p className="mt-2 text-sm text-slate-400">This page is only for the site admin.</p></AppShell>;
  return(<AppShell>
    <h1 className="mb-1 text-2xl font-semibold">Admin</h1>
    <p className="mb-5 text-sm text-slate-400">Test everything without signing up again. Changes here only affect your own account.</p>
    {msg&&<p role="status" className="mb-4 rounded border border-slate-700 bg-slate-900 p-3 text-sm">{msg}</p>}
    <div className="grid gap-6 lg:grid-cols-2">
      <section className={card}><h2 className="mb-2 font-medium">Simulate</h2>
        <p className="mb-3 text-sm text-slate-400">Open the Office in another tab first, then start a fake call. You should see it light up desks and add revenue.</p>
        <button disabled={busy} onClick={()=>call('/api/admin/simulate-call',{},'Simulated call finished.')} className={btn}>Simulate a live call (about 10 s)</button>
        <h3 className="mb-2 mt-5 text-sm font-medium">Send a sample webhook event</h3>
        <div className="flex flex-wrap gap-2">{['task.completed','email.sent','call.ended'].map(e=>(<button key={e} disabled={busy} onClick={()=>call('/api/admin/fire-event',{event:e},`Sent ${e} to your webhooks.`)} className={btn}>{e}</button>))}</div>
      </section>
      <section className={card}><h2 className="mb-2 font-medium">Set my account state</h2>
        <p className="mb-3 text-sm text-slate-400">Flip these to see how customers experience each case.</p>
        <div className="mb-3 flex flex-wrap gap-2"><span className="w-full text-xs text-slate-500">Subscription</span>
          {['active','inactive','past_due','canceled'].map(s=>(<button key={s} disabled={busy} onClick={()=>call('/api/admin/set-state',{subscription_status:s},`Subscription set to ${s}.`)} className={btn}>{s}</button>))}</div>
        <div className="flex flex-wrap gap-2"><span className="w-full text-xs text-slate-500">Agents</span>
          {[['full','Full team'],['receptionist','Receptionist only'],['single','One agent']].map(([m,l])=>(<button key={m} disabled={busy} onClick={()=>call('/api/admin/set-state',{agent_mode:m},`Agents set to ${l}.`)} className={btn}>{l}</button>))}</div>
        <p className="mt-3 text-xs text-slate-500">When you finish testing, set Active and Full team again.</p>
      </section>
    </div>
    <section className={card+' mt-6'}><h2 className="mb-3 font-medium">Overview</h2>
      {!over?<p className="text-sm text-slate-500">Loading…</p>:<>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">{Object.entries(over.counts).map(([k,v])=>(<div key={k} className="rounded border border-slate-700 p-3"><div className="text-2xl font-bold">{v}</div><div className="text-xs text-slate-400">{k}</div></div>))}</div>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-slate-400"><tr><th className="p-2">Business</th><th className="p-2">Type</th><th className="p-2">Agents</th><th className="p-2">Status</th><th className="p-2">Plan</th><th className="p-2">Joined</th></tr></thead>
          <tbody>{over.companies.map(c=>(<tr key={c.id} className="border-t border-slate-800"><td className="p-2">{c.name}</td><td className="p-2">{c.industry}</td><td className="p-2">{c.agent_mode??'full'}</td><td className="p-2">{c.subscription_status??'inactive'}</td><td className="p-2">{c.plan??'-'}</td><td className="p-2">{new Date(c.created_at).toLocaleDateString()}</td></tr>))}</tbody></table></div></>}
    </section>
  </AppShell>);
}
