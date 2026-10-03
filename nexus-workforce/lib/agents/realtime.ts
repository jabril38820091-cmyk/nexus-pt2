'use client';
import {useEffect} from 'react';import {createClient} from '@/lib/supabase/client';import {useStatusStore} from './status-store';
type Row={vapi_call_id:string;caller_number:string|null;current_agent_id:string|null;last_snippet:string|null;revenue_cents:number|null};
export function useCallRealtime(companyId:string|null){
 useEffect(()=>{if(!companyId)return;const sb=createClient();const s=useStatusStore.getState();
  const ch=sb.channel(`calls:${companyId}`).on('postgres_changes',{event:'*',schema:'public',table:'calls',filter:`company_id=eq.${companyId}`},p=>{
   const row=p.new as Row;const old=p.old as Partial<Row>;
   if(p.eventType==='INSERT')s.startCall({callId:row.vapi_call_id,callerNumber:row.caller_number??'',currentAgentId:row.current_agent_id??'router',snippet:row.last_snippet??''});
   if(p.eventType==='UPDATE'){
    if(!row.current_agent_id){s.endCall(row.vapi_call_id,row.revenue_cents??0);return}
    if(old.current_agent_id&&old.current_agent_id!==row.current_agent_id)s.handoff(old.current_agent_id,row.current_agent_id);
    s.updateCall(row.vapi_call_id,{currentAgentId:row.current_agent_id,snippet:row.last_snippet??''})}
  }).subscribe();return()=>{sb.removeChannel(ch)}},[companyId]);
}
