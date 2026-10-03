'use client';
import {useEffect,useState} from 'react';import {useRouter} from 'next/navigation';import {createClient} from '@/lib/supabase/client';import {INDUSTRIES} from '@/lib/industries';
type Unmatched={assistantId:string;vapiName:string};
const box='mt-1 w-full rounded border border-slate-600 bg-slate-900 p-2';
export default function Onboarding(){
 const router=useRouter();const sb=createClient();
 const [company,setCompany]=useState<{id:string;name:string}|null>(null);const [loading,setLoading]=useState(true);
 const [name,setName]=useState('');const [industry,setIndustry]=useState(INDUSTRIES[0].id);
 const [squadId,setSquadId]=useState('');const [phoneId,setPhoneId]=useState('');
 const [unmatched,setUnmatched]=useState<Unmatched[]>([]);const [slugs,setSlugs]=useState<string[]>([]);const [overrides,setOverrides]=useState<Record<string,string>>({});
 const [msg,setMsg]=useState('');
 useEffect(()=>{sb.from('companies').select('id,name').limit(1).maybeSingle().then(({data})=>{setCompany(data);setLoading(false)})},[]);
 async function createCompany(e:React.FormEvent){
  e.preventDefault();setMsg('');const {data:{user}}=await sb.auth.getUser();if(!user)return router.push('/login');
  const {data,error}=await sb.from('companies').insert({owner_id:user.id,name,industry}).select('id,name').single();
  if(error)return setMsg(error.message);setCompany(data);}
 async function connect(e:React.FormEvent){
  e.preventDefault();setMsg('Connecting…');
  const r=await fetch('/api/vapi/connect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({companyId:company!.id,squadId:squadId.trim(),phoneNumberId:phoneId.trim(),overrides})});
  const j=await r.json();
  if(r.ok)return router.push('/office');
  if(r.status===422){setUnmatched(j.unmatched);setSlugs(j.validSlugs);return setMsg('Some assistants did not match a roster agent. Pick one for each, then connect again.')}
  setMsg(j.detail??j.error??'Something went wrong.');}
 if(loading)return<main className="p-8">Loading…</main>;
 return(<main className="mx-auto mt-16 max-w-md p-6">
  {!company?(<form onSubmit={createCompany} className="space-y-4"><h1 className="text-2xl font-semibold">Your business</h1>
   <label className="block text-sm">Business name<input required value={name} onChange={e=>setName(e.target.value)} className={box}/></label>
   <label className="block text-sm">Industry<select value={industry} onChange={e=>setIndustry(e.target.value)} className={box}>{INDUSTRIES.map(i=><option key={i.id} value={i.id}>{i.label}</option>)}</select></label>
   <button className="w-full rounded bg-emerald-600 py-2 font-medium">Continue</button></form>)
  :(<form onSubmit={connect} className="space-y-4"><h1 className="text-2xl font-semibold">Connect your Vapi squad</h1>
   <p className="text-sm text-slate-400">For {company.name}. Find both IDs in the Vapi dashboard.</p>
   <label className="block text-sm">Squad ID<input required value={squadId} onChange={e=>setSquadId(e.target.value)} className={box}/></label>
   <label className="block text-sm">Phone number ID<input required value={phoneId} onChange={e=>setPhoneId(e.target.value)} className={box}/></label>
   {unmatched.map(u=>(<label key={u.assistantId} className="block text-sm">Vapi assistant "{u.vapiName||u.assistantId}" is which agent?
    <select value={overrides[u.assistantId]??''} onChange={e=>setOverrides({...overrides,[u.assistantId]:e.target.value})} className={box}><option value="">Choose…</option>{slugs.map(s=><option key={s} value={s}>{s}</option>)}</select></label>))}
   <button className="w-full rounded bg-emerald-600 py-2 font-medium">Connect squad</button></form>)}
  {msg&&<p role="alert" className="mt-4 text-sm text-amber-400">{msg}</p>}
 </main>);}
