'use client';
import {useCallback,useEffect,useState} from 'react';
import {AppShell} from '@/components/app-shell';
import {createClient} from '@/lib/supabase/client';
import {DEPARTMENTS,ROSTER,type DepartmentId} from '@/lib/agents/roster';
type Task={id:string;agent_slug:string;title:string;status:string;result:string|null;created_at:string};
const box='mt-1 w-full rounded border border-slate-600 bg-slate-950 p-2 text-sm';
const badge:Record<string,string>={done:'bg-emerald-900 text-emerald-300',failed:'bg-red-900 text-red-300',running:'bg-amber-900 text-amber-300',queued:'bg-slate-700 text-slate-300'};
export default function Tasks(){
  const [tasks,setTasks]=useState<Task[]>([]);
  const [agent,setAgent]=useState(ROSTER[1].id);const [title,setTitle]=useState('');const [ins,setIns]=useState('');
  const [busy,setBusy]=useState(false);const [err,setErr]=useState('');
  const load=useCallback(async()=>{const {data}=await createClient().from('tasks').select('*').order('created_at',{ascending:false}).limit(50);setTasks(data??[])},[]);
  useEffect(()=>{load()},[load]);
  async function go(e:React.FormEvent){
    e.preventDefault();setBusy(true);setErr('');
    try{
      const r=await fetch('/api/tasks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({agentSlug:agent,title,instructions:ins})});
      const j=await r.json();if(!r.ok)throw new Error(j.detail??j.error??'Task failed');
      setTitle('');setIns('');
    }catch(e2){setErr(e2 instanceof Error?e2.message:String(e2))}
    setBusy(false);load();
  }
  const name=(s:string)=>ROSTER.find(a=>a.id===s)?.name??s;
  return(<AppShell>
    <h1 className="mb-4 text-2xl font-semibold">Tasks</h1>
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form onSubmit={go} className="h-fit space-y-3 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
        <label className="block text-sm">Assign to<select value={agent} onChange={e=>setAgent(e.target.value)} className={box}>
          {(Object.keys(DEPARTMENTS) as DepartmentId[]).map(d=>(<optgroup key={d} label={DEPARTMENTS[d].label}>{ROSTER.filter(a=>a.department===d).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</optgroup>))}
        </select></label>
        <label className="block text-sm">Task<input required value={title} onChange={e=>setTitle(e.target.value)} className={box}/></label>
        <label className="block text-sm">Instructions<textarea rows={5} value={ins} onChange={e=>setIns(e.target.value)} className={box}/></label>
        <button disabled={busy} className="w-full rounded bg-emerald-600 py-2 font-medium disabled:opacity-50">{busy?'Agent is working…':'Assign task'}</button>
        {err&&<p role="alert" className="text-sm text-amber-400">{err}</p>}
      </form>
      <div className="space-y-3">
        {tasks.length===0&&<p className="text-sm text-slate-500">No tasks yet. Assign one and the agent's answer shows up here.</p>}
        {tasks.map(t=>(<article key={t.id} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between gap-2"><h2 className="font-medium">{t.title}</h2><span className={`rounded-full px-2 py-0.5 text-xs ${badge[t.status]??badge.queued}`}>{t.status}</span></div>
          <p className="text-xs text-slate-500">{name(t.agent_slug)} · {new Date(t.created_at).toLocaleString()}</p>
          {t.result&&<p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{t.result}</p>}
        </article>))}
      </div>
    </div>
  </AppShell>);
}
