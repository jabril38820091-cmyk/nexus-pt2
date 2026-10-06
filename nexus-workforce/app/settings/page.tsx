'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {AppShell} from '@/components/app-shell';
import {AgentChoice,type Choice} from '@/components/agent-choice';
import {ConnectSquad} from '@/components/connect-squad';
import {BusinessProfile,type Profile} from '@/components/settings/business-profile';
import {Notifications} from '@/components/settings/notifications';
import {AgentJobs} from '@/components/settings/agent-jobs';
import {AccountSecurity} from '@/components/settings/account-security';
import {DataPrivacy} from '@/components/settings/data-privacy';
import {useCompany} from '@/lib/use-company';
import {createClient} from '@/lib/supabase/client';
type Full=Profile&{agent_mode:string|null;chosen_agent:string|null;plan:string|null;subscription_status:string|null;notify_drafts:boolean|null;goals:string[]|null;agent_instructions:string|null;track_revenue:boolean|null};
const SECTIONS:[string,string][]=[['profile','Business profile'],['jobs','What your agents do'],['notifications','Notifications'],['agents','Your agents'],['plan','Plan and billing'],['account','Account and security'],['data','Data and privacy'],['advanced','Advanced']];
const card='scroll-mt-6 rounded-xl border border-slate-700 bg-slate-900/60 p-5';
export default function Settings(){
  const {company,isAdmin}=useCompany();
  const [full,setFull]=useState<Full|null>(null);
  const [choice,setChoice]=useState<Choice>({mode:'full',chosen:'lead-qualifier'});
  const [saved,setSaved]=useState('');
  const [info,setInfo]=useState<{squad:string|null;phone:string|null;status:string;agents:number}|null|undefined>(undefined);
  const [url,setUrl]=useState('');
  useEffect(()=>{
    setUrl(location.origin+'/api/webhooks/vapi');
    const sb=createClient();
    sb.from('companies').select('id,name,industry,website,timezone,business_hours,agent_mode,chosen_agent,plan,subscription_status,notify_drafts,goals,agent_instructions,track_revenue').limit(1).maybeSingle().then(({data})=>{
      if(data){setFull(data as Full);setChoice({mode:(data.agent_mode as Choice['mode'])??'full',chosen:data.chosen_agent??'lead-qualifier'})}});
    sb.from('squads').select('id,vapi_squad_id,phone_number,status').order('created_at',{ascending:false}).limit(1).maybeSingle().then(async({data})=>{
      if(!data)return setInfo(null);
      const {count}=await sb.from('agents').select('id',{count:'exact',head:true}).eq('squad_id',data.id);
      setInfo({squad:data.vapi_squad_id,phone:data.phone_number,status:data.status,agents:count??0});
    });
  },[]);
  async function saveAgents(){
    if(!full)return;setSaved('Saving…');
    const {error}=await createClient().from('companies').update({agent_mode:choice.mode,chosen_agent:choice.mode==='single'?choice.chosen:null}).eq('id',full.id);
    setSaved(error?error.message:'Saved. Your office now shows these agents.');
  }
  const row=(k:string,v:string)=>(<div key={k} className="flex justify-between gap-4 border-b border-slate-800 py-2 text-sm"><span className="text-slate-400">{k}</span><span className="break-all text-right">{v}</span></div>);
  return(<AppShell>
    <h1 className="mb-4 text-2xl font-semibold">Settings</h1>
    <nav className="mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden" aria-label="Settings sections">{SECTIONS.map(([id,l])=>(<a key={id} href={`#${id}`} className="shrink-0 rounded-full border border-slate-600 px-3 py-1 text-sm text-slate-300">{l}</a>))}</nav>
    <div className="grid gap-8 lg:grid-cols-[190px_1fr]">
      <nav className="sticky top-6 hidden self-start lg:block" aria-label="Settings sections"><ul className="space-y-1 text-sm">{SECTIONS.map(([id,l])=>(<li key={id}><a href={`#${id}`} className="block rounded px-3 py-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">{l}</a></li>))}</ul></nav>
      <div className="max-w-3xl space-y-6">
        <section id="profile" className={card}><h2 className="mb-3 font-medium">Business profile</h2>{full?<BusinessProfile company={full}/>:<p className="text-sm text-slate-500">Loading…</p>}</section>
        <section id="jobs" className={card}><h2 className="mb-3 font-medium">What your agents do</h2>{full?<AgentJobs company={full}/>:<p className="text-sm text-slate-500">Loading…</p>}</section>
        <section id="notifications" className={card}><h2 className="mb-3 font-medium">Notifications</h2>{full?<Notifications companyId={full.id} initial={full.notify_drafts!==false}/>:<p className="text-sm text-slate-500">Loading…</p>}</section>
        <section id="agents" className={card}><h2 className="mb-3 font-medium">Your agents</h2>
          <AgentChoice value={choice} onChange={setChoice}/>
          <button onClick={saveAgents} className="mt-3 rounded bg-emerald-600 px-4 py-2 text-sm font-medium">Save</button>
          {saved&&<p className="mt-2 text-sm text-slate-300">{saved}</p>}</section>
        <section id="plan" className={card}><h2 className="mb-3 font-medium">Plan and billing</h2>
          {row('Plan',full?.subscription_status==='active'?(full.plan??'Active'):'None')}{row('Status',full?.subscription_status??'inactive')}
          <Link href="/billing" className="mt-3 inline-block rounded border border-slate-600 px-4 py-2 text-sm">Manage plan and billing</Link></section>
        <section id="account" className={card}><h2 className="mb-3 font-medium">Account and security</h2><AccountSecurity/></section>
        <section id="data" className={card}><h2 className="mb-3 font-medium">Data and privacy</h2><DataPrivacy isAdmin={isAdmin}/></section>
        <section id="advanced" className={card}><h2 className="mb-1 font-medium">Advanced</h2>
          <h3 className="mb-1 mt-3 text-sm font-medium">Your Vapi squad</h3>
          <p className="mb-3 text-sm text-slate-400">Optional. Only needed if you already built a squad in Vapi and want it linked to this office.</p>
          {info===undefined&&<p className="text-sm text-slate-500">Loading…</p>}
          {info&&<div className="mb-3">{row('Squad ID',info.squad??'Set up automatically')}{row('Phone number',info.phone??'Not assigned')}{row('Status',info.status)}{row('Agents linked',String(info.agents))}</div>}
          {info===null&&company&&<ConnectSquad companyId={company.id}/>}
          <h3 className="mb-1 mt-5 text-sm font-medium">Vapi webhook</h3>
          <p className="mb-2 text-sm text-slate-400">If you connect your own squad, set its Server URL in Vapi to this address and add the header <code>x-vapi-secret</code>. Turn on the server messages status-update, assistant.started, transcript and end-of-call-report.</p>
          <code className="block break-all rounded bg-slate-950 p-3 text-sm">{url}</code>
          <h3 className="mb-1 mt-5 text-sm font-medium">Voice calls in the browser</h3>
          <p className="text-sm text-slate-400">Needs <code>NEXT_PUBLIC_VAPI_PUBLIC_KEY</code> in Vercel (Config type). Status: {process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY?'set':'not set'}.</p>
          <p className="mt-4 text-sm text-slate-400">Looking for webhooks, API keys or custom connections? They're on the <Link href="/integrations" className="underline">Integrations</Link> page.</p></section>
      </div>
    </div>
  </AppShell>);
}
