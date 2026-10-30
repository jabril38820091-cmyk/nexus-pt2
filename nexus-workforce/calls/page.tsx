'use client';
import {useEffect,useMemo,useState} from 'react';
import {AppShell} from '@/components/app-shell';
import {createClient} from '@/lib/supabase/client';
type Call={id:string;caller_number:string|null;duration_seconds:number|null;outcome:string|null;revenue_cents:number|null;recording_url:string|null;transcript_text:string|null;created_at:string};
export default function Calls(){
  const [calls,setCalls]=useState<Call[]|null>(null);const [q,setQ]=useState('');
  useEffect(()=>{createClient().from('calls').select('*').order('created_at',{ascending:false}).limit(200).then(({data})=>setCalls(data??[]))},[]);
  const shown=useMemo(()=>{const s=q.trim().toLowerCase();return(calls??[]).filter(c=>!s||[c.caller_number,c.outcome,c.transcript_text].some(v=>(v??'').toLowerCase().includes(s)))},[calls,q]);
  const total=shown.reduce((s,c)=>s+(c.revenue_cents??0),0);
  return(<AppShell>
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><h1 className="text-2xl font-semibold">Calls</h1><div className="text-emerald-400">Revenue captured: ${(total/100).toLocaleString()}</div></div>
    <input type="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by caller, outcome or what was said" aria-label="Search calls" className="mb-4 w-full max-w-md rounded border border-slate-600 bg-slate-950 p-2 text-sm"/>
    {calls===null&&<p className="text-slate-500">Loading…</p>}
    {calls&&calls.length===0&&<p className="text-sm text-slate-500">No calls yet. Once your Vapi webhook is set up, every call appears here.</p>}
    {calls&&calls.length>0&&shown.length===0&&<p className="text-sm text-slate-500">No calls match that search.</p>}
    {shown.length>0&&<div className="overflow-x-auto rounded-xl border border-slate-700"><table className="w-full text-left text-sm">
      <thead className="bg-slate-900 text-slate-400"><tr><th className="p-3">When</th><th className="p-3">Caller</th><th className="p-3">Length</th><th className="p-3">Outcome and conversation</th><th className="p-3">Revenue</th><th className="p-3"/></tr></thead>
      <tbody>{shown.map(c=>(<tr key={c.id} className="border-t border-slate-800 align-top">
        <td className="p-3">{new Date(c.created_at).toLocaleString()}</td><td className="p-3">{c.caller_number??'Unknown'}</td>
        <td className="p-3">{c.duration_seconds!=null?`${Math.round(c.duration_seconds)}s`:'—'}</td>
        <td className="max-w-md p-3 text-slate-300">{c.outcome??'—'}
          {c.transcript_text&&<details className="mt-1"><summary className="cursor-pointer text-xs text-slate-400">Read the conversation</summary>
            <div className="mt-2 space-y-1 rounded bg-slate-950/60 p-3 text-xs">{c.transcript_text.split('\n').map((l,i)=>{const caller=l.startsWith('Caller:');return<p key={i} className={caller?'text-slate-200':'text-emerald-300'}>{l}</p>})}</div></details>}</td>
        <td className="p-3">${((c.revenue_cents??0)/100).toLocaleString()}</td><td className="p-3">{c.recording_url&&<a className="underline" href={c.recording_url} target="_blank" rel="noreferrer">Recording</a>}</td></tr>))}</tbody></table></div>}
  </AppShell>);
}
