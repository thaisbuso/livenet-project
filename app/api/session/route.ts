import { NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabaseBrowser
    .from('sessions')
    .select('*')
    .eq('is_live', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ session: data ?? null });
}