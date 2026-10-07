export const GOALS:{id:string;label:string;desc:string}[]=[
  {id:'answer_calls',label:'Answer and route every call',desc:'Pick up, find out what the caller needs, and send them to the right place.'},
  {id:'take_messages',label:'Take messages',desc:'Record who called, what they need, and how to reach them.'},
  {id:'faq',label:'Answer common questions',desc:'Hours, location, prices, policies, and how things work.'},
  {id:'support',label:'Help existing customers',desc:'Handle problems, requests, and account questions.'},
  {id:'scheduling',label:'Scheduling and reminders',desc:'Take appointment requests and reminders. Booking into a calendar needs a connected calendar.'},
  {id:'billing',label:'Billing questions and reminders',desc:'Answer billing questions and remind customers about unpaid invoices.'},
  {id:'followups',label:'Follow up after calls',desc:'Draft follow-ups for your approval.'},
  {id:'new_customers',label:'Welcome new customers',desc:'Collect details from people who want to become customers.'},
  {id:'internal',label:'Internal tasks and reporting',desc:'Summaries, vendor coordination, checklists, and process checks.'}];
export const DEFAULT_GOALS=['answer_calls','take_messages','faq'];
export const goalLabels=(ids:string[]|null|undefined)=>(ids??[]).map(i=>GOALS.find(g=>g.id===i)?.label).filter(Boolean) as string[];
