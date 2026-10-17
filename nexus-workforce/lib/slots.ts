import {localParts,zonedToUtc,dayLabel,timeLabel} from '@/lib/tz';
export type Hours=Record<string,{open:boolean;from:string;to:string}>;
export type Day={y:number;m:number;d:number};
export type Cfg={hours:Hours|null;tz:string;duration:number;buffer:number;minNoticeH:number;maxDays:number};
export type Busy={start:Date;end:Date};
const DOW=['sun','mon','tue','wed','thu','fri','sat'];
const NAMES=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
export const addDays=(day:Day,n:number):Day=>{const t=new Date(Date.UTC(day.y,day.m-1,day.d+n));return{y:t.getUTCFullYear(),m:t.getUTCMonth()+1,d:t.getUTCDate()}};
const dowOf=(day:Day)=>new Date(Date.UTC(day.y,day.m-1,day.d)).getUTCDay();
/** Understands "today", "tomorrow", a weekday name, "next week", or YYYY-MM-DD. Empty means today. */
export function parseDateInput(input:string|null|undefined,tz:string,now:Date):Day|null{
  const t=localParts(now,tz);const today:Day={y:t.y,m:t.m,d:t.d};
  const s=String(input??'').trim().toLowerCase();
  if(!s||s==='today')return today;
  if(s==='tomorrow')return addDays(today,1);
  if(s==='next week')return addDays(today,((8-t.dow)%7)||7);
  const iso=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if(iso){const d:Day={y:+iso[1],m:+iso[2],d:+iso[3]};const c=addDays(d,0);return c.y===d.y&&c.m===d.m&&c.d===d.d?d:null}
  const k=NAMES.findIndex(n=>n===s||n.slice(0,3)===s||s==='this '+n||s==='next '+n);
  if(k>=0){const plusWeek=s.startsWith('next ')?7:0;return addDays(today,((k-t.dow+7)%7)+plusWeek)}
  return null;
}
const mins=(hhmm:string)=>{const m=/^(\d{1,2}):(\d{2})$/.exec(hhmm??'');return m?Number(m[1])*60+Number(m[2]):null};
/** Every start time that is free on one day, honouring hours, length, buffers, notice and the booking window. */
export function slotsForDay(cfg:Cfg,day:Day,busy:Busy[],now:Date):Date[]{
  const h=cfg.hours?.[DOW[dowOf(day)]];
  if(!h||!h.open)return[];
  const from=mins(h.from),to=mins(h.to);
  if(from==null||to==null||to<=from)return[];
  const step=Math.min(cfg.duration,30);
  const earliest=now.getTime()+cfg.minNoticeH*3600_000,latest=now.getTime()+cfg.maxDays*86400_000;
  const out:Date[]=[];
  for(let t=from;t+cfg.duration<=to;t+=step){
    const s=zonedToUtc(day.y,day.m,day.d,Math.floor(t/60),t%60,cfg.tz);
    if(!s)continue;
    const st=s.getTime(),en=st+cfg.duration*60000;
    if(st<earliest||st>latest)continue;
    const clash=busy.some(b=>st<b.end.getTime()+cfg.buffer*60000&&en+cfg.buffer*60000>b.start.getTime());
    if(!clash)out.push(s);
  }
  return out;
}
/** Picks up to n times spread across the day, so the agent can offer a morning, midday and afternoon choice. */
export function spread<T>(list:T[],n:number):T[]{
  if(list.length<=n)return list;
  return Array.from({length:n},(_,i)=>list[Math.round(i*(list.length-1)/(n-1))]);
}
export const slotLabel=(at:Date,tz:string)=>`${dayLabel(at,tz)} at ${timeLabel(at,tz)}`;
