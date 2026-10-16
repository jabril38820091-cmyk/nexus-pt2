import 'server-only';
import {supabaseAdmin} from '@/lib/supabase/admin';
/** Removes stored transcripts older than the business's chosen number of days. 0 or empty means keep them. */
export async function purgeOldTranscripts(companyId:string,days:number|null|undefined):Promise<void>{
  try{
    if(!days||days<=0)return;
    const cutoff=new Date(Date.now()-days*86400_000).toISOString();
    await supabaseAdmin.from('calls').update({transcript_text:null,transcript:null}).eq('company_id',companyId).lt('created_at',cutoff).not('transcript_text','is',null);
  }catch{/* cleanup must never break the call webhook */}
}
