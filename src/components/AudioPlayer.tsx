import React, { useState, useRef, useEffect, useMemo } from "react";
import { FaPlay, FaPause } from "react-icons/fa";
import { GoUnmute, GoMute } from "react-icons/go";

const AudioPlayer: React.FC = () => {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressTime, setProgressTime] = useState("0.00");
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const progressRef = useRef<number | null>(0);

  useEffect(() => {
    const context = new AudioContext();
    setAudioContext(context);
    gainNodeRef.current = context.createGain();
    return () => {
      context.close();
    };
  }, []);

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

  const updateProgress = () => {
    if (sourceRef.current && audioContext && audioBuffer) {
      const elapsed =
        (audioContext.currentTime -
          startTimeRef.current +
          pauseTimeRef.current) %
        audioBuffer.duration;
      setProgress((elapsed / audioBuffer.duration) * 100);
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const playAudio = () => {
    if (audioBuffer && audioContext && gainNodeRef.current) {
      if (!isPlaying) {
        sourceRef.current = audioContext.createBufferSource();
        sourceRef.current.buffer = audioBuffer;
        sourceRef.current
          .connect(gainNodeRef.current)
          .connect(audioContext.destination);
        startTimeRef.current = audioContext.currentTime;
        sourceRef.current.start(0, pauseTimeRef.current);
        setIsPlaying(true);
        animationFrameRef.current = requestAnimationFrame(updateProgress);

        sourceRef.current.onended = () => {
          setIsPlaying(false);
          setProgress(
            (pauseTimeRef.current +=
              audioContext.currentTime - startTimeRef.current)
          );
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

  const toggleMute = () => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 1 : 0;
      setIsMuted(!isMuted);
    }
  };

  const handleProgressBarChange = (e) => {
    setProgress((progressRef.current += audioContext?.currentTime));
    console.log(e.target.value);
  };

  useMemo(
    () => setProgressTime(audioContext?.currentTime.toFixed(2)),
    [progress]
  );

  return (
    <div className="flex gap-3 justify-center items-center">
      <button onClick={() => loadAudio("/sample.mp3")}>Load Audio</button>
      <button onClick={playAudio}>
        {isPlaying ? <FaPause /> : <FaPlay />}
      </button>
      <div className="text-lg">{progressTime}</div>
      <div className="cursor-default">
        <progress
          value={progress}
          ref={progressRef}
          max="100"
          onChange={handleProgressBarChange}
          className="flex h-[2px]"
        ></progress>
      </div>
      <button onClick={toggleMute}>
        {isMuted ? <GoUnmute /> : <GoMute />}
      </button>
    </div>
  );
};

export default AudioPlayer;
