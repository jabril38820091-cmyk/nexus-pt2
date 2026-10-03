'use client';
import {useEffect,useState} from 'react';import {useStatusStore} from '@/lib/agents/status-store';
type P={x:number;y:number};
const pos=(id:string,box:DOMRect):P|null=>{const e=document.querySelector(`[data-agent-id="${id}"]`);if(!e)return null;const r=e.getBoundingClientRect();return{x:r.left-box.left+r.width/2,y:r.top-box.top+r.height/2}};
export function HandoffLayer(){
 const h=useStatusStore(s=>s.lastHandoff);const [d,setD]=useState<string|null>(null);
 useEffect(()=>{if(!h)return;const box=document.querySelector('[data-office-container]')?.getBoundingClientRect();if(!box)return;
  const a=pos(h.from,box),b=pos(h.to,box);if(!a||!b)return;
  setD(`M${a.x} ${a.y} Q${(a.x+b.x)/2} ${Math.min(a.y,b.y)-50} ${b.x} ${b.y}`);const t=setTimeout(()=>setD(null),1400);return()=>clearTimeout(t)},[h]);
 return<svg className="pointer-events-none absolute inset-0 h-full w-full">{d&&<><path d={d} fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 6"/><circle r={5} fill="#60a5fa"><animateMotion dur="1s" path={d} fill="freeze"/></circle></>}</svg>;}
