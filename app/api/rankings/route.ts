
import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const game_mode = searchParams.get('game_mode');

  let query = supabase.from('rankings').select('*');

  if (game_mode) {
    query = query.eq('game_mode', `${game_mode}x${game_mode}`);
  }

  const { data, error } = await query
    .order('time', { ascending: true })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { name, time, game_mode } = await request.json();

  if (!name || !time || !game_mode) {
    return NextResponse.json({ error: 'Missing name, time, or game_mode' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('rankings')
    .insert([{ name, time, game_mode: `${game_mode}x${game_mode}` }])
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
