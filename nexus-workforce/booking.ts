import 'server-only';
import {supabaseAdmin} from '@/lib/supabase/admin';
import {freeBusy,createEvent} from '@/lib/google-calendar';
import {fireEvent} from '@/lib/events';
import {normalizePhone} from '@/lib/phone';
import {validZone,localParts,zonedToUtc,dayLabel,timeLabel} from '@/lib/tz';
import {parseDateInput,slotsForDay,spread,slotLabel,addDays,type Cfg,type Busy} from '@/lib/slots';
type Setup={cfg:Cfg;calendarId:string}|{error:string};
async function setup(companyId:string):Promise<Setup>{
  const {data:s}=await supabaseAdmin.from('booking_settings').select('calendar_id,verified,enabled,duration_minutes,buffer_minutes,min_notice_hours,max_days_ahead').eq('company_id',companyId).maybeSingle();
  if(!s||!s.verified||s.enabled===false)return{error:'Appointment booking is not set up for this business yet. Offer to take a message instead.'};
  const {data:co}=await supabaseAdmin.from('companies').select('timezone,business_hours').eq('id',companyId).maybeSingle();
  if(!co?.business_hours)return{error:'The business has not set its opening hours yet. Offer to take a message instead.'};
  return{calendarId:s.calendar_id,cfg:{hours:co.business_hours,tz:validZone(co.timezone),duration:s.duration_minutes??30,buffer:s.buffer_minutes??0,minNoticeH:s.min_notice_hours??2,maxDays:s.max_days_ahead??30}};
}
const toBusy=(b:{start:string;end:string}[]):Busy[]=>b.map(x=>({start:new Date(x.start),end:new Date(x.end)}));
const CALENDAR_DOWN='The calendar could not be reached right now. Tell the caller someone will call them back to schedule.';
const noon=(d:{y:number;m:number;d:number},tz:string)=>zonedToUtc(d.y,d.m,d.d,12,0,tz)??new Date(Date.UTC(d.y,d.m-1,d.d,12));
const dayStart=(d:{y:number;m:number;d:number},tz:string)=>zonedToUtc(d.y,d.m,d.d,0,0,tz)??new Date(Date.UTC(d.y,d.m-1,d.d));
/** Spoken-style list of open times, for the agent to read out. */
export async function availability(companyId:string,dateInput:string|null|undefined,now=new Date()):Promise<string>{
  const st=await setup(companyId);if('error' in st)return st.error;
  const {cfg,calendarId}=st;
  const nowTxt=`Right now it is ${dayLabel(now,cfg.tz)}, ${timeLabel(now,cfg.tz)}.`;
  const day=parseDateInput(dateInput,cfg.tz,now);
  if(!day)return`${nowTxt} I did not understand that date. Ask the caller for a day like "Tuesday" or a date like 2026-10-20.`;
  const from=dayStart(day,cfg.tz);
  let busy:Busy[];
  try{busy=toBusy(await freeBusy(calendarId,from.toISOString(),new Date(from.getTime()+15*86400_000).toISOString(),cfg.tz))}catch{return CALENDAR_DOWN}
  const today=spread(slotsForDay(cfg,day,busy,now),5);
  if(today.length)return`${nowTxt} Open times on ${dayLabel(today[0],cfg.tz)}: ${today.map(d=>timeLabel(d,cfg.tz)).join(', ')}.`;
  const next:string[]=[];
  for(let i=1;i<=14&&next.length<3;i++){const l=spread(slotsForDay(cfg,addDays(day,i),busy,now),3);if(l.length)next.push(`${dayLabel(l[0],cfg.tz)}: ${l.map(d=>timeLabel(d,cfg.tz)).join(', ')}`)}
  return next.length?`${nowTxt} No openings on ${dayLabel(noon(day,cfg.tz),cfg.tz)}. Next openings: ${next.join('; ')}.`:`${nowTxt} No openings in the next two weeks. Offer to take a message instead.`;
}
/** Reads "2026-10-20 09:00" or "2026-10-20T09:00" as the business's local time, or an ISO time with an offset. */
export function parseStart(input:unknown,tz:string):Date|null{
  const s=String(input??'').trim();
  if(/[zZ]$|[+-]\d{2}:?\d{2}$/.test(s)){const d=new Date(s);return isNaN(+d)?null:d}
  const m=/^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})/.exec(s);
  return m?zonedToUtc(+m[1],+m[2],+m[3],+m[4],+m[5],tz):null;
}
export async function book(companyId:string,a:{start?:unknown;name?:unknown;phone?:unknown;reason?:unknown},callId?:string|null,now=new Date()):Promise<string>{
  const st=await setup(companyId);if('error' in st)return st.error;
  const {cfg,calendarId}=st;
  const name=String(a.name??'').replace(/\s+/g,' ').trim().slice(0,80);
  if(name.length<2)return'I need the caller\'s name to book the appointment.';
  const phoneRaw=String(a.phone??'').trim();const phone=phoneRaw?normalizePhone(phoneRaw):null;
  if(phoneRaw&&!phone)return'That phone number does not look valid. Please confirm it with the caller.';
  const reason=String(a.reason??'').replace(/\s+/g,' ').trim().slice(0,200);
  const start=parseStart(a.start,cfg.tz);
  if(!start)return'I could not read that time. Use the exact time you offered, like 2026-10-20 09:00.';
  const lp=localParts(start,cfg.tz);const day={y:lp.y,m:lp.m,d:lp.d};
  const from=dayStart(day,cfg.tz);
  let busy:Busy[];
  try{busy=toBusy(await freeBusy(calendarId,from.toISOString(),new Date(from.getTime()+2*86400_000).toISOString(),cfg.tz))}catch{return CALENDAR_DOWN}
  if(!slotsForDay(cfg,day,busy,now).some(s=>s.getTime()===start.getTime()))return'That time is not available. Check availability again and offer another time.';
  if(callId){const {count}=await supabaseAdmin.from('bookings').select('id',{count:'exact',head:true}).eq('call_id',callId).eq('status','confirmed');if((count??0)>=2)return'The limit of 2 appointments for this call has been reached.'}
  const {count:hour}=await supabaseAdmin.from('bookings').select('id',{count:'exact',head:true}).eq('company_id',companyId).gte('created_at',new Date(now.getTime()-3600_000).toISOString());
  if((hour??0)>=20)return'The hourly booking limit has been reached. Offer to take a message instead.';
  const end=new Date(start.getTime()+cfg.duration*60000);
  const {data:row,error}=await supabaseAdmin.from('bookings').insert({company_id:companyId,call_id:callId??null,start_at:start.toISOString(),end_at:end.toISOString(),name,phone,reason:reason||null,status:'confirmed'}).select('id').single();
  if(error||!row)return error?.code==='23505'?'That time was just taken. Check availability again and offer another time.':'The appointment could not be saved. Offer to take a message instead.';
  try{
    const ev=await createEvent(calendarId,{summary:`${reason||'Appointment'} - ${name}`,description:`Booked by your Nexus Workforce agent.\nName: ${name}\nPhone: ${phone??'not given'}\nReason: ${reason||'not given'}`,start,end,tz:cfg.tz});
    await supabaseAdmin.from('bookings').update({event_id:ev.id}).eq('id',row.id);
  }catch{
    await supabaseAdmin.from('bookings').update({status:'failed'}).eq('id',row.id);
    return'The calendar could not be updated, so the appointment was not booked. Tell the caller someone will call them back to schedule.';
  }
  await fireEvent(companyId,'booking.created',{name,phone,reason:reason||null,start:start.toISOString(),end:end.toISOString()});
  return`Booked ${slotLabel(start,cfg.tz)} for ${name}. Tell the caller it is confirmed.`;
}
