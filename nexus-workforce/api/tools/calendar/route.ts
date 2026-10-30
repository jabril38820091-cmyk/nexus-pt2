import {NextRequest,NextResponse} from 'next/server';
import {toolAuthorized,companyForCall} from '@/lib/tool-auth';
import {availability,book} from '@/lib/booking';
type TC={id:string;name?:string;arguments?:unknown;function?:{name?:string;arguments?:unknown}};
export const maxDuration=30;
export async function POST(req:NextRequest){
  if(!toolAuthorized(req))return NextResponse.json({error:'unauthorized'},{status:401});
  try{
    const {message:m}=await req.json();
    const call=m?.call??{};const companyId=await companyForCall(call);
    const results:{toolCallId:string;result:string}[]=[];
    for(const tc of (m?.toolCallList??[]) as TC[]){
      const name=tc.function?.name??tc.name;
      let args:Record<string,unknown>={};
      const raw=tc.function?.arguments??tc.arguments??{};
      if(typeof raw==='string'){try{args=JSON.parse(raw)}catch{args={}}}else args=raw as Record<string,unknown>;
      let r:string;
      if(!companyId)r='I could not find the business account for this call.';
      else if(name==='check_availability')r=await availability(companyId,args.date==null?null:String(args.date));
      else if(name==='book_appointment')r=await book(companyId,args,call.id??null);
      else r='Unknown tool.';
      results.push({toolCallId:tc.id,result:r.replace(/\s+/g,' ').trim()});
    }
    return NextResponse.json({results});
  }catch{return NextResponse.json({error:'bad_request'},{status:400})}
}
