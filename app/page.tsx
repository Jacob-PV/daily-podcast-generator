'use client';

import { useState } from 'react';
import { TopicSelector } from '@/components/TopicSelector';
import { GenerateButton } from '@/components/GenerateButton';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { PodcastPlayer } from '@/components/PodcastPlayer';
import { topics } from '@/lib/topics';
import { GenerationStage, PodcastGenerationResponse } from '@/types';
import { Headphones } from 'lucide-react';

const initialStages: GenerationStage[] = [
  {
    id: 'researching',
    name: 'Researching',
    description: 'Finding the latest updates on your topics...',
    status: 'pending',
  },
  {
    id: 'writing',
    name: 'Writing',
    description: 'Crafting your personalized script...',
    status: 'pending',
  },
  {
    id: 'recording',
    name: 'Recording',
    description: 'Generating natural-sounding audio...',
    status: 'pending',
  },
];

export default function Home() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [stages, setStages] = useState<GenerationStage[]>(initialStages);
  const [podcast, setPodcast] = useState<PodcastGenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateStage = (stageId: string, status: GenerationStage['status']) => {
    setStages((prev) =>
      prev.map((stage) =>
        stage.id === stageId ? { ...stage, status } : stage
      )
    );
  };

  const handleGenerate = async () => {
    if (selectedTopics.length === 0) return;

    setIsGenerating(true);
    setError(null);
    setPodcast(null);
    setStages(initialStages);

    try {
      // Stage 1: Researching
      updateStage('researching', 'in_progress');
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Make API call
      const response = await fetch('/api/generate-podcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topics: selectedTopics }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate podcast');
      }

      updateStage('researching', 'completed');

      // Stage 2: Writing
      updateStage('writing', 'in_progress');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      updateStage('writing', 'completed');

      // Stage 3: Recording
      updateStage('recording', 'in_progress');
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const data: PodcastGenerationResponse = await response.json();

      updateStage('recording', 'completed');
      setPodcast(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStages(initialStages);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    setPodcast(null);
    setStages(initialStages);
  };

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <section className="text-center mb-12 animate-stagger">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface mb-6">
            <Headphones className="w-5 h-5 text-primary" />
            <span className="text-sm text-text-muted">Your Daily AI Podcast</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4">
            <span className="gradient-text">Your Podcast,</span>
            <br />
            <span className="text-text-primary">Personalized</span>
          </h1>

          <p className="text-lg text-text-muted max-w-xl mx-auto">
            Choose topics you love. We&apos;ll create a 5-minute podcast just for you,
            powered by AI.
          </p>
        </section>

        {/* Content Section */}
        {!podcast ? (
          <>
            {/* Topic Selection */}
            {!isGenerating && (
              <section className="mb-8">
                <TopicSelector
                  topics={topics}
                  selectedTopics={selectedTopics}
                  onTopicsChange={setSelectedTopics}
                  maxTopics={6}
                  disabled={isGenerating}
                />
              </section>
            )}

            {/* Generate Button or Progress */}
            <section className="flex flex-col items-center gap-6">
              {isGenerating ? (
                <ProgressIndicator stages={stages} />
              ) : (
                <GenerateButton
                  onClick={handleGenerate}
                  isLoading={isGenerating}
                  disabled={selectedTopics.length === 0}
                  topicCount={selectedTopics.length}
                />
              )}

              {/* Error message */}
              {error && (
                <div className="w-full max-w-md p-4 rounded-lg bg-error/10 border border-error/30 text-center">
                  <p className="text-error">{error}</p>
                  <button
                    onClick={handleGenerate}
                    className="mt-2 text-sm text-text-muted hover:text-text-primary transition-colors"
                  >
                    Try again
                  </button>
                </div>
              )}
            </section>
          </>
        ) : (
          /* Podcast Player */
          <section>
            <PodcastPlayer
              audioBase64={podcast.audioBase64}
              title={podcast.title}
              duration={podcast.duration}
              script={podcast.script}
              onRegenerate={handleRegenerate}
            />
          </section>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-text-dim text-sm">
          <p>Powered by OpenAI GPT-4 & Text-to-Speech</p>
        </footer>
      </div>
    </main>
  );
}
