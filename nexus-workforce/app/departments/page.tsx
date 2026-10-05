'use client';
import {useState} from 'react';
import {AppShell} from '@/components/app-shell';
import {AgentPanel} from '@/components/agent-panel';
import {useCompany} from '@/lib/use-company';
import {allowedAgents} from '@/lib/agents/access';
import {DEPARTMENTS,ROSTER,type AgentRoster,type DepartmentId} from '@/lib/agents/roster';
export default function Departments(){
  const [sel,setSel]=useState<AgentRoster|null>(null);
  const {company}=useCompany();const allowed=allowedAgents(company?.agent_mode,company?.chosen_agent);
  return(<AppShell>
    <h1 className="text-2xl font-semibold">Departments</h1>
    <p className="mb-6 text-sm text-slate-400">Pick a department, then an agent, to chat, call, or assign work.</p>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {(Object.keys(DEPARTMENTS) as DepartmentId[]).map(d=>(<section key={d} className="rounded-xl border bg-slate-900/60 p-4" style={{borderColor:DEPARTMENTS[d].color+'55'}}>
        <h2 className="mb-3 font-medium">{DEPARTMENTS[d].icon} {DEPARTMENTS[d].label}</h2>
        <ul className="space-y-2">{ROSTER.filter(a=>a.department===d).map(a=>(<li key={a.id}>
          <button onClick={()=>setSel(a)} className="flex w-full items-center justify-between rounded border border-slate-700 px-3 py-2 text-left text-sm hover:bg-slate-800">
            <span>{allowed.has(a.id)?'':'🔒 '}{a.name}<span className="block text-xs text-slate-500">{a.role}</span></span><span className={`text-xs ${allowed.has(a.id)?'text-emerald-400':'text-slate-500'}`}>{allowed.has(a.id)?'Open':'Locked'}</span>
          </button></li>))}</ul>
      </section>))}
    </div>
    {sel&&<AgentPanel agent={sel} locked={!allowed.has(sel.id)} onClose={()=>setSel(null)}/>}
  </AppShell>);
}
