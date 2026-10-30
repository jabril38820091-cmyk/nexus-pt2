import 'server-only';
/* eslint-disable @typescript-eslint/no-explicit-any */
import {vapi} from './api';
import {withProfile} from './profile';
/** Updates the business profile block inside each assistant's system prompt. Returns how many worked. */
export async function syncProfile(assistantIds:string[],block:string){
  let updated=0;const errors:string[]=[];
  for(let i=0;i<assistantIds.length;i+=3){
    await Promise.all(assistantIds.slice(i,i+3).map(async id=>{
      try{
        const a:any=await vapi('GET',`/assistant/${id}`);
        const msgs:any[]=Array.isArray(a.model?.messages)?[...a.model.messages]:[];
        const k=msgs.findIndex(m=>m.role==='system'&&typeof m.content==='string');
        if(k<0){errors.push(`${a.name??id}: no system prompt to update`);return}
        msgs[k]={...msgs[k],content:withProfile(msgs[k].content,block)};
        await vapi('PATCH',`/assistant/${id}`,{model:{...a.model,messages:msgs}});
        updated++;
      }catch(e){errors.push(`${id}: ${e instanceof Error?e.message:String(e)}`)}
    }));
  }
  return{updated,errors};
}
