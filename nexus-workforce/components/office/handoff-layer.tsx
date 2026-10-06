'use client';
import {useEffect,useState} from 'react';
import {useStatusStore} from '@/lib/agents/status-store';
type P={x:number;y:number};
const pos=(id:string,box:DOMRect):P|null=>{const e=document.querySelector(`[data-agent-id="${id}"]`);if(!e)return null;const r=e.getBoundingClientRect();return{x:r.left-box.left+r.width/2,y:r.top-box.top+r.height/2}};
export function HandoffLayer(){
  const h=useStatusStore(s=>s.lastHandoff);const [d,setD]=useState<string|null>(null);
  useEffect(()=>{if(!h)return;const box=document.querySelector('[data-office-container]')?.getBoundingClientRect();if(!box)return;
    const a=pos(h.from,box),b=pos(h.to,box);if(!a||!b)return;
    setD(`M${a.x} ${a.y} Q${(a.x+b.x)/2} ${Math.min(a.y,b.y)-60} ${b.x} ${b.y}`);const t=setTimeout(()=>setD(null),1500);return()=>clearTimeout(t)},[h]);
  return<svg className="pointer-events-none absolute inset-0 z-30 h-full w-full">{d&&<>
    <path d={d} fill="none" stroke="#d9791c" strokeWidth={3} strokeDasharray="2 8" strokeLinecap="round" opacity=".85"/>
    <g><animateMotion dur="1.1s" path={d} fill="freeze"/>
      <ellipse cx="0" cy="13" rx="7" ry="2" fill="#000" opacity=".2"/>
      <circle cx="0" cy="-8" r="6" fill="#f5d0b0" stroke="#3b2a1a" strokeWidth="1"/><path d="M-6 -9 C-5 -16 5 -16 6 -9 C3 -12 -3 -12 -6 -9Z" fill="#5a3825"/>
      <rect x="-5.5" y="-2" width="11" height="13" rx="4.5" fill="#d9791c" stroke="#3b2a1a" strokeWidth="1"/>
      <text x="9" y="-12" fontSize="13">📞</text></g></>}</svg>;
}
