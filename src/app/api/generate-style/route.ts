import { NextResponse } from 'next/server';
import { generateStyleImage, type RoomAnalysis } from '@/lib/openai';
import { STYLE_KEYS, type StyleKey } from '@/lib/styles';

// Each gpt-image-1 edit call typically takes 15–30s. Pad to the Vercel Pro max.
export const maxDuration = 60;

interface GenerateStyleBody {
  imageDataUrl: string;
  analysis: RoomAnalysis;
  style: StyleKey;
}

function isStyleKey(value: unknown): value is StyleKey {
  return typeof value === 'string' && (STYLE_KEYS as readonly string[]).includes(value);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<GenerateStyleBody>;

    if (!body.imageDataUrl || !body.imageDataUrl.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'imageDataUrl must be a data URL beginning with "data:image/"' },
        { status: 400 },
      );
    }
    if (!body.analysis) {
      return NextResponse.json({ error: 'analysis is required' }, { status: 400 });
    }
    if (!isStyleKey(body.style)) {
      return NextResponse.json(
        { error: `style must be one of: ${STYLE_KEYS.join(', ')}` },
        { status: 400 },
      );
    }

    const imageDataUrl = await generateStyleImage({
      baseImageDataUrl: body.imageDataUrl,
      analysis: body.analysis,
      styleKey: body.style,
    });

    return NextResponse.json({ style: body.style, imageDataUrl });
  } catch (error) {
    console.error('[POST /api/generate-style]', error);
    const message = error instanceof Error ? error.message : 'Style generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
