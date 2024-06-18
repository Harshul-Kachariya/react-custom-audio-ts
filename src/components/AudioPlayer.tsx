import React, { useState, useRef, useEffect, useCallback } from "react";
import { FaPlay, FaPause } from "react-icons/fa";
import { GoUnmute, GoMute } from "react-icons/go";

const AudioPlayer: React.FC = () => {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

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
  useEffect(() => {
    const context = new AudioContext();
    setAudioContext(context);
    gainNodeRef.current = context.createGain();
    loadAudio("../../public/sample.mp3");
    return () => {
      context.close();
    };
  }, []);

  const updateProgress = useCallback(() => {
    if (audioBuffer && audioContext && isPlaying) {
      const elapsed =
        audioContext.currentTime - startTimeRef.current + pauseTimeRef.current;
      const percentage = (elapsed / audioBuffer.duration) * 100;
      setProgress(percentage);
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, [audioBuffer, audioContext, isPlaying]);

  const playAudio = () => {
    if (audioBuffer && audioContext && gainNodeRef.current) {
      if (!isPlaying) {
        createAndStartSource();
        setIsPlaying(true);
        animationFrameRef.current = requestAnimationFrame(updateProgress);

        sourceRef.current!.onended = () => {
          setIsPlaying(false);
          setProgress(100);
          cancelAnimationFrame(animationFrameRef.current!);
        };
      } else {
        sourceRef.current?.stop();
        pauseTimeRef.current += audioContext.currentTime - startTimeRef.current;
        setIsPlaying(false);
        cancelAnimationFrame(animationFrameRef.current!);
      }
    }
  };

  const createAndStartSource = (startTime = 0) => {
    sourceRef.current = audioContext!.createBufferSource();
    sourceRef.current.buffer = audioBuffer!;
    sourceRef.current
      .connect(gainNodeRef.current!)
      .connect(audioContext!.destination);
    startTimeRef.current = audioContext!.currentTime + startTime;
    sourceRef.current.start(0, startTime);
  };

  const toggleMute = () => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 1 : 0;
      setIsMuted(!isMuted);
    }
  };

  const handleProgressBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioContext && audioBuffer) {
      const newProgress = parseFloat(e.target.value);
      setProgress(newProgress);
      const newStartTime = (newProgress / 100) * audioBuffer.duration;

      if (!isPlaying) {
        createAndStartSource(newStartTime);
      }
      startTimeRef.current = audioContext.currentTime - newStartTime;
    }
  };

  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex gap-3 justify-center items-center">
      <button onClick={() => loadAudio("../../public/sample.mp3")}>
        Load Audio
      </button>
      <button onClick={playAudio}>
        {isPlaying ? <FaPause /> : <FaPlay />}
      </button>
      <div className="text-lg">
        {formatTime((progress / 100) * (audioBuffer?.duration || 0))}
      </div>
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
