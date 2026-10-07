'use client';
import {useState} from 'react';
import {createClient} from '@/lib/supabase/client';
import {GoalsPicker} from '@/components/goals-picker';
import {DEFAULT_GOALS} from '@/lib/goals';
export type Jobs={id:string;goals:string[]|null;agent_instructions:string|null;track_revenue:boolean|null};
export function AgentJobs({company}:{company:Jobs}){
  const [goals,setGoals]=useState<string[]>(company.goals?.length?company.goals:DEFAULT_GOALS);
  const [text,setText]=useState(company.agent_instructions??'');
  const [track,setTrack]=useState(company.track_revenue!==false);
  const [msg,setMsg]=useState('');const [block,setBlock]=useState('');const [busy,setBusy]=useState(false);
  async function save(apply:boolean){
    setBusy(true);setMsg('');setBlock('');
    const {error}=await createClient().from('companies').update({goals,agent_instructions:text.trim()||null,track_revenue:track}).eq('id',company.id);
    if(error){setBusy(false);return setMsg(error.message)}
    if(!apply){setBusy(false);return setMsg('Saved. New agents you activate will follow this. Use "Save and update my agents" to change agents you already have.')}
    const r=await fetch('/api/agents/sync',{method:'POST'});const j=await r.json();setBusy(false);
    if(r.status===409){setBlock(j.block??'');return setMsg(j.detail)}
    if(!r.ok)return setMsg(j.detail??j.error??'Could not update your agents.');
    setMsg(`Updated ${j.updated} agent${j.updated===1?'':'s'}.${j.failed?` ${j.failed} could not be updated: ${(j.errors??[]).join(' | ')}`:''}`);
  }
  return(<div className="space-y-5">
    <GoalsPicker value={goals} onChange={setGoals}/>
    <label className="block text-sm">Teach your agents about your business
      <span className="mb-1 block text-xs text-slate-400">Prices, policies, common questions, who to send certain calls to, anything they should or should never say.</span>
      <textarea rows={8} maxLength={4000} value={text} onChange={e=>setText(e.target.value)} placeholder={'Examples:\n- We are closed on public holidays.\n- Never promise a delivery date. Say someone will confirm.\n- Refunds are available within 30 days.'} className="mt-1 w-full rounded border border-slate-600 bg-slate-950 p-2 text-sm"/>
      <span className="text-xs text-slate-500">{text.length}/4000</span></label>
    <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={track} onChange={e=>setTrack(e.target.checked)} className="mt-1 accent-emerald-500"/>
      <span>Track revenue<span className="block text-xs text-slate-400">Show money figures on your Home page and office. Turn this off if your agents aren't about sales.</span></span></label>
    <div className="flex flex-wrap gap-2"><button disabled={busy} onClick={()=>save(false)} className="rounded border border-slate-600 px-4 py-2 text-sm disabled:opacity-50">Save</button>
      <button disabled={busy} onClick={()=>save(true)} className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium disabled:opacity-50">{busy?'Working…':'Save and update my agents'}</button></div>
    {msg&&<p role="status" className="text-sm text-slate-300">{msg}</p>}
    {block&&<pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded bg-slate-950 p-3 text-xs">{block}</pre>}
  </div>);
}
