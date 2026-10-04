'use client';
import {useEffect,useState} from 'react';
import {AppShell} from '@/components/app-shell';
import {createClient} from '@/lib/supabase/client';
export default function Settings(){
  const [info,setInfo]=useState<{squad:string;phone:string;status:string;agents:number}|null|undefined>(undefined);
  const [url,setUrl]=useState('');
  useEffect(()=>{
    setUrl(location.origin+'/api/webhooks/vapi');
    const sb=createClient();
    sb.from('squads').select('id,vapi_squad_id,vapi_phone_number_id,status').order('created_at',{ascending:false}).limit(1).maybeSingle().then(async({data})=>{
      if(!data)return setInfo(null);
      const {count}=await sb.from('agents').select('id',{count:'exact',head:true}).eq('squad_id',data.id);
      setInfo({squad:data.vapi_squad_id,phone:data.vapi_phone_number_id,status:data.status,agents:count??0});
    });
  },[]);
  const row=(k:string,v:string)=>(<div className="flex justify-between gap-4 border-b border-slate-800 py-2 text-sm"><span className="text-slate-400">{k}</span><span className="break-all text-right">{v}</span></div>);
  return(<AppShell>
    <h1 className="mb-4 text-2xl font-semibold">Settings</h1>
    <div className="grid max-w-3xl gap-6">
      <section className="rounded-xl border border-slate-700 bg-slate-900/60 p-4"><h2 className="mb-2 font-medium">Connected Vapi squad</h2>
        {info===undefined&&<p className="text-sm text-slate-500">Loading…</p>}
        {info===null&&<p className="text-sm text-amber-400">No squad connected yet. Finish the connection on the onboarding page.</p>}
        {info&&<>{row('Squad ID',info.squad)}{row('Phone number ID',info.phone)}{row('Status',info.status)}{row('Agents linked',String(info.agents))}</>}
      </section>
      <section className="rounded-xl border border-slate-700 bg-slate-900/60 p-4"><h2 className="mb-2 font-medium">Vapi webhook</h2>
        <p className="mb-2 text-sm text-slate-400">In Vapi, set the Server URL to this address and add the header <code>x-vapi-secret</code>. Turn on the server messages status-update, assistant.started, transcript and end-of-call-report.</p>
        <code className="block break-all rounded bg-slate-950 p-3 text-sm">{url}</code></section>
      <section className="rounded-xl border border-slate-700 bg-slate-900/60 p-4"><h2 className="mb-2 font-medium">Voice calls in the browser</h2>
        <p className="text-sm text-slate-400">Talking to agents by voice needs <code>NEXT_PUBLIC_VAPI_PUBLIC_KEY</code> in Vercel (Config type). Status: {process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY?'set':'not set'}.</p></section>
    </div>
  </AppShell>);
}
