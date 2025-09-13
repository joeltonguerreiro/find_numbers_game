
import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

interface Score {
  id: number;
  created_at: string;
  name: string;
  time: number;
  game_mode: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const game_mode = searchParams.get('game_mode');
  const name = searchParams.get('name');

  if (name) {
    return getUserScores(name, game_mode);
  }

  let query = supabase.from('rankings').select('*');

  if (game_mode) {
    query = query.eq('game_mode', `${game_mode}x${game_mode}`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const bestScores = (data as Score[]).reduce((acc, score) => {
    const name = score.name.toLowerCase();
    if (!acc[name] || score.time < acc[name].time) {
      acc[name] = score;
    }
    return acc;
  }, {} as Record<string, Score>);

  const sortedScores = Object.values(bestScores)
    .sort((a, b) => a.time - b.time)
    .slice(0, 20);

  return NextResponse.json(sortedScores);
}

async function getUserScores(name: string, game_mode: string | null) {
  let query = supabase
    .from('rankings')
    .select('time, created_at')
    .eq('name', name)
    .order('created_at', { ascending: true });

  if (game_mode) {
    query = query.eq('game_mode', `${game_mode}x${game_mode}`);
  }

  const { data, error } = await query;

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

  const trimmedName = name.trim();

  const { data, error } = await supabase
    .from('rankings')
    .insert([{ name: trimmedName, time, game_mode: `${game_mode}x${game_mode}` }])
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
