'use client';
import {useState} from 'react';
import Link from 'next/link';
const IDEAS=['Write a summary of today','What needs my attention?','Write a short update I can send my team','Which calls might need a follow-up?'];
export function AskTeam(){
  const [text,setText]=useState('');const [busy,setBusy]=useState(false);const [reply,setReply]=useState('');const [err,setErr]=useState('');const [copied,setCopied]=useState(false);
  async function ask(q:string){
    if(q.trim().length<3)return;
    setBusy(true);setErr('');setReply('');setCopied(false);
    try{
      const r=await fetch('/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({request:q})});
      const j=await r.json();
      if(!r.ok)throw new Error(j.detail??j.error??'Something went wrong.');
      setReply(j.reply);
    }catch(e){setErr(e instanceof Error?e.message:String(e))}
    setBusy(false);
  }
  return(<section className="mb-6 rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
    <h2 className="text-lg font-semibold">Ask your team</h2>
    <p className="mb-3 mt-1 text-sm text-slate-400">Type anything you'd like done. Your team uses your business's calls, tasks and notes to write, summarize and draft.</p>
    <form onSubmit={e=>{e.preventDefault();ask(text)}} className="flex flex-col gap-2 sm:flex-row">
      <textarea rows={2} maxLength={1000} value={text} onChange={e=>setText(e.target.value)} placeholder="e.g. Write a summary of today" aria-label="What would you like your team to do?" className="flex-1 rounded border border-slate-600 bg-slate-950 p-2 text-sm"/>
      <button disabled={busy||text.trim().length<3} className="rounded bg-emerald-600 px-5 py-2 text-sm font-medium disabled:opacity-50 sm:self-stretch">{busy?'Working…':'Ask'}</button>
    </form>
    <div className="mt-2 flex flex-wrap gap-2">{IDEAS.map(i=>(<button key={i} type="button" disabled={busy} onClick={()=>{setText(i);ask(i)}} className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-300 disabled:opacity-50">{i}</button>))}</div>
    {err&&<p role="alert" className="mt-3 text-sm text-amber-400">{err}</p>}
    {reply&&<div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/60 p-4"><p className="whitespace-pre-wrap text-sm text-slate-100">{reply}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400"><button onClick={async()=>{try{await navigator.clipboard.writeText(reply);setCopied(true)}catch{/* ignore */}}} className="rounded border border-slate-600 px-3 py-1 text-slate-200">{copied?'Copied':'Copy'}</button><span>Saved in <Link href="/tasks" className="underline">Tasks</Link>. Check important details before you rely on them.</span></div></div>}
  </section>);
}
