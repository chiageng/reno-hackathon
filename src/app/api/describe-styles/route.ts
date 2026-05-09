import { NextResponse } from 'next/server';
import { generateDesignDescriptions, type RoomAnalysis } from '@/lib/openai';
import { narrateText } from '@/lib/elevenlabs';
import { STYLE_KEYS, type StyleKey } from '@/lib/styles';

// 1 GPT call (~3s) + 3 parallel ElevenLabs calls (~1–2s each). Total ≤ 6s typically.
export const maxDuration = 60;

interface DescribeBody {
  analysis: RoomAnalysis;
}

interface DescribedItem {
  style: StyleKey;
  description: string;
  audioDataUrl: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<DescribeBody>;
    if (!body.analysis) {
      return NextResponse.json({ error: 'analysis is required' }, { status: 400 });
    }

    // 1) Generate all three commentaries in a single GPT call.
    const descriptions = await generateDesignDescriptions(body.analysis);

    // 2) Narrate each commentary in parallel (3 ElevenLabs calls).
    const items: DescribedItem[] = await Promise.all(
      STYLE_KEYS.map(async (style) => {
        const description = descriptions[style];
        const audio = await narrateText(description);
        return {
          style,
          description,
          audioDataUrl: `data:audio/mpeg;base64,${audio.toString('base64')}`,
        };
      }),
    );

    return NextResponse.json({ items });
  } catch (error) {
    console.error('[POST /api/describe-styles]', error);
    const message = error instanceof Error ? error.message : 'Description failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
