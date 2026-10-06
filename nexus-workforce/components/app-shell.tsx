'use client';
import Link from 'next/link';
import {useEffect} from 'react';
import {useCompany} from '@/lib/use-company';
import {usePathname,useRouter} from 'next/navigation';
import {createClient} from '@/lib/supabase/client';
const NAV=[['/hub','Money Hub'],['/office','Office'],['/departments','Departments'],['/tasks','Tasks'],['/calls','Calls'],['/emails','Emails'],['/billing','Billing'],['/integrations','Integrations'],['/settings','Settings']];
export function AppShell({children}:{children:React.ReactNode}){
  const path=usePathname();const router=useRouter();const {company,loading,isAdmin}=useCompany();
  useEffect(()=>{if(!loading&&!company)router.replace('/onboarding')},[loading,company,router]);
  const inactive=!!company&&company.subscription_status!=='active';
  return(<div className="min-h-screen">
    <header className="border-b border-slate-800 bg-slate-950/80">
      <nav className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-1 px-6 py-3">
        <span className="mr-4 font-semibold">Nexus Workforce</span>
        {[...NAV,...(isAdmin?[['/admin','Admin']]:[])].map(([href,label])=>(<Link key={href} href={href} className={`rounded px-3 py-1.5 text-sm ${path===href?'bg-slate-800 text-white':'text-slate-400 hover:text-white'}`}>{label}</Link>))}
        <button onClick={async()=>{await createClient().auth.signOut();router.push('/login')}} className="ml-auto text-sm text-slate-400 hover:text-white">Sign out</button>
      </nav>
    </header>
    {inactive&&path!=='/billing'&&<div className="bg-amber-900/60 px-6 py-2 text-center text-sm text-amber-200">Your plan isn't active yet. <Link href="/billing" className="underline">Choose a plan</Link> to go live.</div>}
    <main className="mx-auto max-w-[1400px] px-6 py-6">{children}</main>
  </div>);
}
