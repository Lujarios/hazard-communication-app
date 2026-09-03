"use client";

import { useId, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  HardHat,
  Megaphone,
  MessageSquare,
  Mic,
  ShieldCheck,
  Star,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";

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
import { INTRO_SLIDES } from "~/lib/tutorial-steps";
import { DIALOG_BACKDROP_CLASS } from "~/lib/utils";
import type { IntroSlideVisual } from "~/types/tutorial";

function IntroSlideInfographic({ visual }: { visual: IntroSlideVisual }) {
  if (visual === "welcome") {
    return (
      <div
        className="flex flex-col items-center gap-4 rounded-xl bg-[#1e4a8c]/5 px-6 py-8 ring-1 ring-[#1e4a8c]/10"
        aria-hidden
      >
        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-[#1e4a8c] text-white shadow-lg shadow-blue-900/20">
            <HardHat className="size-8" />
          </div>
          <ArrowRight className="size-5 text-[#1e4a8c]/50" />
          <div className="flex size-16 items-center justify-center rounded-2xl bg-white text-[#1e4a8c] ring-2 ring-[#1e4a8c]/20">
            <MessageSquare className="size-8" />
          </div>
        </div>
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-[#1e4a8c]">
          Hazard communication practice
        </p>
      </div>
    );
  }

  if (visual === "goal") {
    const steps = [
      { icon: TriangleAlert, label: "Identify hazards", step: 1 },
      { icon: ShieldCheck, label: "Explain controls", step: 2 },
      { icon: Megaphone, label: "Communicate clearly", step: 3 },
    ] as const;

    return (
      <div
        className="grid gap-3 rounded-xl bg-slate-50 px-4 py-5 ring-1 ring-slate-200 sm:grid-cols-3"
        aria-hidden
      >
        {steps.map(({ icon: Icon, label, step }) => (
          <div
            key={step}
            className="flex flex-col items-center gap-2 rounded-lg bg-white px-3 py-4 text-center ring-1 ring-slate-100"
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-[#1e4a8c] text-xs font-bold text-white">
              {step}
            </span>
            <Icon className="size-6 text-[#1e4a8c]" />
            <p className="text-xs font-medium leading-snug text-slate-700">
              {label}
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (visual === "flow") {
    const steps = [
      { icon: Building2, label: "Scenario" },
      { icon: Mic, label: "Your talk" },
      { icon: Users, label: "Listeners" },
      { icon: Star, label: "Scorecard" },
    ] as const;

    return (
      <div
        className="rounded-xl bg-slate-50 px-4 py-5 ring-1 ring-slate-200"
        aria-hidden
      >
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
          {steps.map(({ icon: Icon, label }, index) => (
            <div key={label} className="flex items-center gap-2 sm:flex-1">
              <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-lg bg-white px-2 py-3 ring-1 ring-slate-100">
                <div className="flex size-9 items-center justify-center rounded-lg bg-[#1e4a8c]/10 text-[#1e4a8c]">
                  <Icon className="size-4" />
                </div>
                <p className="text-[10px] font-semibold text-slate-600 sm:text-xs">
                  {label}
                </p>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight
                  className="hidden size-4 shrink-0 text-slate-300 sm:block"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center gap-4 rounded-xl bg-[#1e4a8c]/5 px-6 py-8 ring-1 ring-[#1e4a8c]/10"
      aria-hidden
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="size-8" />
      </div>
      <div className="flex items-center gap-2 text-[#1e4a8c]">
        <Compass className="size-5" />
        <span className="text-sm font-semibold">Page tour ready</span>
      </div>
      <div className="grid w-full max-w-xs grid-cols-3 gap-1.5 opacity-80">
        <div className="h-8 rounded bg-[#1e4a8c]/20" />
        <div className="col-span-2 h-8 rounded bg-[#1e4a8c]/10" />
        <div className="col-span-2 h-6 rounded bg-slate-200" />
        <div className="h-6 rounded bg-slate-200" />
        <div className="col-span-3 h-5 rounded bg-[#1e4a8c]/15" />
      </div>
    </div>
  );
}

export function TutorialIntroModal() {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const {
    phase,
    introIndex,
    next,
    back,
    close,
    skip,
    startSpotlight,
  } = useTutorial();

  const isOpen = phase === "intro";
  const slide = INTRO_SLIDES[introIndex];
  const isFirstSlide = introIndex === 0;
  const isLastSlide = introIndex === INTRO_SLIDES.length - 1;

  useEscapeKey(close, isOpen);
  useFocusTrap(dialogRef, isOpen, introIndex);

  if (!isOpen || !slide) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className={DIALOG_BACKDROP_CLASS}
        aria-label="Close tutorial"
        onClick={close}
      />

      <div ref={dialogRef} className="relative z-10 w-full max-w-lg">
        <Card
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className="gap-0 py-0 ring-1 ring-slate-200"
        >
        <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-slate-100 py-4 pb-4">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium text-slate-500">
              Step {introIndex + 1} of {INTRO_SLIDES.length}
            </p>
            <CardTitle id={titleId} className="text-lg font-semibold text-slate-900">
              {slide.title}
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

        <CardContent className="space-y-4 py-4">
          <IntroSlideInfographic visual={slide.visual} />
          <p
            id={descriptionId}
            className="text-sm leading-relaxed text-slate-600"
          >
            {slide.body}
          </p>
        </CardContent>

        <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 py-4">
          <div className="flex items-center gap-2">
            {!isFirstSlide && (
              <Button type="button" variant="outline" size="sm" onClick={back}>
                <ChevronLeft className="size-4" />
                Back
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-slate-500"
              onClick={skip}
            >
              Skip tutorial
            </Button>
          </div>

          {isLastSlide ? (
            <Button
              type="button"
              size="sm"
              className="bg-[#1e4a8c] hover:bg-[#163a6e]"
              onClick={startSpotlight}
            >
              Tour the page
              <ChevronRight className="size-4" />
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
