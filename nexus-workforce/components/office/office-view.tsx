'use client';
import {motion,AnimatePresence} from 'framer-motion';
import {DEPARTMENTS,ROSTER,type AgentRoster,type DepartmentId} from '@/lib/agents/roster';
import {useStatusStore} from '@/lib/agents/status-store';
import {HandoffLayer} from './handoff-layer';
const COLORS:Record<string,string>={idle:'#64748b',on_call:'#22c55e',thinking:'#eab308',transferring:'#3b82f6',offline:'#334155'};
function Desk({agent,onSelect}:{agent:AgentRoster;onSelect?:(a:AgentRoster)=>void}){
 const status=useStatusStore(s=>s.statuses[agent.id]??'idle');
 const call=useStatusStore(s=>Object.values(s.activeCalls).find(c=>c.currentAgentId===agent.id));
 const live=status==='on_call';
 return(<div className="relative cursor-pointer rounded-lg p-1 text-center transition hover:bg-slate-800/60" data-agent-id={agent.id} role="button" tabIndex={0} aria-label={`Open ${agent.name}`} onClick={()=>onSelect?.(agent)} onKeyDown={e=>{if(e.key==='Enter')onSelect?.(agent)}}>
  <div className="mx-auto h-10 w-16 rounded-sm border bg-slate-950 transition-all" style={{borderColor:live?agent.avatarColor:'#334155',boxShadow:live?`0 0 12px ${agent.avatarColor}80`:'none'}}/>
  <div className="mx-auto mt-1 h-1.5 w-20 rounded-sm bg-slate-700"/>
  <div className="mx-auto mt-1 h-3 w-3 rounded-full border-2" style={{background:agent.avatarColor,borderColor:COLORS[status]}}/>
  <div className="text-[10px] text-slate-400">{agent.name}</div>
  <AnimatePresence>{call&&<motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="absolute -top-8 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-600 bg-slate-800 px-2 py-0.5 text-[10px]">{call.snippet.slice(0,40)||'Listening…'}</motion.div>}</AnimatePresence>
 </div>);}
export function OfficeView({onSelect}:{onSelect?:(a:AgentRoster)=>void}={}){
 const rev=useStatusStore(s=>s.revenueCents);
 const rooms=(Object.keys(DEPARTMENTS) as DepartmentId[]).filter(d=>d!=='lobby');
 return(<div data-office-container className="relative mx-auto max-w-[1400px] p-6">
  <div className="mb-4 flex items-baseline justify-between"><h1 className="text-2xl font-semibold">Nexus Workforce</h1><div className="text-emerald-400">Revenue captured: ${(rev/100).toLocaleString()}</div></div>
  <div className="mb-6 flex justify-center rounded-2xl border border-slate-700 bg-slate-900/60 p-5">{ROSTER.filter(a=>a.department==='lobby').map(a=><Desk key={a.id} agent={a} onSelect={onSelect}/>)}</div>
  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{rooms.map(d=>(
   <div key={d} className="rounded-2xl border bg-slate-900/50 p-4" style={{borderColor:`${DEPARTMENTS[d].color}40`}}>
    <div className="mb-8 text-sm font-medium">{DEPARTMENTS[d].icon} {DEPARTMENTS[d].label}</div>
    <div className="grid grid-cols-2 gap-x-3 gap-y-8">{ROSTER.filter(a=>a.department===d).map(a=><Desk key={a.id} agent={a} onSelect={onSelect}/>)}</div>
   </div>))}</div>
  <HandoffLayer/></div>);}
