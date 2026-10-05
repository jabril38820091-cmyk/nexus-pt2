export type Scenario={label:string;revenueCents:number;outcome:string;steps:{agentId:string;line:string}[]};
export type Defaults={callsPerMonth:number;missedPct:number;closePct:number;avgValue:number};
const S=(agentId:string,line:string)=>({agentId,line});
// Neutral example numbers and scripts that fit any business. Replace with your own.
export const DEMO_DEFAULTS:Defaults={callsPerMonth:300,missedPct:25,closePct:20,avgValue:500};
export const DEMO_SCENARIOS:Scenario[]=[
  {label:'New customer signs up',revenueCents:50000,outcome:'New customer won',steps:[S('router','Thanks for calling, how can I help?'),S('lead-qualifier','What are you looking for today?'),S('product-specialist','Here is how we can help with that.'),S('deal-closer','I can get you started today.')]},
  {label:'Customer is kept',revenueCents:15000,outcome:'Customer kept',steps:[S('router','Thanks for calling, how can I help?'),S('support','Let me look at your account.'),S('retention','I can offer you a better option.')]},
  {label:'Invoice gets paid',revenueCents:30000,outcome:'Invoice collected',steps:[S('router','Thanks for calling, how can I help?'),S('billing','I sent a secure payment link to your phone.')]}];
export const recoveredRevenue=(d:Defaults,recovery=0.7)=>d.callsPerMonth*(d.missedPct/100)*recovery*(d.closePct/100)*d.avgValue;
