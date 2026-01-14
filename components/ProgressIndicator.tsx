'use client';

import { Search, FileText, Mic, Check, Loader2 } from 'lucide-react';
import { GenerationStage } from '@/types';

interface ProgressIndicatorProps {
  stages: GenerationStage[];
}

const stageIcons: Record<string, React.ElementType> = {
  researching: Search,
  writing: FileText,
  recording: Mic,
};

export function ProgressIndicator({ stages }: ProgressIndicatorProps) {
  return (
    <div className="w-full max-w-md mx-auto glass rounded-2xl p-6">
      <h3 className="text-lg font-display font-semibold text-center mb-6 text-text-primary">
        Creating Your Podcast
      </h3>

      <div className="space-y-4">
        {stages.map((stage, index) => {
          const Icon = stageIcons[stage.id] || Search;
          const isActive = stage.status === 'in_progress';
          const isComplete = stage.status === 'completed';
          const isPending = stage.status === 'pending';

          return (
            <div
              key={stage.id}
              className={`
                flex items-center gap-4 p-3 rounded-lg transition-all duration-300
                ${isActive ? 'bg-surface' : ''}
              `}
            >
              {/* Icon */}
              <div
                className={`
                  relative w-10 h-10 rounded-full flex items-center justify-center
                  transition-all duration-300
                  ${isComplete ? 'bg-success' : ''}
                  ${isActive ? 'bg-gradient-to-r from-primary to-[#9B59B6]' : ''}
                  ${isPending ? 'bg-surface border border-border' : ''}
                `}
              >
                {isComplete ? (
                  <Check className="w-5 h-5 text-white" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 text-white spinner" />
                ) : (
                  <Icon className="w-5 h-5 text-text-muted" />
                )}

                {/* Pulse effect for active */}
                {isActive && (
                  <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                )}
              </div>

              {/* Text */}
              <div className="flex-1">
                <p
                  className={`
                    font-medium transition-colors duration-300
                    ${isComplete ? 'text-success' : ''}
                    ${isActive ? 'text-text-primary' : ''}
                    ${isPending ? 'text-text-muted' : ''}
                  `}
                >
                  {stage.name}
                </p>
                <p
                  className={`
                    text-sm transition-colors duration-300
                    ${isActive ? 'text-text-muted' : 'text-text-dim'}
                  `}
                >
                  {stage.description}
                </p>
              </div>

              {/* Connector line */}
              {index < stages.length - 1 && (
                <div
                  className={`
                    absolute left-[26px] mt-14 w-0.5 h-4
                    ${isComplete ? 'bg-success' : 'bg-border'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-6 h-1 bg-surface rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-[#9B59B6] transition-all duration-500"
          style={{
            width: `${
              (stages.filter((s) => s.status === 'completed').length / stages.length) * 100
            }%`,
          }}
        />
      </div>
    </div>
  );
}
