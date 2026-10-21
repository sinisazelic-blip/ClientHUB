import React from "react";

interface FluxaxNetLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function FluxaxNetLogo({ className = "", size = "md" }: FluxaxNetLogoProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
  };

  return (
    <div className={`font-black tracking-tight select-none text-slate-900 flex items-center gap-0.5 ${sizeClasses[size] || "text-2xl"} ${className}`}>
      <span>Fluxa</span>
      <span className="text-teal-600">X</span>
    </div>
  );
}

export function FluxaxAppIcon() {
  return (
    <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-black flex items-center justify-center text-sm shadow-sm">
      FX
    </div>
  );
}
