'use client';
import {useState} from 'react';
import {createClient} from '@/lib/supabase/client';
export function Notifications({companyId,initial}:{companyId:string;initial:boolean}){
  const [on,setOn]=useState(initial);const [msg,setMsg]=useState('');
  async function toggle(){
    const next=!on;setOn(next);setMsg('');
    const {error}=await createClient().from('companies').update({notify_drafts:next}).eq('id',companyId);
    if(error){setOn(!next);setMsg(error.message)}
  }
  return(<div>
    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-700 p-3">
      <div><div className="text-sm font-medium">Email me when a follow-up needs my OK</div><p className="text-xs text-slate-400">Sent to your login email each time an agent drafts a follow-up. It links to your Money Hub.</p></div>
      <button role="switch" aria-checked={on} aria-label="Email me when a follow-up needs my OK" onClick={toggle} className={`relative h-6 w-11 shrink-0 rounded-full transition ${on?'bg-emerald-500':'bg-slate-600'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on?'left-[22px]':'left-0.5'}`}/></button>
    </div>
    <p className="mt-2 text-xs text-slate-500">Emails need the email service set up on the server. While it is in test mode, it only delivers to the address the email service account was created with.</p>
    {msg&&<p role="alert" className="mt-2 text-sm text-amber-400">{msg}</p>}
  </div>);
}
