import Link from 'next/link';
import {PricingSection} from '@/components/pricing-section';
export default function Pricing(){
  return(<main className="mx-auto max-w-6xl p-8">
    <Link href="/" className="text-sm text-slate-400 underline">← Back</Link>
    <h1 className="mt-4 text-3xl font-bold">Pricing</h1>
    <p className="mb-8 mt-1 text-slate-400">Flat monthly price, no contracts. Start with just a receptionist, or take the whole team.</p>
    <PricingSection/>
    <p className="mt-10 text-xs text-slate-500">By subscribing you agree to the <Link href="/terms" className="underline">Terms of Service</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.</p>
  </main>);
}
