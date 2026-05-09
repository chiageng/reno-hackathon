import { NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/openai';

export const maxDuration = 30;

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // OpenAI cap

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('audio');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'audio file is required (multipart field "audio")' },
        { status: 400 },
      );
    }
    if (file.size === 0) {
      return NextResponse.json(
        { error: 'audio file is empty' },
        { status: 400 },
      );
    }
    if (file.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { error: 'audio file too large (max 25MB)' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || 'audio/webm';

    const text = await transcribeAudio(buffer, mimeType);
    return NextResponse.json({ text });
  } catch (error) {
    console.error('[POST /api/transcribe]', error);
    const message =
      error instanceof Error ? error.message : 'Transcription failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
