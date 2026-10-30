/* eslint-disable @typescript-eslint/no-explicit-any */
const label=(role:string)=>role==='user'?'Caller':'Agent';
const tidy=(s:unknown)=>String(s??'').replace(/\s+/g,' ').trim();
/** Turns the conversation Vapi sends at the end of a call into readable "Agent:" and "Caller:" lines. */
export function transcriptFromArtifact(a:any):string{
  if(!a)return'';
  const msgs:any[]=Array.isArray(a.messages)?a.messages:[];
  let lines=msgs.filter(m=>m&&['assistant','bot','user'].includes(m.role)).map(m=>{const t=tidy(m.message??m.content);return t?`${label(m.role)}: ${t}`:''}).filter(Boolean);
  if(!lines.length&&Array.isArray(a.transcript))lines=a.transcript.filter((m:any)=>m&&['assistant','bot','user'].includes(m.role)).map((m:any)=>{const t=tidy(m.message??m.content);return t?`${label(m.role)}: ${t}`:''}).filter(Boolean);
  if(!lines.length&&typeof a.transcript==='string')lines=a.transcript.split(/\n+/).map((l:string)=>tidy(l).replace(/^AI:\s*/i,'Agent: ').replace(/^User:\s*/i,'Caller: ')).filter(Boolean);
  return lines.join('\n').slice(0,20000);
}
/** Hides long digit runs (phone, card and account numbers) before text is shown to an AI summary. */
export const maskSensitive=(s:string)=>s.replace(/\+?\(?\d[\d\s().-]{7,}\d/g,'[number]');
