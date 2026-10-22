import {NextResponse} from 'next/server';
import {requireAdmin} from '@/lib/admin';
import {supabaseAdmin} from '@/lib/supabase/admin';
import {usageForCompany} from '@/lib/usage-server';
const count=async(t:string)=>(await supabaseAdmin.from(t).select('id',{count:'exact',head:true})).count??0;
export async function GET(){
  if(!(await requireAdmin()))return NextResponse.json({error:'forbidden'},{status:403});
  const [companies,squads,calls,tasks,emails]=await Promise.all(['companies','squads','calls','tasks','email_log'].map(count));
  const {data:list}=await supabaseAdmin.from('companies').select('id,name,industry,agent_mode,subscription_status,plan,created_at,timezone,current_period_start,current_period_end').order('created_at',{ascending:false}).limit(100);
  const rows=await Promise.all((list??[]).map(async c=>{const u=await usageForCompany(c).catch(()=>null);return{id:c.id,name:c.name,industry:c.industry,agent_mode:c.agent_mode,subscription_status:c.subscription_status,plan:c.plan,created_at:c.created_at,used:u?.used??null,limit:u?.limit??null}}));
  return NextResponse.json({counts:{companies,squads,calls,tasks,emails},companies:rows});
}
