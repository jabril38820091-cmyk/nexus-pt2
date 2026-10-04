'use client';
import {Suspense,useEffect,useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {AppShell} from '@/components/app-shell';
import {PlanCards} from '@/components/plan-cards';
import {createClient} from '@/lib/supabase/client';
type Co={plan:string|null;subscription_status:string|null;current_period_end:string|null;stripe_customer_id:string|null};
function Inner(){
  const q=useSearchParams();const [co,setCo]=useState<Co|null|undefined>(undefined);const [err,setErr]=useState('');
  useEffect(()=>{createClient().from('companies').select('plan,subscription_status,current_period_end,stripe_customer_id').limit(1).maybeSingle().then(({data})=>setCo(data))},[]);
  async function portal(){
    setErr('');const r=await fetch('/api/stripe/portal',{method:'POST'});const j=await r.json();
    if(!r.ok)return setErr(j.detail??j.error??'Could not open billing portal');window.location.href=j.url;
  }
  const active=co?.subscription_status==='active';
  return(<>
    <h1 className="mb-4 text-2xl font-semibold">Billing</h1>
    {q.get('status')==='success'&&<p className="mb-4 rounded border border-emerald-700 bg-emerald-950 p-3 text-sm text-emerald-300">Payment received. Your plan activates as soon as Stripe confirms it, usually within a few seconds. Refresh if it still says inactive.</p>}
    {q.get('status')==='cancelled'&&<p className="mb-4 rounded border border-slate-700 p-3 text-sm text-slate-300">Checkout was cancelled. You have not been charged.</p>}
    {co===undefined&&<p className="text-slate-500">Loading…</p>}
    {co===null&&<p className="text-amber-400">Finish onboarding first so we know which business to bill.</p>}
    {co&&<div className="mb-8 max-w-md rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm">
      <div className="flex justify-between py-1"><span className="text-slate-400">Status</span><b className={active?'text-emerald-400':'text-amber-400'}>{co.subscription_status??'inactive'}</b></div>
      <div className="flex justify-between py-1"><span className="text-slate-400">Plan</span><b>{active?co.plan:'None'}</b></div>
      {co.current_period_end&&<div className="flex justify-between py-1"><span className="text-slate-400">Current period ends</span><b>{new Date(co.current_period_end).toLocaleDateString()}</b></div>}
      {co.stripe_customer_id&&<button onClick={portal} className="mt-3 w-full rounded border border-slate-600 py-2">Manage billing or cancel</button>}
      {err&&<p role="alert" className="mt-2 text-amber-400">{err}</p>}
    </div>}
    {co&&<PlanCards current={active?co.plan:null}/>}
  </>);
}
export default function Billing(){return(<AppShell><Suspense fallback={<p className="text-slate-500">Loading…</p>}><Inner/></Suspense></AppShell>)}
