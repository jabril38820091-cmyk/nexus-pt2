'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {OfficeView} from '@/components/office/office-view';
import {runScenario} from '@/lib/agents/demo';
import {DEMO_SCENARIOS} from '@/lib/industries';
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
const FOLLOWUPS=[
  'Hi! Thanks for calling today. Here is a quick recap of what we discussed and the next step. Reply here if you have any questions.',
  'Thanks for staying with us. I have noted your request and someone will confirm the details shortly.',
  'Hello, this is a friendly reminder about your invoice. Here is a secure link to pay. Let us know if you need anything.'];
export function LandingDemo(){
  const [i,setI]=useState(0);const [playing,setPlaying]=useState(false);const [nudge,setNudge]=useState(false);
  const running=useRef(false);const visible=useRef(false);const auto=useRef(true);const wrap=useRef<HTMLDivElement>(null);
  async function play(k:number){if(running.current)return;running.current=true;setI(k);setPlaying(true);await runScenario(DEMO_SCENARIOS[k]);setPlaying(false);running.current=false}
  useEffect(()=>{
    let stop=false;
    const io=new IntersectionObserver(e=>{visible.current=e[0].isIntersecting},{threshold:0.15});
    if(wrap.current)io.observe(wrap.current);
    (async()=>{let k=0;while(!stop){await sleep(1500);if(stop)break;if(visible.current&&auto.current&&!running.current){await play(k%DEMO_SCENARIOS.length);k++;await sleep(4500)}}})();
    return()=>{stop=true;io.disconnect()};
  },[]);// eslint-disable-line react-hooks/exhaustive-deps
  const s=DEMO_SCENARIOS[i];
  return(<div ref={wrap}>
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-sm text-slate-400">Watch a sample call:</span>
      {DEMO_SCENARIOS.map((x,k)=>(<button key={x.label} onClick={()=>{auto.current=false;play(k)}} aria-pressed={i===k} className={`rounded-full border px-3 py-1 text-sm ${i===k?'border-emerald-500 bg-emerald-950 text-emerald-300':'border-slate-600 text-slate-300'}`}>▶ {x.label}</button>))}
    </div>
    <OfficeView onSelect={()=>setNudge(true)}/>
    {nudge&&<p className="mt-3 rounded-xl border border-emerald-700/50 bg-emerald-950/40 p-3 text-sm text-emerald-200">This is a sample office. <Link href="/signup" className="underline">Sign up</Link> to chat with, call, and assign work to your own agents.</p>}
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4"><div className="mb-1 text-xs text-slate-500">What just happened (sample call)</div>
        <ol className="space-y-1 text-sm text-slate-300">{s.steps.map((st,k)=>(<li key={k}><b className="text-slate-100">{st.agentId.replace(/-/g,' ')}:</b> {st.line}</li>))}</ol>
        <p className="mt-2 text-sm text-emerald-400">{playing?'Call in progress…':`Result: ${s.outcome}, +$${(s.revenueCents/100).toLocaleString()}`}</p></div>
      <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4"><div className="mb-1 text-xs text-slate-500">Draft follow-up waiting for your approval (sample)</div>
        <p className="text-sm text-slate-300">{FOLLOWUPS[i]}</p><div className="mt-3 flex gap-2"><span className="rounded bg-emerald-700 px-3 py-1 text-sm">Approve</span><span className="rounded border border-slate-600 px-3 py-1 text-sm text-slate-400">Dismiss</span></div></div>
    </div>
    <p className="mt-3 text-xs text-slate-500">Everything above is a scripted example with made-up numbers. It shows how the product works, not results from a real business.</p>
  </div>);
}
