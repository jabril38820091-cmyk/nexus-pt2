import {NextRequest,NextResponse} from 'next/server';
import {toolAuthorized,companyForCall} from '@/lib/tool-auth';
import {sendSms} from '@/lib/sms';
type TC={id:string;name?:string;arguments?:unknown;function?:{name?:string;arguments?:unknown}};
export async function POST(req:NextRequest){
  if(!toolAuthorized(req))return NextResponse.json({error:'unauthorized'},{status:401});
  try{
    const {message:m}=await req.json();
    const call=m?.call??{};const companyId=await companyForCall(call);
    const results:{toolCallId:string;result:string}[]=[];
    for(const tc of (m?.toolCallList??[]) as TC[]){
      let r:string;
      if((tc.function?.name??tc.name)!=='send_text')r='Unknown tool.';
      else if(!companyId)r='I could not find the business account for this call.';
      else{
        let args=tc.function?.arguments??tc.arguments??{};
        if(typeof args==='string'){try{args=JSON.parse(args)}catch{args={}}}
        const {to,message}=args as {to?:string;message?:string};
        r=(await sendSms(companyId,String(to??''),String(message??''),call.id??null)).message;
      }
      results.push({toolCallId:tc.id,result:r.replace(/\s+/g,' ').trim()});
    }
    return NextResponse.json({results});
  }catch{return NextResponse.json({error:'bad_request'},{status:400})}
}
