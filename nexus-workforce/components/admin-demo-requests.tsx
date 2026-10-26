'use client';
import {useEffect,useState} from 'react';
type R={id:string;created_at:string;name:string;business:string;email:string;phone:string|null;business_type:string;message:string|null;source:string|null;status:string};
export function AdminDemoRequests(){
  const [rows,setRows]=useState<R[]|null>(null);const [statuses,setStatuses]=useState<string[]>([]);
  useEffect(()=>{fetch('/api/admin/demo-requests').then(r=>r.json()).then(j=>{setRows(j.requests??[]);setStatuses(j.statuses??[])}).catch(()=>setRows([]))},[]);
  async function setStatus(id:string,status:string){
    setRows(rs=>(rs??[]).map(r=>r.id===id?{...r,status}:r));
    await fetch('/api/admin/demo-requests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status})});
  }
  if(rows===null)return<p className="text-sm text-slate-500">Loading…</p>;
  if(!rows.length)return<p className="text-sm text-slate-500">No demo requests yet. Share your site's /demo page in your posts.</p>;
  const fresh=rows.filter(r=>r.status==='new').length;
  return(<div><p className="mb-3 text-sm text-slate-400">{rows.length} total, {fresh} new.</p>
    <ul className="space-y-3">{rows.map(r=>(<li key={r.id} className="rounded-lg border border-slate-700 p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2"><div><b>{r.business}</b> · {r.name} · {r.business_type}</div>
        <select aria-label={`Status for ${r.business}`} value={r.status} onChange={e=>setStatus(r.id,e.target.value)} className="rounded border border-slate-600 bg-slate-950 p-1 text-xs">{statuses.map(s=><option key={s}>{s}</option>)}</select></div>
      <div className="mt-1 text-slate-300"><a className="underline" href={`mailto:${r.email}`}>{r.email}</a>{r.phone?` · ${r.phone}`:''} · {new Date(r.created_at).toLocaleString()}</div>
      {r.message&&<p className="mt-1 text-slate-400">{r.message}</p>}
      {r.source&&<p className="mt-1 text-xs text-slate-500">Came from: {r.source}</p>}</li>))}</ul></div>);
}
