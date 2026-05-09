// Server-only — never import this file from a client component.
// All OpenAI calls (vision, image gen, STT) flow through helpers in this module.
import OpenAI from 'openai';
import { VISION_ANALYSIS_PROMPT } from './prompts';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  // Don't throw at import time — let the route handler return a 500 with a clear message.
  console.warn('[reno] OPENAI_API_KEY is not set. Server-side AI calls will fail.');
}

export const openai = new OpenAI({ apiKey });

// Default vision model. Swap to a newer ID if it becomes available.
const VISION_MODEL = 'gpt-4o';

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
