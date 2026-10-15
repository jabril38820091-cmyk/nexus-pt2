'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {PLANS,PLAN_DEPTS} from '@/lib/plans';
import {DEPARTMENTS,ROSTER,type DepartmentId} from '@/lib/agents/roster';
export function PlanCards({current}:{current?:string|null}){
  const router=useRouter();const [busy,setBusy]=useState<string|null>(null);const [err,setErr]=useState('');
  async function pick(key:string){
    setBusy(key);setErr('');
    try{
      // Someone with a plan switches through the billing portal. Someone new goes to checkout.
      const r=await fetch(current?'/api/stripe/portal':'/api/stripe/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan:key})});
      if(r.status===401){router.push('/signup');return}
      const j=await r.json();
      if(!r.ok)throw new Error(j.detail??j.error??'Could not continue');
      window.location.href=j.url;
    }catch(e){setErr(e instanceof Error?e.message:String(e));setBusy(null)}
  }
  return(<div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {PLANS.map(p=>{
        const depts=PLAN_DEPTS[p.key];const agents=ROSTER.filter(a=>depts.includes(a.department));
        return(<div key={p.key} className={`flex flex-col rounded-2xl border bg-slate-900/60 p-5 ${p.hot?'border-emerald-500':'border-slate-700'}`}>
          <div className="mb-1 flex items-center justify-between gap-2"><h3 className="text-lg font-semibold">{p.name}</h3>{p.badge&&<span className={`rounded-full px-2 py-0.5 text-xs ${p.hot?'bg-emerald-900 text-emerald-300':'bg-slate-700 text-slate-300'}`}>{p.badge}</span>}</div>
          <p className="text-sm text-slate-400">{p.tagline}</p>
          <div className="mt-3 text-4xl font-bold">${p.price.toLocaleString()}<span className="text-base font-normal text-slate-400">/month</span></div>
          <p className="text-sm text-slate-400">{p.minutes} included</p>
          <p className="mt-3 rounded-lg bg-black/20 p-2 text-xs text-slate-300"><b>Best for:</b> {p.bestFor}</p>
          <p className="mt-3 text-sm font-medium">{agents.length} agent{agents.length>1?'s':''} · {depts.length} department{depts.length>1?'s':''}</p>
          <details className="mb-2 text-xs text-slate-400"><summary className="cursor-pointer text-slate-300">See every agent</summary>
            <ul className="mt-2 space-y-1">{depts.map(d=>(<li key={d}><b className="text-slate-200">{DEPARTMENTS[d as DepartmentId].icon} {DEPARTMENTS[d as DepartmentId].label}:</b> {agents.filter(a=>a.department===d).map(a=>a.name).join(', ')}</li>))}</ul></details>
          <ul className="my-3 flex-1 list-disc space-y-1.5 pl-5 text-sm text-slate-300">{p.features.map(f=><li key={f}>{f}</li>)}</ul>
          <button disabled={busy!==null||current===p.key} onClick={()=>pick(p.key)} className={`rounded-lg py-2.5 font-medium disabled:opacity-60 ${p.hot?'bg-emerald-600':'border border-slate-600'}`}>
            {current===p.key?'Your current plan':busy===p.key?'Opening…':current?`Switch to ${p.name}`:`Choose ${p.name}`}</button>
        </div>);})}
    </div>
    {err&&<p role="alert" className="mt-3 text-sm text-amber-400">{err}</p>}
  </div>);
}
