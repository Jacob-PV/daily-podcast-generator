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
} from 'lucide-react';

interface PodcastPlayerProps {
  audioBase64: string;
  title: string;
  duration: number;
  script: string;
  onRegenerate: () => void;
}

const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function PodcastPlayer({
  audioBase64,
  title,
  duration,
  script,
  onRegenerate,
}: PodcastPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showScript, setShowScript] = useState(false);
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

      {/* Script toggle */}
      <div className="mt-4">
        <button
          onClick={() => setShowScript(!showScript)}
          className="w-full flex items-center justify-center gap-2 py-3 text-text-muted
            hover:text-text-primary transition-colors"
          aria-expanded={showScript}
        >
          {showScript ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Hide Script
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show Script
            </>
          )}
        </button>

        {showScript && (
          <div className="glass rounded-xl p-6 mt-2 border-l-4 border-primary">
            <p className="font-mono text-sm text-text-muted whitespace-pre-wrap leading-relaxed">
              {script}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
