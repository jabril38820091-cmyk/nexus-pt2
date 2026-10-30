import {PLANS} from '@/lib/plans';
import {localParts,zonedToUtc,validZone} from '@/lib/tz';
export const planMinutes=(plan?:string|null):number|null=>PLANS.find(p=>p.key===plan)?.minutesNum??null;
/** The current billing period: Stripe's dates when known, otherwise the calendar month in the business's time zone. */
export function periodBounds(o:{start?:string|null;end?:string|null;tz?:string|null},now=new Date()):{start:Date;end:Date}{
  const s=o.start?new Date(o.start):null,e=o.end?new Date(o.end):null;
  if(s&&e&&s<=now&&now<e)return{start:s,end:e};
  if(e&&now<e){const st=new Date(e);st.setUTCMonth(st.getUTCMonth()-1);if(st<=now)return{start:st,end:e}}
  const tz=validZone(o.tz);const p=localParts(now,tz);
  const ny=p.m===12?p.y+1:p.y,nm=p.m===12?1:p.m+1;
  return{start:zonedToUtc(p.y,p.m,1,0,0,tz)??new Date(Date.UTC(p.y,p.m-1,1)),end:zonedToUtc(ny,nm,1,0,0,tz)??new Date(Date.UTC(ny,nm-1,1))};
}
/** Total call seconds rounded up to whole minutes. */
export const toMinutes=(seconds:number)=>Math.ceil(Math.max(0,seconds)/60);
export function alertLevel(used:number,limit:number|null):0|80|100{
  if(!limit)return 0;const r=used/limit;return r>=1?100:r>=0.8?80:0;
}
/** The warning to send now: only when usage moves into a higher level within the same billing period. */
export function alertToSend(o:{used:number;limit:number|null;lastLevel:number|null;lastPeriod:string|null;periodStart:Date}):0|80|100{
  const level=alertLevel(o.used,o.limit);
  const same=!!o.lastPeriod&&new Date(o.lastPeriod).getTime()===o.periodStart.getTime();
  return level>(same?(o.lastLevel??0):0)?level:0;
}
