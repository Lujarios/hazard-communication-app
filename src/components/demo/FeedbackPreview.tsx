import { ClipboardList } from "lucide-react";

import { Card, CardContent } from "~/components/ui/card";

export function FeedbackPreview() {
  return (
    <Card className="bg-slate-50 py-4 ring-1 ring-slate-200">
      <CardContent className="flex gap-4 px-4">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#1e4a8c]/10 text-[#1e4a8c]"
          aria-hidden
        >
          <ClipboardList className="size-6" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Feedback (coming soon)
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Stop recording to generate tailored feedback for each worker persona.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
