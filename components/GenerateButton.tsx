'use client';

import { Loader2, Sparkles } from 'lucide-react';

interface GenerateButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled: boolean;
  topicCount: number;
}

export function GenerateButton({
  onClick,
  isLoading,
  disabled,
  topicCount,
}: GenerateButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label={
        isLoading
          ? 'Generating your podcast'
          : `Generate podcast about ${topicCount} selected topics`
      }
      className={`
        relative w-full md:w-auto
        px-12 py-4 rounded-full
        font-display font-semibold text-lg
        text-white
        transition-all duration-300
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg
        ${
          disabled || isLoading
            ? 'bg-gradient-to-r from-text-dim to-text-dim cursor-not-allowed opacity-60'
            : 'bg-gradient-to-r from-primary to-[#9B59B6] hover:scale-[1.03] glow-primary'
        }
      `}
    >
      <span className="flex items-center justify-center gap-2">
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 spinner" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generate My Podcast
          </>
        )}
      </span>
    </button>
  );
}
