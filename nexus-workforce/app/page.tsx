import Link from 'next/link';import {INDUSTRIES,recoveredRevenue} from '@/lib/industries';
export default function Landing(){return(<main className="mx-auto max-w-4xl p-8">
 <h1 className="text-4xl font-bold">Every call answered. Every lead followed up.</h1>
 <div className="mt-8 grid gap-4 md:grid-cols-3">{INDUSTRIES.map(i=>(<div key={i.id} className="rounded-xl border border-slate-700 p-5">
  <h2 className="font-semibold">{i.label}</h2><p className="text-emerald-400 text-2xl">${Math.round(recoveredRevenue(i.defaults)).toLocaleString()}/mo</p><p className="text-sm text-slate-400">estimated recovered revenue</p></div>))}</div>
 <Link href="/signup" className="mt-8 inline-block rounded bg-emerald-600 px-5 py-3">Get started</Link></main>);}
