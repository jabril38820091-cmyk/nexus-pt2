/* eslint-disable @typescript-eslint/no-explicit-any */
import {goalLabels} from '@/lib/goals';
export const BEGIN='[[NEXUS_BUSINESS_PROFILE]]';
export const END='[[/NEXUS_BUSINESS_PROFILE]]';
const DAY_LABELS:Record<string,string>={mon:'Mon',tue:'Tue',wed:'Wed',thu:'Thu',fri:'Fri',sat:'Sat',sun:'Sun'};
const clean=(s:string)=>String(s).replace(/[\r\n]+/g,' ').trim().slice(0,80);
const stripMarkers=(s:string)=>s.split(BEGIN).join('').split(END).join('');
function hoursText(h:any):string{
  if(!h)return'';
  const parts=Object.keys(DAY_LABELS).filter(d=>h[d]?.open&&h[d].from&&h[d].to).map(d=>`${DAY_LABELS[d]} ${clean(h[d].from)}-${clean(h[d].to)}`);
  return parts.length?` Business hours: ${parts.join(', ')}.`:'';
}
export type ProfileInput={name:string;industry?:string|null;website?:string|null;timezone?:string|null;hours?:any;goals?:string[]|null;instructions?:string|null};
/** The text that tells an agent about the business it works for. */
export function profileBlock(c:ProfileInput):string{
  let t=`You work for ${clean(c.name)}${c.industry?`, a ${clean(c.industry)} business`:''}.${c.website?` Website: ${clean(c.website)}.`:''}${c.timezone?` Time zone: ${clean(c.timezone)}.`:''}${hoursText(c.hours)}`;
  const jobs=goalLabels(c.goals);
  if(jobs.length)t+=`\nYour main jobs here: ${jobs.join('; ')}. Stay focused on these jobs.`;
  const ins=c.instructions?stripMarkers(c.instructions).trim().slice(0,4000):'';
  if(ins)t+=`\nThe owner's notes about the business and rules to follow:\n${ins}`;
  return t;
}
/** Puts the profile block at the top of a prompt, replacing any earlier copy so it can be updated later. */
export function withProfile(content:string,block:string):string{
  const i=content.indexOf(BEGIN),j=content.indexOf(END);
  const rest=i>=0&&j>i?(content.slice(0,i)+content.slice(j+END.length)).replace(/^\s+/,''):content;
  return `${BEGIN}\n${stripMarkers(block)}\n${END}\n\n${rest}`;
}
