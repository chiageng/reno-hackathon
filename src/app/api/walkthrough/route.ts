import { NextResponse } from 'next/server';
import {
  getPrerenderedWalkthroughUrl,
  startWalkthroughGeneration,
  WALKTHROUGH_PROMPT_TEMPLATE,
  type WalkthroughResult,
} from '@/lib/gemini';
import { STYLE_KEYS, STYLE_LABELS, type StyleKey } from '@/lib/styles';

// Veo 3 generation is too long to hold the connection open. We return the
// operation name immediately and let the client poll /api/walkthrough/status.
export const maxDuration = 30;

interface WalkthroughBody {
  imageDataUrl: string;
  style: StyleKey;
}

function isStyleKey(value: unknown): value is StyleKey {
  return (
    typeof value === 'string' && (STYLE_KEYS as readonly string[]).includes(value)
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<WalkthroughBody>;

    if (!isStyleKey(body.style)) {
      return NextResponse.json(
        { error: `style must be one of: ${STYLE_KEYS.join(', ')}` },
        { status: 400 },
      );
    }
    if (!body.imageDataUrl || !body.imageDataUrl.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'imageDataUrl is required (data:image/* URL)' },
        { status: 400 },
      );
    }

    // Pre-rendered fallback — instant if a canonical mp4 exists.
    const prerendered = getPrerenderedWalkthroughUrl(body.style);
    if (prerendered) {
      const result: WalkthroughResult = { done: true, videoUrl: prerendered };
      return NextResponse.json(result);
    }

    const operationName = await startWalkthroughGeneration({
      imageDataUrl: body.imageDataUrl,
      prompt: WALKTHROUGH_PROMPT_TEMPLATE(STYLE_LABELS[body.style]),
    });

    const result: WalkthroughResult = { done: false, operationName };
    return NextResponse.json(result);
  } catch (error) {
    console.error('[POST /api/walkthrough]', error);
    const message = error instanceof Error ? error.message : 'Walkthrough start failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
