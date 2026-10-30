/** Offset in minutes of a time zone from UTC at a given instant. */
export function tzOffsetMin(tz:string,at:Date):number{
  const p=new Intl.DateTimeFormat('en-US',{timeZone:tz,hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}).formatToParts(at);
  const g=(t:string)=>Number(p.find(x=>x.type===t)!.value);
  return Math.round((Date.UTC(g('year'),g('month')-1,g('day'),g('hour'),g('minute'),g('second'))-at.getTime())/60000);
}
export function validZone(tz?:string|null):string{
  const z=tz||'UTC';try{new Intl.DateTimeFormat('en-US',{timeZone:z});return z}catch{return'UTC'}
}
export type Parts={y:number;m:number;d:number;hh:number;mm:number;dow:number};
/** The calendar date and clock time of an instant in a zone. dow: 0 is Sunday. */
export function localParts(at:Date,tz:string):Parts{
  const z=validZone(tz);
  const p=new Intl.DateTimeFormat('en-US',{timeZone:z,hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).formatToParts(at);
  const g=(t:string)=>Number(p.find(x=>x.type===t)!.value);
  const y=g('year'),m=g('month'),d=g('day');
  return{y,m,d,hh:g('hour'),mm:g('minute'),dow:new Date(Date.UTC(y,m-1,d)).getUTCDay()};
}
/** When today began in the given zone. */
export function startOfDay(tz:string|null|undefined,now=new Date()):Date{
  const zone=validZone(tz);const {y,m,d}=localParts(now,zone);
  let guess=new Date(Date.UTC(y,m-1,d));
  for(let i=0;i<2;i++)guess=new Date(Date.UTC(y,m-1,d)-tzOffsetMin(zone,guess)*60000);
  return guess;
}
/** The instant for a local date and time in a zone, or null if that clock time does not exist (a daylight saving gap). */
export function zonedToUtc(y:number,m:number,d:number,hh:number,mm:number,tz:string):Date|null{
  const zone=validZone(tz);
  let g=new Date(Date.UTC(y,m-1,d,hh,mm));
  for(let i=0;i<2;i++)g=new Date(Date.UTC(y,m-1,d,hh,mm)-tzOffsetMin(zone,g)*60000);
  const l=localParts(g,zone);
  return l.y===y&&l.m===m&&l.d===d&&l.hh===hh&&l.mm===mm?g:null;
}
export const dayLabel=(at:Date,tz:string)=>new Intl.DateTimeFormat('en-US',{timeZone:validZone(tz),weekday:'long',month:'long',day:'numeric'}).format(at);
export const timeLabel=(at:Date,tz:string)=>new Intl.DateTimeFormat('en-US',{timeZone:validZone(tz),hour:'numeric',minute:'2-digit'}).format(at);
