import React from "react";

interface FluxaxNetLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function FluxaxNetLogo({ className = "", size = "md" }: FluxaxNetLogoProps) {
  const heightClasses = {
    sm: "h-6",
    md: "h-8 sm:h-9",
    lg: "h-11 sm:h-12",
    xl: "h-14 sm:h-16",
  };

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <img
        src="/FluxaX graphics/lockup-clienthub-light.svg"
        alt="FluxaX Client HUB"
        className={`${heightClasses[size] || "h-9"} w-auto object-contain`}
      />
    </div>
  );
}

export function FluxaxAppIcon({ className = "" }: { className?: string }) {
  return (
    <img
      src="/FluxaX graphics/icon-clienthub.svg"
      alt="Client HUB Icon"
      className={`w-8 h-8 object-contain ${className}`}
    />
  );
}

export function FluxaxDynamicLiveStreamBadge({ className = "" }: { className?: string }) {
  return (
    <img
      src="/FluxaX graphics/Client HUB – Dynamic Green Stream (Live Blink + Wave Pulse).svg"
      alt="Live Stream Active"
      className={`h-7 w-auto object-contain ${className}`}
    />
  );
}
