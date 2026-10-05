import 'server-only';
import {createHmac} from 'crypto';
import {supabaseAdmin} from '@/lib/supabase/admin';
export const EVENTS=['task.completed','email.sent','call.ended'] as const;
export function isSafeUrl(u:string):boolean{
  try{
    const x=new URL(u);if(x.protocol!=='https:')return false;
    const h=x.hostname.toLowerCase();
    if(h==='localhost'||h.endsWith('.local')||h.endsWith('.localhost')||h.endsWith('.internal'))return false;
    if(h.includes(':')||h.startsWith('['))return false;
    if(/^\d+\.\d+\.\d+\.\d+$/.test(h)){const [a,b]=h.split('.').map(Number);
      if(a===10||a===127||a===0||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&b===168))return false}
    return true;
  }catch{return false}
}
export async function deliver(hook:{id:string;url:string;secret:string},event:string,data:unknown):Promise<string>{
  const body=JSON.stringify({event,created_at:new Date().toISOString(),data});
  const sig=createHmac('sha256',hook.secret).update(body).digest('hex');
  let status='failed';
  try{
    const r=await fetch(hook.url,{method:'POST',redirect:'manual',signal:AbortSignal.timeout(5000),
      headers:{'Content-Type':'application/json','X-Nexus-Event':event,'X-Nexus-Signature':`sha256=${sig}`},body});
    status=String(r.status);
  }catch{status='failed'}
  await supabaseAdmin.from('webhooks').update({last_status:status,last_at:new Date().toISOString()}).eq('id',hook.id);
  return status;
}
export async function fireEvent(companyId:string|null|undefined,event:string,data:unknown){
  if(!companyId)return;
  try{
    const {data:hooks}=await supabaseAdmin.from('webhooks').select('id,url,secret').eq('company_id',companyId).eq('active',true).contains('events',[event]);
    await Promise.all((hooks??[]).map(h=>deliver(h,event,data)));
  }catch{/* webhook problems must never break the main request */}
}
