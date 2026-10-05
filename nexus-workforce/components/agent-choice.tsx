'use client';
import {DEPARTMENTS,ROSTER,type DepartmentId} from '@/lib/agents/roster';
export type Choice={mode:'receptionist'|'single'|'full';chosen:string};
const OPTIONS:[Choice['mode'],string,string][]=[
  ['receptionist','Receptionist only','One agent that answers your calls and takes messages. The simplest way to start.'],
  ['single','One agent of my choice','Pick a single specialist, such as a lead qualifier or billing agent.'],
  ['full','The full team','All 20 agents across 6 departments, with handoffs between them.']];
export function AgentChoice({value,onChange}:{value:Choice;onChange:(c:Choice)=>void}){
  return(<fieldset className="space-y-2"><legend className="mb-2 text-sm text-slate-300">Which agents do you want?</legend>
    {OPTIONS.map(([m,t,d])=>(<label key={m} className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${value.mode===m?'border-emerald-500 bg-emerald-950/40':'border-slate-700'}`}>
      <input type="radio" name="agent-mode" checked={value.mode===m} onChange={()=>onChange({...value,mode:m})} className="mt-1 accent-emerald-500"/>
      <span><span className="block font-medium">{t}</span><span className="block text-sm text-slate-400">{d}</span></span></label>))}
    {value.mode==='single'&&<label className="block text-sm">Choose the agent
      <select value={value.chosen} onChange={e=>onChange({...value,chosen:e.target.value})} className="mt-1 w-full rounded border border-slate-600 bg-slate-950 p-2">
        {(Object.keys(DEPARTMENTS) as DepartmentId[]).filter(d=>d!=='lobby').map(d=>(<optgroup key={d} label={DEPARTMENTS[d].label}>{ROSTER.filter(a=>a.department===d).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</optgroup>))}
      </select></label>}
  </fieldset>);
}
