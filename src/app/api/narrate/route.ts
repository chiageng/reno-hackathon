import { NextResponse } from 'next/server';
import { narrateText } from '@/lib/elevenlabs';

export const maxDuration = 60;

interface NarrateBody {
  text: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<NarrateBody>;
    if (!body.text || typeof body.text !== 'string') {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }
    if (body.text.length > 1000) {
      return NextResponse.json(
        { error: 'text too long (max 1000 chars)' },
        { status: 400 },
      );
    }

    const audio = await narrateText(body.text);
    return NextResponse.json({
      audioDataUrl: `data:audio/mpeg;base64,${audio.toString('base64')}`,
    });
  } catch (error) {
    console.error('[POST /api/narrate]', error);
    const message = error instanceof Error ? error.message : 'Narration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
