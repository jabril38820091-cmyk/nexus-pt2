import {NextRequest,NextResponse} from 'next/server';
import {requireAdmin} from '@/lib/admin';
import {supabaseAdmin} from '@/lib/supabase/admin';
import {ROSTER} from '@/lib/agents/roster';
export async function POST(req:NextRequest){
  const user=await requireAdmin();
  if(!user)return NextResponse.json({error:'forbidden'},{status:403});
  const b=await req.json();const patch:Record<string,string|null>={};
  if(['active','inactive','past_due','canceled'].includes(b.subscription_status))patch.subscription_status=b.subscription_status;
  if(['full','receptionist','single'].includes(b.agent_mode)){
    patch.agent_mode=b.agent_mode;
    patch.chosen_agent=b.agent_mode==='single'?(ROSTER.some(a=>a.id===b.chosen_agent)?b.chosen_agent:'lead-qualifier'):null;
  }
  if(!Object.keys(patch).length)return NextResponse.json({error:'nothing_to_change'},{status:400});
  const {error}=await supabaseAdmin.from('companies').update(patch).eq('owner_id',user.id);
  if(error)return NextResponse.json({error:'update_failed',detail:error.message},{status:500});
  return NextResponse.json({ok:true});
}
