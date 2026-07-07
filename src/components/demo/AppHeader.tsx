import Image from "next/image";
import {
  CircleHelp,
  LayoutDashboard,
  FileText,
  Settings,
} from "lucide-react";

import { cn } from "~/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Reports", icon: FileText },
  { label: "Settings", icon: Settings },
] as const;

type AppHeaderProps = {
  onHelpClick?: () => void;
};

export function AppHeader({ onHelpClick }: AppHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src="/images/safetalk-logo.png"
            alt="SafeTalk logo"
            width={44}
            height={44}
            className="shrink-0"
            priority
          />
          <div className="min-w-0">
            <p className="text-lg font-bold tracking-tight text-[#1e4a8c]">
              SafeTalk
            </p>
            <p className="truncate text-xs text-slate-500 sm:text-sm">
              Workplace Hazard Communication Assessment Tool
            </p>
          </div>
        </div>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Main navigation"
        >
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              disabled
              aria-disabled="true"
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!onHelpClick}
            aria-disabled={!onHelpClick}
            aria-label="Open help tutorial"
            onClick={onHelpClick}
          >
            <CircleHelp className="size-4" />
            Help
          </button>
        </nav>

        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            "bg-[#1e4a8c] text-sm font-semibold text-white",
          )}
          aria-hidden
        >
          PM
        </div>
      </div>
    </header>
  );
}
