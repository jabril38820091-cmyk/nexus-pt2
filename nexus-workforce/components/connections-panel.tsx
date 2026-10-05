'use client';
import {useCallback,useEffect,useState} from 'react';
import {createClient} from '@/lib/supabase/client';
type Conn={id:string;name:string;description:string|null;url:string;method:string;last_status:string|null};
const PRESETS:Record<string,{label:string;url:string;method:string;headers:string;body:string;path:string}>={
  custom:{label:'Start blank',url:'',method:'POST',headers:'',body:'',path:''},
  openai:{label:'OpenAI-compatible chat',url:'https://api.openai.com/v1/chat/completions',method:'POST',headers:'{"Authorization":"Bearer YOUR_KEY"}',body:'{"model":"MODEL_NAME","messages":[{"role":"user","content":{{input}}}]}',path:'choices.0.message.content'},
  anthropic:{label:'Anthropic messages',url:'https://api.anthropic.com/v1/messages',method:'POST',headers:'{"x-api-key":"YOUR_KEY","anthropic-version":"2023-06-01"}',body:'{"model":"MODEL_NAME","max_tokens":500,"messages":[{"role":"user","content":{{input}}}]}',path:'content.0.text'},
  json:{label:'Simple JSON endpoint',url:'https://',method:'POST',headers:'{"Authorization":"Bearer YOUR_KEY"}',body:'{"input":{{input}}}',path:''}};
const box='mt-1 w-full rounded border border-slate-600 bg-slate-950 p-2 text-sm';
export function ConnectionsPanel(){
  const sb=createClient();
  const [list,setList]=useState<Conn[]>([]);const [p,setP]=useState('openai');
  const [f,setF]=useState({name:'',description:'',...PRESETS.openai,body:PRESETS.openai.body});
  const [err,setErr]=useState('');const [note,setNote]=useState('');
  const load=useCallback(async()=>{const {data}=await sb.from('connections').select('id,name,description,url,method,last_status').order('created_at',{ascending:false});setList(data??[])},[]);// eslint-disable-line react-hooks/exhaustive-deps
  useEffect(()=>{load()},[load]);
  function preset(k:string){const x=PRESETS[k];setP(k);setF(v=>({...v,url:x.url,method:x.method,headers:x.headers,body:x.body,path:x.path}))}
  async function add(e:React.FormEvent){
    e.preventDefault();setErr('');
    const r=await fetch('/api/integrations/connections',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:f.name,description:f.description,url:f.url,method:f.method,headers:f.headers,bodyTemplate:f.body,responsePath:f.path})});
    const j=await r.json();if(!r.ok)return setErr(j.detail??j.error);
    setF(v=>({...v,name:'',description:''}));load();
  }
  async function test(id:string){
    setNote('Testing…');
    const r=await fetch('/api/integrations/connections/test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,input:'Say hello in five words.'})});
    const j=await r.json();setNote(r.ok?`${j.ok?'Worked':'Failed'}: ${j.text}`:(j.error??'Test failed'));load();
  }
  return(<section className="mt-6 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
    <h2 className="mb-1 font-medium">Custom connections (any tool with an API)</h2>
    <p className="mb-3 max-w-3xl text-sm text-slate-400">Add any AI tool or service that has a web API. Your agents can then use it during calls and tasks. Add the address and your key, then give it a short name. Keys stay on the server and are never shown again here.</p>
    <form onSubmit={add} className="grid gap-3 md:grid-cols-2">
      <label className="text-sm">Start from<select value={p} onChange={e=>preset(e.target.value)} className={box}>{Object.entries(PRESETS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></label>
      <label className="text-sm">Short name<input required value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="e.g. gpt or research" className={box}/></label>
      <label className="text-sm md:col-span-2">What is it for? (agents read this)<input value={f.description} onChange={e=>setF({...f,description:e.target.value})} placeholder="e.g. Writes draft replies to customer questions" className={box}/></label>
      <label className="text-sm">Address (https)<input required value={f.url} onChange={e=>setF({...f,url:e.target.value})} className={box}/></label>
      <label className="text-sm">Method<select value={f.method} onChange={e=>setF({...f,method:e.target.value})} className={box}><option>POST</option><option>GET</option></select></label>
      <label className="text-sm md:col-span-2">Headers (JSON, include your key)<textarea rows={2} value={f.headers} onChange={e=>setF({...f,headers:e.target.value})} className={box+' font-mono'}/></label>
      <label className="text-sm md:col-span-2">Body (JSON, put {'{{input}}'} where the agent's text goes)<textarea rows={3} value={f.body} onChange={e=>setF({...f,body:e.target.value})} className={box+' font-mono'}/></label>
      <label className="text-sm">Answer path (optional)<input value={f.path} onChange={e=>setF({...f,path:e.target.value})} placeholder="choices.0.message.content" className={box}/></label>
      <div className="flex items-end"><button className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium">Add connection</button></div>
    </form>
    <p className="mt-2 text-xs text-slate-500">Presets are starting points. Replace YOUR_KEY and MODEL_NAME, and check the provider's docs for current model names.</p>
    {err&&<p role="alert" className="mt-2 text-sm text-amber-400">{err}</p>}{note&&<p className="mt-2 text-sm text-slate-300">{note}</p>}
    <ul className="mt-4 space-y-2">{list.map(c=>(<li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-700 p-3 text-sm">
      <span><b>{c.name}</b> <span className="text-xs text-slate-400">{c.method} · last: {c.last_status??'never'}</span><span className="block break-all text-xs text-slate-500">{c.url}</span>{c.description&&<span className="block text-xs text-slate-400">{c.description}</span>}</span>
      <span className="flex gap-2"><button onClick={()=>test(c.id)} className="rounded border border-slate-600 px-2 py-1 text-xs">Test</button><button onClick={async()=>{await sb.from('connections').delete().eq('id',c.id);load()}} className="rounded border border-red-800 px-2 py-1 text-xs text-red-300">Delete</button></span></li>))}</ul>
    <details className="mt-4 text-sm"><summary className="cursor-pointer text-slate-300">How agents use these on calls</summary>
      <p className="mt-2 text-slate-400">In Vapi, create one Function tool named <code>use_connected_app</code> with two text parameters, <code>app</code> and <code>input</code>. Set its Server URL to <code>{typeof location!=='undefined'?location.origin:''}/api/tools/connected-app?secret=YOUR_WEBHOOK_SECRET</code> and attach it to the assistants that should use your apps. Tasks and chat use whatever tools the assistant already has.</p></details>
  </section>);
}
