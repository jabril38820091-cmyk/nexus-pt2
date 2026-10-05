import {ROSTER} from './roster';
export function allowedAgents(mode?:string|null,chosen?:string|null):Set<string>{
  if(mode==='receptionist')return new Set(['router']);
  if(mode==='single'&&chosen)return new Set([chosen]);
  return new Set(ROSTER.map(a=>a.id));
}
