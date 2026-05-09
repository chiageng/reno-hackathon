// Server-only — never import from a client component.
// We hit the ElevenLabs REST API directly with fetch to avoid SDK version churn.

const apiKey = process.env.ELEVENLABS_API_KEY;
// Default voice: Rachel (warm, conversational). Override with ELEVENLABS_VOICE_ID.
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? '21m00Tcm4TlvDq8ikWAM';
// Turbo v2.5 — good balance of latency (~400ms) and quality.
const MODEL_ID = 'eleven_turbo_v2_5';

if (!apiKey) {
  console.warn('[reno] ELEVENLABS_API_KEY is not set. Narration calls will fail.');
}

export async function narrateText(text: string): Promise<Buffer> {
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY not configured');

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_64`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: {
        stability: 0.4,
        similarity_boost: 0.75,
        style: 0.2,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`ElevenLabs ${res.status}: ${errText.slice(0, 300)}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
