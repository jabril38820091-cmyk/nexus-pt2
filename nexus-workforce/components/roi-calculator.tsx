'use client';
import {useState} from 'react';
import {DEMO_DEFAULTS} from '@/lib/industries';
import {PLANS} from '@/lib/plans';
const fm=(v:number)=>'$'+Math.round(v).toLocaleString();
export function RoiCalculator(){
  const [calls,setCalls]=useState(DEMO_DEFAULTS.callsPerMonth);const [missed,setMissed]=useState(DEMO_DEFAULTS.missedPct);
  const [close,setClose]=useState(DEMO_DEFAULTS.closePct);const [value,setValue]=useState(DEMO_DEFAULTS.avgValue);const [plan,setPlan]=useState(499);
  const missedCalls=calls*missed/100,sales=missedCalls*0.7*close/100,gain=sales*value,net=gain-plan;
  const slider=(label:string,v:number,set:(n:number)=>void,min:number,max:number,step:number,show:string)=>(
    <label className="block text-sm text-slate-400">{label} <b className="float-right text-white">{show}</b>
      <input type="range" min={min} max={max} step={step} value={v} onChange={e=>set(+e.target.value)} className="mt-1 w-full accent-emerald-500"/></label>);
  return(<div className="grid gap-6 rounded-2xl border border-slate-700 bg-slate-900/60 p-6 md:grid-cols-2">
    <div className="space-y-4">
      {slider('Calls per month',calls,setCalls,20,3000,10,String(calls))}
      {slider('Calls that go unanswered',missed,setMissed,5,70,1,missed+'%')}
      {slider('Calls that become a new customer',close,setClose,5,70,1,close+'%')}
      {slider('Average value of a new customer',value,setValue,20,20000,10,fm(value))}
      <label className="block text-sm text-slate-400">Plan
        <select value={plan} onChange={e=>setPlan(+e.target.value)} className="mt-1 w-full rounded border border-slate-600 bg-slate-950 p-2 text-white">{PLANS.map(p=><option key={p.key} value={p.price}>{p.name}, ${p.price}/mo</option>)}</select></label>
    </div>
    <div>
      <p className="text-sm text-slate-400">Estimated revenue you could recover</p>
      <div className="text-5xl font-bold text-emerald-400" aria-live="polite">{fm(gain)}<span className="text-lg font-normal text-slate-400"> /month</span></div>
      <dl className="mt-4 divide-y divide-slate-800 text-sm">
        {[['Missed calls per month',String(Math.round(missedCalls))],['Extra customers won',sales.toFixed(1)],['Plan cost',fm(plan)],['Net gain per month',fm(net)],['Return on plan cost',(gain/plan).toFixed(1)+'x']].map(([k,v])=>(<div key={k} className="flex justify-between py-2"><dt className="text-slate-400">{k}</dt><dd className="font-semibold">{v}</dd></div>))}
      </dl>
      <p className="mt-3 text-xs text-slate-500">An estimate, not a promise. It assumes the agents recover 70% of missed calls. Replace the numbers with your own.</p>
    </div>
  </div>);
}
