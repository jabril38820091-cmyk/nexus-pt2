import {NextRequest,NextResponse} from 'next/server';
import {randomBytes} from 'crypto';
import {createClient} from '@/lib/supabase/server';
import {supabaseAdmin} from '@/lib/supabase/admin';
import {serviceEmail,freeBusy,findEvent,CalendarAccessError} from '@/lib/google-calendar';
import {availability} from '@/lib/booking';
const EMAILISH=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
async function who(){
  const sb=createClient();const {data:{user}}=await sb.auth.getUser();
  if(!user)return null;
  const {data:co}=await sb.from('companies').select('id,timezone').limit(1).maybeSingle();
  return co?{id:co.id as string,tz:(co.timezone as string|null)||'UTC'}:null;
}
export async function GET(){
  const me=await who();if(!me)return NextResponse.json({error:'unauthorized'},{status:401});
  return NextResponse.json({serviceEmail:serviceEmail()});
}
export async function POST(req:NextRequest){
  try{
    const me=await who();if(!me)return NextResponse.json({error:'unauthorized'},{status:401});
    const b=await req.json();
    const svc=serviceEmail();
    if(!svc)return NextResponse.json({error:'not_configured',detail:'Calendar booking is not set up on the server yet.'},{status:503});
    const {data:cur}=await supabaseAdmin.from('booking_settings').select('calendar_id,verify_code,verified').eq('company_id',me.id).maybeSingle();
    if(b.action==='connect'){
      const id=String(b.calendarId??'').trim();
      if(!EMAILISH.test(id)||id.length>200)return NextResponse.json({error:'bad_calendar',detail:'Enter the Calendar ID from your Google Calendar settings. It looks like an email address.'},{status:400});
      try{await freeBusy(id,new Date().toISOString(),new Date(Date.now()+3600_000).toISOString(),me.tz)}
      catch(e){if(e instanceof CalendarAccessError)return NextResponse.json({error:'not_shared',detail:`We can't see that calendar yet. Share it with ${svc} and choose "Make changes to events", then try again.`},{status:400});throw e}
      const code='NX-'+randomBytes(3).toString('hex').toUpperCase();
      const {error}=await supabaseAdmin.from('booking_settings').upsert({company_id:me.id,calendar_id:id,verify_code:code,verified:false,updated_at:new Date().toISOString()},{onConflict:'company_id'});
      if(error)return NextResponse.json({error:'save_failed',detail:error.message},{status:500});
      return NextResponse.json({ok:true,code});
    }
    if(!cur)return NextResponse.json({error:'not_connected',detail:'Connect a calendar first.'},{status:400});
    if(b.action==='verify'){
      if(!cur.verify_code)return NextResponse.json({ok:true});
      let found=false;
      try{found=await findEvent(cur.calendar_id,cur.verify_code,new Date(Date.now()-2*86400_000).toISOString(),new Date(Date.now()+30*86400_000).toISOString())}
      catch(e){if(e instanceof CalendarAccessError)return NextResponse.json({error:'not_shared',detail:`We can't see that calendar. Make sure it's shared with ${svc}.`},{status:400});throw e}
      if(!found)return NextResponse.json({error:'not_found',detail:`We couldn't find an event titled ${cur.verify_code}. Create one on that calendar (any time in the next few weeks), then try again.`},{status:400});
      await supabaseAdmin.from('booking_settings').update({verified:true,verify_code:null,updated_at:new Date().toISOString()}).eq('company_id',me.id);
      return NextResponse.json({ok:true});
    }
    if(!cur.verified)return NextResponse.json({error:'not_verified',detail:'Verify your calendar first.'},{status:400});
    if(b.action==='save'){
      const inList=(v:unknown,list:number[])=>list.includes(Number(v));
      if(!inList(b.duration,[15,30,45,60,90,120])||!inList(b.buffer,[0,5,10,15,30])||!(Number(b.minNotice)>=0&&Number(b.minNotice)<=72)||!(Number(b.maxDays)>=1&&Number(b.maxDays)<=90))return NextResponse.json({error:'bad_values',detail:'Please choose values from the lists.'},{status:400});
      await supabaseAdmin.from('booking_settings').update({duration_minutes:Number(b.duration),buffer_minutes:Number(b.buffer),min_notice_hours:Math.round(Number(b.minNotice)),max_days_ahead:Math.round(Number(b.maxDays)),enabled:b.enabled!==false,updated_at:new Date().toISOString()}).eq('company_id',me.id);
      return NextResponse.json({ok:true});
    }
    if(b.action==='test')return NextResponse.json({ok:true,text:await availability(me.id,String(b.date??'today'))});
    return NextResponse.json({error:'bad_action'},{status:400});
  }catch(e){return NextResponse.json({error:'failed',detail:e instanceof Error?e.message:String(e)},{status:500})}
}
export async function DELETE(){
  const me=await who();if(!me)return NextResponse.json({error:'unauthorized'},{status:401});
  await supabaseAdmin.from('booking_settings').delete().eq('company_id',me.id);
  return NextResponse.json({ok:true});
}
