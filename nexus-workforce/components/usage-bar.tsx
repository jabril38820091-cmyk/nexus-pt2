'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
type U={used:number;limit:number|null;plan:string|null;periodStart:string;periodEnd:string};
export function UsageBar({showLink=false}:{showLink?:boolean}){
  const [u,setU]=useState<U|null>(null);
  useEffect(()=>{fetch('/api/usage').then(r=>r.ok?r.json():null).then(setU).catch(()=>setU(null))},[]);
  if(!u||!u.limit)return null;
  const pct=Math.min(100,Math.round(u.used/u.limit*100));
  const over=u.used-u.limit;
  const tone=u.used>=u.limit?'bg-red-500':pct>=80?'bg-amber-500':'bg-green-500';
  const resets=new Date(u.periodEnd).toLocaleDateString([],{month:'long',day:'numeric'});
  return(<section className="mb-6 rounded-2xl border border-slate-700 bg-slate-900/60 p-5" aria-label="Call minutes used">
    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2"><h2 className="font-semibold">Call minutes</h2>
      <span className="text-sm text-slate-300"><b className="text-slate-100">{u.used.toLocaleString()}</b> of {u.limit.toLocaleString()} used · resets {resets}</span></div>
    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><div className={`h-full rounded-full ${tone}`} style={{width:`${Math.max(pct,2)}%`}}/></div>
    {over>0?<p className="mt-2 text-sm text-red-300">You're {over.toLocaleString()} minutes over your plan. Calls keep being answered. {showLink&&<Link href="/billing" className="underline">Change your plan</Link>}</p>
      :pct>=80?<p className="mt-2 text-sm text-amber-300">You've used {pct}% of this period's minutes. {showLink&&<Link href="/billing" className="underline">See plans</Link>}</p>:null}
  </section>);
}
