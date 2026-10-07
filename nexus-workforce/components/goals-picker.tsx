'use client';
import {GOALS} from '@/lib/goals';
export function GoalsPicker({value,onChange}:{value:string[];onChange:(v:string[])=>void}){
  const toggle=(id:string)=>onChange(value.includes(id)?value.filter(x=>x!==id):[...value,id]);
  return(<fieldset><legend className="mb-2 text-sm text-slate-300">What do you want your agents to do? Pick as many as you like.</legend>
    <div className="grid gap-2 sm:grid-cols-2">{GOALS.map(g=>(<label key={g.id} className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${value.includes(g.id)?'border-emerald-500 bg-emerald-950/30':'border-slate-700'}`}>
      <input type="checkbox" checked={value.includes(g.id)} onChange={()=>toggle(g.id)} className="mt-1 accent-emerald-500"/>
      <span><span className="block text-sm font-medium">{g.label}</span><span className="block text-xs text-slate-400">{g.desc}</span></span></label>))}</div></fieldset>);
}
