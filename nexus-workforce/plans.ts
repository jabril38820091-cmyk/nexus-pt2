import type {DepartmentId} from '@/lib/agents/roster';
export type PlanKey='receptionist'|'starter'|'growth'|'full';
/** Which departments each plan includes. The agents allowed on a plan come from this. */
export const PLAN_DEPTS:Record<PlanKey,DepartmentId[]>={
  receptionist:['lobby'],
  starter:['lobby','sales','success'],
  growth:['lobby','sales','success','finance','executive'],
  full:['lobby','sales','success','finance','executive','marketing','operations']};
export const PLANS:{key:PlanKey;name:string;price:number;minutes:string;minutesNum:number;badge?:string;hot?:boolean;tagline:string;bestFor:string;features:string[]}[]=[
  {key:'receptionist',name:'Receptionist',price:99,minutes:'250 call minutes',minutesNum:250,badge:'Just the front desk',tagline:'One agent that answers every call.',bestFor:'Businesses that just need calls answered and messages taken.',
   features:['Answers every call, any hour','Finds out what the caller needs and takes a message','Answers common questions you teach it','Live office view, chat and voice with your receptionist','Follow-up drafts you approve with one click']},
  {key:'starter',name:'Starter',price:199,minutes:'500 call minutes',minutesNum:500,tagline:'Add sales and customer support.',bestFor:'Small teams that want calls handled and customers looked after.',
   features:['Everything in Receptionist','Sales team: qualify callers, answer product questions, hand off to closing','Customer Success team: onboarding, support, retention and escalation','Assign tasks to any agent']},
  {key:'growth',name:'Growth',price:499,minutes:'2,000 call minutes',minutesNum:2000,hot:true,badge:'Most popular',tagline:'Add finance and leadership summaries.',bestFor:'Growing teams that also want billing help and management reports.',
   features:['Everything in Starter','Finance team: billing questions, expense and revenue summaries','Executive team: chief of staff, strategy and performance summaries']},
  {key:'full',name:'Full Company',price:1499,minutes:'10,000 call minutes',minutesNum:10000,tagline:'Every department, one team.',bestFor:'Businesses that want a complete AI team across the whole company.',
   features:['Everything in Growth','Marketing team: campaign ideas, content drafts, analytics notes','Operations team: process, vendor and quality checks','Priority support']}];
