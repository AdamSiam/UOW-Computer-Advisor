import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Laptop, Cpu, CheckCircle2 } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

// Full Official UOW Malaysia Brand Logo Component (Exact replica of official brand asset with larger crisp typography)
const UowFullBrandLogo: React.FC<{ className?: string }> = ({ className = 'w-80 sm:w-96 h-auto' }) => (
  <svg
    viewBox="0 0 360 180"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Shield Crest on Left */}
    <g transform="translate(10, 8) scale(0.72)">
      {/* Outer Shield Body */}
      <path
        d="M80 6 C125 6 150 14 150 20 V110 C150 155 115 186 80 196 C45 186 10 155 10 110 V20 C10 14 35 6 80 6 Z"
        fill="#041235"
      />
      {/* Crisp Double White Shield Border matching official photo */}
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

      {/* Top Blossoms */}
      <g fill="#041235">
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

      {/* Open White Book */}
      <g fill="#ffffff" stroke="#041235" strokeWidth="1.2">
        <path d="M48 92 C58 87 72 88 78 93 V136 C72 131 58 130 48 135 Z" />
        <path d="M112 92 C102 87 88 88 82 93 V136 C88 131 102 130 112 135 Z" />
      </g>
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
    </g>

    {/* Right Typography Block (Enlarged) */}
    <text
      x="138"
      y="54"
      fill="#ffffff"
      fontFamily="Georgia, 'Times New Roman', serif"
      fontSize="52"
      fontWeight="700"
      letterSpacing="1.2"
    >
      UOW
    </text>

    <text
      x="138"
      y="88"
      fill="#ffffff"
      fontFamily="Georgia, 'Times New Roman', serif"
      fontSize="30"
      fontWeight="600"
      letterSpacing="3"
    >
      MALAYSIA
    </text>

    {/* Horizontal Line Divider */}
    <line x1="138" y1="106" x2="188" y2="106" stroke="#ffffff" strokeWidth="1.8" />

    {/* Subtext Lines */}
    <text
      x="138"
      y="128"
      fill="#ffffff"
      fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
      fontSize="9.5"
      fontWeight="700"
      letterSpacing="0.9"
    >
      PART OF THE UNIVERSITY
    </text>
    <text
      x="138"
      y="142"
      fill="#ffffff"
      fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
      fontSize="9.5"
      fontWeight="700"
      letterSpacing="0.9"
    >
      OF WOLLONGONG AUSTRALIA
    </text>
    <text
      x="138"
      y="156"
      fill="#ffffff"
      fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
      fontSize="9.5"
      fontWeight="700"
      letterSpacing="0.9"
    >
      GLOBAL NETWORK
    </text>
  </svg>
);

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing UOW Computing System...');
  const [showWords, setShowWords] = useState(false);

  useEffect(() => {
    // Delay word appearance for natural AI reveal sequence
    const wordTimer = setTimeout(() => {
      setShowWords(true);
    }, 650);

    const steps = [
      { threshold: 25, text: 'Analyzing academic programme profiles...' },
      { threshold: 55, text: 'Indexing verified hardware specs...' },
      { threshold: 85, text: 'Synthesizing Gemini AI recommendations...' },
      { threshold: 100, text: 'System ready!' },
    ];

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onFinish();
          }, 450);
          return 100;
        }

        const next = prev + Math.floor(Math.random() * 8) + 4;
        const boundedNext = Math.min(next, 100);

        const matchingStep = steps.find((s) => boundedNext <= s.threshold);
        if (matchingStep) {
          setStatusText(matchingStep.text);
        }

        return boundedNext;
      });
    }, 110);

    return () => {
      clearTimeout(wordTimer);
      clearInterval(interval);
    };
  }, [onFinish]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.99, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white select-none px-4 overflow-hidden"
    >
      {/* Dynamic Ambient AI Background Radial Aura */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.35, 0.55, 0.35],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-blue-600/20 via-indigo-600/20 to-cyan-500/10 blur-3xl pointer-events-none"
      />

      {/* Subtle Grid Backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:32px_32px] opacity-15 pointer-events-none" />

      <div className="relative z-10 max-w-md w-full flex flex-col items-center text-center space-y-7 px-2">
        {/* STEP 1: Official UOW Brand Logo (Shows FIRST) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex flex-col items-center w-full"
        >
          <div className="relative py-2 px-2 flex items-center justify-center">
            <UowFullBrandLogo className="w-80 sm:w-96 max-w-full h-auto filter drop-shadow-[0_8px_20px_rgba(30,58,138,0.3)]" />
          </div>
        </motion.div>

        {/* STEP 2: Subtitles, Progress Bar & System Status (Appears Later) */}
        {showWords && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6 w-full"
          >
            {/* Title & Institutional Badges */}
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 text-[11px] font-extrabold tracking-widest uppercase shadow-xs backdrop-blur-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>UOW MALAYSIA KDU</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
                <span>School of Computing</span>
              </h1>

              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Hardware Specification & Smart Laptop Recommendation Engine
              </p>
            </div>

            {/* AI Progress Bar with Glowing Tip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="w-full space-y-2.5 pt-1"
            >
              <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800/80 overflow-hidden p-0.5 relative shadow-inner">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 relative transition-all duration-150 ease-out"
                  style={{ width: `${progress}%` }}
                >
                  {/* Glowing leading light on progress bar */}
                  <div className="absolute right-0 top-0 bottom-0 w-3 bg-white/80 rounded-full blur-[1px] shadow-[0_0_8px_#38bdf8]" />
                </motion.div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span className="text-[11px] text-slate-300 font-medium truncate max-w-[240px] flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                  <span>{statusText}</span>
                </span>
                <span className="font-mono font-bold text-cyan-400 text-xs">{progress}%</span>
              </div>
            </motion.div>

            {/* System Verification Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center justify-center space-x-3 text-[10px] text-slate-400 pt-1"
            >
              <span className="flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Specs</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Laptop className="w-3.5 h-3.5 text-blue-400" />
                <span>UOW Syllabus</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Gemini AI Engine</span>
              </span>
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
