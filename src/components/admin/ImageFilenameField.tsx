"use client";

import Image from "next/image";
import { useState } from "react";

import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  SAMPLE_SCENARIO_IMAGE_FILENAMES,
  getScenarioImagePath,
} from "~/lib/scenario-images";
import { cn } from "~/lib/utils";

type ImageFilenameFieldProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export function ImageFilenameField({
  value,
  onChange,
  error,
}: ImageFilenameFieldProps) {
  const [previewError, setPreviewError] = useState(false);
  const trimmedValue = value.trim();
  const previewSrc = trimmedValue ? getScenarioImagePath(trimmedValue) : null;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="imageFileName">Reference photo filename</Label>
        <Input
          id="imageFileName"
          list="scenario-image-options"
          placeholder="e.g. construction-site-demo.png"
          value={value}
          aria-invalid={Boolean(error)}
          onChange={(event) => {
            setPreviewError(false);
            onChange(event.target.value);
          }}
        />
        <datalist id="scenario-image-options">
          {SAMPLE_SCENARIO_IMAGE_FILENAMES.map((filename) => (
            <option key={filename} value={filename} />
          ))}
        </datalist>
        <p className="text-xs text-slate-500">
          Place image files in{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
            /public/scenarios/
          </code>
          . Only the filename is stored in the database.
        </p>
        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : null}
      </div>

      {previewSrc ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          {!previewError ? (
            <Image
              src={previewSrc}
              alt={`Preview of ${trimmedValue}`}
              width={1200}
              height={675}
              className="h-auto w-full object-contain"
              onError={() => setPreviewError(true)}
            />
          ) : (
            <div
              className={cn(
                "flex min-h-48 items-center justify-center px-4 py-8 text-center",
                "text-sm text-slate-500",
              )}
            >
              No preview found at{" "}
              <code className="ml-1 rounded bg-white px-1 py-0.5 text-xs">
                {previewSrc}
              </code>
              . Add the file to{" "}
              <code className="ml-1 rounded bg-white px-1 py-0.5 text-xs">
                public/scenarios/
              </code>
              .
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
