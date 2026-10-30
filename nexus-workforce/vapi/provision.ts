import 'server-only';
/* eslint-disable @typescript-eslint/no-explicit-any */
import {vapi,vapiCreateClean} from './api';
import {profileBlock,withProfile} from './profile';
type J=Record<string,any>;
export type Template={squad:J;assistants:Record<string,J>;agents:{slug:string;vapi_assistant_id:string}[]};
const STRIP=['id','orgId','createdAt','updatedAt','isServerUrlSecretSet'];
/** Works out what to copy from the template squad. Pure: makes no network calls. */
export function buildPlan(t:Template,selected:string[],company:{name:string;industry?:string|null;website?:string|null;timezone?:string|null;hours?:J|null;goals?:string[]|null;instructions?:string|null}){
  const sel=t.agents.filter(a=>selected.includes(a.slug));
  const rest=t.agents.filter(a=>!selected.includes(a.slug));
  const selIds=new Set(sel.map(a=>a.vapi_assistant_id));
  const removedIds=rest.map(a=>a.vapi_assistant_id);
  const nameOf=(id:string)=>t.assistants[id]?.name as string|undefined;
  const removedNames=new Set(rest.map(a=>nameOf(a.vapi_assistant_id)).filter(Boolean) as string[]);
  const selNames=new Set(sel.map(a=>nameOf(a.vapi_assistant_id)).filter(Boolean) as string[]);
  let toolsDropped=0;
  const items=sel.map(a=>{
    const body:J=JSON.parse(JSON.stringify(t.assistants[a.vapi_assistant_id]));
    STRIP.forEach(k=>delete body[k]);
    const msgs=body.model?.messages;
    if(Array.isArray(msgs)){
      const sys=msgs.find((m:J)=>m.role==='system');
      if(sys&&typeof sys.content==='string')sys.content=withProfile(sys.content,profileBlock({name:company.name,industry:company.industry,website:company.website,timezone:company.timezone,hours:company.hours,goals:company.goals,instructions:company.instructions}));
    }
    if(Array.isArray(body.model?.tools)){
      body.model.tools=body.model.tools.filter((tool:J)=>{
        const s=JSON.stringify(tool);
        const bad=removedIds.some(id=>s.includes(id))||(Array.isArray(tool.destinations)&&tool.destinations.some((d:J)=>d.assistantName&&removedNames.has(d.assistantName)));
        if(bad)toolsDropped++;return!bad;
      });
    }
    const member=(t.squad.members??[]).find((m:J)=>m.assistantId===a.vapi_assistant_id);
    const dests=(member?.assistantDestinations??[]).filter((d:J)=>d.assistantName?selNames.has(d.assistantName):d.assistantId?selIds.has(d.assistantId):true);
    return{slug:a.slug,oldId:a.vapi_assistant_id,body,dests};
  });
  return{items,toolsDropped,destinationsKept:items.reduce((n,i)=>n+i.dests.length,0)};
}
/** Creates the copies in Vapi. If anything fails, deletes what it created. */
export async function execute(plan:ReturnType<typeof buildPlan>,squadName:string){
  const created:{slug:string;oldId:string;newId:string}[]=[];let squadId:string|null=null;
  const rollback=async()=>{await Promise.all([...created.map(c=>vapi('DELETE',`/assistant/${c.newId}`).catch(()=>{})),squadId?vapi('DELETE',`/squad/${squadId}`).catch(()=>{}):Promise.resolve()])};
  try{
    for(let i=0;i<plan.items.length;i+=4){
      const batch=plan.items.slice(i,i+4);
      const res=await Promise.all(batch.map(it=>vapiCreateClean('/assistant',it.body)));
      res.forEach((r:J,k:number)=>created.push({slug:batch[k].slug,oldId:batch[k].oldId,newId:r.id}));
    }
    const map:Record<string,string>=Object.fromEntries(created.map(c=>[c.oldId,c.newId]));
    for(const it of plan.items){
      const tools=it.body.model?.tools;if(!Array.isArray(tools))continue;
      let s=JSON.stringify(tools),changed=false;
      for(const [o,n] of Object.entries(map)){if(s.includes(o)){s=s.split(o).join(n);changed=true}}
      if(changed)await vapi('PATCH',`/assistant/${map[it.oldId]}`,{model:{...it.body.model,tools:JSON.parse(s)}});
    }
    if(created.length>1){
      const members=plan.items.map(it=>({assistantId:map[it.oldId],assistantDestinations:it.dests.map((d:J)=>d.assistantId?{...d,assistantId:map[d.assistantId]??d.assistantId}:d)}));
      const sq=await vapi('POST','/squad',{name:squadName,members});squadId=sq.id;
    }
    return{created,squadId};
  }catch(e){await rollback();throw e}
}
