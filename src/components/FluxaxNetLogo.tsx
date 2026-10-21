import React from "react";

interface FluxaxNetLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showSubtitle?: boolean;
  variant?: "full" | "icon" | "lockup";
}

export function FluxaxAppIcon({ className = "", size = 44 }: { className?: string; size?: number }) {
  const uniqueId = React.useId().replace(/:/g, "_");
  const iconBaseId = `iconBaseGrad_${uniqueId}`;
  const tealGradId = `tealGrad_${uniqueId}`;
  const nodeGlowId = `nodeGlowGrad_${uniqueId}`;
  const softGlowId = `softGlow_${uniqueId}`;
  const nodeHaloId = `nodeHalo_${uniqueId}`;

  return (
    <svg
      viewBox="230 140 540 540"
      width={size}
      height={size}
      className={`shrink-0 overflow-visible ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={iconBaseId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#34383c" />
          <stop offset="100%" stopColor="#212427" />
        </linearGradient>

        <linearGradient id={tealGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5ec2c0" />
          <stop offset="100%" stopColor="#3ea8a6" />
        </linearGradient>

        <linearGradient id={nodeGlowId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b8ffff" />
          <stop offset="40%" stopColor="#48d5d2" />
          <stop offset="100%" stopColor="#289b99" />
        </linearGradient>

        <filter id={softGlowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="14" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id={nodeHaloId} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Podloga ikone */}
      <rect
        x="230"
        y="140"
        width="540"
        height="540"
        rx="120"
        ry="120"
        fill={`url(#${iconBaseId})`}
        stroke="#444b52"
        strokeWidth="3"
      />

      {/* SIGNALNI KRUGOVI (Ishodište: cx=655, cy=262) */}
      <g stroke="#48a9a6" fill="none">
        <circle cx="655" cy="262" r="55" strokeWidth="2.5" opacity="0.75" />
        <circle cx="655" cy="262" r="105" strokeWidth="3" opacity="0.6" />
        <circle cx="655" cy="262" r="160" strokeWidth="2.5" opacity="0.45" />
        <circle cx="655" cy="262" r="220" strokeWidth="2" opacity="0.3" />
        <circle cx="655" cy="262" r="280" strokeWidth="1.5" strokeDasharray="6,8" opacity="0.25" />

        {/* Podatkovne točke */}
        <circle cx="718" cy="180" r="8" fill="#6ce5e2" stroke="#212427" strokeWidth="2.5" />
        <circle cx="790" cy="340" r="10" fill="#48a9a6" stroke="#212427" strokeWidth="3" />
        <circle cx="830" cy="120" r="13" fill="#48d5d2" stroke="#141923" strokeWidth="3.5" filter={`url(#${softGlowId})`} />
      </g>

      {/* MONOGRAM FX */}
      <g>
        {/* Slovo F */}
        <path
          d="M 320 220 L 508 220 L 508 308 L 396 308 L 396 376 L 488 376 L 488 464 L 396 464 L 396 600 L 320 600 Z"
          fill="#ffffff"
        />

        {/* Krakovi slova X */}
        <polygon points="420,314 492,314 676,600 604,600" fill={`url(#${tealGradId})`} />
        <polygon points="668,348 602,348 388,600 460,600" fill={`url(#${tealGradId})`} />

        {/* Kvadratni čvor (Node) */}
        <rect
          x="617"
          y="224"
          width="76"
          height="76"
          rx="8"
          ry="8"
          fill="#48d5d2"
          opacity="0.6"
          filter={`url(#nodeHaloId})`}
        />
        <rect
          x="622"
          y="229"
          width="66"
          height="66"
          rx="6"
          ry="6"
          fill={`url(#${nodeGlowId})`}
          stroke="#ffffff"
          strokeWidth="3"
        />
      </g>
    </svg>
  );
}

export function FluxaxTypography({ className = "", height = 36 }: { className?: string; height?: number }) {
  return (
    <svg
      viewBox="80 790 840 215"
      height={height}
      className={`w-auto shrink-0 ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* CIJELI RED "FLUXA NET" */}
      <g transform="translate(0, 810)">
        {/* F */}
        <path d="M 95 0 H 165 V 19 H 117 V 39 H 160 V 58 H 117 V 95 H 95 Z" fill="#ffffff" />
        {/* L */}
        <path d="M 190 0 H 212 V 76 H 252 V 95 H 190 Z" fill="#ffffff" />
        {/* U */}
        <path
          d="M 275 22 H 297 V 67 C 297 73 302 77 308 77 C 314 77 319 73 319 67 V 0 H 341 V 67 C 341 84 327 96 308 96 C 289 96 275 84 275 67 Z"
          fill="#ffffff"
        />
        <rect x="275" y="0" width="22" height="22" fill="#48a9a6" />
        {/* X */}
        <polygon points="365,0 391,0 445,95 419,95" fill="#48a9a6" />
        <polygon points="445,0 419,0 365,95 391,95" fill="#48a9a6" />
        {/* A */}
        <path
          d="M 496 0 H 522 L 553 95 H 529 L 522 73 H 496 L 489 95 H 465 Z M 502 24 L 499 55 H 519 Z"
          fill="#ffffff"
        />
        {/* Razdjelnik */}
        <rect x="585" y="15" width="3" height="65" fill="#334155" />
        {/* N */}
        <path d="M 625 95 V 0 H 639 L 684 75 V 0 H 697 V 95 H 683 L 638 20 V 95 Z" fill="#94a3b8" />
        {/* E */}
        <path d="M 735 95 V 0 H 790 V 13 H 748 V 41 H 784 V 54 H 748 V 82 H 790 V 95 Z" fill="#94a3b8" />
        {/* T */}
        <path d="M 825 13 V 0 H 905 V 13 H 871 V 95 H 858 V 13 Z" fill="#94a3b8" />
      </g>

      {/* DONJI RED: ((•)) STUDIOBRIDGE */}
      <g transform="translate(500, 975)">
        <g transform="translate(-240, -10)" stroke="#48a9a6" fill="none" strokeLinecap="round">
          <circle cx="20" cy="0" r="5" fill="#48a9a6" stroke="none" />
          <path d="M 11 -11 A 15 15 0 0 0 11 11" strokeWidth="2.8" />
          <path d="M 29 -11 A 15 15 0 0 1 29 11" strokeWidth="2.8" />
          <path d="M 4 -19 A 25 25 0 0 0 4 19" strokeWidth="2.5" opacity="0.65" />
          <path d="M 36 -19 A 25 25 0 0 1 36 19" strokeWidth="2.5" opacity="0.65" />
        </g>
        <text
          x="-175"
          y="0"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontSize="40"
          fontWeight="400"
          letterSpacing="12"
          fill="#e2e8f0"
          textAnchor="start"
        >
          STUDIOBRIDGE
        </text>
      </g>
    </svg>
  );
}

export default function FluxaxNetLogo({
  className = "",
  size = "md",
  showSubtitle = true,
  variant = "full",
}: FluxaxNetLogoProps) {
  const iconPx = size === "sm" ? 34 : size === "lg" ? 56 : size === "xl" ? 72 : 44;
  const typoPx = size === "sm" ? 28 : size === "lg" ? 44 : size === "xl" ? 56 : 36;

  if (variant === "icon") {
    return <FluxaxAppIcon size={iconPx} className={className} />;
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <FluxaxAppIcon size={iconPx} />
      <FluxaxTypography height={typoPx} />
    </div>
  );
}
