import {NextRequest,NextResponse} from 'next/server';
import {requireAdmin} from '@/lib/admin';
import {supabaseAdmin} from '@/lib/supabase/admin';
const STATUSES=['new','contacted','demo booked','customer','not a fit'];
export async function GET(){
  if(!(await requireAdmin()))return NextResponse.json({error:'forbidden'},{status:403});
  const {data}=await supabaseAdmin.from('demo_requests').select('id,created_at,name,business,email,phone,business_type,message,source,status').order('created_at',{ascending:false}).limit(200);
  return NextResponse.json({requests:data??[],statuses:STATUSES});
}
export async function POST(req:NextRequest){
  if(!(await requireAdmin()))return NextResponse.json({error:'forbidden'},{status:403});
  const {id,status}=await req.json();
  if(!STATUSES.includes(status)||typeof id!=='string')return NextResponse.json({error:'bad_request'},{status:400});
  await supabaseAdmin.from('demo_requests').update({status}).eq('id',id);
  return NextResponse.json({ok:true});
}
