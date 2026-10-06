import 'server-only';
import {createClient} from '@/lib/supabase/server';
/** Returns the signed-in user only if their verified email is listed in ADMIN_EMAILS. */
export async function requireAdmin(){
  const sb=createClient();const {data:{user}}=await sb.auth.getUser();
  if(!user?.email||!user.email_confirmed_at)return null;
  const list=(process.env.ADMIN_EMAILS??'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
  return list.includes(user.email.toLowerCase())?user:null;
}
