"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CircleHelp,
  Home,
  LayoutDashboard,
  ChartColumn,
} from "lucide-react";

import { HeaderAuthMenu } from "~/components/auth/HeaderAuthMenu";
import { cn } from "~/lib/utils";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Scenarios", href: "/admin/scenarios", icon: LayoutDashboard },
  { label: "Analytics", href: "/admin/analytics", icon: ChartColumn },
] as const;

type AppHeaderProps = {
  onHelpClick?: () => void;
  highlightHelp?: boolean;
};

export function AppHeader({ onHelpClick, highlightHelp = false }: AppHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-3">
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
        </Link>

        <div className="flex items-center gap-1">
          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Main navigation"
          >
            {navItems.map(({ label, href, icon: Icon }) => {
              const isActive =
                href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(href);

              return (
                <Link
                  key={label}
                  href={href}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-[#1e4a8c]/10 font-medium text-[#1e4a8c]"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            data-tour="help"
            className={cn(
              "relative z-[60] inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors",
              highlightHelp
                ? "bg-[#1e4a8c] font-semibold text-white shadow-lg shadow-blue-900/30 ring-4 ring-[#1e4a8c]/35 ring-offset-2 animate-pulse"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              !onHelpClick && "cursor-not-allowed opacity-50",
            )}
            disabled={!onHelpClick}
            aria-disabled={!onHelpClick}
            aria-label="Open help tutorial"
            onClick={onHelpClick}
          >
            <CircleHelp className="size-4" />
            Help
          </button>

          <HeaderAuthMenu />
        </div>
      </div>
    </header>
  );
}
