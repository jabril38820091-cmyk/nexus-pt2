'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {createClient} from '@/lib/supabase/client';
import {DEPARTMENTS,type AgentRoster} from '@/lib/agents/roster';
type Msg={who:'you'|'agent';text:string};
const box='w-full rounded border border-slate-600 bg-slate-950 p-2 text-sm';
export function AgentPanel({agent,onClose}:{agent:AgentRoster;onClose:()=>void}){
  const [tab,setTab]=useState<'chat'|'voice'|'task'>('chat');
  const [assistantId,setAssistantId]=useState<string|null|undefined>(undefined);
  useEffect(()=>{createClient().from('agents').select('vapi_assistant_id').eq('slug',agent.id).limit(1).maybeSingle().then(({data})=>setAssistantId(data?.vapi_assistant_id??null))},[agent.id]);
  const color=DEPARTMENTS[agent.department].color;
  return(<aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-700 bg-slate-900 shadow-2xl" role="dialog" aria-label={agent.name}>
    <div className="flex items-start justify-between border-b border-slate-700 p-4">
      <div><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{background:color}}/><h2 className="font-semibold">{agent.name}</h2></div>
        <p className="text-sm text-slate-400">{DEPARTMENTS[agent.department].label} · {agent.role}</p></div>
      <button onClick={onClose} aria-label="Close" className="rounded px-2 py-1 text-slate-400 hover:text-white">✕</button>
    </div>
    <div className="flex gap-1 border-b border-slate-800 p-2">
      {(['chat','voice','task'] as const).map(t=>(<button key={t} onClick={()=>setTab(t)} className={`rounded px-3 py-1.5 text-sm ${tab===t?'bg-slate-700 text-white':'text-slate-400'}`}>{t==='chat'?'Chat':t==='voice'?'Talk':'Give a task'}</button>))}
    </div>
    {assistantId===null&&<p className="m-4 rounded border border-amber-600/50 bg-amber-950/40 p-3 text-sm text-amber-300">This agent isn't linked to a Vapi assistant yet. Connect your squad on the onboarding page first.</p>}
    {assistantId&&tab==='chat'&&<ChatTab slug={agent.id}/>}
    {assistantId&&tab==='voice'&&<VoiceTab assistantId={assistantId}/>}
    {assistantId&&tab==='task'&&<TaskTab slug={agent.id}/>}
  </aside>);
}
function ChatTab({slug}:{slug:string}){
  const [msgs,setMsgs]=useState<Msg[]>([]);const [text,setText]=useState('');const [busy,setBusy]=useState(false);
  const chatId=useRef<string|null>(null);const end=useRef<HTMLDivElement>(null);
  useEffect(()=>{end.current?.scrollIntoView({behavior:'smooth'})},[msgs]);
  async function send(e:React.FormEvent){
    e.preventDefault();const input=text.trim();if(!input||busy)return;
    setMsgs(m=>[...m,{who:'you',text:input}]);setText('');setBusy(true);
    try{
      const r=await fetch('/api/agents/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,input,previousChatId:chatId.current})});
      const j=await r.json();
      if(!r.ok)throw new Error(j.detail??j.error??'Chat failed');
      chatId.current=j.chatId;setMsgs(m=>[...m,{who:'agent',text:j.reply}]);
    }catch(err){setMsgs(m=>[...m,{who:'agent',text:'Error: '+(err instanceof Error?err.message:String(err))}])}
    setBusy(false);
  }
  return(<div className="flex min-h-0 flex-1 flex-col">
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      {msgs.length===0&&<p className="text-sm text-slate-500">Send a message to start chatting.</p>}
      {msgs.map((m,i)=>(<div key={i} className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${m.who==='you'?'ml-auto bg-emerald-700':'bg-slate-800'}`}>{m.text}</div>))}
      {busy&&<div className="text-sm text-slate-500">Typing…</div>}<div ref={end}/>
    </div>
    <form onSubmit={send} className="flex gap-2 border-t border-slate-800 p-3">
      <input value={text} onChange={e=>setText(e.target.value)} placeholder="Type a message" className={box}/>
      <button disabled={busy} className="rounded bg-emerald-600 px-4 text-sm font-medium disabled:opacity-50">Send</button>
    </form></div>);
}
function VoiceTab({assistantId}:{assistantId:string}){
  const [state,setState]=useState<'idle'|'connecting'|'live'>('idle');const [lines,setLines]=useState<string[]>([]);const [err,setErr]=useState('');
  const vapi=useRef<{stop:()=>void}|null>(null);
  const key=process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
  useEffect(()=>()=>{vapi.current?.stop()},[]);
  async function start(){
    setErr('');setLines([]);setState('connecting');
    try{
      const {default:Vapi}=await import('@vapi-ai/web');
      const v=new Vapi(key as string);vapi.current=v;
      v.on('call-start',()=>setState('live'));
      v.on('call-end',()=>setState('idle'));
      v.on('error',(e:unknown)=>{setErr((e as {message?:string})?.message??'Call error');setState('idle')});
      v.on('message',(m:{type?:string;role?:string;transcript?:string;transcriptType?:string})=>{
        if(m.type==='transcript'&&m.transcriptType==='final')setLines(l=>[...l,`${m.role==='user'?'You':'Agent'}: ${m.transcript}`]);
      });
      await v.start(assistantId);
    }catch(e){setErr(e instanceof Error?e.message:String(e));setState('idle')}
  }
  if(!key)return<p className="m-4 rounded border border-amber-600/50 bg-amber-950/40 p-3 text-sm text-amber-300">Voice needs your Vapi <b>public</b> key. In Vercel, add <code>NEXT_PUBLIC_VAPI_PUBLIC_KEY</code> (type Config), then redeploy.</p>;
  return(<div className="flex min-h-0 flex-1 flex-col p-4">
    {state==='idle'?<button onClick={start} className="rounded bg-emerald-600 py-3 font-medium">Start voice call</button>
      :<button onClick={()=>vapi.current?.stop()} className="rounded bg-red-600 py-3 font-medium">{state==='connecting'?'Connecting… (tap to cancel)':'End call'}</button>}
    <p className="mt-2 text-xs text-slate-500">Your browser will ask for microphone access.</p>
    {err&&<p role="alert" className="mt-3 text-sm text-amber-400">{err}</p>}
    <div className="mt-4 flex-1 space-y-2 overflow-y-auto text-sm">{lines.map((l,i)=><p key={i} className="rounded bg-slate-800 px-3 py-2">{l}</p>)}</div>
  </div>);
}
function TaskTab({slug}:{slug:string}){
  const [title,setTitle]=useState('');const [ins,setIns]=useState('');const [busy,setBusy]=useState(false);
  const [result,setResult]=useState('');const [err,setErr]=useState('');
  async function go(e:React.FormEvent){
    e.preventDefault();setBusy(true);setErr('');setResult('');
    try{
      const r=await fetch('/api/tasks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({agentSlug:slug,title,instructions:ins})});
      const j=await r.json();
      if(!r.ok)throw new Error(j.detail??j.error??'Task failed');
      if(j.task.status==='failed')setErr(j.task.result);else{setResult(j.task.result);setTitle('');setIns('')}
    }catch(e2){setErr(e2 instanceof Error?e2.message:String(e2))}
    setBusy(false);
  }
  return(<form onSubmit={go} className="flex-1 space-y-3 overflow-y-auto p-4">
    <label className="block text-sm">Task title<input required value={title} onChange={e=>setTitle(e.target.value)} className={box+' mt-1'}/></label>
    <label className="block text-sm">Instructions<textarea rows={5} value={ins} onChange={e=>setIns(e.target.value)} className={box+' mt-1'}/></label>
    <button disabled={busy} className="w-full rounded bg-emerald-600 py-2 font-medium disabled:opacity-50">{busy?'Working…':'Assign task'}</button>
    {err&&<p role="alert" className="text-sm text-amber-400">{err}</p>}
    {result&&<div className="rounded border border-slate-700 bg-slate-800 p-3 text-sm"><div className="mb-1 text-xs text-slate-400">Result</div><p className="whitespace-pre-wrap">{result}</p></div>}
    <Link href="/tasks" className="block text-sm text-slate-400 underline">View all tasks</Link>
  </form>);
}
