"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { useTutorial } from "~/hooks/use-tutorial";
import { SPOTLIGHT_STEPS } from "~/lib/tutorial-steps";
import type { TourTargetId } from "~/types/tutorial";
import { cn } from "~/lib/utils";

const SPOTLIGHT_PADDING = 4;
const TOOLTIP_GAP = 12;
const COMPACT_BREAKPOINT = 1024;

type TargetRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function toTargetRect(rect: DOMRect): TargetRect {
  return {
    top: rect.top - SPOTLIGHT_PADDING,
    left: rect.left - SPOTLIGHT_PADDING,
    width: rect.width + SPOTLIGHT_PADDING * 2,
    height: rect.height + SPOTLIGHT_PADDING * 2,
  };
}

function useTargetRect(target: TourTargetId | null, enabled: boolean) {
  const [rect, setRect] = useState<TargetRect | null>(null);

  const update = useCallback(() => {
    if (!target) {
      setRect(null);
      return;
    }

    const element = document.querySelector(`[data-tour="${target}"]`);
    setRect(element ? toTargetRect(element.getBoundingClientRect()) : null);
  }, [target]);

  useEffect(() => {
    if (!enabled) {
      setRect(null);
      return;
    }

    update();

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [enabled, update]);

  return rect;
}

function useCompactLayout() {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const update = () => {
      setIsCompact(window.innerWidth < COMPACT_BREAKPOINT);
    };

    update();
    window.addEventListener("resize", update);

    return () => window.removeEventListener("resize", update);
  }, []);

  return isCompact;
}

function SpotlightOverlay({
  rect,
  maskId,
}: {
  rect: TargetRect | null;
  maskId: string;
}) {
  if (!rect) {
    return (
      <div
        className="pointer-events-auto fixed inset-0 z-50 bg-black/60"
        aria-hidden
      />
    );
  }

  return (
    <svg
      className="pointer-events-auto fixed inset-0 z-50 h-full w-full"
      aria-hidden
    >
      <defs>
        <mask id={maskId}>
          <rect width="100%" height="100%" fill="white" />
          <rect
            x={rect.left}
            y={rect.top}
            width={rect.width}
            height={rect.height}
            rx={8}
            fill="black"
          />
        </mask>
      </defs>
      <rect
        width="100%"
        height="100%"
        fill="rgba(0, 0, 0, 0.6)"
        mask={`url(#${maskId})`}
      />
    </svg>
  );
}

function SpotlightRing({ rect }: { rect: TargetRect | null }) {
  if (!rect) return null;

  return (
    <div
      className="pointer-events-none fixed z-[51] rounded-lg ring-2 ring-[#1e4a8c] ring-offset-2 ring-offset-transparent"
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }}
      aria-hidden
    />
  );
}

function getAnchoredTooltipStyle(rect: TargetRect): React.CSSProperties {
  const maxWidth = Math.min(320, window.innerWidth - 32);
  const left = Math.max(
    16,
    Math.min(rect.left, window.innerWidth - maxWidth - 16),
  );
  const spaceBelow = window.innerHeight - (rect.top + rect.height);
  const placeBelow = spaceBelow >= 220;

  if (placeBelow) {
    return {
      position: "fixed",
      top: rect.top + rect.height + TOOLTIP_GAP,
      left,
      width: maxWidth,
      zIndex: 52,
    };
  }

  return {
    position: "fixed",
    top: Math.max(16, rect.top - TOOLTIP_GAP - 220),
    left,
    width: maxWidth,
    zIndex: 52,
  };
}

export function TutorialSpotlight() {
  const maskId = useId().replace(/:/g, "");
  const titleId = useId();
  const descriptionId = useId();

  const {
    phase,
    spotlightIndex,
    next,
    back,
    finish,
    close,
  } = useTutorial();

  const isOpen = phase === "spotlight";
  const step = SPOTLIGHT_STEPS[spotlightIndex];
  const isFirstStep = spotlightIndex === 0;
  const isLastStep = spotlightIndex === SPOTLIGHT_STEPS.length - 1;
  const isCompact = useCompactLayout();
  const targetRect = useTargetRect(step?.target ?? null, isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !step) {
    return null;
  }

  const useCenteredTooltip = isCompact || !targetRect;
  const tooltipStyle = useCenteredTooltip
    ? undefined
    : getAnchoredTooltipStyle(targetRect);

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-50">
      <SpotlightOverlay rect={targetRect} maskId={maskId} />
      <SpotlightRing rect={targetRect} />

      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={cn(
          "pointer-events-auto gap-0 py-0 ring-1 ring-slate-200",
          useCenteredTooltip &&
            "fixed bottom-6 left-1/2 w-[min(100vw-2rem,20rem)] -translate-x-1/2",
        )}
        style={tooltipStyle}
      >
        <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-slate-100 py-3 pb-3">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium text-slate-500">
              Tour step {spotlightIndex + 1} of {SPOTLIGHT_STEPS.length}
            </p>
            <CardTitle
              id={titleId}
              className="text-base font-semibold text-slate-900"
            >
              {step.title}
            </CardTitle>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-slate-500 hover:text-slate-900"
            onClick={close}
            aria-label="Close tutorial"
          >
            <X className="size-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-3 py-3">
          <p
            id={descriptionId}
            className="text-sm leading-relaxed text-slate-600"
          >
            {step.body}
          </p>
          {step.howToUse && (
            <div className="rounded-lg bg-[#1e4a8c]/5 px-3 py-2.5 ring-1 ring-[#1e4a8c]/10">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#1e4a8c]">
                How to use
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-700">
                {step.howToUse}
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 py-3">
          {!isFirstStep ? (
            <Button type="button" variant="outline" size="sm" onClick={back}>
              <ChevronLeft className="size-4" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {isLastStep ? (
            <Button
              type="button"
              size="sm"
              className="bg-[#1e4a8c] hover:bg-[#163a6e]"
              onClick={finish}
            >
              Finish
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="bg-[#1e4a8c] hover:bg-[#163a6e]"
              onClick={next}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>,
    document.body,
  );
}
