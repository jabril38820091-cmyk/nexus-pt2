export type DepartmentId='lobby'|'sales'|'marketing'|'success'|'operations'|'finance'|'executive';
export type AgentRoster={id:string;name:string;department:DepartmentId;role:string;deskIndex:number;voiceId:string;avatarColor:string};
export const DEPARTMENTS:Record<DepartmentId,{label:string;icon:string;color:string;kpi:string}>={
 lobby:{label:'Lobby',icon:'🛎',color:'#8b5cf6',kpi:'Calls today'},
 sales:{label:'Sales',icon:'💼',color:'#10b981',kpi:'Pipeline'},
 marketing:{label:'Marketing',icon:'📣',color:'#f59e0b',kpi:'Campaigns live'},
 success:{label:'Customer Success',icon:'🎧',color:'#3b82f6',kpi:'Open tickets'},
 operations:{label:'Operations',icon:'⚙️',color:'#6366f1',kpi:'SLA %'},
 finance:{label:'Finance',icon:'💰',color:'#14b8a6',kpi:'MRR'},
 executive:{label:'Executive',icon:'👔',color:'#ef4444',kpi:'Revenue'}};
const A=(id:string,name:string,department:DepartmentId,role:string,deskIndex:number,voiceId:string):AgentRoster=>({id,name,department,role,deskIndex,voiceId,avatarColor:DEPARTMENTS[department].color});
export const ROSTER:AgentRoster[]=[
 A('router','Router','lobby','Receptionist',0,'Elliot'),
 A('lead-qualifier','Lead Qualifier','sales','SDR',0,'Rachel'),A('product-specialist','Product Specialist','sales','Product Expert',1,'Rachel'),A('deal-closer','Deal Closer','sales','AE',2,'Rachel'),
 A('campaign-strategist','Campaign Strategist','marketing','Strategist',0,'Aria'),A('content-creator','Content Creator','marketing','Copywriter',1,'Aria'),A('analytics-seo','Analytics & SEO','marketing','Analyst',2,'Aria'),
 A('onboarding','Onboarding','success','Onboarding',0,'Sarah'),A('support','Support Agent','success','Tier 1',1,'Sarah'),A('retention','Retention','success','Retention',2,'Sarah'),A('escalation','Escalation','success','Tier 2',3,'Sarah'),
 A('process-optimizer','Process Optimizer','operations','Ops',0,'Nico'),A('vendor-coordinator','Vendor Coordinator','operations','Vendor Mgmt',1,'Nico'),A('qa-agent','Quality Assurance','operations','QA',2,'Nico'),
 A('billing','Billing Agent','finance','Billing',0,'Kai'),A('expense-analyst','Expense Analyst','finance','Analyst',1,'Kai'),A('revenue-forecaster','Revenue Forecaster','finance','Forecaster',2,'Kai'),
 A('chief-of-staff','Chief of Staff','executive','Chief of Staff',0,'Elliot'),A('strategy-advisor','Strategy Advisor','executive','Strategy',1,'Elliot'),A('performance-analyst','Performance Analyst','executive','Analyst',2,'Elliot')];
