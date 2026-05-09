// Server-only — never import this file from a client component.
// All OpenAI calls (vision, image gen, STT) flow through helpers in this module.
import OpenAI, { toFile } from 'openai';
import {
  VISION_ANALYSIS_PROMPT,
  buildStylePrompt,
  buildDesignDescriptionsPrompt,
  buildIteratePrompt,
  buildInsightsPrompt,
} from './prompts';
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
// Speech-to-text. Falls back to whisper-1 if the newer model is unavailable.
const TRANSCRIBE_MODEL = 'gpt-4o-mini-transcribe';
const TRANSCRIBE_FALLBACK_MODEL = 'whisper-1';

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

interface IterateOpts {
  baseImageDataUrl: string;
  editInstruction: string;
}

// Edits an existing redesign with a free-form instruction (e.g. "make the
// sofa green and add a tall plant"). Used by /api/iterate to refine a single
// style. Returns a fresh data: URL (PNG base64).
export async function iterateStyleImage({
  baseImageDataUrl,
  editInstruction,
}: IterateOpts): Promise<string> {
  const { buffer, mimeType } = dataUrlToBuffer(baseImageDataUrl);
  const ext = mimeType.split('/')[1] ?? 'png';
  const file = await toFile(buffer, `redesign.${ext}`, { type: mimeType });

  const prompt = buildIteratePrompt(editInstruction);

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

function audioMimeToExt(mimeType: string): string {
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
  if (mimeType.includes('wav')) return 'wav';
  if (mimeType.includes('ogg')) return 'ogg';
  return 'webm';
}

// Transcribes recorded audio to text. Tries the newer model first, falls
// back to whisper-1 if unsupported on the account. Used by /api/transcribe.
export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string,
): Promise<string> {
  const ext = audioMimeToExt(mimeType);
  const file = await toFile(audioBuffer, `audio.${ext}`, { type: mimeType });

  try {
    const result = await openai.audio.transcriptions.create({
      model: TRANSCRIBE_MODEL,
      file,
    });
    return result.text.trim();
  } catch (err) {
    console.warn(
      `[reno] ${TRANSCRIBE_MODEL} failed, retrying with ${TRANSCRIBE_FALLBACK_MODEL}`,
      err,
    );
    // toFile consumes the buffer once; rebuild for the retry.
    const fallbackFile = await toFile(audioBuffer, `audio.${ext}`, {
      type: mimeType,
    });
    const result = await openai.audio.transcriptions.create({
      model: TRANSCRIBE_FALLBACK_MODEL,
      file: fallbackFile,
    });
    return result.text.trim();
  }
}

export interface RenovationCost {
  category: string;
  description: string;
  lowSGD: number;
  highSGD: number;
}

export type ActionStepCategory =
  | 'preparation'
  | 'walls'
  | 'flooring'
  | 'lighting'
  | 'carpentry'
  | 'furniture'
  | 'decor'
  | 'electrical'
  | 'other';

export interface ActionStep {
  step: number;
  title: string;
  description: string;
  category: ActionStepCategory;
}

export interface RenovationInsights {
  summary: string;
  costs: RenovationCost[];
  totalLowSGD: number;
  totalHighSGD: number;
  timelineLowWeeks: number;
  timelineHighWeeks: number;
  actionPlan: ActionStep[];
}

const ACTION_CATEGORIES: ReadonlySet<ActionStepCategory> = new Set([
  'preparation',
  'walls',
  'flooring',
  'lighting',
  'carpentry',
  'furniture',
  'decor',
  'electrical',
  'other',
]);

function asCategory(value: unknown): ActionStepCategory {
  if (typeof value === 'string' && ACTION_CATEGORIES.has(value as ActionStepCategory)) {
    return value as ActionStepCategory;
  }
  return 'other';
}

// One GPT call returning a renovation cost breakdown + step-by-step plan,
// tailored to the analyzed room. Used by /api/insights.
export async function generateRenovationInsights(
  analysis: RoomAnalysis,
): Promise<RenovationInsights> {
  const completion = await openai.chat.completions.create({
    model: VISION_MODEL,
    response_format: { type: 'json_object' },
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: buildInsightsPrompt(analysis),
      },
    ],
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error('Empty response from insights model');

  const parsed = JSON.parse(text) as Partial<RenovationInsights> & {
    costs?: Partial<RenovationCost>[];
    actionPlan?: Partial<ActionStep>[];
  };

  if (
    typeof parsed.summary !== 'string' ||
    !Array.isArray(parsed.costs) ||
    !Array.isArray(parsed.actionPlan)
  ) {
    throw new Error('Insights response missing required fields');
  }

  const costs: RenovationCost[] = parsed.costs.map((c) => ({
    category: typeof c.category === 'string' ? c.category : 'Misc',
    description: typeof c.description === 'string' ? c.description : '',
    lowSGD: typeof c.lowSGD === 'number' ? c.lowSGD : 0,
    highSGD: typeof c.highSGD === 'number' ? c.highSGD : 0,
  }));

  const actionPlan: ActionStep[] = parsed.actionPlan.map((s, i) => ({
    step: typeof s.step === 'number' ? s.step : i + 1,
    title: typeof s.title === 'string' ? s.title : `Step ${i + 1}`,
    description: typeof s.description === 'string' ? s.description : '',
    category: asCategory(s.category),
  }));

  return {
    summary: parsed.summary,
    costs,
    totalLowSGD:
      typeof parsed.totalLowSGD === 'number'
        ? parsed.totalLowSGD
        : costs.reduce((sum, c) => sum + c.lowSGD, 0),
    totalHighSGD:
      typeof parsed.totalHighSGD === 'number'
        ? parsed.totalHighSGD
        : costs.reduce((sum, c) => sum + c.highSGD, 0),
    timelineLowWeeks:
      typeof parsed.timelineLowWeeks === 'number' ? parsed.timelineLowWeeks : 2,
    timelineHighWeeks:
      typeof parsed.timelineHighWeeks === 'number' ? parsed.timelineHighWeeks : 6,
    actionPlan,
  };
}

// One GPT call returning a designer commentary for each of the three styles,
// tailored to this room's analysis. Used to drive per-design narration in the
// comparison view.
export async function generateDesignDescriptions(
  analysis: RoomAnalysis,
): Promise<Record<StyleKey, string>> {
  const completion = await openai.chat.completions.create({
    model: VISION_MODEL,
    response_format: { type: 'json_object' },
    max_tokens: 600,
    messages: [
      {
        role: 'user',
        content: buildDesignDescriptionsPrompt(analysis),
      },
    ],
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error('Empty response from descriptions model');

  const parsed = JSON.parse(text) as Partial<Record<StyleKey, string>>;
  if (
    typeof parsed.scandi !== 'string' ||
    typeof parsed.japandi !== 'string' ||
    typeof parsed.industrial !== 'string'
  ) {
    throw new Error('Descriptions response missing one or more styles');
  }

  return {
    scandi: parsed.scandi.trim(),
    japandi: parsed.japandi.trim(),
    industrial: parsed.industrial.trim(),
  };
}
