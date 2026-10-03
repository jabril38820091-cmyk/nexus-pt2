import {create} from 'zustand';import {ROSTER} from './roster';
export type AgentStatus='offline'|'idle'|'on_call'|'thinking'|'transferring';
export type ActiveCall={callId:string;callerNumber:string;currentAgentId:string;snippet:string};
type S={statuses:Record<string,AgentStatus>;activeCalls:Record<string,ActiveCall>;lastHandoff:{from:string;to:string;at:number}|null;revenueCents:number;
 startCall:(c:ActiveCall)=>void;updateCall:(id:string,p:Partial<ActiveCall>)=>void;endCall:(id:string,revenueCents?:number)=>void;handoff:(from:string,to:string)=>void};
export const useStatusStore=create<S>((set)=>({
 statuses:Object.fromEntries(ROSTER.map(a=>[a.id,'idle' as AgentStatus])),activeCalls:{},lastHandoff:null,revenueCents:0,
 startCall:c=>set(s=>({activeCalls:{...s.activeCalls,[c.callId]:c},statuses:{...s.statuses,[c.currentAgentId]:'on_call'}})),
 updateCall:(id,p)=>set(s=>{const prev=s.activeCalls[id];if(!prev)return s;const next={...prev,...p};
  const statuses={...s.statuses,[prev.currentAgentId]:'idle' as AgentStatus,[next.currentAgentId]:'on_call' as AgentStatus};
  return{activeCalls:{...s.activeCalls,[id]:next},statuses}}),
 endCall:(id,rev=0)=>set(s=>{const c=s.activeCalls[id];const {[id]:_,...rest}=s.activeCalls;
  return{activeCalls:rest,revenueCents:s.revenueCents+rev,statuses:c?{...s.statuses,[c.currentAgentId]:'idle'}:s.statuses}}),
 handoff:(from,to)=>set({lastHandoff:{from,to,at:Date.now()}})}));
