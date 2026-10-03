import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  showTagline?: boolean;
  inverted?: boolean;
}

export default function Logo({
  className = 'h-10',
  showText = true,
  showTagline = true,
  inverted = false,
}: LogoProps) {
  return (
    <div className="flex items-center gap-3 select-none">
      {/* Dynamic SVG Logo based on the user's uploaded reference */}
      <svg
        className={`${className} shrink-0`}
        viewBox="0 0 100 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Sky / River glow */}
        <path
          d="M30 45 C40 38, 60 38, 70 45"
          stroke={inverted ? '#FF8A50' : '#FF6A2A'}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.3"
        />

        {/* Three people icons */}
        {/* Left person (Orange) */}
        <circle cx="38" cy="23" r="4.5" fill="#F4511E" />
        <path d="M30 35 C30 29, 44 29, 44 35" fill="#F4511E" />

        {/* Center person (Navy/White inverted) */}
        <circle cx="50" cy="18" r="6" fill={inverted ? '#FFFFFF' : '#0F1B2D'} />
        <path d="M41 33 C41 25, 59 25, 59 33" fill={inverted ? '#FFFFFF' : '#0F1B2D'} />

        {/* Right person (Green) */}
        <circle cx="62" cy="23" r="4.5" fill="#16A34A" />
        <path d="M56 35 C56 29, 70 29, 70 35" fill="#16A34A" />

        {/* The arched bridge structure spanning over */}
        <path
          d="M18 48 C35 34, 65 34, 82 48"
          stroke={inverted ? '#FFFFFF' : '#0F1B2D'}
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Bridge pillars */}
        <line x1="33" y1="42" x2="33" y2="49" stroke={inverted ? '#FFFFFF' : '#0F1B2D'} strokeWidth="2.5" />
        <line x1="42" y1="39" x2="42" y2="49" stroke={inverted ? '#FFFFFF' : '#0F1B2D'} strokeWidth="2.5" />
        <line x1="58" y1="39" x2="58" y2="49" stroke={inverted ? '#FFFFFF' : '#0F1B2D'} strokeWidth="2.5" />
        <line x1="67" y1="42" x2="67" y2="49" stroke={inverted ? '#FFFFFF' : '#0F1B2D'} strokeWidth="2.5" />

        {/* The River (S-curve) */}
        <path
          d="M48 42 C44 48, 56 52, 42 62 C34 68, 52 70, 56 74"
          stroke="#2563EB"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-baseline">
            <span
              className={`text-xl font-extrabold tracking-tight font-sans ${
                inverted ? 'text-white' : 'text-[#0F1B2D]'
              }`}
            >
              Samadhan
            </span>
            <span
              className={`text-xl font-extrabold tracking-tight font-sans ml-1 ${
                inverted ? 'text-[#FF8A50]' : 'text-[#2563EB]'
              }`}
            >
              Setu
            </span>
          </div>
          {showTagline && (
            <span
              className={`text-[10px] tracking-wide font-medium font-sans uppercase ${
                inverted ? 'text-gray-300' : 'text-[#64748B]'
              }`}
            >
              A Stronger Community Together
            </span>
          )}
        </div>
      )}
    </div>
  );
}
