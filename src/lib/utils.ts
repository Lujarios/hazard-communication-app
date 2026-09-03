import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Shared overlay behind assessment dialogs so the page recedes. */
export const DIALOG_BACKDROP_CLASS =
  "absolute inset-0 bg-slate-950/75 backdrop-blur-[2px]"

