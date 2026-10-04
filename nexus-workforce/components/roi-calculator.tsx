'use client';
import {useState} from 'react';
import {INDUSTRIES} from '@/lib/industries';
import {PLANS} from '@/lib/plans';
const fm=(v:number)=>'$'+Math.round(v).toLocaleString();
export function RoiCalculator(){
  const [ind,setInd]=useState(INDUSTRIES[0].id);
  const base=INDUSTRIES.find(i=>i.id===ind)!.defaults;
  const [calls,setCalls]=useState(base.callsPerMonth);const [missed,setMissed]=useState(base.missedPct);
  const [close,setClose]=useState(base.closePct);const [value,setValue]=useState(base.avgValue);const [plan,setPlan]=useState(499);
  function choose(id:string){const d=INDUSTRIES.find(i=>i.id===id)!.defaults;setInd(id);setCalls(d.callsPerMonth);setMissed(d.missedPct);setClose(d.closePct);setValue(d.avgValue)}
  const missedCalls=calls*missed/100,sales=missedCalls*0.7*close/100,gain=sales*value,net=gain-plan;
  const slider=(label:string,v:number,set:(n:number)=>void,min:number,max:number,step:number,show:string)=>(
    <label className="block text-sm text-slate-400">{label} <b className="float-right text-white">{show}</b>
      <input type="range" min={min} max={max} step={step} value={v} onChange={e=>set(+e.target.value)} className="mt-1 w-full accent-emerald-500"/></label>);
  return(<div className="grid gap-6 rounded-2xl border border-slate-700 bg-slate-900/60 p-6 md:grid-cols-2">
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Industry">{INDUSTRIES.map(i=>(<button key={i.id} onClick={()=>choose(i.id)} aria-pressed={ind===i.id} className={`rounded-full border px-3 py-1 text-sm ${ind===i.id?'border-emerald-500 bg-emerald-950 text-emerald-300':'border-slate-600 text-slate-300'}`}>{i.label}</button>))}</div>
      {slider('Calls per month',calls,setCalls,50,2000,10,String(calls))}
      {slider('Calls that go unanswered',missed,setMissed,5,60,1,missed+'%')}
      {slider('Calls that become a sale',close,setClose,5,60,1,close+'%')}
      {slider('Average sale value',value,setValue,50,10000,50,fm(value))}
      <label className="block text-sm text-slate-400">Plan
        <select value={plan} onChange={e=>setPlan(+e.target.value)} className="mt-1 w-full rounded border border-slate-600 bg-slate-950 p-2 text-white">{PLANS.map(p=><option key={p.key} value={p.price}>{p.name}, ${p.price}/mo</option>)}</select></label>
    </div>
    <div>
      <p className="text-sm text-slate-400">Estimated revenue you could recover</p>
      <div className="text-5xl font-bold text-emerald-400" aria-live="polite">{fm(gain)}<span className="text-lg font-normal text-slate-400"> /month</span></div>
      <dl className="mt-4 divide-y divide-slate-800 text-sm">
        {[['Missed calls per month',String(Math.round(missedCalls))],['Extra sales closed',sales.toFixed(1)],['Plan cost',fm(plan)],['Net gain per month',fm(net)],['Return on plan cost',(gain/plan).toFixed(1)+'x']].map(([k,v])=>(<div key={k} className="flex justify-between py-2"><dt className="text-slate-400">{k}</dt><dd className="font-semibold">{v}</dd></div>))}
      </dl>
      <p className="mt-3 text-xs text-slate-500">An estimate, not a promise. It assumes the agents recover 70% of missed calls. Replace the numbers with your own.</p>
    </div>
  </div>);
}
