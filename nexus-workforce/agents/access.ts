import {ROSTER} from './roster';
import {PLAN_DEPTS,type PlanKey} from '@/lib/plans';
/** The agents a plan includes. With no active plan, everything is allowed (test mode). */
export function planAgentIds(plan?:string|null,status?:string|null):Set<string>{
  const depts=status==='active'&&plan?PLAN_DEPTS[plan as PlanKey]:undefined;
  return new Set(ROSTER.filter(a=>!depts||depts.includes(a.department)).map(a=>a.id));
}
/** Agents unlocked for a business: what they chose, limited to what their plan includes. */
export function allowedAgents(mode?:string|null,chosen?:string|null,plan?:string|null,status?:string|null):Set<string>{
  const inPlan=planAgentIds(plan,status);
  const picked=mode==='receptionist'?['router']:mode==='single'&&chosen?[chosen]:ROSTER.map(a=>a.id);
  return new Set(picked.filter(id=>inPlan.has(id)));
}
