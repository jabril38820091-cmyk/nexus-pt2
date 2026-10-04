export type PlanKey='starter'|'growth'|'full';
export const PLANS:{key:PlanKey;name:string;price:number;minutes:string;hot?:boolean;features:string[]}[]=[
 {key:'starter',name:'Starter',price:199,minutes:'500 call minutes',features:['Router, Sales and Success agents (8)','Your own phone number','Live office view']},
 {key:'growth',name:'Growth',price:499,minutes:'2,000 call minutes',hot:true,features:['Everything in Starter','Finance and Executive agents (14)','Invoice collection calls','Task assignment to any agent']},
 {key:'full',name:'Full Company',price:1499,minutes:'10,000 call minutes',features:['All 6 departments, 20 agents','Marketing and Operations agents','Priority support']}];
