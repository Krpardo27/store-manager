"use client";

import { useRef } from "react";

export function useSaleAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = async () => {
    if (typeof window === "undefined") {
      return null;
    }

    const globalWithAudio = window as typeof window & {
      webkitAudioContext?: typeof AudioContext;
    };
    const AudioContextConstructor = window.AudioContext ?? globalWithAudio.webkitAudioContext;
    if (!AudioContextConstructor) {
      return null;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextConstructor();
    }

    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }

    return audioContextRef.current;
  };

  const playBeep = async (frequency = 880, durationSeconds = 0.09, gainPeak = 0.1) => {
    const audioContext = await getAudioContext();
    if (!audioContext) {
      return false;
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(gainPeak, audioContext.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + durationSeconds);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + durationSeconds);

    return true;
  };

  const playSaleSuccessSound = async (mode: "item" | "checkout") => {
    const audioContext = await getAudioContext();
    if (!audioContext) {
      return;
    }

    const start = audioContext.currentTime;
    const sequence =
      mode === "checkout"
        ? [
            { frequency: 1046, offset: 0, duration: 0.07 },
            { frequency: 1318, offset: 0.08, duration: 0.08 },
            { frequency: 1567, offset: 0.17, duration: 0.16 },
          ]
        : [
            { frequency: 1108, offset: 0, duration: 0.06 },
            { frequency: 1480, offset: 0.07, duration: 0.1 },
          ];

    sequence.forEach((note) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = mode === "checkout" ? "square" : "triangle";
      oscillator.frequency.setValueAtTime(note.frequency, start + note.offset);

      gain.gain.setValueAtTime(0.0001, start + note.offset);
      gain.gain.exponentialRampToValueAtTime(0.2, start + note.offset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + note.offset + note.duration);

      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(start + note.offset);
      oscillator.stop(start + note.offset + note.duration);
    });
  };

  const playScanFeedback = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(120);
    }

    void playBeep(760, 0.06, 0.06);
  };

  const disposeAudioContext = () => {
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      void audioContextRef.current.close();
    }
  };

  return { getAudioContext, playSaleSuccessSound, playScanFeedback, disposeAudioContext };
}
