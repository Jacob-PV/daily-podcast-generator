import OpenAI from 'openai';
import { getTopicsByIds } from './topics';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

// Set ffmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return new OpenAI({ apiKey });
}

interface StructuredScript {
  title: string;
  intro: string;
  stories: string[];
  outro: string;
  fullScript: string;
}

export async function generatePodcastScript(topicIds: string[]): Promise<StructuredScript> {
  const openai = getOpenAIClient();
  const topics = getTopicsByIds(topicIds);
  const topicNames = topics.map((t) => t.name).join(', ');

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a professional podcast host creating a daily personalized podcast. Your style is engaging, informative, and conversational. You speak naturally with appropriate pauses and transitions.`,
      },
      {
        role: 'user',
        content: `Create a 5-minute podcast script (approximately 750 words) for ${today} covering the following topics: ${topicNames}.

Requirements:
1. Start with a warm, engaging introduction mentioning it's the listener's personalized daily podcast
2. Cover 2-3 interesting stories total across the selected topics
3. Each story should be a self-contained segment that can stand alone
4. Include thought-provoking insights or analysis
5. End with a brief summary and an uplifting closing

IMPORTANT: Format the response as JSON with separate segments for the intro, each story, and the outro. This allows us to add audio transitions between stories.

{
  "title": "A catchy episode title",
  "intro": "The opening introduction segment...",
  "stories": [
    "First story segment covering one topic...",
    "Second story segment covering another topic...",
    "Third story segment if applicable..."
  ],
  "outro": "The closing summary and farewell..."
}

Make each segment sound natural when read aloud - use conversational language, rhetorical questions, and varied sentence structures. Do NOT include transition phrases between stories as we will add an audio jingle between them.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 2500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Failed to generate podcast script');
  }

  try {
    // Remove markdown code blocks if present
    let jsonContent = content;
    if (content.includes('```json')) {
      jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (content.includes('```')) {
      jsonContent = content.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(jsonContent.trim());

    // Construct full script for display purposes
    const fullScript = [
      parsed.intro,
      ...parsed.stories,
      parsed.outro
    ].join('\n\n---\n\n');

    return {
      title: parsed.title,
      intro: parsed.intro,
      stories: parsed.stories || [],
      outro: parsed.outro,
      fullScript,
    };
  } catch {
    // If JSON parsing fails, treat as single segment (backwards compatibility)
    return {
      title: `Your Daily Podcast - ${today}`,
      intro: content,
      stories: [],
      outro: '',
      fullScript: content,
    };
  }
}

// TTS configuration for podcast narration
const TTS_CONFIG = {
  model: 'gpt-4o-mini-tts' as const,
  voice: 'marin' as const,
  instructions: 'Deliver this like a polished news anchor. Clear articulation, steady pace, confident tone, minimal drama.',
};

// Generate audio for a text segment, handling chunking for long text
async function generateSegmentAudio(text: string): Promise<Buffer> {
  const openai = getOpenAIClient();
  const MAX_CHARS = 4000; // OpenAI TTS limit with buffer

  // Split text into chunks at sentence boundaries if needed
  if (text.length <= MAX_CHARS) {
    const response = await openai.audio.speech.create({
      model: TTS_CONFIG.model,
      voice: TTS_CONFIG.voice,
      input: text,
      instructions: TTS_CONFIG.instructions,
    });
    return Buffer.from(await response.arrayBuffer());
  }

  // Handle long segments by chunking
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + ' ' + sentence).length > MAX_CHARS) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    } else {
      currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
    }
  }
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  const audioBuffers: Buffer[] = [];
  for (const chunk of chunks) {
    const response = await openai.audio.speech.create({
      model: TTS_CONFIG.model,
      voice: TTS_CONFIG.voice,
      input: chunk,
      instructions: TTS_CONFIG.instructions,
    });
    audioBuffers.push(Buffer.from(await response.arrayBuffer()));
  }

  return Buffer.concat(audioBuffers);
}

// Adjust volume of audio file using ffmpeg
async function adjustVolume(inputBuffer: Buffer, volumeLevel: number = 0.3): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const tempDir = join(process.cwd(), '.tmp');
    const inputPath = join(tempDir, `input-${Date.now()}.mp3`);
    const outputPath = join(tempDir, `output-${Date.now()}.mp3`);

    // Ensure temp directory exists
    if (!existsSync(tempDir)) {
      const { mkdirSync } = require('fs');
      mkdirSync(tempDir, { recursive: true });
    }

    // Write input buffer to temp file
    writeFileSync(inputPath, inputBuffer);

    ffmpeg(inputPath)
      .audioFilters(`volume=${volumeLevel}`)
      .toFormat('mp3')
      .on('end', () => {
        const outputBuffer = readFileSync(outputPath);
        // Clean up temp files
        try {
          unlinkSync(inputPath);
          unlinkSync(outputPath);
        } catch {
          // Ignore cleanup errors
        }
        resolve(outputBuffer);
      })
      .on('error', (err: Error) => {
        // Clean up temp files on error
        try {
          if (existsSync(inputPath)) unlinkSync(inputPath);
          if (existsSync(outputPath)) unlinkSync(outputPath);
        } catch {
          // Ignore cleanup errors
        }
        reject(err);
      })
      .save(outputPath);
  });
}

// Cache for the volume-adjusted separator audio
let cachedSeparatorAudio: Buffer | null = null;

// Get the signature audio separator from file with volume adjustment
async function getSeparatorAudio(): Promise<Buffer> {
  // Return cached version if available
  if (cachedSeparatorAudio) {
    return cachedSeparatorAudio;
  }

  // Read the ambient magic wash audio file as the separator
  const audioPath = join(process.cwd(), 'audio', 'ambient-magic-wash.mp3');
  const rawAudio = readFileSync(audioPath);

  // Adjust volume to 30% to blend well with TTS narration
  cachedSeparatorAudio = await adjustVolume(rawAudio, 0.3);
  return cachedSeparatorAudio;
}

export async function generateAudio(script: string): Promise<Buffer> {
  // Legacy function for backwards compatibility
  return generateSegmentAudio(script);
}

// Generate audio for structured podcast with separators between stories
async function generateStructuredAudio(
  intro: string,
  stories: string[],
  outro: string
): Promise<Buffer> {
  const audioBuffers: Buffer[] = [];

  // Generate intro audio
  if (intro) {
    audioBuffers.push(await generateSegmentAudio(intro));
  }

  // Load separator audio file once and reuse (with volume adjustment)
  let separatorAudio: Buffer | null = null;
  if (stories.length > 0) {
    separatorAudio = await getSeparatorAudio();
  }

  // Generate audio for each story with separator between them
  for (let i = 0; i < stories.length; i++) {
    // Add separator before each story (after intro and between stories)
    if (separatorAudio) {
      audioBuffers.push(separatorAudio);
    }

    // Generate story audio
    audioBuffers.push(await generateSegmentAudio(stories[i]));
  }

  // Add separator before outro
  if (separatorAudio && outro) {
    audioBuffers.push(separatorAudio);
  }

  // Generate outro audio
  if (outro) {
    audioBuffers.push(await generateSegmentAudio(outro));
  }

  return Buffer.concat(audioBuffers);
}

export async function generatePodcast(topicIds: string[]): Promise<{
  audioBase64: string;
  script: string;
  title: string;
  duration: number;
}> {
  // Generate structured script
  const { intro, stories, outro, fullScript, title } = await generatePodcastScript(topicIds);

  // Generate audio with separators between segments
  const audioBuffer = await generateStructuredAudio(intro, stories, outro);
  const audioBase64 = audioBuffer.toString('base64');

  // Estimate duration (roughly 150 words per minute for TTS, plus separator time)
  const wordCount = fullScript.split(/\s+/).length;
  const separatorCount = stories.length + (outro ? 1 : 0); // Separators between segments
  const separatorDuration = separatorCount * 1.5; // ~1.5 seconds per separator
  const duration = Math.ceil((wordCount / 150) * 60) + separatorDuration;

  return {
    audioBase64,
    script: fullScript,
    title,
    duration,
  };
}
