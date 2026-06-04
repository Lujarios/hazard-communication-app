"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function getSpeechRecognitionConstructor():
  | SpeechRecognitionConstructor
  | undefined {
  if (typeof window === "undefined") return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

export function useSpeechRecognition() {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldListenRef = useRef(false);
  const onFinalResultRef = useRef<(text: string) => void>(() => undefined);

  useEffect(() => {
    setIsSupported(!!getSpeechRecognitionConstructor());
  }, []);

  const stop = useCallback(() => {
    shouldListenRef.current = false;
    setIsListening(false);
    setInterimTranscript("");

    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.onend = null;
      recognition.stop();
      recognitionRef.current = null;
    }
  }, []);

  const start = useCallback(
    (onFinalResult: (text: string) => void) => {
      const SpeechRecognitionCtor = getSpeechRecognitionConstructor();
      if (!SpeechRecognitionCtor) {
        setError(
          "Speech recognition is unavailable in this browser. You can type your transcript below.",
        );
        return;
      }

      stop();

      onFinalResultRef.current = onFinalResult;
      shouldListenRef.current = true;
      setError(null);
      setInterimTranscript("");

      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (!result) continue;
          const transcript = result[0]?.transcript ?? "";

          if (result.isFinal) {
            const trimmed = transcript.trim();
            if (trimmed) {
              onFinalResultRef.current(trimmed);
            }
          } else {
            interim += transcript;
          }
        }

        setInterimTranscript(interim.trim());
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === "aborted" || event.error === "no-speech") {
          return;
        }
        setError(
          event.error === "not-allowed"
            ? "Microphone access was denied. Allow microphone access or type your transcript below."
            : `Speech recognition error: ${event.error}`,
        );
      };

      recognition.onend = () => {
        if (!shouldListenRef.current) {
          setIsListening(false);
          setInterimTranscript("");
          return;
        }

        try {
          recognition.start();
        } catch {
          setIsListening(false);
          shouldListenRef.current = false;
        }
      };

      recognitionRef.current = recognition;

      try {
        recognition.start();
        setIsListening(true);
      } catch {
        setError("Could not start speech recognition. Try again or type your transcript.");
        shouldListenRef.current = false;
        setIsListening(false);
      }
    },
    [stop],
  );

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.onend = null;
        recognition.stop();
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    interimTranscript,
    error,
    start,
    stop,
  };
}
