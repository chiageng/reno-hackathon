// Server-only — never import from a client component.
// Wraps Google Gemini's Veo 3 video generation.
//
// Veo 3 jobs typically take 30–120s and are gated by quota. The route handler
// returns an operation name immediately; the client polls /api/walkthrough/status
// until the video is ready.
import { GoogleGenAI } from '@google/genai';
import { existsSync } from 'fs';
import { join } from 'path';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('[reno] GEMINI_API_KEY is not set. Walkthrough calls will fail.');
}

export const gemini = new GoogleGenAI({ apiKey: apiKey ?? '' });

// Default Veo 3 model. Override via GEMINI_VEO_MODEL if a newer version ships.
// The original `veo-3.0-generate-preview` was retired when Veo 3 went GA.
// Use `veo-3.0-fast-generate-001` for ~2x faster jobs at lower fidelity.
const VEO_MODEL = process.env.GEMINI_VEO_MODEL ?? 'veo-3.0-generate-001';

const PRERENDERED_DIR = join(process.cwd(), 'public', 'demo');

export interface WalkthroughResult {
  done: boolean;
  /** Public URL the client can put into <video src>. Set when done = true. */
  videoUrl?: string;
  /** Long-running operation name for polling. Set when done = false. */
  operationName?: string;
  error?: string;
}

/**
 * Returns a public URL for a pre-rendered walkthrough mp4 if one exists at
 * /public/demo/walkthrough-<style>.mp4, otherwise null.
 */
export function getPrerenderedWalkthroughUrl(style: string): string | null {
  const filename = `walkthrough-${style}.mp4`;
  const fullPath = join(PRERENDERED_DIR, filename);
  if (existsSync(fullPath)) {
    return `/demo/${filename}`;
  }
  return null;
}

function dataUrlToParts(dataUrl: string): { base64: string; mimeType: string } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) throw new Error('Invalid image data URL');
  return { mimeType: m[1], base64: m[2] };
}

/**
 * Kicks off Veo 3 video generation using the provided redesign image as the
 * starting frame. Returns the operation name to poll.
 */
export async function startWalkthroughGeneration(opts: {
  imageDataUrl: string;
  prompt: string;
}): Promise<string> {
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const { base64, mimeType } = dataUrlToParts(opts.imageDataUrl);

  const operation = await gemini.models.generateVideos({
    model: VEO_MODEL,
    prompt: opts.prompt,
    image: { imageBytes: base64, mimeType },
    config: {
      numberOfVideos: 1,
      aspectRatio: '16:9',
    },
  });

  if (!operation.name) {
    throw new Error('Veo 3 did not return an operation name');
  }
  return operation.name;
}

/**
 * Checks the status of an in-flight Veo 3 generation. When done, returns the
 * video URL (or downloads the bytes inline if Google returns them that way).
 */
export async function getWalkthroughStatus(
  operationName: string,
): Promise<WalkthroughResult> {
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  // The SDK accepts a partial operation { name } for polling.
  const operation = await gemini.operations.getVideosOperation({
    operation: { name: operationName } as never,
  });

  if (!operation.done) {
    return { done: false, operationName };
  }

  // The shape of the response varies between SDK versions. Defensively try
  // a few known paths.
  // Defensively handle SDK shape variations across versions.
  type LooseVideo = { video?: { uri?: string }; uri?: string };
  const generated: LooseVideo | undefined =
    (operation.response?.generatedVideos?.[0] as LooseVideo | undefined) ??
    (operation.response as unknown as { videos?: LooseVideo[] })?.videos?.[0];

  const uri = generated?.video?.uri ?? generated?.uri ?? null;

  if (!uri) {
    return { done: true, error: 'Video generation finished but no URI found' };
  }

  // Some Google URIs require an API key parameter to download. Append if missing.
  const videoUrl = uri.includes('key=')
    ? uri
    : `${uri}${uri.includes('?') ? '&' : '?'}key=${apiKey}`;

  return { done: true, videoUrl };
}

export const WALKTHROUGH_PROMPT_TEMPLATE = (styleLabel: string): string =>
  `Slow cinematic camera dolly forward through this ${styleLabel.toLowerCase()} living room. Soft natural daylight, photorealistic, professional interior cinematography, gentle depth of field, no people, no text overlays, 8 seconds.`;
