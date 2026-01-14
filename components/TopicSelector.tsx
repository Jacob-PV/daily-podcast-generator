'use client';

import { Topic } from '@/types';
import { Check } from 'lucide-react';

interface TopicSelectorProps {
  topics: Topic[];
  selectedTopics: string[];
  onTopicsChange: (topics: string[]) => void;
  maxTopics?: number;
  disabled?: boolean;
}

export function TopicSelector({
  topics,
  selectedTopics,
  onTopicsChange,
  maxTopics = 6,
  disabled = false,
}: TopicSelectorProps) {
  const handleToggle = (topicId: string) => {
    if (disabled) return;

    if (selectedTopics.includes(topicId)) {
      onTopicsChange(selectedTopics.filter((id) => id !== topicId));
    } else if (selectedTopics.length < maxTopics) {
      onTopicsChange([...selectedTopics, topicId]);
    }
  };

  const isSelected = (topicId: string) => selectedTopics.includes(topicId);
  const isMaxReached = selectedTopics.length >= maxTopics;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold font-display text-text-primary">
          Choose Your Topics
        </h2>
        <span className="text-sm text-text-muted">
          {selectedTopics.length}/{maxTopics} selected
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {topics.map((topic) => {
          const selected = isSelected(topic.id);
          const isDisabled = disabled || (!selected && isMaxReached);

          return (
            <button
              key={topic.id}
              onClick={() => handleToggle(topic.id)}
              disabled={isDisabled}
              aria-pressed={selected}
              aria-label={`${topic.name}, ${selected ? 'selected' : 'not selected'}`}
              className={`
                relative flex flex-col items-center justify-center
                min-h-[120px] p-4 rounded-xl
                border-2 transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg
                ${
                  selected
                    ? 'border-transparent bg-surface'
                    : 'border-border bg-surface/50 hover:bg-surface hover:border-text-dim'
                }
                ${isDisabled && !selected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${selected ? 'transform hover:scale-[1.02]' : 'hover:scale-[1.02]'}
              `}
              style={{
                boxShadow: selected ? `0 0 20px ${topic.color}30` : 'none',
              }}
            >
              {/* Gradient border for selected */}
              {selected && (
                <div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{
                    background: `linear-gradient(135deg, ${topic.color}, ${topic.color}80)`,
                    padding: '2px',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                  }}
                />
              )}

              {/* Checkmark */}
              {selected && (
                <div
                  className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: topic.color }}
                >
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Icon */}
              <span className="text-4xl mb-2" role="img" aria-hidden="true">
                {topic.icon}
              </span>

              {/* Name */}
              <span className="text-sm font-medium text-text-primary text-center">
                {topic.name}
              </span>

              {/* Category */}
              <span className="text-xs text-text-muted mt-1">
                {topic.category}
              </span>
            </button>
          );
        })}
      </div>

      {selectedTopics.length === 0 && (
        <p className="text-center text-text-muted mt-4 text-sm">
          Select at least one topic to generate your podcast
        </p>
      )}
    </div>
  );
}
