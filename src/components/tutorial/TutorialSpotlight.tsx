"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
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
import { useEscapeKey, useFocusTrap } from "~/hooks/use-tutorial-a11y";
import { SPOTLIGHT_STEPS } from "~/lib/tutorial-steps";
import type { TourTargetId } from "~/types/tutorial";
import { cn } from "~/lib/utils";

const SPOTLIGHT_PADDING = 4;
const TOOLTIP_GAP = 12;
const TOOLTIP_ESTIMATED_HEIGHT = 300;
const COMPACT_BREAKPOINT = 1024;

type TargetRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type TooltipPlacement = {
  centered: boolean;
  style?: React.CSSProperties;
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
        className="pointer-events-auto absolute inset-0 bg-slate-950/75 backdrop-blur-[2px]"
        aria-hidden
      />
    );
  }

  return (
    <svg
      className="pointer-events-auto absolute inset-0 h-full w-full"
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
        fill="rgba(2, 6, 23, 0.75)"
        mask={`url(#${maskId})`}
      />
    </svg>
  );
}

function SpotlightRing({ rect }: { rect: TargetRect | null }) {
  if (!rect) return null;

  return (
    <div
      className="pointer-events-none absolute rounded-lg ring-2 ring-[#1e4a8c] ring-offset-2 ring-offset-transparent"
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

function isCrampedTarget(rect: TargetRect): boolean {
  return (
    rect.height > window.innerHeight * 0.55 ||
    rect.width > window.innerWidth * 0.9
  );
}

function getCenteredTooltipStyle(): React.CSSProperties {
  return {
    position: "fixed",
    bottom: 24,
    left: "50%",
    transform: "translateX(-50%)",
    width: "min(100vw - 2rem, 20rem)",
    zIndex: 2,
  };
}

function getTooltipPlacement(
  rect: TargetRect | null,
  isCompact: boolean,
): TooltipPlacement {
  if (!rect || isCompact || isCrampedTarget(rect)) {
    return { centered: true, style: getCenteredTooltipStyle() };
  }

  const maxWidth = Math.min(320, window.innerWidth - 32);
  const left = Math.max(
    16,
    Math.min(rect.left, window.innerWidth - maxWidth - 16),
  );
  const belowTop = rect.top + rect.height + TOOLTIP_GAP;
  const fitsBelow =
    belowTop + TOOLTIP_ESTIMATED_HEIGHT <= window.innerHeight - 16;
  const fitsAbove =
    rect.top - TOOLTIP_GAP - TOOLTIP_ESTIMATED_HEIGHT >= 16;

  if (!fitsBelow && !fitsAbove) {
    return { centered: true, style: getCenteredTooltipStyle() };
  }

  if (fitsBelow) {
    return {
      centered: false,
      style: {
        position: "fixed",
        top: belowTop,
        left,
        width: maxWidth,
        zIndex: 2,
      },
    };
  }

  return {
    centered: false,
    style: {
      position: "fixed",
      top: Math.max(16, rect.top - TOOLTIP_GAP - TOOLTIP_ESTIMATED_HEIGHT),
      left,
      width: maxWidth,
      zIndex: 2,
    },
  };
}

export function TutorialSpotlight() {
  const dialogRef = useRef<HTMLDivElement>(null);
  const maskId = useId().replace(/:/g, "");
  const titleId = useId();
  const descriptionId = useId();
  const howToUseId = useId();

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

  useEscapeKey(close, isOpen);
  useFocusTrap(dialogRef, isOpen, spotlightIndex);

  useEffect(() => {
    if (!isOpen || !step) return;

    const element = document.querySelector(`[data-tour="${step.target}"]`);
    element?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [isOpen, step, spotlightIndex]);

  if (!isOpen || !step) {
    return null;
  }

  const { centered: useCenteredTooltip, style: tooltipStyle } =
    getTooltipPlacement(targetRect, isCompact);

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div className="pointer-events-none absolute inset-0">
        <SpotlightOverlay rect={targetRect} maskId={maskId} />
        <SpotlightRing rect={targetRect} />
      </div>

      <div
        ref={dialogRef}
        className="pointer-events-none absolute inset-0 z-[1]"
      >
        <Card
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={
            step.howToUse ? `${descriptionId} ${howToUseId}` : descriptionId
          }
          className={cn(
            "pointer-events-auto gap-0 bg-white py-0 shadow-xl ring-1 ring-slate-200",
            useCenteredTooltip && "max-h-[min(70vh,32rem)] overflow-y-auto",
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
              <div
                id={howToUseId}
                className="rounded-lg bg-[#1e4a8c]/5 px-3 py-2.5 ring-1 ring-[#1e4a8c]/10"
              >
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
      </div>
    </div>,
    document.body,
  );
}
