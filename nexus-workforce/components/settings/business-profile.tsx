'use client';
import {useState} from 'react';
import {createClient} from '@/lib/supabase/client';
export type Hours=Record<string,{open:boolean;from:string;to:string}>;
export type Profile={id:string;name:string;industry:string|null;website:string|null;timezone:string|null;business_hours:Hours|null};
const DAYS:[string,string][]=[['mon','Monday'],['tue','Tuesday'],['wed','Wednesday'],['thu','Thursday'],['fri','Friday'],['sat','Saturday'],['sun','Sunday']];
const DEFAULT_HOURS:Hours=Object.fromEntries(DAYS.map(([k])=>[k,{open:!['sat','sun'].includes(k),from:'09:00',to:'17:00'}]));
const FALLBACK_TZ=['America/New_York','America/Chicago','America/Denver','America/Los_Angeles','America/Phoenix','America/Anchorage','Pacific/Honolulu','Europe/London','Europe/Paris','Asia/Dubai','Asia/Kolkata','Asia/Singapore','Asia/Tokyo','Australia/Sydney','UTC'];
const zones=():string[]=>{try{return typeof Intl.supportedValuesOf==='function'?Intl.supportedValuesOf('timeZone'):FALLBACK_TZ}catch{return FALLBACK_TZ}};
const box='mt-1 w-full rounded border border-slate-600 bg-slate-950 p-2 text-sm';
export function BusinessProfile({company}:{company:Profile}){
  const [f,setF]=useState({name:company.name,industry:company.industry??'',website:company.website??'',timezone:company.timezone??'',hours:company.business_hours??DEFAULT_HOURS});
  const [msg,setMsg]=useState('');const [busy,setBusy]=useState(false);
  const setDay=(k:string,patch:Partial<Hours[string]>)=>setF(v=>({...v,hours:{...v.hours,[k]:{...(v.hours[k]??DEFAULT_HOURS[k]),...patch}}}));
  async function save(e:React.FormEvent){
    e.preventDefault();setMsg('');
    const site=f.website.trim();
    if(!f.name.trim())return setMsg('Enter your business name.');
    if(site&&!/^https?:\/\/\S+\.\S+/.test(site))return setMsg('The website should start with http:// or https://');
    setBusy(true);
    const {error}=await createClient().from('companies').update({name:f.name.trim(),industry:f.industry.trim()||'Other',website:site||null,timezone:f.timezone||null,business_hours:f.hours}).eq('id',company.id);
    setBusy(false);setMsg(error?error.message:'Saved. New agents you activate will know these details.');
  }
  const tz=zones();
  return(<form onSubmit={save} className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm">Business name<input required value={f.name} onChange={e=>setF({...f,name:e.target.value})} className={box}/></label>
      <label className="text-sm">What kind of business?<input value={f.industry} onChange={e=>setF({...f,industry:e.target.value})} placeholder="e.g. restaurant, agency, clinic" className={box}/></label>
      <label className="text-sm">Website<input value={f.website} onChange={e=>setF({...f,website:e.target.value})} placeholder="https://example.com" className={box}/></label>
      <label className="text-sm">Time zone<select value={f.timezone} onChange={e=>setF({...f,timezone:e.target.value})} className={box}><option value="">Not set</option>{tz.map(z=><option key={z} value={z}>{z}</option>)}</select></label>
    </div>
    <fieldset><legend className="mb-2 text-sm text-slate-300">Business hours</legend>
      <div className="space-y-1.5">{DAYS.map(([k,label])=>{const d=f.hours[k]??DEFAULT_HOURS[k];return(<div key={k} className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex w-36 items-center gap-2"><input type="checkbox" checked={d.open} onChange={e=>setDay(k,{open:e.target.checked})} className="accent-emerald-500"/>{label}</label>
        {d.open?<><input type="time" aria-label={`${label} opens`} value={d.from} onChange={e=>setDay(k,{from:e.target.value})} className="rounded border border-slate-600 bg-slate-950 p-1"/><span className="text-slate-500">to</span><input type="time" aria-label={`${label} closes`} value={d.to} onChange={e=>setDay(k,{to:e.target.value})} className="rounded border border-slate-600 bg-slate-950 p-1"/></>:<span className="text-slate-500">Closed</span>}</div>)})}</div></fieldset>
    <button disabled={busy} className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium disabled:opacity-50">{busy?'Saving…':'Save profile'}</button>
    {msg&&<p role="status" className="text-sm text-slate-300">{msg}</p>}
  </form>);
}
