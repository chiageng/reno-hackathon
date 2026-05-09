import { NextResponse } from 'next/server';
import { iterateStyleImage } from '@/lib/openai';

// gpt-image-1 edit at quality "medium" is typically 15–30s.
export const maxDuration = 60;

interface IterateBody {
  imageDataUrl: string;
  editInstruction: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<IterateBody>;

    if (!body.imageDataUrl || !body.imageDataUrl.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'imageDataUrl must be a data URL beginning with "data:image/"' },
        { status: 400 },
      );
    }
    if (!body.editInstruction || typeof body.editInstruction !== 'string') {
      return NextResponse.json(
        { error: 'editInstruction is required' },
        { status: 400 },
      );
    }
    if (body.editInstruction.length > 500) {
      return NextResponse.json(
        { error: 'editInstruction too long (max 500 chars)' },
        { status: 400 },
      );
    }

    const imageDataUrl = await iterateStyleImage({
      baseImageDataUrl: body.imageDataUrl,
      editInstruction: body.editInstruction,
    });

    return NextResponse.json({ imageDataUrl });
  } catch (error) {
    console.error('[POST /api/iterate]', error);
    const message = error instanceof Error ? error.message : 'Iteration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
