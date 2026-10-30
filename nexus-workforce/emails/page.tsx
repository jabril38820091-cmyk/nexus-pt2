'use client';
import {useEffect,useState} from 'react';
import {AppShell} from '@/components/app-shell';
import {createClient} from '@/lib/supabase/client';
type Row={id:string;to_email:string;subject:string;body:string;status:string;error:string|null;created_at:string};
export default function Emails(){
  const [rows,setRows]=useState<Row[]|null>(null);
  useEffect(()=>{createClient().from('email_log').select('*').order('created_at',{ascending:false}).limit(100).then(({data})=>setRows(data??[]))},[]);
  return(<AppShell>
    <h1 className="mb-1 text-2xl font-semibold">Emails</h1>
    <p className="mb-4 text-sm text-slate-400">Every email your agents send during calls, so you can review what customers received.</p>
    {rows===null&&<p className="text-slate-500">Loading…</p>}
    {rows&&rows.length===0&&<p className="text-sm text-slate-500">No emails yet. Once an agent has the send_email tool and uses it on a call, it appears here.</p>}
    <div className="space-y-3">{rows?.map(r=>(<details key={r.id} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
        <span><b>{r.subject}</b><span className="ml-2 text-sm text-slate-400">to {r.to_email}</span></span>
        <span className="text-xs text-slate-500"><span className={`mr-2 rounded-full px-2 py-0.5 ${r.status==='sent'?'bg-emerald-900 text-emerald-300':'bg-red-900 text-red-300'}`}>{r.status}</span>{new Date(r.created_at).toLocaleString()}</span></summary>
      <p className="mt-3 whitespace-pre-wrap text-sm text-slate-300">{r.body}</p>
      {r.error&&<p className="mt-2 text-sm text-amber-400">{r.error}</p>}
    </details>))}</div>
  </AppShell>);
}
