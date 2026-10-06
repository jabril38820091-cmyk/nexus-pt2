import {NextRequest,NextResponse} from 'next/server';
import {supabaseAdmin} from '@/lib/supabase/admin';
import {fireEvent} from '@/lib/events';
import {runCallFollowup} from '@/lib/playbooks';
/**
 * Point your Vapi Server URL at /api/webhooks/vapi and set the secret header.
 * Server messages to enable: status-update, assistant.started, transcript, end-of-call-report.
 * (transcript is not in Vapi's default serverMessages; add it.)
 * VERIFY the assistant.started payload in your Vapi logs; field names below are tolerant guesses.
 */
export async function POST(req:NextRequest){
 try{
  if(req.headers.get('x-vapi-secret')!==process.env.VAPI_WEBHOOK_SECRET)return NextResponse.json({error:'unauthorized'},{status:401});
  const {message:m}=await req.json();
  if(!m?.type)return NextResponse.json({ok:true});
  const callId:string|undefined=m.call?.id;const phoneId:string|undefined=m.call?.phoneNumberId;
  if(!callId||!phoneId)return NextResponse.json({ok:true});
  const {data:squad}=await supabaseAdmin.from('squads').select('id,company_id').eq('vapi_phone_number_id',phoneId).maybeSingle();
  if(!squad)return NextResponse.json({ok:true});
  const touch=(patch:Record<string,unknown>)=>supabaseAdmin.from('calls').update({...patch,updated_at:new Date().toISOString()}).eq('vapi_call_id',callId);
  if(m.type==='status-update'&&m.status==='in-progress'){
   await supabaseAdmin.from('calls').upsert({company_id:squad.company_id,vapi_call_id:callId,caller_number:m.call?.customer?.number,current_agent_id:'router',last_snippet:''},{onConflict:'vapi_call_id'});
  }
  if(m.type==='assistant.started'){
   const aid:string|undefined=m.assistant?.id??m.newAssistant?.id??m.assistantId;
   if(aid){const {data:a}=await supabaseAdmin.from('agents').select('slug').eq('squad_id',squad.id).eq('vapi_assistant_id',aid).maybeSingle();
    if(a)await touch({current_agent_id:a.slug,last_snippet:'Transferring…'});}
  }
  if(m.type==='transcript'&&m.transcriptType==='final')await touch({last_snippet:String(m.transcript??'').slice(-120)});
  if(m.type==='end-of-call-report'){
   // Optional: if your assistants' analysis plan returns structuredData.revenue_cents, it shows up in the office counter.
   await touch({duration_seconds:m.durationSeconds,outcome:m.analysis?.summary,recording_url:m.recordingUrl??m.artifact?.recordingUrl,transcript:m.artifact?.messages,revenue_cents:m.analysis?.structuredData?.revenue_cents??0,current_agent_id:null});
   await fireEvent(squad.company_id,'call.ended',{call_id:callId,duration_seconds:m.durationSeconds??null,summary:m.analysis?.summary??null});
   await runCallFollowup(squad.company_id,{callId,summary:m.analysis?.summary??null,caller:m.call?.customer?.number??null,durationSeconds:m.durationSeconds??0});
  }
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:'webhook_failed'},{status:500})}}
