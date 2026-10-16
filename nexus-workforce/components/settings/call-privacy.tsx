'use client';
import {useState} from 'react';
import {createClient} from '@/lib/supabase/client';
export type Privacy={id:string;save_transcripts:boolean|null;transcript_retention_days:number|null};
const OPTIONS:[number,string][]=[[30,'30 days'],[90,'90 days'],[180,'180 days'],[365,'1 year'],[0,'Keep until I delete them']];
export function CallPrivacy({company}:{company:Privacy}){
  const [save,setSave]=useState(company.save_transcripts!==false);
  const [days,setDays]=useState(company.transcript_retention_days??90);
  const [msg,setMsg]=useState('');const [busy,setBusy]=useState(false);
  async function apply(){
    setBusy(true);setMsg('');
    const {error}=await createClient().from('companies').update({save_transcripts:save,transcript_retention_days:days}).eq('id',company.id);
    setBusy(false);setMsg(error?error.message:'Saved. Older transcripts are cleared as new calls come in.');
  }
  async function wipe(){
    if(!confirm('Delete every stored transcript? This cannot be undone.'))return;
    setBusy(true);setMsg('');
    const {error}=await createClient().from('calls').update({transcript_text:null,transcript:null}).not('transcript_text','is',null);
    setBusy(false);setMsg(error?error.message:'All stored transcripts were deleted.');
  }
  return(<div className="space-y-4">
    <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={save} onChange={e=>setSave(e.target.checked)} className="mt-1 accent-emerald-500"/>
      <span>Save call transcripts and recording links<span className="block text-xs text-slate-400">Lets you read what was said on the Calls page and lets your team write better summaries. Turn it off and new calls keep only the length and outcome.</span></span></label>
    <label className="block text-sm">Keep transcripts for
      <select disabled={!save} value={days} onChange={e=>setDays(Number(e.target.value))} className="mt-1 block w-64 rounded border border-slate-600 bg-slate-950 p-2 text-sm disabled:opacity-50">{OPTIONS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
    <div className="flex flex-wrap gap-2"><button disabled={busy} onClick={apply} className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium disabled:opacity-50">Save</button>
      <button disabled={busy} onClick={wipe} className="rounded border border-red-900 px-4 py-2 text-sm text-red-300 disabled:opacity-50">Delete all stored transcripts</button></div>
    {msg&&<p role="status" className="text-sm text-slate-300">{msg}</p>}
    <p className="text-xs text-slate-500">Many places require telling people, or getting their consent, before a call is recorded or transcribed. Add a short notice to your greeting if that applies to you, and check the rules where you and your callers are.</p>
  </div>);
}
