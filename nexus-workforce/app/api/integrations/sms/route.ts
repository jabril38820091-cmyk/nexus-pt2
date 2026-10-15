import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {supabaseAdmin} from '@/lib/supabase/admin';
import {encrypt} from '@/lib/crypto';
import {isSid} from '@/lib/sms';
import {normalizePhone} from '@/lib/phone';
export async function POST(req:NextRequest){
  try{
    const sb=createClient();const {data:{user}}=await sb.auth.getUser();
    if(!user)return NextResponse.json({error:'unauthorized'},{status:401});
    const b=await req.json();
    const sid=String(b.accountSid??'').trim(),from=normalizePhone(String(b.fromNumber??'')),token=String(b.authToken??'').trim();
    if(!isSid(sid))return NextResponse.json({error:'bad_sid',detail:'The Account SID starts with AC and is 34 characters long. Copy it from your Twilio dashboard.'},{status:400});
    if(!from)return NextResponse.json({error:'bad_number',detail:'Enter the Twilio phone number you bought, like +16125550123.'},{status:400});
    const {data:co}=await sb.from('companies').select('id').limit(1).maybeSingle();
    if(!co)return NextResponse.json({error:'company_not_found'},{status:404});
    const {data:existing}=await supabaseAdmin.from('sms_settings').select('auth_token_enc').eq('company_id',co.id).maybeSingle();
    if(!token&&!existing)return NextResponse.json({error:'token_required',detail:'Enter your Twilio Auth Token.'},{status:400});
    const enc=token?encrypt(token):existing!.auth_token_enc;
    const {error}=await supabaseAdmin.from('sms_settings').upsert({company_id:co.id,account_sid:sid,auth_token_enc:enc,from_number:from,enabled:b.enabled!==false,updated_at:new Date().toISOString()},{onConflict:'company_id'});
    if(error)return NextResponse.json({error:'save_failed',detail:error.message},{status:500});
    return NextResponse.json({ok:true});
  }catch(e){return NextResponse.json({error:'failed',detail:e instanceof Error?e.message:String(e)},{status:500})}
}
export async function DELETE(){
  const sb=createClient();const {data:{user}}=await sb.auth.getUser();
  if(!user)return NextResponse.json({error:'unauthorized'},{status:401});
  const {data:co}=await sb.from('companies').select('id').limit(1).maybeSingle();
  if(!co)return NextResponse.json({error:'company_not_found'},{status:404});
  await supabaseAdmin.from('sms_settings').delete().eq('company_id',co.id);
  return NextResponse.json({ok:true});
}
