import 'server-only';
import {supabaseAdmin} from '@/lib/supabase/admin';
import {vapiChat} from '@/lib/vapi/chat';
export const PLAYBOOK_KEYS=['call_followup'] as const;
/** Drafts a follow-up after a call, when the customer has turned the playbook on. The draft waits for approval. */
export async function runCallFollowup(companyId:string,c:{callId:string;summary:string|null;caller:string|null;durationSeconds:number}){
  try{
    if(!c.summary||c.durationSeconds<15)return;
    const {data:pb}=await supabaseAdmin.from('playbooks').select('enabled').eq('company_id',companyId).eq('key','call_followup').maybeSingle();
    if(!pb?.enabled)return;
    const tag=`call:${c.callId}`;
    const {count}=await supabaseAdmin.from('tasks').select('id',{count:'exact',head:true}).eq('company_id',companyId).like('instructions',`%${tag}%`);
    if((count??0)>0)return;
    const {data:squads}=await supabaseAdmin.from('squads').select('id').eq('company_id',companyId);
    const {data:agents}=await supabaseAdmin.from('agents').select('slug,vapi_assistant_id').in('squad_id',(squads??[]).map(s=>s.id)).in('slug',['deal-closer','router']);
    const a=agents?.find(x=>x.slug==='deal-closer')??agents?.find(x=>x.slug==='router');
    if(!a?.vapi_assistant_id)return;
    const {text}=await vapiChat(a.vapi_assistant_id,`Write a short, friendly follow-up message (under 80 words) to send to a caller after this call. Use only facts from the summary. Do not invent prices, times or promises.\n\nCall summary: ${c.summary}`);
    await supabaseAdmin.from('tasks').insert({company_id:companyId,agent_slug:a.slug,title:`Follow-up${c.caller?` for ${c.caller}`:''}`,instructions:`${tag}\nCaller: ${c.caller??'unknown'}\nSummary: ${c.summary}`,status:'needs_review',result:text});
    await notifyOwner(companyId);
  }catch{/* never break the call webhook */}
}

/** Emails the business owner that a draft is waiting, if they turned that on. Never throws. */
async function notifyOwner(companyId:string){
  try{
    if(!process.env.RESEND_API_KEY)return;
    const {data:co}=await supabaseAdmin.from('companies').select('owner_id,notify_drafts').eq('id',companyId).maybeSingle();
    if(!co||co.notify_drafts===false)return;
    const {data:u}=await supabaseAdmin.auth.admin.getUserById(co.owner_id);
    const to=u?.user?.email;if(!to)return;
    const base=(process.env.NEXT_PUBLIC_APP_URL??'').replace(/\/$/,'');
    await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({from:process.env.EMAIL_FROM??'Nexus <onboarding@resend.dev>',to:[to],subject:'A follow-up needs your OK',text:`One of your agents drafted a follow-up and it is waiting for your approval.\n\nReview it: ${base}/hub\n\nYou can turn these emails off in Settings.`})});
  }catch{/* notification problems must never break the call webhook */}
}
