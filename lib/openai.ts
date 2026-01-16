import OpenAI from 'openai';
import { getTopicsByIds } from './topics';
import { SEPARATOR_AUDIO_BASE64 } from './separator-audio';

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return new OpenAI({ apiKey });
}

interface StorySource {
  title: string;
  url: string;
}

interface PodcastStory {
  title: string;
  content: string;
  sources: StorySource[];
}

interface StructuredScript {
  title: string;
  intro: string;
  stories: PodcastStory[];
  outro: string;
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

  // Use web search to find real, current news stories
  const response = await openai.responses.create({
    model: 'gpt-4o',
    tools: [{ type: 'web_search_preview' }],
    input: `Find 2-3 significant, factual news stories from today or the past few days about: ${topicNames}.

For each story, I need:
- The actual headline/title
- Key facts (what happened, who's involved, numbers/data if applicable)
- At least one reliable source URL

Focus on substantive news - no fluff or opinion pieces. Look for stories from reputable outlets like Reuters, AP, BBC, NYT, WSJ, TechCrunch, Wired, etc.`,
  });

  // Extract the research from web search
  const researchContent = response.output_text || '';

  // Now generate the podcast script based on real research
  const scriptResponse = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a professional podcast host creating a concise, fact-based daily news podcast. Your style is direct, informative, and engaging - like a polished news anchor. Avoid filler phrases, unnecessary commentary, or speculation. Stick to the facts.`,
      },
      {
        role: 'user',
        content: `Create a podcast script for ${today} based on this research:

${researchContent}

Requirements:
1. INTRO: Brief (2-3 sentences max) - just welcome listeners and preview what's coming
2. STORIES: 2-3 stories, each with:
   - A clear headline/title
   - Factual content (100-150 words each) - no fluff, just the key information
   - Include specific details: names, numbers, dates when available
   - IMPORTANT: Include the actual source URLs from the research
3. OUTRO: Very brief (1-2 sentences) - just sign off

DO NOT:
- Add unnecessary commentary like "isn't that interesting?" or "what do you think?"
- Speculate or editorialize
- Include transition phrases between stories (we add audio transitions)
- Make up any facts - only use information from the research above

Format as JSON:
{
  "title": "Brief episode title",
  "intro": "Brief welcome...",
  "stories": [
    {
      "title": "Story Headline",
      "content": "The story content for audio...",
      "sources": [
        {"title": "Source Name", "url": "https://..."}
      ]
    }
  ],
  "outro": "Brief signoff..."
}`,
      },
    ],
    temperature: 0.5,
    max_tokens: 3000,
  });

  const content = scriptResponse.choices[0]?.message?.content;
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

    // Ensure stories have the correct structure
    const stories: PodcastStory[] = (parsed.stories || []).map((story: { title?: string; content?: string; sources?: StorySource[] } | string) => {
      if (typeof story === 'string') {
        return { title: 'Story', content: story, sources: [] };
      }
      return {
        title: story.title || 'Story',
        content: story.content || '',
        sources: story.sources || [],
      };
    });

    return {
      title: parsed.title,
      intro: parsed.intro,
      stories,
      outro: parsed.outro,
    };
  } catch {
    // If JSON parsing fails, return minimal structure
    return {
      title: `Your Daily Podcast - ${today}`,
      intro: content,
      stories: [],
      outro: '',
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

// Cache for the separator audio buffer
let cachedSeparatorAudio: Buffer | null = null;

// Get the signature audio separator from embedded base64 data
function getSeparatorAudio(): Buffer {
  // Return cached version if available
  if (cachedSeparatorAudio) {
    return cachedSeparatorAudio;
  }

  // Decode the embedded base64 audio
  cachedSeparatorAudio = Buffer.from(SEPARATOR_AUDIO_BASE64, 'base64');
  return cachedSeparatorAudio;
}

export async function generateAudio(script: string): Promise<Buffer> {
  // Legacy function for backwards compatibility
  return generateSegmentAudio(script);
}

// Generate audio for structured podcast with separators between stories
async function generateStructuredAudio(
  intro: string,
  stories: PodcastStory[],
  outro: string
): Promise<Buffer> {
  const audioBuffers: Buffer[] = [];

  // Generate intro audio
  if (intro) {
    audioBuffers.push(await generateSegmentAudio(intro));
  }

  // Load separator audio once and reuse
  let separatorAudio: Buffer | null = null;
  if (stories.length > 0) {
    separatorAudio = getSeparatorAudio();
  }

  // Generate audio for each story with separator between them
  for (let i = 0; i < stories.length; i++) {
    // Add separator before each story (after intro and between stories)
    if (separatorAudio) {
      audioBuffers.push(separatorAudio);
    }

    // Generate story audio (use content field)
    audioBuffers.push(await generateSegmentAudio(stories[i].content));
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
  title: string;
  duration: number;
  intro: string;
  stories: PodcastStory[];
  outro: string;
}> {
  // Generate structured script
  const { intro, stories, outro, title } = await generatePodcastScript(topicIds);

  // Generate audio with separators between segments
  const audioBuffer = await generateStructuredAudio(intro, stories, outro);
  const audioBase64 = audioBuffer.toString('base64');

  // Calculate total word count for duration estimate
  const introWords = intro.split(/\s+/).length;
  const storyWords = stories.reduce((sum, s) => sum + s.content.split(/\s+/).length, 0);
  const outroWords = outro.split(/\s+/).length;
  const totalWords = introWords + storyWords + outroWords;

  // Estimate duration (roughly 150 words per minute for TTS, plus separator time)
  const separatorCount = stories.length + (outro ? 1 : 0);
  const separatorDuration = separatorCount * 1.5; // ~1.5 seconds per separator
  const duration = Math.ceil((totalWords / 150) * 60) + separatorDuration;

  return {
    audioBase64,
    title,
    duration,
    intro,
    stories,
    outro,
  };
}
