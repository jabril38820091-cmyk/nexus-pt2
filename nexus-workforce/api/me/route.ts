import {NextResponse} from 'next/server';
import {requireAdmin} from '@/lib/admin';
export async function GET(){
  return NextResponse.json({isAdmin:!!(await requireAdmin())});
}
