"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartPieSlice,
  Plus,
  ClockCounterClockwise,
  Wallet,
} from "@phosphor-icons/react";

const NAV_ITEMS = [
  { href: "/", label: "Panel", icon: ChartPieSlice },
  { href: "/add", label: "Nuevo", icon: Plus },
  { href: "/history", label: "Historial", icon: ClockCounterClockwise },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 md:top-6 md:bottom-auto">
      <div className="flex items-center gap-1 rounded-full bg-white/80 backdrop-blur-2xl border border-[var(--border)] px-2 py-2 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2 px-3">
          <Wallet size={18} weight="fill" className="text-[var(--accent)]" />
          <span className="hidden md:block text-sm font-semibold tracking-tight">
            ContUp
          </span>
        </div>
        <div className="w-px h-5 bg-[var(--border)] mx-1" />
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
                ${
                  isActive
                    ? "bg-[var(--foreground)] text-white"
                    : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-black/[0.04]"
                }
                active:scale-[0.97]
              `}
            >
              <Icon size={18} weight={isActive ? "fill" : "regular"} />
              <span className="hidden md:block">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
