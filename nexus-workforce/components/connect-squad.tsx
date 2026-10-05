'use client';
import {useState} from 'react';
type Unmatched={assistantId:string;vapiName:string};
const box='mt-1 w-full rounded border border-slate-600 bg-slate-950 p-2 text-sm';
export function ConnectSquad({companyId}:{companyId:string}){
  const [squadId,setSquadId]=useState('');const [phoneId,setPhoneId]=useState('');
  const [unmatched,setUnmatched]=useState<Unmatched[]>([]);const [slugs,setSlugs]=useState<string[]>([]);const [overrides,setOverrides]=useState<Record<string,string>>({});
  const [msg,setMsg]=useState('');
  async function connect(e:React.FormEvent){
    e.preventDefault();setMsg('Connecting…');
    const r=await fetch('/api/vapi/connect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({companyId,squadId:squadId.trim(),phoneNumberId:phoneId.trim(),overrides})});
    const j=await r.json();
    if(r.ok){setMsg('Connected. Reloading…');return window.location.reload()}
    if(r.status===422){setUnmatched(j.unmatched);setSlugs(j.validSlugs);return setMsg('Some assistants did not match an agent. Pick one for each, then connect again.')}
    setMsg(j.detail??j.error??'Something went wrong.');
  }
  return(<form onSubmit={connect} className="space-y-3">
    <label className="block text-sm">Squad ID<input required value={squadId} onChange={e=>setSquadId(e.target.value)} className={box}/></label>
    <label className="block text-sm">Phone number ID<input required value={phoneId} onChange={e=>setPhoneId(e.target.value)} className={box}/></label>
    {unmatched.map(u=>(<label key={u.assistantId} className="block text-sm">Vapi assistant "{u.vapiName||u.assistantId}" is which agent?
      <select value={overrides[u.assistantId]??''} onChange={e=>setOverrides({...overrides,[u.assistantId]:e.target.value})} className={box}><option value="">Choose…</option>{slugs.map(s=><option key={s} value={s}>{s}</option>)}</select></label>))}
    <button className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium">Connect squad</button>
    {msg&&<p role="alert" className="text-sm text-amber-400">{msg}</p>}
  </form>);
}
