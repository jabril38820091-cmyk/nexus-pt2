import {useStatusStore} from './status-store';import type {Scenario} from '../industries';
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
export async function runScenario(sc:Scenario){
 const st=useStatusStore.getState();const id=`demo-${Date.now()}`;const [first,...rest]=sc.steps;
 st.startCall({callId:id,callerNumber:'+1 (415) 555-0199',currentAgentId:first.agentId,snippet:first.line});await sleep(2200);
 let prev=first.agentId;
 for(const step of rest){st.handoff(prev,step.agentId);await sleep(1100);st.updateCall(id,{currentAgentId:step.agentId,snippet:step.line});prev=step.agentId;await sleep(2200)}
 st.endCall(id,sc.revenueCents);
}
