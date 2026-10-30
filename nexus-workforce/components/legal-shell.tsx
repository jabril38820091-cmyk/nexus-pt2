import Link from 'next/link';
import {LEGAL,missingDetails} from '@/lib/legal';
export function LegalShell({title,children}:{title:string;children:React.ReactNode}){
  const missing=missingDetails();
  return(<main className="mx-auto max-w-3xl px-6 py-10">
    <Link href="/" className="text-sm text-slate-400 underline">← {LEGAL.product}</Link>
    <h1 className="mb-1 mt-4 text-3xl font-bold">{title}</h1>
    <p className="mb-6 text-sm text-slate-400">Last updated: {LEGAL.updated}</p>
    {missing.length>0&&<p role="note" className="mb-6 rounded border border-amber-600/50 bg-amber-950/40 p-3 text-sm text-amber-300">Draft: the business details below are not filled in yet ({missing.join(', ')}). Add them in your hosting settings to remove this notice.</p>}
    <div className="space-y-6 text-slate-300 [&_h2]:mb-2 [&_h2]:mt-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-100 [&_p]:leading-relaxed [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1">{children}</div>
    <nav className="mt-10 flex gap-4 border-t border-slate-800 pt-4 text-sm text-slate-400" aria-label="Legal"><Link href="/terms" className="underline">Terms of Service</Link><Link href="/privacy" className="underline">Privacy Policy</Link></nav>
  </main>);
}
