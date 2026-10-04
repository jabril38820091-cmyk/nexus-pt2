'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {PLANS} from '@/lib/plans';
export function PlanCards({current}:{current?:string|null}){
  const router=useRouter();const [busy,setBusy]=useState<string|null>(null);const [err,setErr]=useState('');
  async function pick(key:string){
    setBusy(key);setErr('');
    try{
      const r=await fetch('/api/stripe/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan:key})});
      if(r.status===401){router.push('/signup');return}
      const j=await r.json();
      if(!r.ok)throw new Error(j.detail??j.error??'Could not start checkout');
      window.location.href=j.url;
    }catch(e){setErr(e instanceof Error?e.message:String(e));setBusy(null)}
  }
  return(<div>
    <div className="grid gap-4 md:grid-cols-3">
      {PLANS.map(p=>(<div key={p.key} className={`flex flex-col rounded-2xl border bg-slate-900/60 p-6 ${p.hot?'border-emerald-500':'border-slate-700'}`}>
        <h3 className="text-lg font-semibold">{p.name}{p.hot&&<span className="ml-2 rounded-full bg-emerald-900 px-2 py-0.5 text-xs text-emerald-300">Most popular</span>}</h3>
        <div className="mt-2 text-4xl font-bold">${p.price.toLocaleString()}<span className="text-base font-normal text-slate-400">/month</span></div>
        <p className="text-sm text-slate-400">{p.minutes}</p>
        <ul className="my-4 flex-1 list-disc space-y-1 pl-5 text-sm text-slate-300">{p.features.map(f=><li key={f}>{f}</li>)}</ul>
        <button disabled={busy!==null||current===p.key} onClick={()=>pick(p.key)} className={`rounded-lg py-2.5 font-medium disabled:opacity-60 ${p.hot?'bg-emerald-600':'border border-slate-600'}`}>
          {current===p.key?'Current plan':busy===p.key?'Opening checkout…':`Choose ${p.name}`}</button>
      </div>))}
    </div>
    {err&&<p role="alert" className="mt-3 text-sm text-amber-400">{err}</p>}
  </div>);
}
