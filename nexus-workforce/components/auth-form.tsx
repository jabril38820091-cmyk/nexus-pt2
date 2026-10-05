'use client';
import {useState} from 'react';import Link from 'next/link';import {useRouter} from 'next/navigation';import {createClient} from '@/lib/supabase/client';
export function AuthForm({mode}:{mode:'login'|'signup'}){
 const router=useRouter();const [email,setEmail]=useState('');const [password,setPassword]=useState('');
 const [msg,setMsg]=useState('');const [busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent){
  e.preventDefault();setBusy(true);setMsg('');const sb=createClient();
  if(mode==='signup'){
   const {data,error}=await sb.auth.signUp({email,password,options:{emailRedirectTo:`${location.origin}/auth/callback`}});
   setBusy(false);
   if(error)return setMsg(error.message);
   if(data.session)return router.push('/office');
   return setMsg('Check your email and click the confirmation link.');
  }
  const {error}=await sb.auth.signInWithPassword({email,password});
  setBusy(false);
  if(error)return setMsg(error.message);
  router.push('/office');router.refresh();
 }
 return(<main className="mx-auto mt-24 max-w-sm p-6">
  <h1 className="text-2xl font-semibold">{mode==='login'?'Log in':'Create your account'}</h1>
  <form onSubmit={submit} className="mt-6 space-y-4">
   <label className="block text-sm">Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full rounded border border-slate-600 bg-slate-900 p-2"/></label>
   <label className="block text-sm">Password<input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full rounded border border-slate-600 bg-slate-900 p-2"/></label>
   <button disabled={busy} className="w-full rounded bg-emerald-600 py-2 font-medium disabled:opacity-50">{busy?'Please wait…':mode==='login'?'Log in':'Sign up'}</button>
   {msg&&<p role="alert" className="text-sm text-amber-400">{msg}</p>}
  </form>
  <p className="mt-4 text-sm text-slate-400">{mode==='login'?<>No account? <Link className="underline" href="/signup">Sign up</Link></>:<>Have an account? <Link className="underline" href="/login">Log in</Link></>}</p>
 </main>);}
