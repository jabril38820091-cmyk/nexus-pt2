'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {createClient} from '@/lib/supabase/client';
import {ChangePassword} from '@/components/change-password';
const box='mt-1 block w-64 rounded border border-slate-600 bg-slate-950 p-2 text-sm';
export function AccountSecurity(){
  const router=useRouter();const [email,setEmail]=useState('');const [msg,setMsg]=useState('');
  async function changeEmail(e:React.FormEvent){
    e.preventDefault();
    const {error}=await createClient().auth.updateUser({email:email.trim()});
    setMsg(error?error.message:'Check both your old and new inboxes for a confirmation link.');if(!error)setEmail('');
  }
  async function signOutEverywhere(){await createClient().auth.signOut({scope:'global'});router.push('/login')}
  return(<div className="space-y-6">
    <div><h3 className="mb-2 text-sm font-medium">Change password</h3><ChangePassword/></div>
    <form onSubmit={changeEmail} className="flex flex-wrap items-end gap-2"><label className="text-sm">New email address<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className={box}/></label>
      <button className="rounded border border-slate-600 px-4 py-2 text-sm">Change email</button>{msg&&<p role="status" className="w-full text-sm text-slate-300">{msg}</p>}</form>
    <div><h3 className="mb-1 text-sm font-medium">Sign out everywhere</h3><p className="mb-2 text-xs text-slate-400">Ends your session on every device, including this one.</p>
      <button onClick={signOutEverywhere} className="rounded border border-slate-600 px-4 py-2 text-sm">Sign out of all devices</button></div>
  </div>);
}
