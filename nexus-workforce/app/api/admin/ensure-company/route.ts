import {NextResponse} from 'next/server';
import {requireAdmin} from '@/lib/admin';
import {supabaseAdmin} from '@/lib/supabase/admin';
export async function POST(){
  const user=await requireAdmin();
  if(!user)return NextResponse.json({error:'forbidden'},{status:403});
  const {data:existing}=await supabaseAdmin.from('companies').select('id').eq('owner_id',user.id).limit(1).maybeSingle();
  if(existing)return NextResponse.json({ok:true,created:false});
  const {error}=await supabaseAdmin.from('companies').insert({owner_id:user.id,name:'Admin test business',industry:'Other',agent_mode:'full',subscription_status:'active',plan:'full'});
  if(error)return NextResponse.json({error:'create_failed',detail:error.message},{status:500});
  return NextResponse.json({ok:true,created:true});
}
