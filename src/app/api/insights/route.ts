import { NextResponse } from 'next/server';
import {
  generateRenovationInsights,
  type RoomAnalysis,
} from '@/lib/openai';

// One GPT-4o call producing structured cost breakdown + action plan.
// Typical wall time: 3–6 seconds.
export const maxDuration = 60;

interface InsightsBody {
  analysis: RoomAnalysis;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<InsightsBody>;
    if (!body.analysis) {
      return NextResponse.json(
        { error: 'analysis is required' },
        { status: 400 },
      );
    }

    const insights = await generateRenovationInsights(body.analysis);
    return NextResponse.json(insights);
  } catch (error) {
    console.error('[POST /api/insights]', error);
    const message =
      error instanceof Error ? error.message : 'Insights generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
