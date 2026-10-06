'use client';
import {useEffect,useRef,useState} from 'react';
import {motion,AnimatePresence} from 'framer-motion';
import {DEPARTMENTS,ROSTER,type AgentRoster,type DepartmentId} from '@/lib/agents/roster';
import {useStatusStore} from '@/lib/agents/status-store';
import {CountUp} from '@/components/count-up';
import {MiniAgent} from './mini-agent';
import {HandoffLayer} from './handoff-layer';
const RING:Record<string,string>={idle:'#64748b',on_call:'#22c55e',thinking:'#eab308',transferring:'#3b82f6',offline:'#334155'};
const SCREEN:Record<string,string>={lobby:'☎️',sales:'📈',marketing:'📣',success:'💬',operations:'⚙️',finance:'💰',executive:'📊'};
function Scene({agent,status,locked}:{agent:AgentRoster;status:string;locked:boolean}){
  const live=status==='on_call',c=agent.avatarColor,dept=agent.department;
  return(<svg viewBox="0 0 170 124" className="w-full" aria-hidden="true" style={{opacity:locked?0.4:1,filter:locked?'grayscale(1)':undefined}}>
    <ellipse cx="85" cy="116" rx="70" ry="6" fill="#000" opacity=".25"/>
    <g transform="translate(70 14) scale(.98)"><MiniAgent id={agent.id} color={c} status={status}/></g>
    <rect x="8" y="76" width="154" height="14" rx="5" fill="#8b6b4a"/><rect x="16" y="90" width="138" height="24" rx="4" fill="#6f5439"/>
    <rect x="76" y="96" width="18" height="3" rx="1.5" fill="#4b3a28"/>
    <rect x="34" y="68" width="14" height="9" fill="#334155"/>
    <rect x="12" y="30" width="60" height="40" rx="5" fill="#0b1220" stroke={live?c:'#334155'} strokeWidth="2"/>
    {live&&<rect x="12" y="30" width="60" height="40" rx="5" fill={c} opacity=".12"/>}
    <motion.text x="42" y="58" textAnchor="middle" fontSize="20" animate={live?{scale:[1,1.15,1]}:{scale:1}} transition={{duration:1,repeat:Infinity}} style={{transformBox:'fill-box',transformOrigin:'center',opacity:live?1:0.55}}>{SCREEN[dept]}</motion.text>
    {live&&[0,1,2,3].map(i=>(<motion.rect key={i} x={22+i*10} y={58} width="6" height="9" rx="1" fill={c} style={{transformBox:'fill-box',transformOrigin:'bottom'}} animate={{scaleY:[0.25,1,0.25]}} transition={{duration:0.7,repeat:Infinity,delay:i*0.12}}/>))}
    <rect x="86" y="80" width="42" height="5" rx="2" fill="#475569"/>
    <rect x="140" y="66" width="11" height="10" rx="2" fill="#e2e8f0"/><path d="M151 69 q5 0 0 5" fill="none" stroke="#e2e8f0" strokeWidth="1.5"/>
    {status==='idle'&&[0,1].map(i=>(<motion.path key={i} d={`M${143+i*4} 64 q-3 -4 0 -8`} fill="none" stroke="#94a3b8" strokeWidth="1" animate={{opacity:[0,.7,0],y:[0,-4,-8]}} transition={{duration:2.4,repeat:Infinity,delay:i*0.8}}/>))}
    <circle cx="160" cy="14" r="6" fill={RING[status]??RING.idle}/>
    {live&&<motion.circle cx="160" cy="14" r="6" fill="none" stroke={RING.on_call} style={{transformBox:'fill-box',transformOrigin:'center'}} animate={{scale:[1,2.3],opacity:[.8,0]}} transition={{duration:1.2,repeat:Infinity}}/>}
  </svg>);
}
function Desk({agent,onSelect,allowed,big}:{agent:AgentRoster;onSelect?:(a:AgentRoster)=>void;allowed?:Set<string>|null;big?:boolean}){
  const status=useStatusStore(s=>s.statuses[agent.id]??'idle');
  const call=useStatusStore(s=>Object.values(s.activeCalls).find(x=>x.currentAgentId===agent.id));
  const locked=!!allowed&&!allowed.has(agent.id);
  return(<div data-agent-id={agent.id} role="button" tabIndex={0} aria-label={`Open ${agent.name}`} onClick={()=>onSelect?.(agent)} onKeyDown={e=>{if(e.key==='Enter')onSelect?.(agent)}}
    className={`relative mx-auto cursor-pointer rounded-xl p-1 text-center transition hover:bg-white/5 ${big?'w-60':'w-full max-w-[190px]'}`}>
    <AnimatePresence>{call&&<motion.div initial={{opacity:0,y:6,scale:.9}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0}} className="absolute -top-2 left-1/2 z-20 w-max max-w-[165px] -translate-x-1/2 rounded-2xl border border-slate-500 bg-slate-800 px-3 py-1 text-[11px] leading-snug text-slate-100 shadow-lg">{call.snippet?.slice(0,60)||'Listening…'}</motion.div>}</AnimatePresence>
    <Scene agent={agent} status={status} locked={locked}/>
    <div className="-mt-1 text-xs font-medium text-slate-200">{locked?'🔒 ':''}{agent.name}</div>
    <div className="text-[10px] text-slate-500">{agent.role}</div>
  </div>);
}
export function OfficeView({onSelect,allowed}:{onSelect?:(a:AgentRoster)=>void;allowed?:Set<string>|null}={}){
  const rev=useStatusStore(s=>s.revenueCents);const statuses=useStatusStore(s=>s.statuses);
  const prev=useRef(rev);const [pops,setPops]=useState<{id:number;amt:number}[]>([]);
  useEffect(()=>{if(rev>prev.current){const id=Date.now(),amt=rev-prev.current;setPops(p=>[...p,{id,amt}]);setTimeout(()=>setPops(p=>p.filter(x=>x.id!==id)),2600)}prev.current=rev},[rev]);
  const rooms=(Object.keys(DEPARTMENTS) as DepartmentId[]).filter(d=>d!=='lobby');
  const working=ROSTER.filter(a=>statuses[a.id]==='on_call').length;
  const lobby=ROSTER.find(a=>a.department==='lobby')!;
  return(<div data-office-container className="relative mx-auto max-w-[1400px] overflow-hidden rounded-3xl p-5" style={{background:'radial-gradient(1200px 600px at 50% 0%,#1e293b 0%,#0f172a 60%,#020617 100%)'}}>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-xl font-semibold">Your live office</h1><p className="text-sm text-slate-400">{working>0?`${working} agent${working>1?'s':''} on a call right now`:'All quiet. Your agents are standing by.'}</p></div>
      <div className="relative rounded-2xl border border-emerald-700/50 bg-emerald-950/40 px-4 py-2 text-right"><div className="text-xs text-emerald-300/80">Revenue captured</div>
        <div className="text-2xl font-bold text-emerald-400"><CountUp value={rev/100} prefix="$"/></div>
        <AnimatePresence>{pops.map(p=>(<motion.div key={p.id} initial={{opacity:1,y:0}} animate={{opacity:0,y:-44}} exit={{opacity:0}} transition={{duration:2.4}} className="pointer-events-none absolute right-3 top-0 text-lg font-bold text-yellow-300">+${(p.amt/100).toLocaleString()} 🪙</motion.div>))}</AnimatePresence></div>
    </div>
    <div className="mb-5 rounded-2xl border p-3" style={{borderColor:DEPARTMENTS.lobby.color+'55',background:`linear-gradient(180deg,${DEPARTMENTS.lobby.color}18,transparent)`}}>
      <div className="mb-1 text-sm font-medium">{DEPARTMENTS.lobby.icon} Front desk</div><div className="pt-8"><Desk agent={lobby} onSelect={onSelect} allowed={allowed} big/></div></div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{rooms.map(d=>{const agents=ROSTER.filter(a=>a.department===d);const act=agents.filter(a=>statuses[a.id]==='on_call').length;
      return(<section key={d} className="rounded-2xl border p-3" style={{borderColor:DEPARTMENTS[d].color+'55',background:`linear-gradient(180deg,${DEPARTMENTS[d].color}1f,transparent 70%)`}}>
        <div className="mb-2 flex items-center justify-between"><span className="text-sm font-medium">{DEPARTMENTS[d].icon} {DEPARTMENTS[d].label}</span>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{background:DEPARTMENTS[d].color+'25',color:DEPARTMENTS[d].color}}>{act}/{agents.length} working</span></div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-6 pt-7">{agents.map(a=><Desk key={a.id} agent={a} onSelect={onSelect} allowed={allowed}/>)}</div></section>);})}</div>
    <HandoffLayer/></div>);
}
