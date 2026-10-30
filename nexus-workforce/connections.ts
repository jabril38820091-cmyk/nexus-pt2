import 'server-only';
import {supabaseAdmin} from '@/lib/supabase/admin';
import {isSafeUrl} from '@/lib/events';
export type Conn={id:string;name:string;url:string;method:string;headers:Record<string,string>|null;body_template:string|null;response_path:string|null};
const BLOCKED=new Set(['host','content-length','transfer-encoding','connection']);
export function cleanHeaders(h:unknown):Record<string,string>|null{
  if(h==null||h==='')return {};
  if(typeof h!=='object'||Array.isArray(h))return null;
  const out:Record<string,string>={};
  for(const [k,v] of Object.entries(h as Record<string,unknown>)){
    if(!/^[A-Za-z0-9-]{1,60}$/.test(k)||BLOCKED.has(k.toLowerCase()))return null;
    if(typeof v!=='string'||/[\r\n]/.test(v)||v.length>2000)return null;
    out[k]=v;
  }
  return out;
}
function walk(obj:unknown,path:string):unknown{
  return path.split('.').filter(Boolean).reduce<unknown>((o,k)=>o==null?undefined:(o as Record<string,unknown>)[k],obj);
}
export async function runConnection(c:Conn,input:string):Promise<{ok:boolean;text:string}>{
  if(!isSafeUrl(c.url))return{ok:false,text:'This connection address is not allowed.'};
  const headers=cleanHeaders(c.headers??{});
  if(!headers)return{ok:false,text:'This connection has invalid headers.'};
  let url=c.url;let body:string|undefined;
  if(c.method==='GET'){url+=(url.includes('?')?'&':'?')+'input='+encodeURIComponent(input)}
  else{
    body=(c.body_template||'{"input":{{input}}}').split('{{input}}').join(JSON.stringify(input));
    try{JSON.parse(body)}catch{return{ok:false,text:'The body template is not valid JSON.'}}
    if(!Object.keys(headers).some(k=>k.toLowerCase()==='content-type'))headers['Content-Type']='application/json';
  }
  let status='failed',out:{ok:boolean;text:string};
  try{
    const r=await fetch(url,{method:c.method==='GET'?'GET':'POST',headers,body,redirect:'manual',signal:AbortSignal.timeout(20000)});
    status=String(r.status);
    const raw=(await r.text()).slice(0,200000);
    if(!r.ok)out={ok:false,text:`The app answered with an error (${r.status}).`};
    else{
      let text=raw;
      if(c.response_path){try{const v=walk(JSON.parse(raw),c.response_path);if(v!==undefined)text=typeof v==='string'?v:JSON.stringify(v)}catch{/* keep raw */}}
      out={ok:true,text:text.slice(0,2000)};
    }
  }catch{out={ok:false,text:'The app did not answer in time.'}}
  await supabaseAdmin.from('connections').update({last_status:status,last_at:new Date().toISOString()}).eq('id',c.id);
  return out;
}
