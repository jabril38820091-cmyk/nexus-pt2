import Link from 'next/link';
import {PlanCards} from '@/components/plan-cards';
import {RoiCalculator} from '@/components/roi-calculator';
import {LandingDemo} from '@/components/landing-demo';
import {ExampleScenarios} from '@/components/example-scenarios';
const STEPS=[
  ['Answer every call','Your front-desk agent picks up in seconds, any hour, and finds out what the caller needs.'],
  ['Route to the right specialist','Sales, support, billing and more take over mid-call, so callers never repeat themselves.'],
  ['Watch it work','Your live office shows each agent, each handoff and the revenue captured.']];
const DEPTS=[['💼','Sales','Qualify leads, answer product questions, close deals'],['🎧','Customer Success','Support, retention and escalation'],['💰','Finance','Billing questions and overdue invoices'],['📣','Marketing','Campaign ideas and content drafts'],['⚙️','Operations','Process, vendors and quality checks'],['👔','Executive','Summaries and performance reviews']];
export default function Landing(){
  return(<div className="min-h-screen">
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
      <span className="font-semibold">Nexus Workforce</span>
      <nav className="flex items-center gap-4 text-sm"><a href="#pricing" className="text-slate-400 hover:text-white">Pricing</a><Link href="/login" className="text-slate-400 hover:text-white">Log in</Link><Link href="/signup" className="rounded-lg bg-emerald-600 px-4 py-2 font-medium">Get started</Link></nav>
    </header>
    <main>
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h1 className="text-4xl font-bold leading-tight md:text-6xl">Every call answered. Every lead followed up.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-400">A team of AI voice agents answers your phone around the clock, qualifies leads, books and closes work, and chases unpaid invoices.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/signup" className="rounded-lg bg-emerald-600 px-6 py-3 font-medium">Start now</Link><a href="#demo" className="rounded-lg border border-slate-600 px-6 py-3">Watch it work</a><a href="#calculator" className="rounded-lg border border-slate-600 px-6 py-3">See what you could recover</a></div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="mb-6 text-2xl font-semibold">How it works</h2>
        <div className="grid gap-4 md:grid-cols-3">{STEPS.map(([t,d],i)=>(<div key={t} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6"><div className="mb-2 text-emerald-400">0{i+1}</div><h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm text-slate-400">{d}</p></div>))}</div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="mb-6 text-2xl font-semibold">A full company, not one chatbot</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{DEPTS.map(([i,n,d])=>(<div key={n} className="rounded-xl border border-slate-700 p-4"><div className="font-medium">{i} {n}</div><p className="text-sm text-slate-400">{d}</p></div>))}</div>
      </section>
      <section id="demo" className="mx-auto max-w-6xl scroll-mt-6 px-6 py-12"><h2 className="mb-2 text-2xl font-semibold">See it work</h2><p className="mb-6 text-slate-400">A sample business, a sample call. Watch agents hand off and a follow-up get drafted.</p><LandingDemo/></section>
      <section id="examples" className="mx-auto max-w-6xl scroll-mt-6 px-6 py-12"><h2 className="mb-2 text-2xl font-semibold">Example scenarios</h2><p className="mb-6 text-slate-400">Four moments where an answered call, or a quick follow-up, makes a difference.</p><ExampleScenarios/></section>
      <section id="calculator" className="mx-auto max-w-6xl scroll-mt-6 px-6 py-12">
        <h2 className="mb-6 text-2xl font-semibold">What are missed calls costing you?</h2>
        <RoiCalculator/>
      </section>
      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-6 px-6 py-12">
        <h2 className="mb-2 text-2xl font-semibold">Pricing</h2><p className="mb-6 text-slate-400">Flat monthly price. Cancel any time.</p>
        <PlanCards/>
      </section>
    </main>
    <footer className="mx-auto max-w-6xl px-6 py-10 text-sm text-slate-500">© Nexus Workforce</footer>
  </div>);
}
