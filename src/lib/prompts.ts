// All AI prompt templates live here. Tune copy here, not inline in route handlers.
import type { StyleKey } from './styles';
import { STYLE_LABELS } from './styles';
import type { RoomAnalysis } from './openai';

export const VISION_ANALYSIS_PROMPT = `You are an interior design analyst. Look at the room photo and return a single JSON object describing what you see.

Identify:
- roomType: "living room", "bedroom", "kitchen", "bathroom", "dining room", "office", or "other".
- estimatedSizeM2: a number — your best estimate of the floor area in square metres.
- lighting: a short phrase describing whether the light is natural or artificial, plus direction if visible (e.g. "natural, north-facing window").
- currentStyle: a short descriptive phrase for the current look (e.g. "modern minimalist with leather accents").
- keyElements: an array of the main movable items you can see (e.g. ["leather sofa", "wooden coffee table", "area rug"]).
- fixedElements: an array of things that should NOT change in a redesign — windows, doors, ceiling, structural walls, plumbing fixtures, built-ins.
- narrationText: a friendly one-paragraph narration (~30 words) suitable for a designer to speak aloud, conversational and warm. Start with "I can see…" or similar.

Return ONLY the JSON object. No markdown, no commentary.`;

const STYLE_DESCRIPTIONS: Record<StyleKey, string> = {
  scandi:
    'Light oak wood, off-white walls, soft greys, sheepskin throws, simple Nordic furniture, lots of negative space, plants, brass accents.',
  japandi:
    'Warm minimal — light timber, paper lanterns, low natural-fibre furniture, neutral tones, subtle greenery, calm and uncluttered.',
  industrial:
    'Exposed brick or concrete accent wall, dark metal fixtures, leather upholstery, edison bulbs, dark stained wood, urban warehouse feel.',
};

export function buildDesignDescriptionsPrompt(analysis: RoomAnalysis): string {
  const keyItems = analysis.keyElements.length
    ? analysis.keyElements.join(', ')
    : 'the existing furniture';

  return `You are an interior designer talking to a homeowner who just saw three redesigns of their room. Their room:
- Type: ${analysis.roomType}
- Size: ~${analysis.estimatedSizeM2} m²
- Lighting: ${analysis.lighting}
- Current style: ${analysis.currentStyle}
- Key items: ${keyItems}

Write a short, warm one-paragraph designer commentary (UNDER 45 WORDS) for EACH of the three styles below. Speak in first person, directly to the homeowner. Each commentary should:
- Open with what makes this style click for THIS specific room (lighting, size, mood, current items)
- Mention one specific design choice that elevates the space
- Feel intuitive and conversational, not technical
- Read aloud naturally — these will be spoken by a voice actor

Styles:
1. Scandi
2. Japandi
3. Industrial

Return ONLY this JSON shape, no markdown:
{ "scandi": "…", "japandi": "…", "industrial": "…" }`;
}

export function buildStylePrompt(style: StyleKey, analysis: RoomAnalysis): string {
  const keyItems = analysis.keyElements.length
    ? analysis.keyElements.join(', ')
    : 'existing furniture';

  return `Photorealistic interior design redesign of THIS exact room in ${STYLE_LABELS[style]} style.

CRITICAL — preserve from the original photo, do not move, remove, or alter:
- Window positions and sizes
- Door positions
- Ceiling height and structure
- Wall layout
- Floor material (unless the style explicitly calls for change)

Replace and restyle:
- All furniture (currently visible: ${keyItems})
- Decor and accessories
- Wall paint colour
- Lighting fixtures
- Rugs and textiles

Style direction: ${STYLE_DESCRIPTIONS[style]}

Render at high quality, natural daylight, slight depth of field, professional interior photography aesthetic.`;
}
