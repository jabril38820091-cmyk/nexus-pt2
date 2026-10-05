'use client';
import {useCallback,useEffect,useState} from 'react';
import {AppShell} from '@/components/app-shell';
import {createClient} from '@/lib/supabase/client';
import {ConnectionsPanel} from '@/components/connections-panel';
type Hook={id:string;url:string;events:string[];secret:string;last_status:string|null;last_at:string|null};
type Key={id:string;name:string;key_prefix:string;last_used_at:string|null;created_at:string};
const EVENTS=[['task.completed','A task finishes'],['email.sent','An agent sends an email'],['call.ended','A phone call ends']];
const CATALOG:[string,string,string][]=[
  ['Any tool with an API','Custom','Add it in Custom connections below, with an address and your key'],
  ['Zapier','Bridge','Connect thousands of apps using a Zapier webhook'],['Make','Bridge','Connect thousands of apps using a Make webhook'],['n8n','Bridge','Self-hosted or cloud automation, via webhooks'],
  ['Vapi','Built in','Voice agents, chat and phone numbers'],['Email (Resend)','Built in','Agents send follow-up emails'],['Stripe','Built in','Billing and subscriptions'],
  ['Google Calendar','Via a bridge','Book appointments from a call.ended or task event'],['Slack','Via a bridge','Post call summaries to a channel'],['Google Sheets','Via a bridge','Log every call or task'],
  ['HubSpot / Salesforce','Via a bridge','Create leads from calls'],['SMS (Twilio)','Planned','Text callers directly'],['Native calendar booking','Planned','Agents book without a bridge']];
const tone:Record<string,string>={Custom:'bg-purple-900 text-purple-300','Built in':'bg-emerald-900 text-emerald-300',Bridge:'bg-blue-900 text-blue-300','Via a bridge':'bg-slate-700 text-slate-300',Planned:'bg-amber-900 text-amber-300'};
const box='mt-1 w-full rounded border border-slate-600 bg-slate-950 p-2 text-sm';
const card='rounded-xl border border-slate-700 bg-slate-900/60 p-4';
export default function Integrations(){
  const sb=createClient();
  const [hooks,setHooks]=useState<Hook[]>([]);const [keys,setKeys]=useState<Key[]>([]);
  const [url,setUrl]=useState('');const [ev,setEv]=useState<string[]>(['task.completed']);const [err,setErr]=useState('');
  const [keyName,setKeyName]=useState('');const [newKey,setNewKey]=useState('');const [note,setNote]=useState('');
  const load=useCallback(async()=>{
    const [h,k]=await Promise.all([sb.from('webhooks').select('*').order('created_at',{ascending:false}),sb.from('api_keys').select('id,name,key_prefix,last_used_at,created_at').order('created_at',{ascending:false})]);
    setHooks(h.data??[]);setKeys(k.data??[]);
  },[]);// eslint-disable-line react-hooks/exhaustive-deps
  useEffect(()=>{load()},[load]);
  async function addHook(e:React.FormEvent){
    e.preventDefault();setErr('');
    const r=await fetch('/api/integrations/webhooks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url,events:ev})});
    const j=await r.json();if(!r.ok)return setErr(j.detail??j.error);
    setUrl('');load();
  }
  async function test(id:string){setNote('Sending test…');const r=await fetch('/api/integrations/webhooks/test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});const j=await r.json();setNote(r.ok?`Test sent. Your server answered ${j.status}.`:(j.error??'Test failed'));load()}
  async function addKey(e:React.FormEvent){
    e.preventDefault();setErr('');setNewKey('');
    const r=await fetch('/api/integrations/keys',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:keyName})});
    const j=await r.json();if(!r.ok)return setErr(j.detail??j.error);
    setNewKey(j.key);setKeyName('');load();
  }
  const origin=typeof location!=='undefined'?location.origin:'';
  return(<AppShell>
    <h1 className="text-2xl font-semibold">Integrations</h1>
    <p className="mb-6 mt-1 max-w-2xl text-sm text-slate-400">Connect Nexus to the tools you already use. Webhooks send events out. The API lets other tools start work here. Zapier, Make and n8n can then link either one to thousands of apps.</p>
    <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{CATALOG.map(([n,s,d])=>(<div key={n} className="rounded-xl border border-slate-700 p-3"><div className="flex items-center justify-between"><b className="text-sm">{n}</b><span className={`rounded-full px-2 py-0.5 text-xs ${tone[s]}`}>{s}</span></div><p className="mt-1 text-xs text-slate-400">{d}</p></div>))}</div>
    {err&&<p role="alert" className="mb-4 text-sm text-amber-400">{err}</p>}
    <div className="grid gap-6 lg:grid-cols-2">
      <section className={card}><h2 className="mb-1 font-medium">Webhooks (send events out)</h2>
        <p className="mb-3 text-sm text-slate-400">We POST JSON to your address, signed with an <code>X-Nexus-Signature</code> header (HMAC-SHA256 of the body using the secret).</p>
        <form onSubmit={addHook} className="space-y-2">
          <label className="block text-sm">Address (https only)<input required type="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://hooks.zapier.com/..." className={box}/></label>
          <div className="flex flex-wrap gap-3 text-sm">{EVENTS.map(([k,l])=>(<label key={k} className="flex items-center gap-1"><input type="checkbox" checked={ev.includes(k)} onChange={()=>setEv(ev.includes(k)?ev.filter(x=>x!==k):[...ev,k])} className="accent-emerald-500"/>{l}</label>))}</div>
          <button className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium">Add webhook</button>
        </form>
        {note&&<p className="mt-2 text-sm text-slate-300">{note}</p>}
        <ul className="mt-4 space-y-3">{hooks.map(h=>(<li key={h.id} className="rounded border border-slate-700 p-3 text-sm">
          <div className="break-all font-medium">{h.url}</div>
          <div className="text-xs text-slate-400">{h.events.join(', ')} · last: {h.last_status??'never'}</div>
          <details className="mt-1 text-xs"><summary className="cursor-pointer text-slate-400">Show signing secret</summary><code className="break-all">{h.secret}</code></details>
          <div className="mt-2 flex gap-2"><button onClick={()=>test(h.id)} className="rounded border border-slate-600 px-2 py-1 text-xs">Send test</button>
            <button onClick={async()=>{await sb.from('webhooks').delete().eq('id',h.id);load()}} className="rounded border border-red-800 px-2 py-1 text-xs text-red-300">Delete</button></div></li>))}</ul>
      </section>
      <section className={card}><h2 className="mb-1 font-medium">API keys (let other tools in)</h2>
        <p className="mb-3 text-sm text-slate-400">A key lets a script or automation assign tasks to your agents. Treat it like a password.</p>
        <form onSubmit={addKey} className="flex gap-2"><input required value={keyName} onChange={e=>setKeyName(e.target.value)} placeholder="Key name, e.g. Zapier" className={box+' mt-0'}/><button className="rounded bg-emerald-600 px-4 text-sm font-medium">Create</button></form>
        {newKey&&<div className="mt-3 rounded border border-amber-600/60 bg-amber-950/40 p-3 text-sm"><p className="mb-1 text-amber-300">Copy this now. It won't be shown again.</p><code className="break-all">{newKey}</code></div>}
        <ul className="mt-4 space-y-2">{keys.map(k=>(<li key={k.id} className="flex items-center justify-between rounded border border-slate-700 p-3 text-sm"><span>{k.name}<span className="block text-xs text-slate-400">{k.key_prefix}… · last used {k.last_used_at?new Date(k.last_used_at).toLocaleDateString():'never'}</span></span>
          <button onClick={async()=>{await sb.from('api_keys').delete().eq('id',k.id);load()}} className="rounded border border-red-800 px-2 py-1 text-xs text-red-300">Revoke</button></li>))}</ul>
        <h3 className="mb-1 mt-5 text-sm font-medium">Example</h3>
        <pre className="overflow-x-auto rounded bg-slate-950 p-3 text-xs">{`curl -X POST ${origin}/api/v1/tasks \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"agent":"lead-qualifier","title":"Follow up","instructions":"Draft a reply"}'`}</pre>
        <p className="mt-2 text-xs text-slate-500">GET the same address to list recent tasks.</p>
      </section>
    </div>
    <ConnectionsPanel/>
  </AppShell>);
}
