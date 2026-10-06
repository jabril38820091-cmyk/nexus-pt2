import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {supabaseAdmin} from '@/lib/supabase/admin';
import {requireAdmin} from '@/lib/admin';
import {getStripe} from '@/lib/stripe/server';
import {vapi} from '@/lib/vapi/api';
export const maxDuration=60;
export async function POST(req:NextRequest){
  try{
    const sb=createClient();const {data:{user}}=await sb.auth.getUser();
    if(!user)return NextResponse.json({error:'unauthorized'},{status:401});
    const {confirm}=await req.json();
    if(confirm!=='DELETE')return NextResponse.json({error:'not_confirmed',detail:'Type DELETE to confirm.'},{status:400});
    if(await requireAdmin())return NextResponse.json({error:'forbidden',detail:"Admin accounts can't be deleted here."},{status:403});
    const {data:companies}=await supabaseAdmin.from('companies').select('id,stripe_subscription_id').eq('owner_id',user.id);
    // 1. Stop billing first. If this fails, stop here so the customer is never billed for a deleted account.
    for(const c of companies??[]){
      if(!c.stripe_subscription_id)continue;
      try{await getStripe().subscriptions.cancel(c.stripe_subscription_id)}
      catch(e){const code=(e as {code?:string}).code;if(code!=='resource_missing')return NextResponse.json({error:'billing_cancel_failed',detail:'We could not cancel your subscription. Cancel it on the Billing page first, then try again.'},{status:502})}
    }
    // 2. Remove only the agents we created for this customer (never the template, never a squad they connected themselves).
    const tpl=process.env.TEMPLATE_SQUAD_ID;
    for(const c of companies??[]){
      const {data:squads}=await supabaseAdmin.from('squads').select('id,vapi_squad_id,compiled_json').eq('company_id',c.id);
      for(const sq of squads??[]){
        if(sq.compiled_json?.provisioned!==true||(tpl&&sq.vapi_squad_id===tpl))continue;
        const {data:agents}=await supabaseAdmin.from('agents').select('vapi_assistant_id').eq('squad_id',sq.id);
        await Promise.all((agents??[]).filter(a=>a.vapi_assistant_id).map(a=>vapi('DELETE',`/assistant/${a.vapi_assistant_id}`).catch(()=>{})));
        if(sq.vapi_squad_id)await vapi('DELETE',`/squad/${sq.vapi_squad_id}`).catch(()=>{});
      }
    }
    // 3. Delete the login. Their business and everything attached to it is removed with it.
    const {error}=await supabaseAdmin.auth.admin.deleteUser(user.id);
    if(error)return NextResponse.json({error:'delete_failed',detail:error.message},{status:500});
    return NextResponse.json({ok:true});
  }catch(e){return NextResponse.json({error:'delete_failed',detail:e instanceof Error?e.message:String(e)},{status:500})}
}
