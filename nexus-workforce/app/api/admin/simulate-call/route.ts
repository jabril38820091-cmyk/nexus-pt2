import {NextResponse} from 'next/server';
import {requireAdmin} from '@/lib/admin';
import {supabaseAdmin} from '@/lib/supabase/admin';
import {runCallFollowup} from '@/lib/playbooks';
export const maxDuration=30;
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
export async function POST(){
  const user=await requireAdmin();
  if(!user)return NextResponse.json({error:'forbidden'},{status:403});
  const {data:co}=await supabaseAdmin.from('companies').select('id').eq('owner_id',user.id).limit(1).maybeSingle();
  if(!co)return NextResponse.json({error:'no_company'},{status:404});
  const callId='sim-'+Date.now();
  const touch=(p:Record<string,unknown>)=>supabaseAdmin.from('calls').update({...p,updated_at:new Date().toISOString()}).eq('vapi_call_id',callId);
  const {error}=await supabaseAdmin.from('calls').insert({company_id:co.id,vapi_call_id:callId,caller_number:'+1 (555) 010-0100',current_agent_id:'router',last_snippet:'Thanks for calling, how can I help?'});
  if(error)return NextResponse.json({error:'insert_failed',detail:error.message},{status:500});
  for(const [agent,line] of [['lead-qualifier','What are you looking for today?'],['product-specialist','Here is how we can help.'],['deal-closer','I can get you started today.']]){
    await sleep(2500);await touch({current_agent_id:agent,last_snippet:line});
  }
  await sleep(2500);
  await touch({current_agent_id:null,duration_seconds:45,outcome:'Simulated call',revenue_cents:50000});
  await runCallFollowup(co.id,{callId,summary:'The caller asked about getting started and agreed to a follow-up message.',caller:'+1 (555) 010-0100',durationSeconds:45});
  return NextResponse.json({ok:true});
}
