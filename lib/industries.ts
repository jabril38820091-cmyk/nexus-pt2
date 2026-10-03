export type Scenario={label:string;revenueCents:number;outcome:string;steps:{agentId:string;line:string}[]};
export type Industry={id:string;label:string;company:string;defaults:{callsPerMonth:number;missedPct:number;closePct:number;avgValue:number};scenarios:Scenario[]};
const S=(agentId:string,line:string)=>({agentId,line});
export const INDUSTRIES:Industry[]=[
{id:'dental',label:'Dental practice',company:'Bright Dental',defaults:{callsPerMonth:350,missedPct:30,closePct:25,avgValue:1100},scenarios:[
 {label:'New patient books',revenueCents:110000,outcome:'New patient booked',steps:[S('router','Bright Dental, how can I help?'),S('lead-qualifier','Are you in pain or after a cleaning?'),S('product-specialist','We have Thursday at 9.'),S('deal-closer','You are booked.')]},
 {label:'Appointment saved',revenueCents:18000,outcome:'Appointment saved',steps:[S('router','Bright Dental, how can I help?'),S('support','I see your visit tomorrow.'),S('retention','I can move you to Friday.')]}]},
{id:'home',label:'Home services',company:'Summit Home Services',defaults:{callsPerMonth:500,missedPct:35,closePct:30,avgValue:450},scenarios:[
 {label:'Emergency job booked',revenueCents:65000,outcome:'Emergency job booked',steps:[S('router','Summit Home Services, what is going on?'),S('lead-qualifier','Is water still running?'),S('product-specialist','A plumber can be there in 45 minutes.'),S('deal-closer','Booked.')]},
 {label:'Install approved',revenueCents:380000,outcome:'Install approved',steps:[S('router','Summit Home Services, how can I help?'),S('support','I have your furnace quote.'),S('deal-closer','I can hold Tuesday.')]}]},
{id:'law',label:'Law firm',company:'Harbor Law',defaults:{callsPerMonth:250,missedPct:30,closePct:15,avgValue:4500},scenarios:[
 {label:'Case signed',revenueCents:600000,outcome:'Client signed',steps:[S('router','Harbor Law, is this a new matter?'),S('lead-qualifier','Tell me what happened and when.'),S('product-specialist','Fees are contingent.'),S('deal-closer','I can send the agreement tonight.')]},
 {label:'Retainer paid',revenueCents:250000,outcome:'Retainer collected',steps:[S('router','Harbor Law, how can I help?'),S('billing','Your retainer is low. Here is a payment link.')]}]}];
export const recoveredRevenue=(d:Industry['defaults'],recovery=0.7)=>d.callsPerMonth*(d.missedPct/100)*recovery*(d.closePct/100)*d.avgValue;
