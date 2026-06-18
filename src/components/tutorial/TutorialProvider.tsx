"use client";

import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { INTRO_SLIDES, SPOTLIGHT_STEPS } from "~/lib/tutorial-steps";
import {
  initialTutorialState,
  type TutorialPhase,
  type TutorialState,
} from "~/types/tutorial";

export type TutorialContextValue = {
  phase: TutorialPhase;
  introIndex: number;
  spotlightIndex: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  skip: () => void;
  next: () => void;
  back: () => void;
  startSpotlight: () => void;
  finish: () => void;
};

export const TutorialContext = createContext<TutorialContextValue | null>(null);

type TutorialProviderProps = {
  children: ReactNode;
};

export function TutorialProvider({ children }: TutorialProviderProps) {
  const [state, setState] = useState<TutorialState>(initialTutorialState);

  const close = useCallback(() => {
    setState(initialTutorialState);
  }, []);

  const open = useCallback(() => {
    setState({
      phase: "intro",
      introIndex: 0,
      spotlightIndex: 0,
    });
  }, []);

  const startSpotlight = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: "spotlight",
      spotlightIndex: 0,
    }));
  }, []);

  const next = useCallback(() => {
    setState((prev) => {
      if (prev.phase === "intro") {
        if (prev.introIndex < INTRO_SLIDES.length - 1) {
          return { ...prev, introIndex: prev.introIndex + 1 };
        }

        return {
          ...prev,
          phase: "spotlight",
          spotlightIndex: 0,
        };
      }

      if (prev.phase === "spotlight") {
        if (prev.spotlightIndex < SPOTLIGHT_STEPS.length - 1) {
          return { ...prev, spotlightIndex: prev.spotlightIndex + 1 };
        }

        return initialTutorialState;
      }

      return prev;
    });
  }, []);

  const back = useCallback(() => {
    setState((prev) => {
      if (prev.phase === "intro" && prev.introIndex > 0) {
        return { ...prev, introIndex: prev.introIndex - 1 };
      }

      if (prev.phase === "spotlight" && prev.spotlightIndex > 0) {
        return { ...prev, spotlightIndex: prev.spotlightIndex - 1 };
      }

      return prev;
    });
  }, []);

  const value = useMemo<TutorialContextValue>(
    () => ({
      phase: state.phase,
      introIndex: state.introIndex,
      spotlightIndex: state.spotlightIndex,
      isOpen: state.phase !== "closed",
      open,
      close,
      skip: close,
      next,
      back,
      startSpotlight,
      finish: close,
    }),
    [state, open, close, next, back, startSpotlight],
  );

  return (
    <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>
  );
}
