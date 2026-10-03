'use client';
import {useEffect,useState} from 'react';
import {OfficeView} from '@/components/office/office-view';import {runScenario} from '@/lib/agents/demo';import {INDUSTRIES} from '@/lib/industries';
import {useCallRealtime} from '@/lib/agents/realtime';import {createClient} from '@/lib/supabase/client';
export default function OfficePage(){
 const [companyId,setCompanyId]=useState<string|null>(null);const [industry,setIndustry]=useState(INDUSTRIES[0]);
 useEffect(()=>{createClient().from('companies').select('id,industry').limit(1).maybeSingle().then(({data})=>{
  if(data){setCompanyId(data.id);setIndustry(INDUSTRIES.find(i=>i.id===data.industry)??INDUSTRIES[0])}})},[]);
 useCallRealtime(companyId);
 return(<div className="min-h-screen"><div className="mx-auto flex max-w-[1400px] gap-2 px-6 pt-6">
  {industry.scenarios.map(s=><button key={s.label} className="rounded border border-slate-600 px-3 py-1" onClick={()=>runScenario(s)}>▶ {s.label}</button>)}</div><OfficeView/></div>);}
