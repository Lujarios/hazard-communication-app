"use client";

/**
 * Upload a scenario image to public/scenarios/ or pick an existing filename.
 */
import Image from "next/image";
import { Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "~/components/ui/button";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewError, setPreviewError] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const trimmedValue = value.trim();
  const previewSrc = trimmedValue ? getScenarioImagePath(trimmedValue) : null;

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setUploadError(null);
    setPreviewError(false);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/admin/scenario-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Upload failed.");
      }

      const payload = (await response.json()) as { fileName: string };
      onChange(payload.fileName);
    } catch (uploadFailure) {
      setUploadError(
        uploadFailure instanceof Error
          ? uploadFailure.message
          : "Failed to upload image.",
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="imageFileName">Reference photo filename</Label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Upload className="size-4" aria-hidden />
            )}
            {isUploading ? "Uploading..." : "Upload image"}
          </Button>
        </div>
        <Input
          id="imageFileName"
          list="scenario-image-options"
          placeholder="Upload an image or enter filename manually"
          value={value}
          aria-invalid={Boolean(error)}
          onChange={(event) => {
            setPreviewError(false);
            setUploadError(null);
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
          . Upload stores the file locally and saves only its filename.
        </p>
        {uploadError ? (
          <p className="text-xs text-destructive">{uploadError}</p>
        ) : null}
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
