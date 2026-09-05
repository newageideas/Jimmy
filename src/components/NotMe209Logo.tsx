import React from 'react';

interface NotMe209LogoProps {
  className?: string;
  size?: number | string;
  showGlow?: boolean;
  animate?: boolean;
}

export const NotMe209Logo: React.FC<NotMe209LogoProps> = ({
  className = '',
  size = '100%',
  showGlow = true,
  animate = false,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Ambient Bokeh & Glow behind the emblem */}
      {showGlow && (
        <>
          <div
            className={`absolute -inset-8 rounded-full bg-purple-600/30 blur-2xl pointer-events-none ${
              animate ? 'animate-pulse' : ''
            }`}
          />
          <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full bg-fuchsia-500/20 blur-xl pointer-events-none" />
          <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-indigo-500/25 blur-xl pointer-events-none" />
          <div className="absolute top-1/2 -right-6 w-12 h-12 rounded-full bg-cyan-400/20 blur-lg pointer-events-none" />
        </>
      )}

      {/* SVG Vector Graphic of the exact notme 209 leaf emblem */}
      <svg
        viewBox="0 0 500 500"
        className="w-full h-full relative z-10 drop-shadow-[0_12px_28px_rgba(0,0,0,0.85)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Radial gradient for the leaf body */}
          <linearGradient id="purpleLeafGrad" x1="250" y1="20" x2="250" y2="480" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="35%" stopColor="#9333ea" />
            <stop offset="70%" stopColor="#581c87" />
            <stop offset="100%" stopColor="#2e1065" />
          </linearGradient>

          <linearGradient id="leafEdgeGlow" x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#e9d5ff" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#4c1d95" />
          </linearGradient>

          <linearGradient id="silverRingGrad" x1="160" y1="160" x2="340" y2="340" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#d1d5db" />
            <stop offset="50%" stopColor="#9ca3af" />
            <stop offset="75%" stopColor="#6b7280" />
            <stop offset="100%" stopColor="#f3f4f6" />
          </linearGradient>

          <linearGradient id="badgeInnerDark" x1="250" y1="160" x2="250" y2="340" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1e112a" />
            <stop offset="50%" stopColor="#12071d" />
            <stop offset="100%" stopColor="#0a0312" />
          </linearGradient>

          <radialGradient id="badgeCenterGlow" cx="250" cy="250" r="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7e22ce" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. OUTER PURPLE CANNABIS LEAF SILHOUETTE (7 Serrated Leaflets) */}
        <g id="leaf-silhouette">
          {/* Main Leaf Body with serrations */}
          <path
            d="
              M 250 420 
              C 245 440 240 455 250 460
              C 260 455 255 440 250 420
              Z
            "
            fill="#3b0764"
            stroke="#9333ea"
            strokeWidth="4"
          />

          {/* STEM at the bottom */}
          <path
            d="M 246 380 C 244 420 240 450 252 465 C 256 450 254 420 254 380 Z"
            fill="#581c87"
            stroke="#a855f7"
            strokeWidth="2"
          />

          {/* Lower Left Leaflet (7th) */}
          <path
            d="
              M 200 320
              L 165 335 L 175 325 L 140 335 L 155 320
              L 125 325 L 145 305 L 120 305 L 145 285
              C 155 275 190 285 215 305
              Z
            "
            fill="url(#purpleLeafGrad)"
            stroke="#c084fc"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Lower Right Leaflet (6th) */}
          <path
            d="
              M 300 320
              L 335 335 L 325 325 L 360 335 L 345 320
              L 375 325 L 355 305 L 380 305 L 355 285
              C 345 275 310 285 285 305
              Z
            "
            fill="url(#purpleLeafGrad)"
            stroke="#c084fc"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Middle Left Leaflet (5th) */}
          <path
            d="
              M 210 290
              L 160 285 L 175 270 L 125 270 L 145 250
              L 90 245 L 120 225 L 75 210 L 115 195
              L 85 180 L 130 175 L 110 160 L 155 160
              C 180 185 205 230 220 270
              Z
            "
            fill="url(#purpleLeafGrad)"
            stroke="#c084fc"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Middle Right Leaflet (4th) */}
          <path
            d="
              M 290 290
              L 340 285 L 325 270 L 375 270 L 355 250
              L 410 245 L 380 225 L 425 210 L 385 195
              L 415 180 L 370 175 L 390 160 L 345 160
              C 320 185 295 230 280 270
              Z
            "
            fill="url(#purpleLeafGrad)"
            stroke="#c084fc"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Upper Left Leaflet (3rd) */}
          <path
            d="
              M 225 250
              L 200 200 L 210 185 L 170 150 L 190 140
              L 155 105 L 180 95 L 145 60 L 185 65
              L 175 45 L 205 55 L 205 35 L 230 60
              C 240 100 240 170 235 230
              Z
            "
            fill="url(#purpleLeafGrad)"
            stroke="#c084fc"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Upper Right Leaflet (2nd) */}
          <path
            d="
              M 275 250
              L 300 200 L 290 185 L 330 150 L 310 140
              L 345 105 L 320 95 L 355 60 L 315 65
              L 325 45 L 295 55 L 295 35 L 270 60
              C 260 100 260 170 265 230
              Z
            "
            fill="url(#purpleLeafGrad)"
            stroke="#c084fc"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Central Top Main Leaflet (1st) */}
          <path
            d="
              M 235 240
              L 230 180 L 220 165 L 232 140 L 222 125
              L 236 95 L 225 80 L 240 50 L 232 40
              L 250 20
              L 268 40 L 260 50 L 275 80 L 264 95
              L 278 125 L 268 140 L 280 165 L 270 180
              L 265 240
              Z
            "
            fill="url(#purpleLeafGrad)"
            stroke="#e9d5ff"
            strokeWidth="4"
            strokeLinejoin="round"
          />

          {/* Central Ribs & Leaf Veins Detail */}
          <path d="M 250 25 L 250 220" stroke="#f3e8ff" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
          <path d="M 250 50 L 235 43 M 250 50 L 265 43" stroke="#e9d5ff" strokeWidth="1.8" />
          <path d="M 250 85 L 230 75 M 250 85 L 270 75" stroke="#e9d5ff" strokeWidth="1.8" />
          <path d="M 250 120 L 225 105 M 250 120 L 275 105" stroke="#e9d5ff" strokeWidth="1.8" />
          <path d="M 250 155 L 223 138 M 250 155 L 277 138" stroke="#e9d5ff" strokeWidth="1.8" />

          {/* Left Upper Rib */}
          <path d="M 240 230 L 175 48" stroke="#e9d5ff" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
          {/* Right Upper Rib */}
          <path d="M 260 230 L 325 48" stroke="#e9d5ff" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />

          {/* Left Mid Rib */}
          <path d="M 230 250 L 95 190" stroke="#e9d5ff" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
          {/* Right Mid Rib */}
          <path d="M 270 250 L 405 190" stroke="#e9d5ff" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
        </g>

        {/* 2. CENTRAL EMBLEM BADGE (Circular Shield) */}
        <g id="center-badge">
          {/* Outer Dark Drop Shadow */}
          <circle cx="250" cy="260" r="92" fill="#000000" opacity="0.6" />

          {/* Outer Silver Beveled Ring */}
          <circle
            cx="250"
            cy="255"
            r="88"
            fill="url(#silverRingGrad)"
            stroke="#3b0764"
            strokeWidth="3"
          />

          {/* Inner Dark Rim */}
          <circle cx="250" cy="255" r="82" fill="#2e1065" />

          {/* Inner Disc with Deep Violet Midnight Gradient */}
          <circle
            cx="250"
            cy="255"
            r="78"
            fill="url(#badgeInnerDark)"
            stroke="#a855f7"
            strokeWidth="2"
          />

          {/* Subtle Inner Glow */}
          <circle cx="250" cy="255" r="78" fill="url(#badgeCenterGlow)" />

          {/* Mini Purple Leaf Accent above 'notme' */}
          <g transform="translate(250, 204) scale(0.24)">
            <path
              d="M 0 -35 C 10 -15 15 5 0 25 C -15 5 -10 -15 0 -35 Z"
              fill="#c084fc"
            />
            <path
              d="M 0 5 C 15 -5 28 0 35 15 C 20 18 5 15 0 5 Z"
              fill="#a855f7"
            />
            <path
              d="M 0 5 C -15 -5 -28 0 -35 15 C -20 18 -5 15 0 5 Z"
              fill="#a855f7"
            />
          </g>

          {/* Text: "notme" (Clean, bold sans-serif) */}
          <text
            x="250"
            y="244"
            textAnchor="middle"
            fill="#ffffff"
            fontFamily="'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif"
            fontWeight="800"
            fontSize="34"
            letterSpacing="-0.5px"
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))"
          >
            notme
          </text>

          {/* Text: "209" (Large extra-bold numbers) */}
          <text
            x="250"
            y="302"
            textAnchor="middle"
            fill="#ffffff"
            fontFamily="'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif"
            fontWeight="900"
            fontSize="54"
            letterSpacing="1px"
            stroke="#e9d5ff"
            strokeWidth="1"
            filter="drop-shadow(0 4px 8px rgba(0,0,0,0.9))"
          >
            209
          </text>
        </g>
      </svg>
    </div>
  );
};
