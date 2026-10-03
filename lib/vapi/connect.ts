import 'server-only';
import {ROSTER} from '@/lib/agents/roster';
const API='https://api.vapi.ai';
const H=()=>({Authorization:`Bearer ${process.env.VAPI_API_KEY}`});
const norm=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
async function get<T>(path:string):Promise<T>{const r=await fetch(API+path,{headers:H(),cache:'no-store'});if(!r.ok)throw new Error(`Vapi ${path} ${r.status}`);return r.json() as Promise<T>}
type Squad={id:string;name?:string;members:{assistantId?:string;assistant?:{name?:string}}[]};
type Assistant={id:string;name?:string;voice?:{voiceId?:string}};
export type Mapped={assistantId:string;vapiName:string;slug:string|null};
/** Reads your existing squad and maps each assistant to a roster slug by name. Pass overrides {assistantId: slug} for any that don't match. */
export async function readExistingSquad(squadId:string,overrides:Record<string,string>={}):Promise<{squad:Squad;mapped:Mapped[]}>{
  const squad=await get<Squad>(`/squad/${squadId}`);
  const ids=squad.members.map(m=>m.assistantId).filter((x):x is string=>!!x);
  const assistants=await Promise.all(ids.map(id=>get<Assistant>(`/assistant/${id}`)));
  const mapped=assistants.map(a=>{
    const name=a.name??'';
    const hit=overrides[a.id]??ROSTER.find(r=>norm(r.name)===norm(name)||norm(r.id)===norm(name))?.id??null;
    return{assistantId:a.id,vapiName:name,slug:hit};});
  return{squad,mapped};
}
