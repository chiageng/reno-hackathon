// Server-only — never import this file from a client component.
// All OpenAI calls (vision, image gen, STT) flow through helpers in this module.
import OpenAI, { toFile } from 'openai';
import { VISION_ANALYSIS_PROMPT, buildStylePrompt } from './prompts';
import type { StyleKey } from './styles';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  // Don't throw at import time — let the route handler return a 500 with a clear message.
  console.warn('[reno] OPENAI_API_KEY is not set. Server-side AI calls will fail.');
}

export const openai = new OpenAI({ apiKey });

// Default vision model. Swap to a newer ID if it becomes available.
const VISION_MODEL = 'gpt-4o';
// Image generation model. gpt-image-1 supports image-to-image edit with a prompt.
const IMAGE_MODEL = 'gpt-image-1';

export interface RoomAnalysis {
  roomType: string;
  estimatedSizeM2: number;
  lighting: string;
  currentStyle: string;
  keyElements: string[];
  fixedElements: string[];
  narrationText: string;
}

export async function analyzeRoomImage(imageDataUrl: string): Promise<RoomAnalysis> {
  const completion = await openai.chat.completions.create({
    model: VISION_MODEL,
    response_format: { type: 'json_object' },
    max_tokens: 700,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: VISION_ANALYSIS_PROMPT },
          { type: 'image_url', image_url: { url: imageDataUrl } },
        ],
      },
    ],
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error('Empty response from vision model');

  const parsed = JSON.parse(text) as Partial<RoomAnalysis>;
  if (
    typeof parsed.roomType !== 'string' ||
    typeof parsed.narrationText !== 'string' ||
    !Array.isArray(parsed.keyElements) ||
    !Array.isArray(parsed.fixedElements)
  ) {
    throw new Error('Vision model returned an unexpected JSON shape');
  }

  return {
    roomType: parsed.roomType,
    estimatedSizeM2: typeof parsed.estimatedSizeM2 === 'number' ? parsed.estimatedSizeM2 : 0,
    lighting: parsed.lighting ?? '',
    currentStyle: parsed.currentStyle ?? '',
    keyElements: parsed.keyElements,
    fixedElements: parsed.fixedElements,
    narrationText: parsed.narrationText,
  };
}

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mimeType: string } {
  const m = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!m) throw new Error('Invalid image data URL');
  return { buffer: Buffer.from(m[2], 'base64'), mimeType: m[1] };
}

interface GenerateStyleOpts {
  baseImageDataUrl: string;
  styleKey: StyleKey;
  analysis: RoomAnalysis;
}

// Generates one stylised version of the room. Returns a data: URL (PNG base64).
// Wall time: ~15–30s per call at quality "medium". Caller should fire the three
// styles in parallel and stream results as each one lands.
export async function generateStyleImage({
  baseImageDataUrl,
  styleKey,
  analysis,
}: GenerateStyleOpts): Promise<string> {
  const { buffer, mimeType } = dataUrlToBuffer(baseImageDataUrl);
  const ext = mimeType.split('/')[1] ?? 'jpg';
  const file = await toFile(buffer, `room.${ext}`, { type: mimeType });

  const prompt = buildStylePrompt(styleKey, analysis);

  const result = await openai.images.edit({
    model: IMAGE_MODEL,
    image: file,
    prompt,
    size: '1024x1024',
    quality: 'medium',
    n: 1,
  });

  const b64 = result.data?.[0]?.b64_json;
  if (!b64) throw new Error('Empty image response from gpt-image-1');
  return `data:image/png;base64,${b64}`;
}
