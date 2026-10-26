'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {BUSINESS_TYPES,validateDemo} from '@/lib/demo';
const box='mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 p-2.5 text-sm';
export function DemoForm(){
  const [f,setF]=useState({name:'',business:'',email:'',phone:'',businessType:'',message:'',consent:false,website:''});
  const [startedAt]=useState(()=>Date.now());
  const [source,setSource]=useState<string|null>(null);
  const [busy,setBusy]=useState(false);const [errors,setErrors]=useState<string[]>([]);const [done,setDone]=useState(false);
  useEffect(()=>{try{const q=new URLSearchParams(location.search);const s=['utm_source','utm_medium','utm_campaign'].map(k=>q.get(k)).filter(Boolean).join(' / ');setSource(s||document.referrer||null)}catch{/* ignore */}},[]);
  async function submit(e:React.FormEvent){
    e.preventDefault();setErrors([]);
    const v=validateDemo({...f,source});
    if('errors' in v){setErrors(v.errors);return}
    setBusy(true);
    try{
      const r=await fetch('/api/demo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...f,startedAt,source})});
      const j=await r.json().catch(()=>({}));
      if(!r.ok)setErrors(j.errors??['Something went wrong. Please try again.']);else setDone(true);
    }catch{setErrors(['Something went wrong. Please check your connection and try again.'])}
    setBusy(false);
  }
  if(done)return(<div role="status" className="rounded-2xl border border-emerald-700/50 bg-emerald-950/20 p-6"><h3 className="text-lg font-semibold">Thanks, {f.name.split(' ')[0]||'there'}.</h3><p className="mt-1 text-slate-300">We got your request and will be in touch at {f.email} to set up your demo.</p></div>);
  const set=(k:keyof typeof f)=>(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>)=>setF({...f,[k]:e.target.value});
  return(<form onSubmit={submit} noValidate className="grid gap-4 rounded-2xl border border-slate-700 bg-slate-900/60 p-6 sm:grid-cols-2">
    <label className="text-sm">Your name<input required autoComplete="name" value={f.name} onChange={set('name')} className={box}/></label>
    <label className="text-sm">Business name<input required autoComplete="organization" value={f.business} onChange={set('business')} className={box}/></label>
    <label className="text-sm">Email<input required type="email" autoComplete="email" value={f.email} onChange={set('email')} className={box}/></label>
    <label className="text-sm">Phone <span className="text-slate-500">(optional)</span><input type="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} className={box}/></label>
    <label className="text-sm sm:col-span-2">Type of business<select required value={f.businessType} onChange={set('businessType')} className={box}><option value="">Choose one</option>{BUSINESS_TYPES.map(t=><option key={t}>{t}</option>)}</select></label>
    <label className="text-sm sm:col-span-2">What would you like your agents to handle? <span className="text-slate-500">(optional)</span><textarea rows={3} maxLength={1000} value={f.message} onChange={set('message')} className={box}/></label>
    <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={set('website')} name="website" className="absolute -left-[9999px] h-px w-px opacity-0"/>
    <label className="flex items-start gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={f.consent} onChange={e=>setF({...f,consent:e.target.checked})} className="mt-1 accent-emerald-500"/><span>I agree to be contacted about Nexus Workforce. See our <Link href="/privacy" className="underline">Privacy Policy</Link>.</span></label>
    {errors.length>0&&<ul role="alert" className="list-disc space-y-1 pl-5 text-sm text-red-300 sm:col-span-2">{errors.map(e=><li key={e}>{e}</li>)}</ul>}
    <div className="sm:col-span-2"><button disabled={busy} className="rounded-lg bg-emerald-600 px-6 py-3 font-medium disabled:opacity-50">{busy?'Sending…':'Request a demo'}</button></div>
  </form>);
}
