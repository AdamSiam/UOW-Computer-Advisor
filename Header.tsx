import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, UserRole, FontSizeLevel } from '../types';
import { UowShieldLogo } from './UowLogo';
import {
  Laptop,
  GraduationCap,
  Sparkles,
  SlidersHorizontal,
  BookmarkCheck,
  Bot,
  MessageSquareHeart,
  LayoutDashboard,
  Building2,
  BookOpen,
  Cpu,
  Layers,
  HardDrive,
  Users,
  Sun,
  Moon,
  UserCheck,
  ShieldCheck,
  LogOut,
  LogIn,
  UserPlus,
  Zap,
  User as UserIcon,
  X,
  History,
  CheckCircle2,
  GitCommit,
  HelpCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Type,
  Check,
  BarChart3,
} from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  onOpenAuth: (tab?: 'login' | 'register', role?: UserRole) => void;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  fontSize?: FontSizeLevel;
  setFontSize?: React.Dispatch<React.SetStateAction<FontSizeLevel>>;
  onStartTour?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenAuth,
  onLogout,
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  fontSize = 'large',
  setFontSize,
  onStartTour,
}) => {
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const versionDropdownRef = useRef<HTMLDivElement>(null);
  const fontMenuRef = useRef<HTMLDivElement>(null);
  const role: UserRole = currentUser ? currentUser.role : 'student';

  const checkScroll = () => {
    if (navRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navRef.current;
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
    }
  };

  useEffect(() => {
    checkScroll();
    const timeoutId = setTimeout(checkScroll, 100);
    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkScroll);
    };
  }, [role, activeTab]);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (navRef.current) {
      navRef.current.scrollBy({
        left: direction === 'left' ? -220 : 220,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (versionDropdownRef.current && !versionDropdownRef.current.contains(event.target as Node)) {
        setShowVersionDropdown(false);
      }
      if (fontMenuRef.current && !fontMenuRef.current.contains(event.target as Node)) {
        setShowFontMenu(false);
      }
    };
    if (showVersionDropdown || showFontMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVersionDropdown, showFontMenu]);

  const releaseHistory = [
    { version: 'v1.1.0', date: 'Aug 2026', type: 'Official Release', changes: ['Branding update to UOW Computer Advisor', 'Header layout & mobile viewport collision prevention optimizations', 'Cloud Run & Render production deployment stability fixes', 'Spotlight auto-scroll alignment in interactive onboarding tour'] },
    { version: 'v1.0.0', date: 'Aug 2026', type: 'Release Milestone', changes: ['Full production deployment with hardened authentication', 'Single default administrator account and self-service student registration', 'Saved Recommendations, Bookmarks, and Hardware Decision Matrix engine'] },
    { version: 'v0.16.0', date: 'Aug 2026', type: 'Feature Addition', changes: ['Dedicated Saved Recommendations & Bookmarked Laptops section', 'Added report summary clipboard copy, report deletion, and bookmarked laptops grid'] },
    { version: 'v0.15.4', date: 'Aug 2026', type: 'Patch & Maintenance', changes: ['Server heartbeat polling stabilization', 'Firebase configuration auto-resolution', 'Header version badge interactive modal'] },
    { version: 'v0.15.0', date: 'Aug 2026', type: 'Major Release', changes: ['Firebase Firestore cloud database provisioning', 'Hybrid server + cloud security rules', 'Persistent user feedback and catalogue storage'] },
    { version: 'v0.14.0', date: 'Aug 2026', type: 'UI & Polish', changes: ['Dark & Light mode contrast adjustments', 'Accessibility improvements across forms and navigation'] },
    { version: 'v0.13.0', date: 'Aug 2026', type: 'Feature Refinement', changes: ['Admin tab restructuring and clean tab navigation', 'Student Feedback Submission portal and admin review'] },
    { version: 'v0.12.0', date: 'Aug 2026', type: 'Feature Addition', changes: ['Real-time active student presence tracker', 'Heartbeat ping API server routing'] },
    { version: 'v0.11.0', date: 'Aug 2026', type: 'Feature Addition', changes: ['Admin Analytics Dashboard with interactive Recharts charts', 'Traffic and usage distribution reports'] },
    { version: 'v0.10.0', date: 'Aug 2026', type: 'Feature Addition', changes: ['Excel Catalogue Bulk Upload & Parser for admin inventory management'] },
    { version: 'v0.9.0', date: 'Aug 2026', type: 'Feature Addition', changes: ['Admin Portal tabs: Programmes, Requirements, Brands, and Devices management'] },
    { version: 'v0.8.0', date: 'Aug 2026', type: 'Full-Stack Integration', changes: ['Express server API (`server.ts`) with endpoints for inventory and faculties'] },
    { version: 'v0.7.0', date: 'Aug 2026', type: 'AI Integration', changes: ['Floating Bot Advisor Chatbot widget powered by Gemini model API'] },
    { version: 'v0.6.0', date: 'Aug 2026', type: 'Feature Addition', changes: ['Side-by-side Laptop Comparison Matrix modal and spec comparison'] },
    { version: 'v0.5.0', date: 'Aug 2026', type: 'Feature Addition', changes: ['Student Portal drawer and Saved Recommendations reports'] },
    { version: 'v0.4.0', date: 'Aug 2026', type: 'Feature Addition', changes: ['Interactive multi-step Recommendation Wizard with dynamic scoring logic'] },
    { version: 'v0.3.0', date: 'Aug 2026', type: 'Framework Migration', changes: ['React + Tailwind CSS architecture and component modularization'] },
    { version: 'v0.2.0', date: 'Aug 2026', type: 'JS Enhancements', changes: ['Dynamic JavaScript DOM filtering and budget sliders'] },
    { version: 'v0.1.0', date: 'Aug 2026', type: 'Initial Build', changes: ['Initial static HTML/CSS prototype with UOW shield logo and header'] },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 transition-all duration-200 shadow-xs">
      <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* Logo & Brand Title with Version Dropdown */}
          <div
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group min-w-0 shrink"
            onClick={() => setActiveTab(role === 'student' ? 'wizard' : 'dashboard')}
          >
            <div className="flex items-center justify-center transition-transform group-hover:scale-105 shrink-0">
              <UowShieldLogo className="w-7 h-9 sm:w-8.5 sm:h-10.5 filter drop-shadow-xs" />
            </div>
            <div className="min-w-0 flex items-center space-x-1.5 sm:space-x-2">
              <div className="min-w-0">
                <span className="font-extrabold text-xs xs:text-sm sm:text-base text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors whitespace-nowrap block">
                  UOW Computer Advisor
                </span>
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 hidden xl:block leading-tight">
                  Laptop Decision Support System
                </p>
              </div>
              
              {/* Subtle Version Badge */}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 shrink-0 hidden sm:inline-block">
                v1.1.0
              </span>
            </div>
          </div>

          {/* Controls: Auth, Tour, Font Size, Theme Toggle */}
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            {/* Quick Interactive Tour Button */}
            {onStartTour && (
              <button
                type="button"
                onClick={onStartTour}
                title="Launch guided interactive platform tour"
                className="flex items-center space-x-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-semibold transition-all cursor-pointer shrink-0"
              >
                <HelpCircle className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span className="hidden md:inline">Tour</span>
              </button>
            )}

            {/* User Account / Auth Section */}
            {currentUser ? (
              <div id="tour-user-account" className="flex items-center space-x-1 sm:space-x-1.5 pl-1 border-l border-slate-200 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  title="Click to view Profile and Change Password"
                  className={`flex items-center space-x-1.5 p-1 sm:pl-2 sm:pr-3 sm:py-1.5 rounded-xl border transition-all cursor-pointer group text-left ${
                    activeTab === 'profile'
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500/80 dark:border-blue-500/80 ring-2 ring-blue-500/30 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border-slate-200/80 dark:border-slate-700/80'
                  }`}
                >
                  <div className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-lg bg-blue-600 group-hover:bg-blue-700 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs transition-colors overflow-hidden shrink-0">
                    {currentUser.photo_url ? (
                      <img
                        src={currentUser.photo_url}
                        alt={currentUser.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (currentUser.nickname || currentUser.name).charAt(0)
                    )}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 leading-none truncate max-w-[130px] transition-colors">
                      {currentUser.nickname ? currentUser.nickname : currentUser.name}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      {currentUser.role === 'administrator' ? (
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">Admin</span>
                      ) : (
                        <span>{currentUser.student_id ? `ID: ${currentUser.student_id}` : 'Student'}</span>
                      )}
                    </p>
                  </div>
                </button>

                <button
                  onClick={onLogout}
                  title="Sign out of your account"
                  className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-red-600 dark:hover:text-red-400 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-red-50 dark:hover:bg-red-950/40 border border-slate-200/80 dark:border-slate-700/80 transition-all cursor-pointer shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div id="tour-user-account" className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
                <button
                  onClick={() => onOpenAuth('login', 'student')}
                  title="Sign in with your student or staff account"
                  className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-1.5 sm:px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline sm:inline">Sign In</span>
                  <span className="xs:hidden">Login</span>
                </button>
                <button
                  onClick={() => onOpenAuth('register', 'student')}
                  title="Create a new student account"
                  className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register</span>
                </button>
              </div>
            )}

            {/* Font Size Accessibility Selector */}
            {setFontSize && (
              <div className="relative shrink-0" ref={fontMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowFontMenu((prev) => !prev)}
                  title="Adjust text size for easier reading"
                  aria-label="Text Size Accessibility Options"
                  className={`flex items-center space-x-0.5 sm:space-x-1 p-1.5 sm:p-2 rounded-xl text-slate-700 dark:text-slate-200 border transition-all cursor-pointer shadow-xs shrink-0 ${
                    showFontMenu
                      ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-400 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border-slate-200/80 dark:border-slate-700/80'
                  }`}
                >
                  <Type className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-[10px] sm:text-xs font-bold px-1 py-0.2 rounded bg-blue-500/15 text-blue-700 dark:text-blue-300">
                    {fontSize === 'normal' ? '100%' : fontSize === 'large' ? '110%' : fontSize === 'xlarge' ? '120%' : '132%'}
                  </span>
                </button>

                {showFontMenu && (
                  <div className="absolute right-0 mt-2 w-64 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center space-x-1.5">
                        <Type className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Text Size & Eye Comfort</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">Accessibility</span>
                    </div>

                    <div className="space-y-1">
                      {[
                        { id: 'normal' as FontSizeLevel, label: 'Standard', scale: '100%', desc: 'Standard compact scale' },
                        { id: 'large' as FontSizeLevel, label: 'Comfortable (Default)', scale: '110%', desc: 'Recommended for eye comfort' },
                        { id: 'xlarge' as FontSizeLevel, label: 'Extra Large', scale: '120%', desc: 'Enhanced legibility for eye strain' },
                        { id: 'huge' as FontSizeLevel, label: 'High Visibility', scale: '132%', desc: 'Maximum size for visual clarity' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setFontSize(item.id);
                            setShowFontMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                            fontSize === item.id
                              ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-transparent'
                          }`}
                        >
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs font-semibold text-slate-900 dark:text-white">{item.label}</span>
                              <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">({item.scale})</span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</p>
                          </div>
                          {fontSize === item.id && (
                            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>Instant visual scaling</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFontSize('large');
                          setShowFontMenu(false);
                        }}
                        className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                      >
                        Reset to Default
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode((prev) => !prev)}
              aria-label="Toggle Theme"
              className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-all border border-slate-200/80 dark:border-slate-700/80 shadow-xs cursor-pointer shrink-0"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="relative group/nav border-t border-slate-200/70 dark:border-slate-800/70">
          {/* Scroll Left Button */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollTabs('left')}
              aria-label="Scroll tabs left"
              className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          <nav
            ref={navRef}
            onScroll={checkScroll}
            onWheel={(e) => {
              if (navRef.current && e.deltaY !== 0 && Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
                navRef.current.scrollLeft += e.deltaY;
              }
            }}
            className="-mx-4 px-4 sm:mx-0 sm:px-0 flex space-x-1.5 overflow-x-auto py-2 scroll-smooth scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 touch-pan-x overscroll-x-contain"
          >
            {role === 'student' ? (
              <>
                <NavButton
                  id="wizard"
                  label="Laptop Wizard"
                  icon={<Sparkles className="w-4 h-4 text-blue-500" />}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
                <NavButton
                  id="catalogue"
                  label="Browse Laptops"
                  icon={<Laptop className="w-4 h-4" />}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
                <NavButton
                  id="compare"
                  label="Compare"
                  icon={<SlidersHorizontal className="w-4 h-4" />}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
                <NavButton
                  id="saved-recommendations"
                  label="Saved Picks"
                  icon={<BookmarkCheck className="w-4 h-4 text-emerald-500" />}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
                <NavButton
                  id="ai-assistant"
                  label="Bot Advisor"
                  icon={<Bot className="w-4 h-4 text-indigo-500" />}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
                <NavButton
                  id="feedback"
                  label="Feedback"
                  icon={<MessageSquareHeart className="w-4 h-4 text-amber-500" />}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
                {currentUser && (
                  <NavButton
                    id="profile"
                    label="My Profile"
                    icon={<UserIcon className="w-4 h-4 text-violet-500" />}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                  />
                )}
              </>
            ) : (
              <>
                <NavButton
                  id="dashboard"
                  label="Dashboard"
                  icon={<LayoutDashboard className="w-4 h-4" />}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
                <NavButton
                  id="brands"
                  label="Brands & Popular Picks"
                  icon={<Layers className="w-4 h-4 text-indigo-500" />}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
                <NavButton
                  id="programmes"
                  label="Programmes"
                  icon={<BookOpen className="w-4 h-4 text-blue-500" />}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
                <NavButton
                  id="faculties"
                  label="Faculties"
                  icon={<Building2 className="w-4 h-4" />}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
                <NavButton
                  id="requirement-profiles"
                  label="Requirement Profiles"
                  icon={<Cpu className="w-4 h-4" />}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
                <NavButton
                  id="devices"
                  label="Devices Catalogue"
                  icon={<HardDrive className="w-4 h-4" />}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
                <NavButton
                  id="students"
                  label="Accounts"
                  icon={<Users className="w-4 h-4" />}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
                {currentUser && (
                  <NavButton
                    id="profile"
                    label="My Profile"
                    icon={<UserIcon className="w-4 h-4 text-violet-500" />}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                  />
                )}
              </>
            )}
          </nav>

          {/* Scroll Right Button */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollTabs('right')}
              aria-label="Scroll tabs right"
              className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

interface NavButtonProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  badge?: string;
}

const navTooltips: Record<string, string> = {
  wizard: 'Interactive step-by-step recommendation wizard mapped to UOW course requirements',
  catalogue: 'Browse, filter, and search verified laptop models in the inventory database',
  compare: 'Compare laptop specs side-by-side (CPU, RAM, GPU, Storage, and Prices)',
  'ai-assistant': 'Ask Bot Advisor for laptop hardware advice or course syllabus compatibility',
  saved: 'View and manage your saved laptop recommendation reports',
  feedback: 'Submit feedback and ratings on web experience and recommendation accuracy',
  dashboard: 'Admin metrics overview, analytics, system health, and quick stats',
  programmes: 'Manage academic programmes and requirement profile mappings',
  faculties: 'Manage academic faculties and department listings',
  'requirement-profiles': 'Manage hardware requirement profiles (CPU, RAM, GPU specs)',
  brands: 'Manage laptop brand partners and manufacturers',
  devices: 'Manage laptop inventory, specs, pricing, and availability',
  students: 'Manage student accounts and portal activity records',
  profile: 'View and edit account profile details, institutional enrolments, and change password',
};

const NavButton: React.FC<NavButtonProps> = ({ id, label, icon, activeTab, setActiveTab, badge }) => {
  const isActive = activeTab === id;
  const tooltipText = navTooltips[id] || `Navigate to ${label}`;

  return (
    <button
      id={`tour-nav-${id}`}
      onClick={() => setActiveTab(id)}
      title={tooltipText}
      className={`relative flex items-center space-x-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-[13px] font-semibold whitespace-nowrap transition-colors duration-150 cursor-pointer shrink-0 ${
        isActive
          ? 'text-white'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="activeNavTabIndicator"
          className="absolute inset-0 bg-blue-600 rounded-xl shadow-xs shadow-blue-500/30"
          transition={{ type: 'spring', stiffness: 500, damping: 38 }}
        />
      )}
      <span className="relative z-10 flex items-center space-x-2">
        {icon}
        <span>{label}</span>
        {badge && (
          <span
            className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isActive
                ? 'bg-blue-500 text-white'
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/80'
            }`}
          >
            {badge}
          </span>
        )}
      </span>
    </button>
  );
};
