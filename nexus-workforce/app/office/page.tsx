'use client';
import {useEffect,useState} from 'react';
import {AppShell} from '@/components/app-shell';
import {AgentPanel} from '@/components/agent-panel';
import {OfficeView} from '@/components/office/office-view';
import {runScenario} from '@/lib/agents/demo';
import {INDUSTRIES} from '@/lib/industries';
import {useCallRealtime} from '@/lib/agents/realtime';
import {createClient} from '@/lib/supabase/client';
import type {AgentRoster} from '@/lib/agents/roster';
export default function OfficePage(){
  const [companyId,setCompanyId]=useState<string|null>(null);
  const [industry,setIndustry]=useState(INDUSTRIES[0]);
  const [sel,setSel]=useState<AgentRoster|null>(null);
  useEffect(()=>{createClient().from('companies').select('id,industry').limit(1).maybeSingle().then(({data})=>{
    if(data){setCompanyId(data.id);setIndustry(INDUSTRIES.find(i=>i.id===data.industry)??INDUSTRIES[0])}})},[]);
  useCallRealtime(companyId);
  return(<AppShell>
    <p className="mb-3 text-sm text-slate-400">Click any agent to chat, talk by voice, or give them a task. Live phone calls light up their desks automatically.</p>
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <span className="text-sm text-slate-500">Demo:</span>
      {industry.scenarios.map(s=><button key={s.label} className="rounded border border-slate-600 px-3 py-1 text-sm" onClick={()=>runScenario(s)}>▶ {s.label}</button>)}
    </div>
    <OfficeView onSelect={setSel}/>
    {sel&&<AgentPanel agent={sel} onClose={()=>setSel(null)}/>}
  </AppShell>);
}
