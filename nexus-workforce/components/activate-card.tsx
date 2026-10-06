'use client';
import {useState} from 'react';
type Squad={id:string;phone_number:string|null}|null;
const btn='rounded bg-emerald-600 px-4 py-2 text-sm font-medium disabled:opacity-50';
export function ActivateCard({squad,isAdmin,mode,onDone}:{squad:Squad;isAdmin:boolean;mode:string;onDone:()=>void}){
  const [busy,setBusy]=useState(false);const [msg,setMsg]=useState('');const [plan,setPlan]=useState('');const [area,setArea]=useState('');
  async function call(url:string,body:object){
    setBusy(true);setMsg('Working… this can take up to a minute.');
    try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const j=await r.json();setBusy(false);return{ok:r.ok,j}}
    catch{setBusy(false);return{ok:false,j:{detail:'Request failed.'}}}
  }
  async function activate(dry:boolean){
    const {ok,j}=await call('/api/provision',{dryRun:dry});
    if(!ok)return setMsg(j.detail??j.error??'Something went wrong.');
    if(dry){setPlan(JSON.stringify(j.plan,null,2));return setMsg('Dry run only. Nothing was created.')}
    setMsg('Your agents are ready.');onDone();
  }
  async function getNumber(){
    const {ok,j}=await call('/api/provision/phone',{areaCode:area});
    if(!ok)return setMsg(`${j.detail??j.error}${j.hint?` ${j.hint}`:''}`);
    setMsg(j.sipOnly?'Vapi gave a web (SIP) address, not a regular phone number. To take real calls, attach a normal phone number in the Vapi dashboard.':`Your number: ${j.number}`);onDone();
  }
  if(squad?.phone_number)return null;
  const label=mode==='receptionist'?'your receptionist':mode==='single'?'your chosen agent':'your full team';
  return(<section className="mb-6 rounded-2xl border border-emerald-600/60 bg-emerald-950/30 p-5">
    {!squad?<>
      <h2 className="text-lg font-semibold">Activate your agents</h2>
      <p className="mb-3 mt-1 text-sm text-slate-300">We'll set up {label} so they can answer chat and calls. This takes about a minute.</p>
      <div className="flex flex-wrap gap-2"><button disabled={busy} onClick={()=>activate(false)} className={btn}>Activate my agents</button>
        {isAdmin&&<button disabled={busy} onClick={()=>activate(true)} className="rounded border border-slate-600 px-4 py-2 text-sm disabled:opacity-50">Dry run (admin)</button>}</div>
    </>:<>
      <h2 className="text-lg font-semibold">Get a phone number</h2>
      <p className="mb-3 mt-1 text-sm text-slate-300">Your agents are ready. Pick an area code and we'll ask Vapi for a number. Depending on your Vapi account, it may offer only a web (SIP) address, and we'll tell you if so.</p>
      <div className="flex flex-wrap gap-2"><input value={area} onChange={e=>setArea(e.target.value.replace(/\D/g,'').slice(0,3))} placeholder="Area code, e.g. 612" aria-label="Area code" className="w-44 rounded border border-slate-600 bg-slate-950 p-2 text-sm"/>
        <button disabled={busy||area.length!==3} onClick={getNumber} className={btn}>Get a number</button></div>
    </>}
    {msg&&<p role="status" className="mt-3 text-sm text-slate-200">{msg}</p>}
    {plan&&<pre className="mt-2 overflow-x-auto rounded bg-slate-950 p-3 text-xs">{plan}</pre>}
  </section>);
}
