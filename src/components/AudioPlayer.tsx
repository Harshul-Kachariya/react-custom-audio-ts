import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaPlay, FaPause } from "react-icons/fa";
import { GoMute, GoUnmute } from "react-icons/go";

import sample from "../../public/sample2.mp3";

const AudioPlayer: React.FC = () => {
  const [audioBuffer, setAudioBuffer] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);
  const [progress, setProgress] = useState(0);
  const [currentTimes, setCurrentTimes] = useState<any | null>(0);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Load the audio data
  const loadAudio = async (url: string) => {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const decodedAudio = await audioContext?.decodeAudioData(arrayBuffer);
      setAudioBuffer(decodedAudio);
    } catch (error) {
      console.error("Error loading audio:", error);
    }
  };

  // Initialize the audio context and load the audio
  useEffect(() => {
    const context = new AudioContext();
    setAudioContext(context);
    gainNodeRef.current = context.createGain();
    loadAudio(sample);
    return () => {
      context.close();
    };
  }, []);

  // Update the progress bar based on the current time
  const updateProgress = useCallback(() => {
    if (audioBuffer && audioContext && !isPlaying && !hasReachedEnd) {
      const elapsed = audioContext.currentTime - startTimeRef.current;
      const percentage =
        ((pauseTimeRef.current + elapsed) / audioBuffer.duration) * 100;
      setProgress(percentage);
      setCurrentTimes(pauseTimeRef.current + elapsed);
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, [audioBuffer, audioContext, isPlaying, hasReachedEnd]);

  // Manage the play/pause functionality
  const playAudio = () => {
    if (audioBuffer && audioContext && gainNodeRef.current) {
      if (!isPlaying) {
        // Resume playback from the last paused position
        createAndStartSource(pauseTimeRef.current);
        startTimeRef.current = audioContext.currentTime - pauseTimeRef.current;
        setIsPlaying(true);
        setHasReachedEnd(false);
        pauseTimeRef.current = 0;
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      } else {
        // Pause the audio
        sourceRef.current?.stop();
        pauseTimeRef.current += audioContext.currentTime - startTimeRef.current;
        setIsPlaying(false);
        cancelAnimationFrame(animationFrameRef.current!);
      }
    }
  };

  // Create and start a new audio source
  const createAndStartSource = (startTime = 0) => {
    // Stop any existing audio source
    if (sourceRef.current) {
      sourceRef.current.stop();
    }
    sourceRef.current = audioContext!.createBufferSource();
    sourceRef.current.buffer = audioBuffer!;
    sourceRef.current
      .connect(gainNodeRef.current!)
      .connect(audioContext!.destination);

    sourceRef.current.start(0, startTime);
    startTimeRef.current = audioContext!.currentTime - startTime;
  };

  // Toggle the mute state
  const toggleMute = () => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 1 : 0;
      setIsMuted(!isMuted);
    }
  };

  // Handle seeking through the progress bar
  const handleProgressBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioContext && audioBuffer) {
      const newProgress = parseFloat(e.target.value);
      const newStartTime = (newProgress / 100) * audioBuffer.duration;

      setProgress(newProgress);

      if (isPlaying) {
        // Update the playback position during play
        sourceRef.current?.stop();
        createAndStartSource(newStartTime);
      }
      pauseTimeRef.current = newStartTime;
      startTimeRef.current = audioContext.currentTime; // Reset the start time reference
    }
  };

  // Format time for display
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    setCurrentTimes((progress / 100) * (audioBuffer?.duration || 0));
  }, [progress, audioBuffer?.duration]);

  useEffect(() => {
    if (Math.floor(audioBuffer?.duration) === Math.floor(currentTimes)) {
      setCurrentTimes(audioBuffer.duration);
      setIsPlaying(false);
      setHasReachedEnd(true);
      cancelAnimationFrame(animationFrameRef.current!);
    }
  }, [audioBuffer?.duration, currentTimes]);

  return (
    <div className="flex gap-3 justify-center items-center">
      <button onClick={() => loadAudio(sample)}>Audio</button>
      <button onClick={playAudio}>
        {isPlaying ? <FaPause /> : <FaPlay />}
      </button>
      <div className="text-lg">{formatTime(currentTimes)}</div>
      <div className="cursor-default">
        <input
          type="range"
          max="100"
          value={progress}
          onChange={handleProgressBarChange}
          className="w-64 h-[2px] cursor-pointer"
        />
      </div>
      <button onClick={toggleMute}>
        {isMuted ? <GoMute /> : <GoUnmute />}
      </button>
    </div>
  );
};

export default AudioPlayer;
