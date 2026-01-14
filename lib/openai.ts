import OpenAI from 'openai';
import { getTopicsByIds } from './topics';

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return new OpenAI({ apiKey });
}

export async function generatePodcastScript(topicIds: string[]): Promise<{ script: string; title: string }> {
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
2. Cover 2-3 interesting developments or stories for each topic
3. Use smooth transitions between topics
4. Include thought-provoking insights or analysis
5. End with a brief summary and an uplifting closing

Format the response as JSON:
{
  "title": "A catchy episode title",
  "script": "The full podcast script here..."
}

Make the script sound natural when read aloud - use conversational language, rhetorical questions, and varied sentence structures.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
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
    return {
      title: parsed.title,
      script: parsed.script,
    };
  } catch {
    // If JSON parsing fails, try to extract content
    return {
      title: `Your Daily Podcast - ${today}`,
      script: content,
    };
  }
}

export async function generateAudio(script: string): Promise<Buffer> {
  const openai = getOpenAIClient();

  // OpenAI TTS has a 4096 character limit, so we need to split long scripts
  const MAX_CHARS = 4000; // Leave some buffer
  const chunks: string[] = [];

  // Split script into chunks at sentence boundaries
  const sentences = script.split(/(?<=[.!?])\s+/);
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

  // Generate audio for each chunk
  const audioBuffers: Buffer[] = [];

  for (const chunk of chunks) {
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'onyx',
      input: chunk,
      speed: 1.0,
    });

    const arrayBuffer = await response.arrayBuffer();
    audioBuffers.push(Buffer.from(arrayBuffer));
  }

  // Concatenate all audio buffers
  return Buffer.concat(audioBuffers);
}

export async function generatePodcast(topicIds: string[]): Promise<{
  audioBase64: string;
  script: string;
  title: string;
  duration: number;
}> {
  // Generate script
  const { script, title } = await generatePodcastScript(topicIds);

  // Generate audio
  const audioBuffer = await generateAudio(script);
  const audioBase64 = audioBuffer.toString('base64');

  // Estimate duration (roughly 150 words per minute for TTS)
  const wordCount = script.split(/\s+/).length;
  const duration = Math.ceil((wordCount / 150) * 60);

  return {
    audioBase64,
    script,
    title,
    duration,
  };
}
