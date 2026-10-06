'use client';
import {motion} from 'framer-motion';
const SKIN=['#f5d0b0','#e8b48a','#c98a5a','#8d5524','#fbe0c8'];
const HAIR=['#2b2118','#5a3825','#a0522d','#d9a441','#1c1c28','#7a3b1d'];
const hash=(s:string)=>{let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h};
const ORIGIN={transformBox:'fill-box' as const,transformOrigin:'center'};
/** A cartoon office worker in a 60x68 box. Render inside an <svg>. Each worker has their own look and idle rhythm. */
export function MiniAgent({id,color,status}:{id:string;color:string;status:string}){
  const h=hash(id);const skin=SKIN[h%5],hair=HAIR[(h>>3)%6],style=(h>>6)%4,glasses=(h>>9)%4===0,tie=(h>>11)%3===0;
  const wait=(h%7)*0.9;
  const live=status==='on_call',think=status==='thinking',xfer=status==='transferring',idle=!live&&!think&&!xfer;
  const arm=(side:'l'|'r')=>{
    const x=side==='l'?7:44,d=side==='l'?0:0.22;
    const anim=live?{y:[0,-3,0]}:xfer?{y:[0,-14,0]}:idle?{y:[0,0,-10,-10,0,0]}:{y:0};
    const tr=live?{duration:0.45,repeat:Infinity,delay:d}:xfer?{duration:0.6,repeat:Infinity}:idle?{duration:11,repeat:Infinity,times:[0,0.8,0.85,0.93,0.98,1],delay:wait}:{};
    return(<motion.g animate={anim} transition={tr}><rect x={x} y="44" width="9" height="21" rx="4.5" fill={color}/><rect x={x} y="44" width="9" height="21" rx="4.5" fill="#000" opacity=".1"/><circle cx={x+4.5} cy="65" r="4.6" fill={skin}/></motion.g>);
  };
  return(<motion.g animate={{y:live?[0,-1.5,0]:[0,-1,0]}} transition={{duration:live?0.6:3.4,repeat:Infinity,ease:'easeInOut',delay:wait/3}}>
    {style===1&&<><rect x="13" y="15" width="8" height="30" rx="4" fill={hair}/><rect x="39" y="15" width="8" height="30" rx="4" fill={hair}/></>}
    {style===2&&<circle cx="30" cy="7" r="6.5" fill={hair}/>}
    {style===3&&<ellipse cx="30" cy="16" rx="19" ry="14" fill={hair}/>}
    <path d="M12 68 C12 48 18 40 30 40 C42 40 48 48 48 68Z" fill={color}/>
    <path d="M12 68 C12 48 18 40 30 40 C42 40 48 48 48 68Z" fill="#000" opacity=".06"/>
    <rect x="26" y="33" width="8" height="9" rx="3" fill={skin}/>
    <path d="M23.5 40 L30 49 L36.5 40Z" fill="#fff8ee"/>
    {tie&&<path d="M29 47 L31 47 L32.4 58 L30 61 L27.6 58Z" fill="#8b2b2b"/>}
    {arm('l')}{arm('r')}
    <motion.g animate={live?{rotate:[-2.5,2.5,-2.5]}:{rotate:[0,0,0]}} transition={{duration:1.1,repeat:Infinity,ease:'easeInOut'}} style={{transformBox:'fill-box',transformOrigin:'50% 100%'}}>
      <circle cx="16.4" cy="26" r="3.3" fill={skin}/><circle cx="43.6" cy="26" r="3.3" fill={skin}/>
      <circle cx="30" cy="24" r="14" fill={skin}/>
      {style!==3&&<path d="M16 23 C14.5 5 45.5 5 44 23 C40.5 14 19.5 14 16 23Z" fill={hair}/>}
      {style===3&&<path d="M17 21 C18 11 42 11 43 21 C38 16 22 16 17 21Z" fill={hair}/>}
      <ellipse cx="21" cy="31.5" rx="2.6" ry="1.6" fill="#f08a84" opacity=".35"/><ellipse cx="39" cy="31.5" rx="2.6" ry="1.6" fill="#f08a84" opacity=".35"/>
      <motion.g animate={{scaleY:[1,1,0.1,1]}} transition={{duration:4.2,repeat:Infinity,times:[0,0.92,0.96,1],delay:wait}} style={ORIGIN}>
        <ellipse cx="24.5" cy="25.5" rx="3" ry="3.3" fill="#fff"/><ellipse cx="35.5" cy="25.5" rx="3" ry="3.3" fill="#fff"/>
        <motion.g animate={{x:[0,0,1.3,1.3,-1.1,-1.1,0]}} transition={{duration:7,repeat:Infinity,delay:wait}}><circle cx="24.5" cy="26" r="1.7" fill="#2a1f17"/><circle cx="35.5" cy="26" r="1.7" fill="#2a1f17"/></motion.g>
      </motion.g>
      <motion.g animate={{y:think?-1.6:0}}><path d="M20.5 20.2 q4 -2.4 8 0" fill="none" stroke={hair} strokeWidth="1.5" strokeLinecap="round"/><path d="M31.5 20.2 q4 -2.4 8 0" fill="none" stroke={hair} strokeWidth="1.5" strokeLinecap="round"/></motion.g>
      {glasses&&<g fill="none" stroke="#2a1f17" strokeWidth="1"><circle cx="24.5" cy="25.7" r="4.5"/><circle cx="35.5" cy="25.7" r="4.5"/><path d="M29 25.5h2"/></g>}
      {live?<motion.ellipse cx="30" cy="33" rx="3.2" ry="1.6" fill="#7a2323" animate={{scaleY:[1,2,1]}} transition={{duration:0.34,repeat:Infinity}} style={ORIGIN}/>:<path d="M26 32 q4 3.6 8 0" fill="none" stroke="#7a2323" strokeWidth="1.4" strokeLinecap="round"/>}
      {live&&<g fill="none" stroke="#2a2e3a" strokeWidth="2.2" strokeLinecap="round"><path d="M14.5 24 a15.5 15.5 0 0 1 31 0"/><path d="M14.5 25 v6 M45.5 25 v6"/><path d="M45.5 31 q0 5 -8 6" strokeWidth="1.5"/><circle cx="36.5" cy="37" r="1.6" fill="#2a2e3a"/></g>}
    </motion.g>
    {think&&[0,1,2].map(i=>(<motion.circle key={i} cx={22+i*8} cy={-3} r="2.4" fill="#e0a21c" animate={{opacity:[0.2,1,0.2]}} transition={{duration:0.9,repeat:Infinity,delay:i*0.18}}/>))}
  </motion.g>);
}
