'use client';
import {useEffect,useState} from 'react';
import {createClient} from '@/lib/supabase/client';
const box='mt-1 w-full rounded border border-slate-600 bg-slate-950 p-2 text-sm';
export function Texting(){
  const [cfg,setCfg]=useState<{from_number:string;enabled:boolean}|null|undefined>(undefined);
  const [sid,setSid]=useState('');const [token,setToken]=useState('');const [from,setFrom]=useState('');const [test,setTest]=useState('');
  const [msg,setMsg]=useState('');const [busy,setBusy]=useState(false);
  const load=()=>createClient().from('sms_settings').select('from_number,enabled').limit(1).maybeSingle().then(({data})=>{setCfg(data);if(data)setFrom(data.from_number)});
  useEffect(()=>{load()},[]);
  async function save(e:React.FormEvent){
    e.preventDefault();setBusy(true);setMsg('');
    const r=await fetch('/api/integrations/sms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accountSid:sid,authToken:token,fromNumber:from})});
    const j=await r.json();setBusy(false);
    if(!r.ok)return setMsg(j.detail??j.error);
    setToken('');setSid('');setMsg('Saved. Send yourself a test text below.');load();
  }
  async function sendTest(){
    setBusy(true);setMsg('Sending…');
    const r=await fetch('/api/integrations/sms/test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({to:test})});
    const j=await r.json();setBusy(false);setMsg(j.message??j.error);
  }
  async function disconnect(){
    if(!confirm('Disconnect texting? Your agents will stop being able to send texts.'))return;
    await fetch('/api/integrations/sms',{method:'DELETE'});setCfg(null);setFrom('');setMsg('Disconnected.');
  }
  return(<div className="space-y-4">
    <p className="text-sm text-slate-400">Let your agents text callers back. Texts are sent from <b>your own</b> Twilio account and number. Every text starts with your business name and ends with "Reply STOP to opt out."</p>
    {cfg&&<p className="rounded border border-emerald-700/50 bg-emerald-950/30 p-3 text-sm text-emerald-200">Connected. Texts go out from {cfg.from_number}.</p>}
    <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm">Twilio Account SID<input value={sid} onChange={e=>setSid(e.target.value)} placeholder={cfg?'Leave blank to keep the saved one… or paste to change':'ACxxxxxxxx…'} required={!cfg} className={box}/></label>
      <label className="text-sm">Twilio Auth Token<input type="password" autoComplete="off" value={token} onChange={e=>setToken(e.target.value)} placeholder={cfg?'Saved. Paste to change':''} required={!cfg} className={box}/></label>
      <label className="text-sm">Your Twilio phone number<input value={from} onChange={e=>setFrom(e.target.value)} placeholder="+16125550123" required className={box}/></label>
      <div className="flex items-end"><button disabled={busy} className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium disabled:opacity-50">{cfg?'Update':'Connect texting'}</button></div>
    </form>
    {cfg&&<div className="flex flex-wrap items-end gap-2"><label className="text-sm">Send a test text to your phone<input value={test} onChange={e=>setTest(e.target.value)} placeholder="(612) 555-0123" className={box+' w-56'}/></label>
      <button disabled={busy||!test} onClick={sendTest} className="rounded border border-slate-600 px-4 py-2 text-sm disabled:opacity-50">Send test</button>
      <button onClick={disconnect} className="rounded border border-red-900 px-4 py-2 text-sm text-red-300">Disconnect</button></div>}
    {msg&&<p role="status" className="text-sm text-slate-200">{msg}</p>}
    <details className="text-xs text-slate-400"><summary className="cursor-pointer text-slate-300">Before you text real customers</summary>
      <ul className="mt-2 list-disc space-y-1 pl-5"><li>In the US, carriers block business texts from numbers that are not registered. Register for A2P 10DLC, or verify a toll-free number, in your Twilio account. It can take several days.</li>
        <li>A Twilio trial account can only text numbers you have verified in Twilio.</li>
        <li>Only text people who contacted you or agreed to hear from you. Texting rules differ by country and by state, so check with a lawyer for your situation.</li>
        <li>Your agents can send at most 3 texts per call, 3 per person per day, and 30 per hour.</li></ul></details>
  </div>);
}
