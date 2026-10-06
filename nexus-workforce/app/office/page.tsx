'use client';
import {useState} from 'react';
import {AppShell} from '@/components/app-shell';
import {AgentPanel} from '@/components/agent-panel';
import {OfficeView} from '@/components/office/office-view';
import {runScenario} from '@/lib/agents/demo';
import {DEMO_SCENARIOS} from '@/lib/industries';
import {useCallRealtime} from '@/lib/agents/realtime';
import {useCompany} from '@/lib/use-company';
import {allowedAgents} from '@/lib/agents/access';
import type {AgentRoster} from '@/lib/agents/roster';
export default function OfficePage(){
  const {company}=useCompany();
  const [sel,setSel]=useState<AgentRoster|null>(null);
  const allowed=allowedAgents(company?.agent_mode,company?.chosen_agent);
  useCallRealtime(company?.id??null);
  return(<AppShell>
    <p className="mb-3 text-sm text-slate-400">Click an agent to chat, talk by voice, or give them a task. Agents marked 🔒 aren't in your current setup.</p>
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <span className="text-sm text-slate-500">Demo:</span>
      {DEMO_SCENARIOS.map(s=><button key={s.label} className="rounded border border-slate-600 px-3 py-1 text-sm" onClick={()=>runScenario(s)}>▶ {s.label}</button>)}
    </div>
    <OfficeView onSelect={setSel} allowed={allowed} showRevenue={company?.track_revenue!==false}/>
    {sel&&<AgentPanel agent={sel} locked={!allowed.has(sel.id)} onClose={()=>setSel(null)}/>}
  </AppShell>);
}
