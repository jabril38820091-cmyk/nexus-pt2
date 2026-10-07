'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {createClient} from '@/lib/supabase/client';
export function DataPrivacy({isAdmin}:{isAdmin:boolean}){
  const router=useRouter();const [msg,setMsg]=useState('');const [confirm,setConfirm]=useState('');const [busy,setBusy]=useState(false);
  async function exportData(){
    setMsg('Preparing your export…');const sb=createClient();
    const [co,calls,tasks,emails,pb,hooks,conns]=await Promise.all([
      sb.from('companies').select('name,industry,website,timezone,business_hours,plan,subscription_status,agent_mode,chosen_agent,created_at').limit(1).maybeSingle(),
      sb.from('calls').select('caller_number,duration_seconds,outcome,revenue_cents,created_at'),
      sb.from('tasks').select('agent_slug,title,instructions,status,result,created_at'),
      sb.from('email_log').select('to_email,subject,body,status,created_at'),
      sb.from('playbooks').select('key,enabled'),
      sb.from('webhooks').select('url,events,active,created_at'),
      sb.from('connections').select('name,description,url,method,created_at')]);
    const data={exported_at:new Date().toISOString(),business:co.data,calls:calls.data,tasks:tasks.data,emails:emails.data,autopilot:pb.data,webhooks:hooks.data,connections:conns.data};
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='my-nexus-data.json';a.click();URL.revokeObjectURL(url);
    setMsg('Downloaded. Secrets such as webhook signing keys and API keys are not included.');
  }
  async function deleteAccount(){
    setBusy(true);setMsg('');
    const r=await fetch('/api/account/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({confirm})});
    const j=await r.json();
    if(!r.ok){setBusy(false);return setMsg(j.detail??j.error??'Could not delete the account.')}
    await createClient().auth.signOut();router.push('/');
  }
  return(<div className="space-y-6">
    <div><h3 className="mb-1 text-sm font-medium">Export your data</h3><p className="mb-2 text-xs text-slate-400">A JSON file with your business details, calls, tasks, emails and settings.</p>
      <button onClick={exportData} className="rounded border border-slate-600 px-4 py-2 text-sm">Download my data</button></div>
    <div className="rounded-xl border border-red-900/70 p-4"><h3 className="mb-1 text-sm font-medium text-red-300">Delete my account</h3>
      <p className="mb-3 text-xs text-slate-400">This permanently deletes your business, calls, tasks and settings, cancels your subscription, and removes the agents we set up for you. It cannot be undone.</p>
      {isAdmin?<p className="text-xs text-amber-400">Admin accounts can't be deleted here.</p>:<div className="flex flex-wrap items-end gap-2">
        <label className="text-sm">Type DELETE to confirm<input value={confirm} onChange={e=>setConfirm(e.target.value)} className="mt-1 block w-48 rounded border border-slate-600 bg-slate-950 p-2 text-sm"/></label>
        <button disabled={confirm!=='DELETE'||busy} onClick={deleteAccount} className="rounded bg-red-700 px-4 py-2 text-sm font-medium disabled:opacity-40">{busy?'Deleting…':'Delete everything'}</button></div>}</div>
    {msg&&<p role="status" className="text-sm text-slate-300">{msg}</p>}
  </div>);
}
