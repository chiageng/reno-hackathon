import { NextResponse } from 'next/server';
import { getWalkthroughStatus } from '@/lib/gemini';

export const maxDuration = 30;

export async function GET(req: Request) {
  try {
    const op = new URL(req.url).searchParams.get('op');
    if (!op) {
      return NextResponse.json(
        { error: 'op (operation name) query parameter is required' },
        { status: 400 },
      );
    }

    const status = await getWalkthroughStatus(op);
    return NextResponse.json(status);
  } catch (error) {
    console.error('[GET /api/walkthrough/status]', error);
    const message =
      error instanceof Error ? error.message : 'Walkthrough status check failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
