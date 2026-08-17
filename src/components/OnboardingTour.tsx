import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Laptop,
  CheckCircle2,
  HelpCircle,
  Bot,
  User,
  SlidersHorizontal,
  BookmarkCheck,
  Scale,
  ShieldCheck,
  MessageSquareHeart,
} from 'lucide-react';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetId?: string; // HTML element id to spotlight / anchor
  role: 'student' | 'administrator' | 'all';
  tabToActivate?: string;
  icon?: React.ReactNode;
}

const STUDENT_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to UOW Computer Advisor! 🎓',
    description:
      'This smart platform helps UOW Malaysia students find the perfect laptop tailored to your degree syllabus, budget, and performance needs without any guesswork.',
    role: 'student',
    tabToActivate: 'wizard',
    icon: <Sparkles className="w-5 h-5 text-blue-400" />,
  },
  {
    id: 'wizard',
    title: '1. Intelligent Recommendation Wizard',
    description:
      'Select your Faculty & Degree Programme, customize your budget or weight preferences, and instantly receive ranked laptop recommendations scored specifically for your coursework.',
    targetId: 'tour-nav-wizard',
    role: 'student',
    tabToActivate: 'wizard',
    icon: <Sparkles className="w-5 h-5 text-blue-500" />,
  },
  {
    id: 'catalogue',
    title: '2. Verified Device Catalogue',
    description:
      'Browse all UOW-approved and verified laptop models in our database. Filter by price, processor, GPU, RAM, and brand to explore all available hardware.',
    targetId: 'tour-nav-catalogue',
    role: 'student',
    tabToActivate: 'catalogue',
    icon: <Laptop className="w-5 h-5 text-indigo-500" />,
  },
  {
    id: 'compare',
    title: '3. Side-by-Side Comparison Matrix',
    description:
      'Compare up to 4 laptops side-by-side with automatic spec difference highlighting, benchmark comparisons, and syllabus suitability ratings.',
    targetId: 'tour-nav-compare',
    role: 'student',
    tabToActivate: 'compare',
    icon: <Scale className="w-5 h-5 text-violet-500" />,
  },
  {
    id: 'saved',
    title: '4. Saved Picks & Bookmarks',
    description:
      'Easily bookmark laptops or save your customized recommendation reports for quick reference anytime, with one-click clipboard copying.',
    targetId: 'tour-nav-saved-recommendations',
    role: 'student',
    tabToActivate: 'saved-recommendations',
    icon: <BookmarkCheck className="w-5 h-5 text-emerald-500" />,
  },
  {
    id: 'ai-assistant',
    title: '5. Bot Advisor (Interactive Q&A)',
    description:
      'Have questions about laptop specs, graphics cards, or syllabus compatibility? Open the Bot Advisor tab or chat with the floating helper at the bottom right corner anytime!',
    targetId: 'tour-nav-ai-assistant',
    role: 'student',
    tabToActivate: 'ai-assistant',
    icon: <Bot className="w-5 h-5 text-cyan-500" />,
  },
  {
    id: 'feedback',
    title: '6. Student Feedback & Ratings',
    description:
      'Help improve recommendations by rating your experience and sharing feedback directly with UOW faculty administrators.',
    targetId: 'tour-nav-feedback',
    role: 'student',
    tabToActivate: 'feedback',
    icon: <MessageSquareHeart className="w-5 h-5 text-amber-500" />,
  },
  {
    id: 'profile-role',
    title: '7. User Account & Preferences',
    description:
      'Access your profile to customize your display nickname, manage passwords, or review your session activity.',
    targetId: 'tour-user-account',
    role: 'student',
    icon: <User className="w-5 h-5 text-violet-500" />,
  },
];

const ADMIN_TOUR_STEPS: TourStep[] = [
  {
    id: 'admin-welcome',
    title: 'Administrator Management Portal 🛡️',
    description:
      'Welcome to the UOW Advisor Admin Suite. Here you can configure academic hardware profiles, update syllabus requirements, manage laptop inventory, and audit feedback.',
    role: 'administrator',
    tabToActivate: 'dashboard',
    icon: <ShieldCheck className="w-5 h-5 text-blue-400" />,
  },
  {
    id: 'admin-dashboard',
    title: '1. Overview Dashboard & Analytics',
    description:
      'Monitor real-time system metrics, student recommendation distribution charts, faculty engagement, and active student presence.',
    targetId: 'tour-nav-dashboard',
    role: 'administrator',
    tabToActivate: 'dashboard',
    icon: <SlidersHorizontal className="w-5 h-5 text-blue-500" />,
  },
  {
    id: 'admin-curriculum',
    title: '2. Academic Programmes & Requirement Profiles',
    description:
      'Create and update degree programs (CS, SE, Game Dev) and link them to minimum hardware specifications (CPU, RAM, GPU, OS rules).',
    targetId: 'tour-nav-programmes',
    role: 'administrator',
    tabToActivate: 'programmes',
    icon: <Laptop className="w-5 h-5 text-indigo-500" />,
  },
  {
    id: 'admin-inventory',
    title: '3. Devices Catalogue & Excel Bulk Upload',
    description:
      'Manage laptop inventory with complete specifications, prices, and images. Easily upload or export the entire inventory via Excel sheets.',
    targetId: 'tour-nav-devices',
    role: 'administrator',
    tabToActivate: 'devices',
    icon: <Laptop className="w-5 h-5 text-emerald-500" />,
  },
  {
    id: 'admin-users',
    title: '4. Students & Account Records',
    description:
      'Review registered student and administrator accounts, track institutional enrollments, and analyze user feedback submissions.',
    targetId: 'tour-nav-students',
    role: 'administrator',
    tabToActivate: 'students',
    icon: <User className="w-5 h-5 text-violet-500" />,
  },
];

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: 'student' | 'administrator';
  onNavigateTab: (tab: string) => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onClose,
  currentRole,
  onNavigateTab,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Reset to first step whenever tour opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  const steps = currentRole === 'administrator' ? ADMIN_TOUR_STEPS : STUDENT_TOUR_STEPS;
  const currentStep = steps[currentStepIndex] || steps[0];

  // Auto-switch tabs if the step requires a specific view
  useEffect(() => {
    if (!isOpen) return;
    if (currentStep.tabToActivate) {
      onNavigateTab(currentStep.tabToActivate);
    }
  }, [isOpen, currentStepIndex, currentStep, onNavigateTab]);

  // Scroll to focused element smoothly (centered horizontally and vertically)
  const scrollToTarget = () => {
    if (!currentStep.targetId) return;
    const el = document.getElementById(currentStep.targetId);
    if (el) {
      // Find closest scrollable horizontal parent if in nav bar
      const scrollParent = el.closest('nav') || el.parentElement;
      if (scrollParent && scrollParent.scrollWidth > scrollParent.clientWidth) {
        const parentRect = scrollParent.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const offset = elRect.left - parentRect.left - (parentRect.width / 2) + (elRect.width / 2);
        scrollParent.scrollBy({
          left: offset,
          behavior: 'smooth',
        });
      }
      
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  };

  // Scroll to target element on step change with multiple safety passes
  useEffect(() => {
    if (!isOpen || !currentStep.targetId) return;

    // Initial scroll
    scrollToTarget();

    // Secondary scroll pass after tab activation animation and layout settle
    const t1 = setTimeout(scrollToTarget, 80);
    const t2 = setTimeout(scrollToTarget, 220);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isOpen, currentStepIndex, currentStep.targetId]);

  // Continuous and event-driven tracking of bounding rectangle
  useEffect(() => {
    if (!isOpen) {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      if (currentStep.targetId) {
        const el = document.getElementById(currentStep.targetId);
        if (el) {
          const rect = el.getBoundingClientRect();
          setTargetRect(rect);
          return;
        }
      }
      setTargetRect(null);
    };

    updateRect();

    // Run animation frame tracking for 800ms during transition & smooth scroll
    let start = performance.now();
    let frameId: number;

    const trackLoop = (now: number) => {
      updateRect();
      if (now - start < 800) {
        frameId = requestAnimationFrame(trackLoop);
      }
    };
    frameId = requestAnimationFrame(trackLoop);

    // Global scroll listeners in capture phase for window, nav bar, and subcontainers
    window.addEventListener('scroll', updateRect, { capture: true, passive: true });
    window.addEventListener('resize', updateRect, { passive: true });
    window.addEventListener('touchmove', updateRect, { capture: true, passive: true });

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', updateRect, { capture: true });
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('touchmove', updateRect, { capture: true });
    };
  }, [isOpen, currentStepIndex, currentStep.targetId]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('uow_has_seen_onboarding_tour', 'true');
    onClose();
  };

  const isLastStep = currentStepIndex === steps.length - 1;

  // Calculate modal positioning - clean, non-obstructive placement
  const getModalPosition = () => {
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const isMobile = viewportWidth < 640;

    if (!targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    if (isMobile) {
      // If target is in top half (e.g. Header nav tabs), place dialog near bottom
      if (targetRect.top < viewportHeight * 0.5) {
        return {
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
        };
      }
      // If target is near bottom (e.g. Floating bot), place dialog near top
      return {
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
      };
    }

    // Desktop positioning
    if (targetRect.top < viewportHeight * 0.45) {
      // Below target
      const topPos = Math.min(viewportHeight - 360, targetRect.bottom + 16);
      const leftPos = Math.max(20, Math.min(viewportWidth - 500, targetRect.left + targetRect.width / 2 - 240));
      return {
        top: `${topPos}px`,
        left: `${leftPos}px`,
      };
    } else {
      // Above target
      const topPos = Math.max(20, targetRect.top - 330);
      const leftPos = Math.max(20, Math.min(viewportWidth - 500, targetRect.left + targetRect.width / 2 - 240));
      return {
        top: `${topPos}px`,
        left: `${leftPos}px`,
      };
    }
  };

  const modalPos = getModalPosition();

  // Check if target is currently visible in viewport
  const isTargetVisible = targetRect && 
    targetRect.top < (typeof window !== 'undefined' ? window.innerHeight : 800) &&
    targetRect.bottom > 0 &&
    targetRect.left < (typeof window !== 'undefined' ? window.innerWidth : 1200) &&
    targetRect.right > 0;

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto overflow-hidden">
      {/* Background Dimmer with SVG Mask Cutout */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-auto z-40"
        onClick={handleComplete}
      >
        <defs>
          <mask id="onboarding-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {isTargetVisible && targetRect && (
              <rect
                x={targetRect.left - 6}
                y={targetRect.top - 6}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx={14}
                ry={14}
                fill="black"
              />
            )}
          </mask>
        </defs>

        <rect
          width="100%"
          height="100%"
          fill="rgba(11, 17, 33, 0.82)"
          mask="url(#onboarding-spotlight-mask)"
        />
      </svg>

      {/* Glowing Neon Focus Border around Cutout */}
      {isTargetVisible && targetRect && (
        <div
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
          className="fixed pointer-events-none rounded-2xl z-40 ring-2 ring-blue-400/90 shadow-[0_0_25px_rgba(59,130,246,0.6)] transition-all duration-150"
        >
          <div className="absolute inset-0 rounded-2xl ring-4 ring-blue-500/20 animate-pulse" />
        </div>
      )}

      {/* Guide Dialog Modal */}
      <div
        style={modalPos}
        className="fixed z-50 w-[calc(100vw-24px)] max-w-lg sm:w-[480px] bg-slate-900/95 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl border border-slate-700/90 overflow-hidden backdrop-blur-xl transition-[top,left,bottom,right] duration-200 ease-out max-h-[78vh] flex flex-col justify-between pb-safe"
      >
        {/* Top Decorative Glow */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-44 h-44 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Content with animated cross-fade per step */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="overflow-y-auto pr-1"
          >
            {/* Header & Close Button */}
            <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2.5 sm:mb-3.5 relative z-10">
              <div className="flex items-center space-x-2.5 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-inner">
                  {currentStep.icon || <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />}
                </div>
                <div>
                  <div className="flex items-center space-x-2 flex-wrap">
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {currentRole === 'administrator' ? 'Admin Guide' : 'Student Guide'}
                    </span>
                    {currentStep.targetId && (
                      <button
                        type="button"
                        onClick={scrollToTarget}
                        title="Re-center the highlighted element"
                        className="text-[10px] font-bold text-blue-400 hover:text-blue-300 underline cursor-pointer"
                      >
                        Center Tab
                      </button>
                    )}
                  </div>
                  <h3 className="text-sm sm:text-xl font-extrabold text-white mt-0.5 sm:mt-1 leading-snug">
                    {currentStep.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={handleComplete}
                title="Skip Tour"
                className="p-1 rounded-lg sm:rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Description Content */}
            <div className="relative z-10 mb-3 sm:mb-5 text-xs sm:text-sm text-slate-300 leading-relaxed pl-0.5">
              {currentStep.description}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress Indicators & Action Buttons */}
        <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-800 relative z-10 shrink-0">
          {/* Step Counter & Dots */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 whitespace-nowrap">
              {currentStepIndex + 1}/{steps.length}
            </span>
            <div className="flex items-center space-x-1 pl-0.5">
              {steps.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentStepIndex(idx)}
                  title={`Go to step ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === currentStepIndex
                      ? 'w-4 sm:w-5 bg-blue-500'
                      : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {currentStepIndex > 0 && (
              <button
                onClick={handlePrev}
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Previous</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-md sm:shadow-lg shadow-blue-500/25 transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <span>{isLastStep ? 'Done' : 'Next'}</span>
              {isLastStep ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
