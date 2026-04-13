"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  accent?: string;
  accentBg?: string;
  className?: string;
  delay?: number;
}

export default function StatCard({
  label,
  value,
  icon,
  accent = "var(--foreground)",
  accentBg = "var(--background)",
  className = "",
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.32, 0.72, 0, 1],
      }}
      className={`group relative ${className}`}
    >
      {/* Outer shell — Double-Bezel */}
      <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
        {/* Inner core */}
        <div className="rounded-[calc(1.25rem-0.375rem)] bg-white p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
          <div className="flex items-start justify-between mb-4">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
              {label}
            </span>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: accentBg, color: accent }}
            >
              {icon}
            </div>
          </div>
          <p
            className="text-2xl md:text-3xl font-semibold tracking-tighter font-mono"
            style={{ color: accent }}
          >
            {value}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
