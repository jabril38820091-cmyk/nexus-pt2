const SCENARIOS:{time:string;title:string;steps:[string,string][];result:string;value:string}[]=[
  {time:'8:47 PM',title:'The after-hours lead',steps:[['Receptionist','Thanks for calling. How can I help?'],['Caller','I want to find out how to get started.'],['Sales agent','Happy to help. What are you looking to solve, and by when?'],['Sales agent','Great, I have noted that and set your next step.']],result:'A new customer who would have reached voicemail. A follow-up draft is waiting for approval.',value:'Example value: $500'},
  {time:'Tuesday 2:15 PM',title:'Keeping a customer who wants to cancel',steps:[['Caller','I want to cancel. It is too expensive for me.'],['Retention agent','I am sorry to hear that. Can I ask what changed?'],['Retention agent','I can offer you our lower-cost option instead.'],['Caller','Okay, let us do that.']],result:'The customer stays on a plan you approved in advance.',value:'Example value: $150 per month kept'},
  {time:'Thursday 10:05 AM',title:'The overdue invoice',steps:[['Billing agent','I am calling about an invoice that is past due.'],['Caller','Oh, I forgot about that.'],['Billing agent','No problem. I can send you a secure link to pay it now.']],result:'A friendly reminder that gets an overdue invoice moving.',value:'Example value: $300 collected'},
  {time:'6:10 AM',title:'The early-morning question',steps:[['Caller','What time do you open, and do you take walk-ins?'],['Support agent','We open at 9, and yes, walk-ins are welcome.']],result:'Answered before anyone is at work, so no one on your team handles it later.',value:'Example value: about 10 minutes of staff time saved'}];
export function ExampleScenarios(){
  return(<div>
    <div className="grid gap-4 md:grid-cols-2">{SCENARIOS.map(s=>(<article key={s.title} className="flex flex-col rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
      <div className="mb-2 flex items-center justify-between"><span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300">Example scenario</span><span className="text-xs text-slate-500">{s.time}</span></div>
      <h3 className="mb-3 text-lg font-semibold">{s.title}</h3>
      <ul className="mb-3 flex-1 space-y-1.5 text-sm">{s.steps.map(([who,line],i)=>(<li key={i} className="flex gap-2"><b className={`w-28 shrink-0 text-xs ${who==='Caller'?'text-slate-400':'text-emerald-400'}`}>{who}</b><span className="text-slate-300">{line}</span></li>))}</ul>
      <p className="text-sm text-slate-300">{s.result}</p>
      <p className="mt-2 text-sm font-semibold text-emerald-400">{s.value}</p>
    </article>))}</div>
    <p className="mt-4 text-xs text-slate-500">These are made-up examples that show what your agents can do. The numbers are illustrative, not results from real customers. Steps like sending a payment link depend on the tools you connect.</p>
  </div>);
}
