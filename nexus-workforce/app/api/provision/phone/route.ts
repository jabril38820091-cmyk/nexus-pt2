import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {supabaseAdmin} from '@/lib/supabase/admin';
import {requireAdmin} from '@/lib/admin';
import {vapi} from '@/lib/vapi/api';
export const maxDuration=30;
export async function POST(req:NextRequest){
  try{
    const sb=createClient();const {data:{user}}=await sb.auth.getUser();
    if(!user)return NextResponse.json({error:'unauthorized'},{status:401});
    const {areaCode}=await req.json();
    if(!/^\d{3}$/.test(String(areaCode??'')))return NextResponse.json({error:'bad_area_code',detail:'Enter a 3-digit area code.'},{status:400});
    const admin=!!(await requireAdmin());
    const {data:co}=await sb.from('companies').select('id,name,subscription_status').limit(1).maybeSingle();
    if(!co)return NextResponse.json({error:'company_not_found'},{status:404});
    if(!admin&&co.subscription_status!=='active')return NextResponse.json({error:'plan_required',detail:'Choose a plan on the Billing page first.'},{status:402});
    const {data:sq}=await supabaseAdmin.from('squads').select('id,vapi_squad_id,vapi_phone_number_id').eq('company_id',co.id).limit(1).maybeSingle();
    if(!sq)return NextResponse.json({error:'no_agents',detail:'Activate your agents first.'},{status:400});
    if(sq.vapi_phone_number_id)return NextResponse.json({error:'already_has_number'},{status:409});
    let target:Record<string,string>;
    if(sq.vapi_squad_id)target={squadId:sq.vapi_squad_id};
    else{const {data:a}=await supabaseAdmin.from('agents').select('vapi_assistant_id').eq('squad_id',sq.id).limit(1).maybeSingle();
      if(!a?.vapi_assistant_id)return NextResponse.json({error:'no_agents'},{status:400});target={assistantId:a.vapi_assistant_id}}
    const base=(process.env.NEXT_PUBLIC_APP_URL??'').replace(/\/$/,'');
    const num=await vapi('POST','/phone-number',{provider:'vapi',numberDesiredAreaCode:String(areaCode),name:`${co.name} line`.slice(0,40),...target,server:{url:`${base}/api/webhooks/vapi`,secret:process.env.VAPI_WEBHOOK_SECRET}});
    const digits:string|undefined=num.number;const sip:string|undefined=num.sipUri;
    await supabaseAdmin.from('squads').update({vapi_phone_number_id:num.id,phone_number:digits??sip??null}).eq('id',sq.id);
    return NextResponse.json({ok:true,number:digits??null,sipOnly:!digits&&!!sip});
  }catch(e){return NextResponse.json({error:'phone_failed',detail:e instanceof Error?e.message:String(e),hint:'If Vapi cannot assign a regular number, buy or import one in the Vapi dashboard and attach it to this squad.'},{status:500})}
}
