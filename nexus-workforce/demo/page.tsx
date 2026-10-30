import Link from 'next/link';
import {DemoForm} from '@/components/demo-form';
export const metadata={title:'Request a demo | Nexus Workforce'};
export default function Demo(){
  return(<main className="mx-auto max-w-3xl px-6 py-10">
    <Link href="/" className="text-sm text-slate-400 underline">← Nexus Workforce</Link>
    <h1 className="mb-2 mt-4 text-3xl font-bold">See an AI receptionist on your business</h1>
    <p className="mb-6 text-slate-400">Tell us a little about your business, and we'll show you how your agents would answer your calls. It takes about 15 minutes, with no commitment.</p>
    <DemoForm/>
  </main>);
}
