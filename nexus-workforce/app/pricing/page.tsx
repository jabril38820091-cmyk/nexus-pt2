import Link from 'next/link';
import {PlanCards} from '@/components/plan-cards';
export default function Pricing(){
  return(<main className="mx-auto max-w-5xl p-8">
    <Link href="/" className="text-sm text-slate-400 underline">← Back</Link>
    <h1 className="mt-4 text-3xl font-bold">Pricing</h1>
    <p className="mb-8 mt-1 text-slate-400">Flat monthly price. Cancel any time from your billing page.</p>
    <PlanCards/>
  </main>);
}
