import React from 'react';

// Custom UOW Shield Logo Component (Exact replica matching official UOW brand shield crest)
export const UowShieldLogo: React.FC<{ className?: string }> = ({ className = 'w-9 h-11' }) => (
  <svg
    viewBox="0 0 160 200"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Outer Shield Background */}
    <path
      d="M80 6 C125 6 150 14 150 20 V110 C150 155 115 186 80 196 C45 186 10 155 10 110 V20 C10 14 35 6 80 6 Z"
      fill="#041235"
    />

    {/* Outer Double White Borders */}
    <path
      d="M80 8 C122 8 146 16 146 21 V108 C146 151 112 181 80 191 C48 181 14 151 14 108 V21 C14 16 38 8 80 8 Z"
      stroke="#ffffff"
      strokeWidth="2.5"
      fill="none"
    />
    <path
      d="M80 13 C118 13 141 20 141 24 V106 C141 147 109 175 80 185 C51 175 19 147 19 106 V24 C19 20 42 13 80 13 Z"
      stroke="#ffffff"
      strokeWidth="1.5"
      fill="none"
    />

    {/* Top White Field with Wavy Bottom */}
    <path
      d="M20 24 C20 24 50 16 80 16 C110 16 140 24 140 24 V66 C120 62 100 70 80 64 C60 58 40 68 20 62 Z"
      fill="#ffffff"
    />

    {/* Top Flowers (Navy Blue Flowers on White Field) */}
    <g fill="#041235">
      {/* Center Flower */}
      <g transform="translate(80, 40)">
        <circle cx="0" cy="-9" r="4.5" />
        <circle cx="8.5" cy="-3" r="4.5" />
        <circle cx="5.5" cy="7" r="4.5" />
        <circle cx="-5.5" cy="7" r="4.5" />
        <circle cx="-8.5" cy="-3" r="4.5" />
        <circle cx="0" cy="0" r="4" />
        <circle cx="0" cy="0" r="2" fill="#ffffff" />
        <circle cx="0" cy="0" r="1" fill="#041235" />
        <path d="M-6 9 C-2 12 0 14 0 16 C0 14 2 12 6 9" stroke="#041235" strokeWidth="1.5" fill="none" />
      </g>

      {/* Left Flower */}
      <g transform="translate(48, 44) rotate(-12)">
        <circle cx="0" cy="-8" r="4" />
        <circle cx="7.5" cy="-2.5" r="4" />
        <circle cx="5" cy="6" r="4" />
        <circle cx="-5" cy="6" r="4" />
        <circle cx="-7.5" cy="-2.5" r="4" />
        <circle cx="0" cy="0" r="3.5" />
        <circle cx="0" cy="0" r="1.8" fill="#ffffff" />
        <circle cx="0" cy="0" r="0.9" fill="#041235" />
      </g>

      {/* Right Flower */}
      <g transform="translate(112, 44) rotate(12)">
        <circle cx="0" cy="-8" r="4" />
        <circle cx="7.5" cy="-2.5" r="4" />
        <circle cx="5" cy="6" r="4" />
        <circle cx="-5" cy="6" r="4" />
        <circle cx="-7.5" cy="-2.5" r="4" />
        <circle cx="0" cy="0" r="3.5" />
        <circle cx="0" cy="0" r="1.8" fill="#ffffff" />
        <circle cx="0" cy="0" r="0.9" fill="#041235" />
      </g>
    </g>

    {/* Bottom Section: Open White Book */}
    <g fill="#ffffff" stroke="#041235" strokeWidth="1.2">
      <path d="M48 92 C58 87 72 88 78 93 V136 C72 131 58 130 48 135 Z" />
      <path d="M112 92 C102 87 88 88 82 93 V136 C88 131 102 130 112 135 Z" />
    </g>

    {/* Book Lines */}
    <g stroke="#041235" strokeWidth="1" opacity="0.85">
      <line x1="53" y1="100" x2="73" y2="98" />
      <line x1="53" y1="106" x2="73" y2="104" />
      <line x1="53" y1="112" x2="73" y2="110" />
      <line x1="53" y1="118" x2="73" y2="116" />

      <line x1="87" y1="98" x2="107" y2="100" />
      <line x1="87" y1="104" x2="107" y2="106" />
      <line x1="87" y1="110" x2="107" y2="112" />
      <line x1="87" y1="116" x2="107" y2="118" />
    </g>

    {/* Left Column Trefoils */}
    <g fill="#ffffff" transform="translate(35, 96)">
      <g transform="translate(0, 0)"><circle cx="-1.5" cy="-1.5" r="2" /><circle cx="1.5" cy="-1.5" r="2" /><circle cx="0" cy="1.5" r="2" /></g>
      <g transform="translate(0, 14)"><circle cx="-1.5" cy="-1.5" r="2" /><circle cx="1.5" cy="-1.5" r="2" /><circle cx="0" cy="1.5" r="2" /></g>
      <g transform="translate(0, 28)"><circle cx="-1.5" cy="-1.5" r="2" /><circle cx="1.5" cy="-1.5" r="2" /><circle cx="0" cy="1.5" r="2" /></g>
    </g>

    {/* Right Column Bookmark Tabs */}
    <g fill="#ffffff" transform="translate(125, 96)">
      <path d="M-2 -3 H3 V3 H-2 L0 0 Z" />
      <path d="M-2 11 H3 V17 H-2 L0 14 Z" />
      <path d="M-2 25 H3 V31 H-2 L0 28 Z" />
    </g>
  </svg>
);
