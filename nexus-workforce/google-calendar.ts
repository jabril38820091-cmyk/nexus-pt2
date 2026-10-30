import 'server-only';
import {createSign} from 'crypto';
export class CalendarAccessError extends Error{}
type SA={client_email:string;private_key:string};
function sa():SA{
  const raw=process.env.GOOGLE_SERVICE_ACCOUNT_B64?Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_B64,'base64').toString('utf8'):process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if(!raw)throw new Error('Calendar booking is not set up on the server yet.');
  const j=JSON.parse(raw);
  if(!j.client_email||!j.private_key)throw new Error('The Google service account key is incomplete.');
  return j;
}
/** The address businesses share their calendar with. */
export const serviceEmail=():string|null=>{try{return sa().client_email}catch{return null}};
const b64u=(b:Buffer|string)=>Buffer.from(b).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
export function buildJwt(acct:SA,nowMs=Date.now()):string{
  const iat=Math.floor(nowMs/1000);
  const head=b64u(JSON.stringify({alg:'RS256',typ:'JWT'}));
  const body=b64u(JSON.stringify({iss:acct.client_email,scope:'https://www.googleapis.com/auth/calendar',aud:'https://oauth2.googleapis.com/token',iat,exp:iat+3600}));
  const sig=createSign('RSA-SHA256').update(`${head}.${body}`).sign(acct.private_key);
  return `${head}.${body}.${b64u(sig)}`;
}
let cache:{token:string;exp:number}|null=null;
async function accessToken():Promise<string>{
  if(cache&&cache.exp>Date.now()+60_000)return cache.token;
  const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},signal:AbortSignal.timeout(15000),
    body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:buildJwt(sa())}).toString()});
  const j=await r.json().catch(()=>({}));
  if(!r.ok||!j.access_token)throw new Error('Google sign-in failed. Check the service account key.');
  cache={token:j.access_token,exp:Date.now()+(Number(j.expires_in)||3600)*1000};
  return cache.token;
}
async function api(path:string,init:RequestInit={}){
  const token=await accessToken();
  const r=await fetch(`https://www.googleapis.com/calendar/v3${path}`,{...init,signal:AbortSignal.timeout(15000),headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'}});
  const j=await r.json().catch(()=>({}));
  if(r.status===403||r.status===404)throw new CalendarAccessError('Calendar not shared');
  if(!r.ok)throw new Error(`Google Calendar error (${r.status})`);
  return j;
}
export async function freeBusy(calendarId:string,timeMin:string,timeMax:string,tz:string):Promise<{start:string;end:string}[]>{
  const j=await api('/freeBusy',{method:'POST',body:JSON.stringify({timeMin,timeMax,timeZone:tz,items:[{id:calendarId}]})});
  const all=j.calendars??{};const c=all[calendarId]??all[Object.keys(all)[0]];
  if(!c||(c.errors&&c.errors.length))throw new CalendarAccessError('Calendar not shared');
  return c.busy??[];
}
export async function createEvent(calendarId:string,e:{summary:string;description:string;start:Date;end:Date;tz:string}):Promise<{id:string}>{
  // No attendees: a service account cannot invite people without domain-wide delegation. Details go in the description.
  const j=await api(`/calendars/${encodeURIComponent(calendarId)}/events`,{method:'POST',body:JSON.stringify({summary:e.summary,description:e.description,start:{dateTime:e.start.toISOString(),timeZone:e.tz},end:{dateTime:e.end.toISOString(),timeZone:e.tz}})});
  return{id:String(j.id)};
}
/** True if an event whose text matches exists in the window. Used to prove the business owns the calendar. */
export async function findEvent(calendarId:string,text:string,timeMin:string,timeMax:string):Promise<boolean>{
  const j=await api(`/calendars/${encodeURIComponent(calendarId)}/events?q=${encodeURIComponent(text)}&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&maxResults=5`);
  return Array.isArray(j.items)&&j.items.some((x:{summary?:string})=>String(x.summary??'').includes(text));
}
