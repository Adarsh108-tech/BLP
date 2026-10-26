import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seedHelper';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    const result = await seedDatabase(force);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Seed API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Seeding failed' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  return POST(request);
}
