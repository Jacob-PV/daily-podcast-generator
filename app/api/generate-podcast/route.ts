import { NextRequest, NextResponse } from 'next/server';
import { generatePodcast } from '@/lib/openai';
import { PodcastGenerationRequest } from '@/types';

export const maxDuration = 60; // Allow up to 60 seconds for podcast generation

export async function POST(req: NextRequest) {
  try {
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Parse request body
    const body: PodcastGenerationRequest = await req.json();

    // Validate topics
    if (!body.topics || !Array.isArray(body.topics) || body.topics.length === 0) {
      return NextResponse.json(
        { error: 'At least one topic is required' },
        { status: 400 }
      );
    }

    if (body.topics.length > 6) {
      return NextResponse.json(
        { error: 'Maximum 6 topics allowed' },
        { status: 400 }
      );
    }

    // Generate podcast
    const result = await generatePodcast(body.topics);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Podcast generation error:', error);

    if (error instanceof Error) {
      // Handle specific OpenAI errors
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid OpenAI API key' },
          { status: 401 }
        );
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate podcast. Please try again.' },
      { status: 500 }
    );
  }
}
