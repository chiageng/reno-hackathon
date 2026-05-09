import { NextResponse } from 'next/server';
import { analyzeRoomImage } from '@/lib/openai';

// Vision call typically returns in 3–8s. Pad to 60 (Vercel Pro max) for safety.
export const maxDuration = 60;

interface AnalyzeBody {
  imageDataUrl: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<AnalyzeBody>;
    if (!body.imageDataUrl || typeof body.imageDataUrl !== 'string') {
      return NextResponse.json(
        { error: 'imageDataUrl is required' },
        { status: 400 },
      );
    }
    if (!body.imageDataUrl.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'imageDataUrl must be a data URL beginning with "data:image/"' },
        { status: 400 },
      );
    }

    const analysis = await analyzeRoomImage(body.imageDataUrl);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('[POST /api/analyze]', error);
    const message = error instanceof Error ? error.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
