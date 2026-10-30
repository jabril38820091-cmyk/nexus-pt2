'use client';
import {useState} from 'react';
import Link from 'next/link';
import {createClient} from '@/lib/supabase/client';
export default function Forgot(){
  const [email,setEmail]=useState('');const [msg,setMsg]=useState('');
  async function go(e:React.FormEvent){
    e.preventDefault();setMsg('Sending…');
    const {error}=await createClient().auth.resetPasswordForEmail(email,{redirectTo:`${location.origin}/auth/callback?next=/settings`});
    setMsg(error?error.message:'If that email has an account, a reset link is on its way.');
  }
  return(<main className="mx-auto mt-24 max-w-sm p-6"><h1 className="text-2xl font-semibold">Reset your password</h1>
    <form onSubmit={go} className="mt-6 space-y-4"><label className="block text-sm">Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full rounded border border-slate-600 bg-slate-900 p-2"/></label>
      <button className="w-full rounded bg-emerald-600 py-2 font-medium">Send reset link</button>{msg&&<p role="status" className="text-sm text-slate-300">{msg}</p>}</form>
    <p className="mt-4 text-sm"><Link href="/login" className="text-slate-400 underline">Back to log in</Link></p></main>);
}
