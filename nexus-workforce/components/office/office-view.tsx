'use client';
import {useEffect,useRef,useState} from 'react';
import {motion,AnimatePresence} from 'framer-motion';
import {DEPARTMENTS,ROSTER,type AgentRoster,type DepartmentId} from '@/lib/agents/roster';
import {useStatusStore} from '@/lib/agents/status-store';
import {CountUp} from '@/components/count-up';
import {MiniAgent} from './mini-agent';
import {HandoffLayer} from './handoff-layer';
const RING:Record<string,string>={idle:'#a8927a',on_call:'#22a55b',thinking:'#e0a21c',transferring:'#2f7fd1',offline:'#6b5846'};
const SCREEN:Record<string,string>={lobby:'☎️',sales:'📈',marketing:'📣',success:'💬',operations:'⚙️',finance:'💰',executive:'📊'};
const INK='#3b2a1a',SOFT='#7a6248';
const lum=(hex:string)=>{const n=parseInt(hex.slice(1),16);return(0.299*(n>>16)+0.587*((n>>8)&255)+0.114*(n&255))/255};
function Scene({agent,status,locked}:{agent:AgentRoster;status:string;locked:boolean}){
  const live=status==='on_call',c=agent.avatarColor,dept=agent.department;
  return(<svg viewBox="0 0 170 130" className="w-full" aria-hidden="true" style={{opacity:locked?0.45:1,filter:locked?'grayscale(1)':undefined}}>
    <ellipse cx="85" cy="123" rx="74" ry="6" fill="#5b3a1a" opacity=".2"/>
    <rect x="68" y="34" width="60" height="58" rx="18" fill={c} opacity=".6"/><rect x="68" y="34" width="60" height="58" rx="18" fill="#000" opacity=".12"/>
    <g transform="translate(68 12)"><MiniAgent id={agent.id} color={c} status={status}/></g>
    <rect x="6" y="82" width="158" height="13" rx="5" fill="#b9854f"/><rect x="6" y="82" width="158" height="4" rx="2" fill="#d6a86e"/>
    <rect x="14" y="95" width="142" height="26" rx="4" fill="#94653a"/><rect x="22" y="101" width="40" height="13" rx="2" fill="#7e5430"/><circle cx="42" cy="107" r="1.8" fill="#e9c58f"/><rect x="108" y="101" width="40" height="13" rx="2" fill="#7e5430"/><circle cx="128" cy="107" r="1.8" fill="#e9c58f"/>
    <rect x="38" y="77" width="10" height="6" fill="#2b2f3a"/>
    <rect x="12" y="34" width="62" height="44" rx="5" fill="#2b2f3a"/><rect x="16" y="38" width="54" height="36" rx="3" fill="#18212f"/>
    {live&&<rect x="16" y="38" width="54" height="36" rx="3" fill={c} opacity=".18"/>}
    <motion.text x="43" y="63" textAnchor="middle" fontSize="20" animate={live?{scale:[1,1.15,1]}:{scale:1}} transition={{duration:1,repeat:Infinity}} style={{transformBox:'fill-box',transformOrigin:'center',opacity:live?1:0.6}}>{SCREEN[dept]}</motion.text>
    {live&&[0,1,2,3].map(i=>(<motion.rect key={i} x={24+i*10} y={62} width="6" height="9" rx="1" fill={c} style={{transformBox:'fill-box',transformOrigin:'bottom'}} animate={{scaleY:[0.25,1,0.25]}} transition={{duration:0.7,repeat:Infinity,delay:i*0.12}}/>))}
    <rect x="86" y="85" width="38" height="5" rx="2" fill="#efe4d2"/>
    <rect x="132" y="70" width="11" height="12" rx="2" fill="#fff8ee"/><rect x="132" y="74" width="11" height="3" fill={c} opacity=".7"/><path d="M143 73 q5 0 0 6" fill="none" stroke="#fff8ee" strokeWidth="1.6"/>
    {status==='idle'&&[0,1].map(i=>(<motion.path key={i} d={`M${135+i*4} 66 q-3 -4 0 -8`} fill="none" stroke="#b9a68f" strokeWidth="1" animate={{opacity:[0,.8,0],y:[0,-4,-8]}} transition={{duration:2.4,repeat:Infinity,delay:i*0.8}}/>))}
    <rect x="150" y="73" width="12" height="9" rx="2" fill="#c4623c"/><ellipse cx="156" cy="70" rx="7" ry="5" fill="#4f9d5b"/><ellipse cx="152" cy="66" rx="4" ry="5" fill="#6bb36f"/>
    <circle cx="158" cy="14" r="6" fill={RING[status]??RING.idle}/>
    {live&&<motion.circle cx="158" cy="14" r="6" fill="none" stroke={RING.on_call} style={{transformBox:'fill-box',transformOrigin:'center'}} animate={{scale:[1,2.3],opacity:[.8,0]}} transition={{duration:1.2,repeat:Infinity}}/>}
  </svg>);
}
function Desk({agent,onSelect,allowed,big}:{agent:AgentRoster;onSelect?:(a:AgentRoster)=>void;allowed?:Set<string>|null;big?:boolean}){
  const status=useStatusStore(s=>s.statuses[agent.id]??'idle');
  const call=useStatusStore(s=>Object.values(s.activeCalls).find(x=>x.currentAgentId===agent.id));
  const locked=!!allowed&&!allowed.has(agent.id);
  return(<div data-agent-id={agent.id} role="button" tabIndex={0} aria-label={`Open ${agent.name}`} onClick={()=>onSelect?.(agent)} onKeyDown={e=>{if(e.key==='Enter')onSelect?.(agent)}}
    className={`relative mx-auto cursor-pointer rounded-xl p-1 text-center transition hover:bg-black/5 ${big?'w-60':'w-full max-w-[190px]'}`}>
    <div className="absolute -top-3 left-1/2 z-20 -translate-x-1/2"><AnimatePresence>{call&&<motion.div initial={{opacity:0,y:6,scale:.9}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0}} className="relative w-max max-w-[150px] rounded-2xl border bg-white px-3 py-1 text-[11px] leading-snug shadow-lg" style={{borderColor:'#e0cfae',color:INK}}>{call.snippet?.slice(0,60)||'Listening…'}<span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r bg-white" style={{borderColor:'#e0cfae'}}/></motion.div>}</AnimatePresence></div>
    <Scene agent={agent} status={status} locked={locked}/>
    <div className="-mt-1 text-xs font-semibold" style={{color:INK}}>{locked?'🔒 ':''}{agent.name}</div>
    <div className="text-[10px]" style={{color:SOFT}}>{agent.role}</div>
  </div>);
}
export function OfficeView({onSelect,allowed}:{onSelect?:(a:AgentRoster)=>void;allowed?:Set<string>|null}={}){
  const rev=useStatusStore(s=>s.revenueCents);const statuses=useStatusStore(s=>s.statuses);
  const prev=useRef(rev);const [pops,setPops]=useState<{id:number;amt:number}[]>([]);
  useEffect(()=>{if(rev>prev.current){const id=Date.now(),amt=rev-prev.current;setPops(p=>[...p,{id,amt}]);setTimeout(()=>setPops(p=>p.filter(x=>x.id!==id)),2600)}prev.current=rev},[rev]);
  const rooms=(Object.keys(DEPARTMENTS) as DepartmentId[]).filter(d=>d!=='lobby');
  const working=ROSTER.filter(a=>statuses[a.id]==='on_call').length;
  const lobby=ROSTER.find(a=>a.department==='lobby')!;
  const sign=(d:DepartmentId)=>({background:DEPARTMENTS[d].color,color:lum(DEPARTMENTS[d].color)>0.62?INK:'#fff'});
  return(<div data-office-container className="relative mx-auto max-w-[1400px] overflow-hidden rounded-3xl border-2" style={{borderColor:'#6a5040',background:'#d2a977'}}>
    <div className="relative px-5 pb-4 pt-4" style={{background:'linear-gradient(#f6ead6,#ecdcc0)',borderBottom:'8px solid #a97c4e'}}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-xl font-bold" style={{color:INK}}>Your live office</h1><p className="text-sm" style={{color:SOFT}}>{working>0?`${working} agent${working>1?'s':''} on a call right now`:'All quiet. Your team is at their desks.'}</p></div>
        <div className="relative rounded-2xl border-2 bg-white/80 px-4 py-2 text-right" style={{borderColor:'#c9a56e'}}><div className="text-xs" style={{color:SOFT}}>Revenue captured</div>
          <div className="text-2xl font-bold text-green-700"><CountUp value={rev/100} prefix="$"/></div>
          <AnimatePresence>{pops.map(p=>(<motion.div key={p.id} initial={{opacity:1,y:0}} animate={{opacity:0,y:-44}} exit={{opacity:0}} transition={{duration:2.4}} className="pointer-events-none absolute right-3 top-0 text-lg font-bold text-amber-600">+${(p.amt/100).toLocaleString()} 🪙</motion.div>))}</AnimatePresence></div>
      </div>
      <div className="mt-3 flex items-end justify-around gap-2" aria-hidden="true">{[0,1,2,3,4,5].map(i=>(<div key={i} className="relative hidden h-12 w-20 rounded-t-lg border-4 sm:block" style={{borderColor:'#b48a5a',background:'linear-gradient(#9fd3f0,#e9f5fb)'}}><span className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2" style={{background:'#b48a5a'}}/><span className="absolute inset-x-0 top-1/2 h-[3px]" style={{background:'#b48a5a'}}/></div>))}</div>
    </div>
    <div className="p-5" style={{background:'repeating-linear-gradient(90deg,#d2a977 0 118px,#c79d6a 118px 120px)'}}>
      <section className="relative mb-7 rounded-3xl p-3 pt-7" style={{background:'#f7eddb',border:`4px solid ${DEPARTMENTS.lobby.color}`,boxShadow:`0 6px 0 ${DEPARTMENTS.lobby.color}55`}}>
        <div className="absolute -top-3.5 left-5 rounded-full px-3 py-0.5 text-sm font-semibold" style={sign('lobby')}>{DEPARTMENTS.lobby.icon} Front desk</div>
        <div className="absolute left-1/2 top-14 h-28 w-80 -translate-x-1/2 rounded-[50%]" style={{background:"#8c5a3c26"}} aria-hidden="true"/><div className="absolute left-4 top-6 text-3xl" aria-hidden="true">🛋️</div><div className="absolute right-4 top-6 text-3xl" aria-hidden="true">🪴</div>
        <div className="pt-6"><Desk agent={lobby} onSelect={onSelect} allowed={allowed} big/></div></section>
      <div className="grid grid-cols-1 gap-x-5 gap-y-8 md:grid-cols-2 xl:grid-cols-3">{rooms.map(d=>{const agents=ROSTER.filter(a=>a.department===d);const act=agents.filter(a=>statuses[a.id]==='on_call').length;
        return(<section key={d} className="relative rounded-3xl p-3 pt-6" style={{background:'#f7eddb',border:`4px solid ${DEPARTMENTS[d].color}`,boxShadow:`0 6px 0 ${DEPARTMENTS[d].color}55`}}>
          <div className="absolute -top-3.5 left-5 rounded-full px-3 py-0.5 text-sm font-semibold" style={sign(d)}>{DEPARTMENTS[d].icon} {DEPARTMENTS[d].label}</div>
          <span className="absolute right-3 top-2 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium" style={{color:INK}}>{act}/{agents.length} working</span>
          <div className="grid grid-cols-2 gap-x-2 gap-y-6 pt-6">{agents.map((a,i)=>(<div key={a.id} className={i===agents.length-1&&agents.length%2===1?'col-span-2':''}><Desk agent={a} onSelect={onSelect} allowed={allowed}/></div>))}</div>
          <span className="absolute bottom-1.5 right-3 text-xl opacity-90" aria-hidden="true">🪴</span></section>);})}</div>
    </div>
    <HandoffLayer/></div>);
}
