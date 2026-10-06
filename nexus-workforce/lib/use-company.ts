'use client';
import {useEffect,useState} from 'react';
import {createClient} from '@/lib/supabase/client';
export type Company={id:string;name:string;industry:string;agent_mode:string|null;chosen_agent:string|null;subscription_status:string|null;plan:string|null};
export function useCompany(){
  const [company,setCompany]=useState<Company|null>(null);const [loading,setLoading]=useState(true);const [isAdmin,setIsAdmin]=useState(false);
  useEffect(()=>{(async()=>{
    const sb=createClient();
    const q=()=>sb.from('companies').select('id,name,industry,agent_mode,chosen_agent,subscription_status,plan').limit(1).maybeSingle();
    let {data}=await q();
    let admin=false;
    try{const r=await fetch('/api/me');admin=r.ok&&(await r.json()).isAdmin===true}catch{/* treat as not admin */}
    if(!data&&admin){await fetch('/api/admin/ensure-company',{method:'POST'});({data}=await q())}
    setIsAdmin(admin);setCompany(data);setLoading(false);
  })()},[]);
  return{company,loading,isAdmin};
}
