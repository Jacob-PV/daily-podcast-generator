'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Download,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { PodcastStory } from '@/types';

interface PodcastPlayerProps {
  audioBase64: string;
  title: string;
  duration: number;
  intro: string;
  stories: PodcastStory[];
  outro: string;
  onRegenerate: () => void;
}

const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function PodcastPlayer({
  audioBase64,
  title,
  duration,
  intro,
  stories,
  outro,
  onRegenerate,
}: PodcastPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  const audioSrc = `data:audio/mp3;base64,${audioBase64}`;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedData = () => setIsLoaded(true);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioBase64]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const vol = parseFloat(e.target.value);
    audioRef.current.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const changeSpeed = () => {
    if (!audioRef.current) return;
    const currentIndex = speeds.indexOf(speed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    audioRef.current.playbackRate = newSpeed;
    setSpeed(newSpeed);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = audioSrc;
    link.download = `${title.replace(/\s+/g, '-').toLowerCase()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <audio ref={audioRef} src={audioSrc} preload="auto" />

      {/* Main player card */}
      <div className="glass rounded-2xl p-6 gradient-border">
        {/* Title */}
        <h2 className="text-xl font-display font-semibold text-text-primary mb-6 text-center">
          {title}
        </h2>

        {/* Waveform visualization */}
        <div className="flex items-center justify-center gap-1 h-16 mb-6">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={`
                w-1 rounded-full bg-gradient-to-t from-primary to-[#9B59B6]
                ${isPlaying ? 'wave-bar' : ''}
              `}
              style={{
                height: isPlaying
                  ? `${20 + Math.random() * 40}px`
                  : `${20 + Math.sin(i * 0.5) * 15}px`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-surface rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-primary
              [&::-webkit-slider-thumb]:shadow-lg
              [&::-webkit-slider-thumb]:cursor-pointer"
            style={{
              background: `linear-gradient(to right, #FF6B6B ${
                (currentTime / duration) * 100
              }%, #21262D ${(currentTime / duration) * 100}%)`,
            }}
            aria-label="Podcast progress"
          />
          <div className="flex justify-between text-sm text-text-muted mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {/* Volume */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-full hover:bg-surface transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-text-muted" />
              ) : (
                <Volume2 className="w-5 h-5 text-text-muted" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-surface rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-3
                [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-text-muted"
              aria-label="Volume"
            />
          </div>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            disabled={!isLoaded}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-[#9B59B6]
              flex items-center justify-center
              hover:scale-105 transition-transform glow-primary
              disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 text-white" />
            ) : (
              <Play className="w-7 h-7 text-white ml-1" />
            )}
          </button>

          {/* Speed */}
          <button
            onClick={changeSpeed}
            className="px-3 py-1 rounded-full bg-surface text-text-muted text-sm font-medium
              hover:bg-surface-hover transition-colors min-w-[60px]"
            aria-label={`Playback speed ${speed}x`}
          >
            {speed}x
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="p-2 rounded-full hover:bg-surface transition-colors"
            aria-label="Download podcast"
          >
            <Download className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {/* Regenerate button */}
        <div className="mt-6 text-center">
          <button
            onClick={onRegenerate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-text-muted
              hover:text-text-primary transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Generate New Episode
          </button>
        </div>
      </div>

      {/* Transcript Sections */}
      <div className="mt-6 space-y-3">
        {/* Intro Section */}
        {intro && (
          <div className="glass rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('intro')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-surface/50 transition-colors"
              aria-expanded={expandedSections.has('intro')}
            >
              <span className="font-medium text-text-primary">Introduction</span>
              {expandedSections.has('intro') ? (
                <ChevronUp className="w-5 h-5 text-text-muted" />
              ) : (
                <ChevronDown className="w-5 h-5 text-text-muted" />
              )}
            </button>
            {expandedSections.has('intro') && (
              <div className="px-4 pb-4 border-t border-surface">
                <p className="text-sm text-text-muted leading-relaxed pt-3">
                  {intro}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Story Sections */}
        {stories.map((story, index) => (
          <div key={index} className="glass rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection(`story-${index}`)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-surface/50 transition-colors"
              aria-expanded={expandedSections.has(`story-${index}`)}
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">
                  {index + 1}
                </span>
                <span className="font-medium text-text-primary">{story.title}</span>
              </div>
              {expandedSections.has(`story-${index}`) ? (
                <ChevronUp className="w-5 h-5 text-text-muted" />
              ) : (
                <ChevronDown className="w-5 h-5 text-text-muted" />
              )}
            </button>
            {expandedSections.has(`story-${index}`) && (
              <div className="px-4 pb-4 border-t border-surface">
                <p className="text-sm text-text-muted leading-relaxed pt-3">
                  {story.content}
                </p>
                {story.sources && story.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-surface/50">
                    <p className="text-xs font-medium text-text-dim mb-2">Sources:</p>
                    <div className="space-y-1">
                      {story.sources.map((source, sourceIndex) => (
                        <a
                          key={sourceIndex}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{source.title || source.url}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Outro Section */}
        {outro && (
          <div className="glass rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('outro')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-surface/50 transition-colors"
              aria-expanded={expandedSections.has('outro')}
            >
              <span className="font-medium text-text-primary">Closing</span>
              {expandedSections.has('outro') ? (
                <ChevronUp className="w-5 h-5 text-text-muted" />
              ) : (
                <ChevronDown className="w-5 h-5 text-text-muted" />
              )}
            </button>
            {expandedSections.has('outro') && (
              <div className="px-4 pb-4 border-t border-surface">
                <p className="text-sm text-text-muted leading-relaxed pt-3">
                  {outro}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
