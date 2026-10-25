import React from "react";

interface FluxaxNetLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function FluxaxNetLogo({ className = "", size = "md" }: FluxaxNetLogoProps) {
  const jewelSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
    xl: "w-6 h-6",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
    xl: "text-2xl",
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* AUTHENTIC STUDIO VINTAGE PILOT LAMP (JEWEL INDICATOR) */}
      <div
        className={`${jewelSizes[size]} rounded-full relative flex items-center justify-center shrink-0`}
        style={{
          background: "radial-gradient(circle at 35% 35%, #ff4d4d 0%, #dc2626 45%, #991b1b 75%, #450a0a 100%)",
          border: "1.5px solid #1a0505",
          boxShadow: "0 0 10px rgba(239, 68, 68, 0.85), inset 0 1px 2px rgba(255, 255, 255, 0.7), 0 2px 4px rgba(0,0,0,0.4)",
        }}
        title="Client HUB • Studio Online"
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background: "radial-gradient(circle at 35% 25%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 50%)",
          }}
        />
      </div>

      {/* CLEAN TYPOGRAPHY: Client HUB */}
      <div className="flex items-baseline gap-1.5 leading-none">
        <span className={`font-black tracking-tight text-slate-900 ${textSizes[size]}`}>
          Client <span className="text-teal-700">HUB</span>
        </span>
      </div>
    </div>
  );
}

export function FluxaxAppIcon({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-8 h-8 rounded-full relative flex items-center justify-center ${className}`}
      style={{
        background: "radial-gradient(circle at 35% 35%, #ff4d4d 0%, #dc2626 45%, #991b1b 75%, #450a0a 100%)",
        border: "2px solid #1a0505",
        boxShadow: "0 0 12px rgba(239, 68, 68, 0.9), inset 0 1px 2px rgba(255, 255, 255, 0.8)",
      }}
    >
      <div
        className="w-full h-full rounded-full"
        style={{
          background: "radial-gradient(circle at 35% 25%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 50%)",
        }}
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
