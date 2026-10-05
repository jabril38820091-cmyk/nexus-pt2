'use client';
import {useEffect,useState} from 'react';
import {createClient} from '@/lib/supabase/client';
export type Company={id:string;name:string;industry:string;agent_mode:string|null;chosen_agent:string|null;subscription_status:string|null;plan:string|null};
export function useCompany(){
  const [company,setCompany]=useState<Company|null>(null);const [loading,setLoading]=useState(true);
  useEffect(()=>{createClient().from('companies').select('id,name,industry,agent_mode,chosen_agent,subscription_status,plan').limit(1).maybeSingle().then(({data})=>{setCompany(data);setLoading(false)})},[]);
  return{company,loading};
}
