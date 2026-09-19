import { NextResponse } from 'next/server';
import { detectPatterns } from '@/lib/ai';

export async function POST() {
  return NextResponse.json(await detectPatterns());
}
