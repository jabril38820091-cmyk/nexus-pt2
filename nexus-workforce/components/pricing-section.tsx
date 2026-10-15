import {PlanCards} from './plan-cards';
import {PLANS,PLAN_DEPTS} from '@/lib/plans';
import {DEPARTMENTS,ROSTER,type DepartmentId} from '@/lib/agents/roster';
const count=(k:(typeof PLANS)[number]['key'],d:DepartmentId)=>PLAN_DEPTS[k].includes(d)?ROSTER.filter(a=>a.department===d).length:0;
const DEPT_ROWS:DepartmentId[]=['sales','success','finance','executive','marketing','operations'];
const EVERY_PLAN=['Live office view of your agents','Chat, voice and tasks with each agent','Teach your agents your business and choose their jobs','Follow-up drafts you approve with one click','Webhooks, API keys and custom connections'];
const FAQ:[string,string][]=[
  ['Can I start with just the receptionist?','Yes. The Receptionist plan gives you one agent that answers calls, takes messages and answers the questions you teach it. It is the simplest way to start.'],
  ['What is included in every plan?',`Every plan includes: ${EVERY_PLAN.join('; ')}. What changes between plans is how many agents you get and how many call minutes are included.`],
  ['How do call minutes work?','Each plan includes an amount of voice-call time per month for conversations your agents handle. Chat and tasks are separate from call minutes.'],
  ['Do I need a contract?','No. Plans are billed monthly and you can cancel any time from your Billing page.'],
  ['How do I switch plans?','Open your Billing page and choose a different plan, or use Manage billing. Your new plan shows on your next invoice.'],
  ['Can I decide what my agents do?','Yes. Pick their jobs and write down your prices, policies and rules in Settings. You can change them any time.'],
  ['Can I connect my other tools?','Yes. Send events to other apps with webhooks, let other tools start work with an API key, or add a custom connection to any tool that has a web API.'],
  ['Can I export or delete my data?','Yes. Settings has a download of your data and a way to delete your account.']];
export function PricingSection(){
  return(<div>
    <PlanCards/>
    <h3 className="mb-3 mt-12 text-xl font-semibold">Compare plans</h3>
    <div className="overflow-x-auto rounded-2xl border border-slate-700"><table className="w-full min-w-[640px] text-left text-sm">
      <thead className="bg-slate-900 text-slate-300"><tr><th className="p-3 font-medium">What you get</th>{PLANS.map(p=><th key={p.key} className="p-3 font-semibold">{p.name}</th>)}</tr></thead>
      <tbody className="divide-y divide-slate-800">
        <tr><td className="p-3 text-slate-400">Price per month</td>{PLANS.map(p=><td key={p.key} className="p-3 font-semibold">${p.price.toLocaleString()}</td>)}</tr>
        <tr><td className="p-3 text-slate-400">Included call minutes</td>{PLANS.map(p=><td key={p.key} className="p-3">{p.minutesNum.toLocaleString()}</td>)}</tr>
        <tr><td className="p-3 text-slate-400">Total agents</td>{PLANS.map(p=><td key={p.key} className="p-3">{ROSTER.filter(a=>PLAN_DEPTS[p.key].includes(a.department)).length}</td>)}</tr>
        <tr><td className="p-3 text-slate-400">{DEPARTMENTS.lobby.icon} Receptionist (front desk)</td>{PLANS.map(p=><td key={p.key} className="p-3 text-emerald-400">✓</td>)}</tr>
        {DEPT_ROWS.map(d=>(<tr key={d}><td className="p-3 text-slate-400">{DEPARTMENTS[d].icon} {DEPARTMENTS[d].label} team</td>{PLANS.map(p=>{const n=count(p.key,d);return<td key={p.key} className={`p-3 ${n?'text-slate-100':'text-slate-600'}`}>{n?`${n} agents`:'—'}</td>})}</tr>))}
        {EVERY_PLAN.map(f=>(<tr key={f}><td className="p-3 text-slate-400">{f}</td>{PLANS.map(p=><td key={p.key} className="p-3 text-emerald-400">✓</td>)}</tr>))}
        <tr><td className="p-3 text-slate-400">Priority support</td>{PLANS.map(p=><td key={p.key} className={`p-3 ${p.key==='full'?'text-emerald-400':'text-slate-600'}`}>{p.key==='full'?'✓':'—'}</td>)}</tr>
      </tbody></table></div>
    <h3 className="mb-3 mt-12 text-xl font-semibold">Questions</h3>
    <div className="divide-y divide-slate-800 rounded-2xl border border-slate-700">{FAQ.map(([q,a])=>(<details key={q} className="group p-4"><summary className="cursor-pointer font-medium">{q}</summary><p className="mt-2 text-sm text-slate-400">{a}</p></details>))}</div>
  </div>);
}
