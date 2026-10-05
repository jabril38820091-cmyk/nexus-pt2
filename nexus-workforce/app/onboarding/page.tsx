'use client';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {createClient} from '@/lib/supabase/client';
import {useCompany} from '@/lib/use-company';
import {AgentChoice,type Choice} from '@/components/agent-choice';
const box='mt-1 w-full rounded border border-slate-600 bg-slate-900 p-2';
export default function Onboarding(){
  const router=useRouter();const {company,loading}=useCompany();
  const [name,setName]=useState('');const [industry,setIndustry]=useState('');
  const [choice,setChoice]=useState<Choice>({mode:'receptionist',chosen:'lead-qualifier'});
  const [busy,setBusy]=useState(false);const [msg,setMsg]=useState('');
  useEffect(()=>{if(!loading&&company)router.replace('/office')},[loading,company,router]);
  async function submit(e:React.FormEvent){
    e.preventDefault();setBusy(true);setMsg('');
    const sb=createClient();const {data:{user}}=await sb.auth.getUser();
    if(!user){router.push('/login');return}
    const {error}=await sb.from('companies').insert({owner_id:user.id,name,industry:industry.trim()||'Other',agent_mode:choice.mode,chosen_agent:choice.mode==='single'?choice.chosen:null});
    if(error){setMsg(error.message);setBusy(false);return}
    router.push('/office');
  }
  if(loading||company)return<main className="p-8 text-slate-400">Loading…</main>;
  return(<main className="mx-auto mt-12 max-w-md p-6">
    <h1 className="text-2xl font-semibold">Set up your business</h1>
    <p className="mb-6 mt-1 text-sm text-slate-400">Two quick questions. You can change your agents any time in Settings.</p>
    <form onSubmit={submit} className="space-y-5">
      <label className="block text-sm">Business name<input required value={name} onChange={e=>setName(e.target.value)} className={box}/></label>
      <label className="block text-sm">What kind of business is it? (optional)<input value={industry} onChange={e=>setIndustry(e.target.value)} placeholder="e.g. restaurant, agency, clinic, online store" className={box}/></label>
      <AgentChoice value={choice} onChange={setChoice}/>
      <button disabled={busy} className="w-full rounded bg-emerald-600 py-2.5 font-medium disabled:opacity-50">{busy?'Setting up…':'Continue to my office'}</button>
      {msg&&<p role="alert" className="text-sm text-amber-400">{msg}</p>}
    </form>
  </main>);
}
