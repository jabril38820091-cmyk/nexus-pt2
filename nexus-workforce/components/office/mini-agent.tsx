'use client';
import {motion} from 'framer-motion';
const SKIN=['#f2c9a0','#e0a878','#c68642','#8d5524','#f6d6bd'];
const HAIR=['#2b2118','#5a3825','#a0522d','#d9a441','#1c1c28'];
const hash=(s:string)=>{let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h};
/** A little cartoon worker, drawn in a 60x64 box. Render inside an <svg>. */
export function MiniAgent({id,color,status}:{id:string;color:string;status:string}){
  const h=hash(id);const skin=SKIN[h%5],hair=HAIR[(h>>3)%5],style=(h>>6)%3,glasses=(h>>9)%4===0;
  const live=status==='on_call',think=status==='thinking',xfer=status==='transferring';
  const type={y:[0,-3,0]};
  return(<motion.g animate={{y:live?[0,-1.5,0]:[0,-1,0]}} transition={{duration:live?0.6:3.2,repeat:Infinity,ease:'easeInOut'}}>
    <rect x="14" y="36" width="32" height="30" rx="10" fill={color}/>
    <motion.rect x="7" y="42" width="9" height="16" rx="4.5" fill={color} animate={live?type:xfer?{y:[0,-8,0]}:{y:0}} transition={{duration:0.45,repeat:Infinity}}/>
    <motion.rect x="44" y="42" width="9" height="16" rx="4.5" fill={color} animate={live?type:{y:0}} transition={{duration:0.45,repeat:Infinity,delay:0.22}}/>
    {style===1&&<><rect x="14" y="18" width="7" height="26" rx="3.5" fill={hair}/><rect x="39" y="18" width="7" height="26" rx="3.5" fill={hair}/></>}
    {style===2&&<circle cx="30" cy="7" r="6" fill={hair}/>}
    <circle cx="30" cy="24" r="14" fill={skin}/>
    <path d="M16 24 C16 6 44 6 44 24 C40 15 20 15 16 24Z" fill={hair}/>
    <motion.g animate={{scaleY:[1,1,0.1,1]}} transition={{duration:4,repeat:Infinity,times:[0,0.9,0.95,1]}} style={{transformBox:'fill-box',transformOrigin:'center'}}>
      <circle cx="24.5" cy="26" r="1.8" fill="#1f2937"/><circle cx="35.5" cy="26" r="1.8" fill="#1f2937"/></motion.g>
    {glasses&&<g fill="none" stroke="#1f2937" strokeWidth="1"><circle cx="24.5" cy="26" r="4.2"/><circle cx="35.5" cy="26" r="4.2"/><path d="M28.7 26h2.6"/></g>}
    <motion.ellipse cx="30" cy="33" rx="3" ry="1.3" fill="#7f1d1d" animate={live?{scaleY:[1,2.2,1]}:{scaleY:1}} style={{transformBox:'fill-box',transformOrigin:'center'}} transition={{duration:0.35,repeat:Infinity}}/>
    {live&&<g fill="none" stroke="#0f172a" strokeWidth="2"><path d="M14 24 a16 16 0 0 1 32 0"/><path d="M15 25 v6 M45 25 v6"/><path d="M45 31 q0 5 -8 6" strokeWidth="1.4"/></g>}
    {think&&[0,1,2].map(i=>(<motion.circle key={i} cx={22+i*8} cy={-2} r="2.4" fill="#facc15" animate={{opacity:[0.2,1,0.2]}} transition={{duration:0.9,repeat:Infinity,delay:i*0.18}}/>))}
  </motion.g>);
}
