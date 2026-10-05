'use client';
import {useState} from 'react';
import {createClient} from '@/lib/supabase/client';
export function ChangePassword(){
  const [pw,setPw]=useState('');const [msg,setMsg]=useState('');
  async function go(e:React.FormEvent){
    e.preventDefault();
    if(pw.length<8)return setMsg('Use at least 8 characters.');
    const {error}=await createClient().auth.updateUser({password:pw});
    setMsg(error?error.message:'Password updated.');if(!error)setPw('');
  }
  return(<form onSubmit={go} className="flex flex-wrap items-end gap-2">
    <label className="text-sm">New password<input type="password" value={pw} onChange={e=>setPw(e.target.value)} autoComplete="new-password" className="mt-1 block w-64 rounded border border-slate-600 bg-slate-950 p-2"/></label>
    <button className="rounded border border-slate-600 px-4 py-2 text-sm">Change password</button>{msg&&<p role="status" className="w-full text-sm text-slate-300">{msg}</p>}</form>);
}
