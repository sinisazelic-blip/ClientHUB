import React from "react";

interface FluxaxNetLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function FluxaxNetLogo({ className = "", size = "md" }: FluxaxNetLogoProps) {
  const logoHeights = {
    sm: "h-7 sm:h-8",
    md: "h-8 sm:h-9",
    lg: "h-10",
    xl: "h-12",
  };

  return (
    <div className={`flex items-center select-none ${className}`}>
      {/* Vintage Studio Equipment Hardware Badge */}
      <div className="relative inline-flex items-center justify-center px-2 py-1 rounded-lg bg-gradient-to-b from-[#181f29] via-[#0f151e] to-[#0a0e14] border border-slate-700/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_1px_3px_rgba(0,0,0,0.25)] hover:border-teal-500/60 transition-colors">
        <img
          src="/branding/CH logo.png"
          alt="FluxaX Client HUB"
          className={`${logoHeights[size]} w-auto object-contain block`}
        />
      </div>
    </div>
  );
}

export function FluxaxAppIcon({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center select-none ${className}`}>
      <img
        src="/branding/CH icon.png"
        alt="Client HUB Icon"
        className="w-8 h-8 object-contain rounded-full shadow-sm"
      />
    </div>
  );
}

export function FluxaxDynamicLiveStreamBadge({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-bold tracking-wider ${className}`}
    >
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <span>LIVE STREAM ACTIVE</span>
    </div>
  );
}
