'use client';
import {useEffect,useState} from 'react';
import {AppShell} from '@/components/app-shell';
import {AgentChoice,type Choice} from '@/components/agent-choice';
import {ConnectSquad} from '@/components/connect-squad';
import {useCompany} from '@/lib/use-company';
import {createClient} from '@/lib/supabase/client';
export default function Settings(){
  const {company}=useCompany();
  const [choice,setChoice]=useState<Choice>({mode:'full',chosen:'lead-qualifier'});
  const [saved,setSaved]=useState('');
  const [info,setInfo]=useState<{squad:string;phone:string;status:string;agents:number}|null|undefined>(undefined);
  const [url,setUrl]=useState('');
  useEffect(()=>{if(company)setChoice({mode:(company.agent_mode as Choice['mode'])??'full',chosen:company.chosen_agent??'lead-qualifier'})},[company]);
  useEffect(()=>{
    setUrl(location.origin+'/api/webhooks/vapi');
    const sb=createClient();
    sb.from('squads').select('id,vapi_squad_id,vapi_phone_number_id,status').order('created_at',{ascending:false}).limit(1).maybeSingle().then(async({data})=>{
      if(!data)return setInfo(null);
      const {count}=await sb.from('agents').select('id',{count:'exact',head:true}).eq('squad_id',data.id);
      setInfo({squad:data.vapi_squad_id,phone:data.vapi_phone_number_id,status:data.status,agents:count??0});
    });
  },[]);
  async function save(){
    if(!company)return;setSaved('Saving…');
    const {error}=await createClient().from('companies').update({agent_mode:choice.mode,chosen_agent:choice.mode==='single'?choice.chosen:null}).eq('id',company.id);
    setSaved(error?error.message:'Saved. Your office now shows these agents.');
  }
  const row=(k:string,v:string)=>(<div className="flex justify-between gap-4 border-b border-slate-800 py-2 text-sm"><span className="text-slate-400">{k}</span><span className="break-all text-right">{v}</span></div>);
  const card='rounded-xl border border-slate-700 bg-slate-900/60 p-4';
  return(<AppShell>
    <h1 className="mb-4 text-2xl font-semibold">Settings</h1>
    <div className="grid max-w-3xl gap-6">
      <section className={card}><h2 className="mb-3 font-medium">Your agents</h2>
        <AgentChoice value={choice} onChange={setChoice}/>
        <button onClick={save} className="mt-3 rounded bg-emerald-600 px-4 py-2 text-sm font-medium">Save</button>
        {saved&&<p className="mt-2 text-sm text-slate-300">{saved}</p>}
      </section>
      <section className={card}><h2 className="mb-1 font-medium">Advanced: connect your own Vapi squad</h2>
        <p className="mb-3 text-sm text-slate-400">Optional. Only needed if you already built a squad in Vapi and want it linked to this office.</p>
        {info===undefined&&<p className="text-sm text-slate-500">Loading…</p>}
        {info&&<div className="mb-3">{row('Squad ID',info.squad)}{row('Phone number ID',info.phone)}{row('Status',info.status)}{row('Agents linked',String(info.agents))}</div>}
        {info===null&&company&&<ConnectSquad companyId={company.id}/>}
      </section>
      <section className={card}><h2 className="mb-2 font-medium">Vapi webhook</h2>
        <p className="mb-2 text-sm text-slate-400">If you connect a squad, set its Server URL in Vapi to this address and add the header <code>x-vapi-secret</code>. Turn on the server messages status-update, assistant.started, transcript and end-of-call-report.</p>
        <code className="block break-all rounded bg-slate-950 p-3 text-sm">{url}</code></section>
      <section className={card}><h2 className="mb-2 font-medium">Voice calls in the browser</h2>
        <p className="text-sm text-slate-400">Talking to agents by voice needs <code>NEXT_PUBLIC_VAPI_PUBLIC_KEY</code> in Vercel (Config type). Status: {process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY?'set':'not set'}.</p></section>
    </div>
  </AppShell>);
}
