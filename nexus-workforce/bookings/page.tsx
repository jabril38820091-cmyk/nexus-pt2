'use client';
import {useEffect,useState} from 'react';
import {AppShell} from '@/components/app-shell';
import {createClient} from '@/lib/supabase/client';
type B={id:string;start_at:string;end_at:string;name:string;phone:string|null;reason:string|null;status:string};
export default function Bookings(){
  const [rows,setRows]=useState<B[]|null>(null);
  useEffect(()=>{createClient().from('bookings').select('id,start_at,end_at,name,phone,reason,status').eq('status','confirmed').order('start_at',{ascending:true}).limit(200).then(({data})=>setRows(data??[]))},[]);
  const now=Date.now();const upcoming=(rows??[]).filter(b=>new Date(b.end_at).getTime()>=now);const past=(rows??[]).filter(b=>new Date(b.end_at).getTime()<now).reverse();
  const row=(b:B)=>(<li key={b.id} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4"><div className="font-medium">{new Date(b.start_at).toLocaleString([],{weekday:'long',month:'long',day:'numeric',hour:'numeric',minute:'2-digit'})}</div>
    <div className="text-sm text-slate-300">{b.name}{b.phone?` · ${b.phone}`:''}</div>{b.reason&&<div className="text-sm text-slate-400">{b.reason}</div>}</li>);
  return(<AppShell>
    <h1 className="mb-1 text-2xl font-semibold">Bookings</h1>
    <p className="mb-5 text-sm text-slate-400">Appointments your agents booked. Times show in your computer's time zone. They also appear on your Google Calendar.</p>
    {rows===null&&<p className="text-slate-500">Loading…</p>}
    {rows&&rows.length===0&&<p className="text-sm text-slate-500">No bookings yet. Connect your calendar in Settings, then agents can book during calls.</p>}
    {upcoming.length>0&&<><h2 className="mb-2 font-medium">Upcoming</h2><ul className="mb-6 space-y-3">{upcoming.map(row)}</ul></>}
    {past.length>0&&<><h2 className="mb-2 font-medium text-slate-400">Past</h2><ul className="space-y-3 opacity-70">{past.slice(0,30).map(row)}</ul></>}
  </AppShell>);
}
