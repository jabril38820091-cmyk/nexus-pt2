'use client';
import {useEffect,useState} from 'react';
import {AppShell} from '@/components/app-shell';
import {createClient} from '@/lib/supabase/client';
type Call={id:string;caller_number:string|null;duration_seconds:number|null;outcome:string|null;revenue_cents:number|null;recording_url:string|null;created_at:string};
export default function Calls(){
  const [calls,setCalls]=useState<Call[]|null>(null);
  useEffect(()=>{createClient().from('calls').select('*').order('created_at',{ascending:false}).limit(100).then(({data})=>setCalls(data??[]))},[]);
  const total=(calls??[]).reduce((s,c)=>s+(c.revenue_cents??0),0);
  return(<AppShell>
    <div className="mb-4 flex items-end justify-between"><h1 className="text-2xl font-semibold">Calls</h1><div className="text-emerald-400">Revenue captured: ${(total/100).toLocaleString()}</div></div>
    {calls===null&&<p className="text-slate-500">Loading…</p>}
    {calls&&calls.length===0&&<p className="text-sm text-slate-500">No calls yet. Once your Vapi webhook is set up, every call appears here.</p>}
    {calls&&calls.length>0&&<div className="overflow-x-auto rounded-xl border border-slate-700"><table className="w-full text-left text-sm">
      <thead className="bg-slate-900 text-slate-400"><tr><th className="p-3">When</th><th className="p-3">Caller</th><th className="p-3">Length</th><th className="p-3">Outcome</th><th className="p-3">Revenue</th><th className="p-3"/></tr></thead>
      <tbody>{calls.map(c=>(<tr key={c.id} className="border-t border-slate-800">
        <td className="p-3">{new Date(c.created_at).toLocaleString()}</td><td className="p-3">{c.caller_number??'Unknown'}</td>
        <td className="p-3">{c.duration_seconds!=null?`${Math.round(c.duration_seconds)}s`:'—'}</td><td className="max-w-xs p-3 text-slate-300">{c.outcome??'—'}</td>
        <td className="p-3">${((c.revenue_cents??0)/100).toLocaleString()}</td><td className="p-3">{c.recording_url&&<a className="underline" href={c.recording_url} target="_blank" rel="noreferrer">Recording</a>}</td></tr>))}</tbody></table></div>}
  </AppShell>);
}
