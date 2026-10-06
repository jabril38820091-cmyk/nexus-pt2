import {NextResponse} from 'next/server';
import {requireAdmin} from '@/lib/admin';
import {supabaseAdmin} from '@/lib/supabase/admin';
const count=async(t:string)=>(await supabaseAdmin.from(t).select('id',{count:'exact',head:true})).count??0;
export async function GET(){
  if(!(await requireAdmin()))return NextResponse.json({error:'forbidden'},{status:403});
  const [companies,squads,calls,tasks,emails]=await Promise.all(['companies','squads','calls','tasks','email_log'].map(count));
  const {data:list}=await supabaseAdmin.from('companies').select('id,name,industry,agent_mode,subscription_status,plan,created_at').order('created_at',{ascending:false}).limit(100);
  return NextResponse.json({counts:{companies,squads,calls,tasks,emails},companies:list??[]});
}
