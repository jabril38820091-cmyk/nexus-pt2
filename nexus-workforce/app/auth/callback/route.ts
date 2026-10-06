import {NextResponse,type NextRequest} from 'next/server';import {createClient} from '@/lib/supabase/server';
export async function GET(req:NextRequest){
  const {searchParams,origin}=new URL(req.url);const code=searchParams.get('code');
  const next=searchParams.get('next');
  const dest=next&&next.startsWith('/')&&!next.startsWith('//')?next:'/hub';
  if(code){const {error}=await createClient().auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(`${origin}${dest}`)}
  return NextResponse.redirect(`${origin}/login`);
}
