import 'server-only';
import {supabaseAdmin} from '@/lib/supabase/admin';
import {fireEvent} from '@/lib/events';
import {periodBounds,planMinutes,toMinutes,alertToSend} from '@/lib/usage';
export type Usage={used:number;limit:number|null;plan:string|null;periodStart:string;periodEnd:string};
async function secondsBetween(companyId:string,start:Date,end:Date):Promise<number>{
  let total=0;
  for(let from=0;;from+=1000){
    const {data}=await supabaseAdmin.from('calls').select('duration_seconds').eq('company_id',companyId).gte('created_at',start.toISOString()).lt('created_at',end.toISOString()).range(from,from+999);
    const rows=data??[];for(const r of rows)total+=Number(r.duration_seconds)||0;
    if(rows.length<1000)return total;
  }
}
type Co={id:string;plan:string|null;subscription_status?:string|null;timezone:string|null;current_period_start:string|null;current_period_end:string|null};
export async function usageForCompany(co:Co,now=new Date()):Promise<Usage>{
  const active=co.subscription_status==null||['active','trialing'].includes(co.subscription_status);
  const {start,end}=periodBounds({start:active?co.current_period_start:null,end:active?co.current_period_end:null,tz:co.timezone},now);
  return{used:toMinutes(await secondsBetween(co.id,start,end)),limit:planMinutes(co.plan),plan:co.plan,periodStart:start.toISOString(),periodEnd:end.toISOString()};
}
const COLS='id,plan,subscription_status,timezone,current_period_start,current_period_end';
export async function usageFor(companyId:string,now=new Date()):Promise<Usage|null>{
  const {data:co}=await supabaseAdmin.from('companies').select(COLS).eq('id',companyId).maybeSingle();
  return co?usageForCompany(co as Co,now):null;
}
/** After each call: email the owner once when the period crosses 80% and once at 100%. Never throws. */
export async function checkUsageAlerts(companyId:string,now=new Date()):Promise<void>{
  try{
    const {data:co}=await supabaseAdmin.from('companies').select('id,plan,subscription_status,timezone,current_period_start,current_period_end,owner_id,usage_alert_level,usage_alert_period').eq('id',companyId).maybeSingle();
    if(!co)return;
    const u=await usageForCompany(co as unknown as Co,now);
    const level=alertToSend({used:u.used,limit:u.limit,lastLevel:co.usage_alert_level,lastPeriod:co.usage_alert_period,periodStart:new Date(u.periodStart)});
    if(!level)return;
    await supabaseAdmin.from('companies').update({usage_alert_level:level,usage_alert_period:u.periodStart}).eq('id',companyId);
    await fireEvent(companyId,'usage.alert',{level,used:u.used,limit:u.limit});
    if(!process.env.RESEND_API_KEY)return;
    const {data:usr}=await supabaseAdmin.auth.admin.getUserById(co.owner_id);
    const to=usr?.user?.email;if(!to)return;
    const base=(process.env.NEXT_PUBLIC_APP_URL??'').replace(/\/$/,'');
    const subject=level===100?'You have used all your call minutes':'You have used 80% of your call minutes';
    const text=level===100
      ?`Your agents have used ${u.used} of the ${u.limit} call minutes in your plan this period.\n\nCalls will keep being answered. To get more minutes, you can change your plan here: ${base}/billing`
      :`Your agents have used ${u.used} of the ${u.limit} call minutes in your plan this period.\n\nSee your usage or change your plan here: ${base}/billing`;
    await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({from:process.env.EMAIL_FROM??'Nexus <onboarding@resend.dev>',to:[to],subject,text})});
  }catch{/* usage warnings must never break the call webhook */}
}
