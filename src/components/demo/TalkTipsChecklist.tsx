"use client";

/**
 * Optional on-page checklist of what a complete pre-job talk should cover.
 */
import { useEffect, useRef, useState } from "react";
import { ClipboardList } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { cn } from "~/lib/utils";

const SAFETY_TALK_TIPS = [
  {
    id: "name-hazards",
    label: "Name each visible hazard clearly",
  },
  {
    id: "explain-why",
    label: "Explain why each hazard is dangerous",
  },
  {
    id: "state-controls",
    label: "State the control or mitigation for each one",
  },
  {
    id: "life-threatening",
    label: "Call out life-threatening risks first",
  },
  {
    id: "plain-language",
    label: "Use plain language for new or limited-English workers",
  },
  {
    id: "check-understanding",
    label: "Ask if the crew has questions before finishing",
  },
] as const;

const AUTO_SCROLL_PX_PER_SECOND = 16;
const EDGE_PAUSE_MS = 1000;

type TalkTipsChecklistProps = {
  className?: string;
};

export function TalkTipsChecklist({ className }: TalkTipsChecklistProps) {
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const viewportRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const offsetRef = useRef(0);
  const directionRef = useRef<1 | -1>(1);
  const edgePauseUntilRef = useRef(0);

  const stopAutoScroll = () => {
    if (!autoScrollEnabled) return;

    const viewport = viewportRef.current;
    const list = listRef.current;
    if (viewport && list) {
      // Hand scroll position back to native overflow scrolling.
      viewport.scrollTop = offsetRef.current;
      list.style.transform = "";
    }
    setAutoScrollEnabled(false);
  };

  const toggleTip = (tipId: string) => {
    stopAutoScroll();
    setCheckedIds((current) =>
      current.includes(tipId)
        ? current.filter((id) => id !== tipId)
        : [...current, tipId],
    );
  };

  useEffect(() => {
    if (!autoScrollEnabled) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) {
      setAutoScrollEnabled(false);
      return;
    }

    let frameId = 0;
    let lastTimestamp: number | null = null;

    const tick = (timestamp: number) => {
      const viewport = viewportRef.current;
      const list = listRef.current;
      if (!viewport || !list) {
        frameId = window.requestAnimationFrame(tick);
        return;
      }

      const maxOffset = Math.max(0, list.scrollHeight - viewport.clientHeight);
      if (maxOffset <= 1) {
        lastTimestamp = timestamp;
        frameId = window.requestAnimationFrame(tick);
        return;
      }

      if (timestamp < edgePauseUntilRef.current) {
        lastTimestamp = timestamp;
        frameId = window.requestAnimationFrame(tick);
        return;
      }

      const previous = lastTimestamp ?? timestamp;
      lastTimestamp = timestamp;
      const deltaSeconds = Math.min((timestamp - previous) / 1000, 0.05);

      let nextOffset =
        offsetRef.current +
        AUTO_SCROLL_PX_PER_SECOND * deltaSeconds * directionRef.current;

      if (nextOffset >= maxOffset) {
        nextOffset = maxOffset;
        directionRef.current = -1;
        edgePauseUntilRef.current = timestamp + EDGE_PAUSE_MS;
      } else if (nextOffset <= 0) {
        nextOffset = 0;
        directionRef.current = 1;
        edgePauseUntilRef.current = timestamp + EDGE_PAUSE_MS;
      }

      offsetRef.current = nextOffset;
      list.style.transform = `translate3d(0, ${-nextOffset}px, 0)`;

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [autoScrollEnabled]);

  const completedCount = checkedIds.length;

  return (
    <Card
      className={cn("flex w-full flex-col gap-0 py-0 ring-1 ring-slate-200", className)}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-slate-100 py-3 pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
          <ClipboardList className="size-4 text-[#1e4a8c]" aria-hidden />
          Talk checklist
        </CardTitle>
        <span className="text-xs font-medium tabular-nums text-slate-500">
          {completedCount}/{SAFETY_TALK_TIPS.length}
        </span>
      </CardHeader>

      <CardContent className="flex flex-col p-2">
        <div
          ref={viewportRef}
          className={cn(
            "max-h-36",
            autoScrollEnabled ? "overflow-hidden" : "overflow-y-auto",
          )}
          onPointerDown={stopAutoScroll}
          onWheel={stopAutoScroll}
          onTouchStart={stopAutoScroll}
          onFocusCapture={stopAutoScroll}
        >
          <ul
            ref={listRef}
            className="m-0 flex flex-col gap-1 p-0 will-change-transform"
          >
            {SAFETY_TALK_TIPS.map((tip) => {
              const isChecked = checkedIds.includes(tip.id);

              return (
                <li key={tip.id}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-2 transition-colors",
                      isChecked ? "bg-emerald-50/80" : "hover:bg-slate-50",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleTip(tip.id)}
                      className="mt-0.5 size-3.5 shrink-0 rounded border-slate-300 accent-[#1e4a8c]"
                    />
                    <span
                      className={cn(
                        "text-xs leading-snug text-slate-700",
                        isChecked && "text-slate-500 line-through",
                      )}
                    >
                      {tip.label}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="border-t border-slate-100 px-2 pb-2 pt-3 text-[10px] leading-relaxed text-slate-500">
          Use this as a quick guide while you prepare and deliver your safety
          talk.
        </p>
      </CardContent>
    </Card>
  );
}
