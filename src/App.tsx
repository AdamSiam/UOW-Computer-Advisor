import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { AuthModal } from './components/Auth/AuthModal';
import { AdminDashboard } from './components/AdminPortal/AdminDashboard';
import { ProgrammeManagement } from './components/AdminPortal/ProgrammeManagement';
import { FacultyManagement } from './components/AdminPortal/FacultyManagement';
import { RequirementProfileManagement } from './components/AdminPortal/RequirementProfileManagement';
import { BrandManagement } from './components/AdminPortal/BrandManagement';
import { DeviceManagement } from './components/AdminPortal/DeviceManagement';
import { StudentManagement } from './components/AdminPortal/StudentManagement';
import { BrandPopularityReport } from './components/AdminPortal/BrandPopularityReport';

import { RecommendationWizard } from './components/StudentPortal/RecommendationWizard';
import { SavedRecommendations } from './components/StudentPortal/SavedRecommendations';
import { DeviceCatalogue } from './components/StudentPortal/DeviceCatalogue';
import { DeviceComparison } from './components/StudentPortal/DeviceComparison';
import { AIAssistant } from './components/StudentPortal/AIAssistant';
import { StudentFeedback } from './components/StudentPortal/StudentFeedback';
import { UserProfile } from './components/Profile/UserProfile';
import { FloatingChatBot } from './components/FloatingChatBot';
import { SplashScreen } from './components/SplashScreen';
import { OnboardingTour } from './components/OnboardingTour';

import { User, UserRole, FontSizeLevel } from './types';
import { ShieldCheck, LogIn, GraduationCap, AlertTriangle, ArrowRight } from 'lucide-react';

export function App() {
  // Current User Session State (persisted in localStorage)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('uow_advisor_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved user:', e);
      }
    }
    return null;
  });

  const activeRole: UserRole = currentUser ? currentUser.role : 'student';

  const [activeTab, setActiveTab] = useState<string>(
    currentUser && currentUser.role === 'administrator' ? 'dashboard' : 'wizard'
  );

  // Initial Loading Splash Screen State
  const [isLoading, setIsLoading] = useState(true);

  // Interactive Onboarding Highlight Tour State (shows automatically for first time users)
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);

  // Auth Modal State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register'>('login');
  const [authInitialRole, setAuthInitialRole] = useState<UserRole>('student');

  // Font Size Accessibility State (Comfortable 'large' is default for better visibility for eye issues)
  const [fontSize, setFontSize] = useState<FontSizeLevel>(() => {
    const saved = localStorage.getItem('uow_advisor_fontsize') as FontSizeLevel | null;
    if (saved && ['normal', 'large', 'xlarge', 'huge'].includes(saved)) {
      return saved;
    }
    return 'large';
  });

  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('uow_advisor_theme');
    if (savedTheme !== null) {
      return savedTheme === 'dark';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-font-size', fontSize);
    localStorage.setItem('uow_advisor_fontsize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    // Generate or retrieve persistent tab session ID
    let clientId = sessionStorage.getItem('uow_client_session_id');
    if (!clientId) {
      clientId = 'session-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
      sessionStorage.setItem('uow_client_session_id', clientId);
    }

    const sendHeartbeat = () => {
      const activeUserRole: UserRole = currentUser?.role === 'administrator' ? 'administrator' : 'student';
      fetch('/api/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': clientId || 'session-unknown',
          'x-user-role': activeUserRole,
        },
        body: JSON.stringify({ role: activeUserRole }),
      }).catch(() => {});
    };

    // Initial ping & recurring heartbeat every 10 seconds
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('uow_advisor_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('uow_advisor_theme', 'light');
    }
  }, [darkMode]);

  // Auto-launch tour for first time users on initial mount
  useEffect(() => {
    // Reset stored tour flag so user can test the effect directly
    localStorage.removeItem('uow_has_seen_onboarding_tour');
    if (!isLoading && !isAuthOpen) {
      const timer = setTimeout(() => setIsTourOpen(true), 350);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthOpen]);

  const handleLoginSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    localStorage.setItem('uow_advisor_user', JSON.stringify(user));
    localStorage.setItem('uow_advisor_token', token);

    if (user.role === 'administrator') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('wizard');
    }

    // If first time user logging in/registering, trigger the highlight showcase
    const hasSeenTour = localStorage.getItem('uow_has_seen_onboarding_tour');
    if (!hasSeenTour) {
      setTimeout(() => setIsTourOpen(true), 400);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('uow_advisor_user');
    localStorage.removeItem('uow_advisor_token');
    setActiveTab('wizard');
    setAuthInitialTab('login');
    setAuthInitialRole('student');
    setIsAuthOpen(true);
  };

  const handleOpenAuth = (tab: 'login' | 'register' = 'login', targetRole: UserRole = 'student') => {
    setAuthInitialTab(tab);
    setAuthInitialRole(targetRole);
    setIsAuthOpen(true);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && (
          <SplashScreen
            key="splash"
            onFinish={() => {
              setIsLoading(false);
              const hasSeenTour = localStorage.getItem('uow_has_seen_onboarding_tour');
              if (!currentUser) {
                setIsAuthOpen(true);
              } else if (!hasSeenTour) {
                setTimeout(() => setIsTourOpen(true), 350);
              }
            }}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 selection:bg-blue-500 selection:text-white">
      {/* Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        fontSize={fontSize}
        setFontSize={setFontSize}
        onStartTour={() => setIsTourOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeRole}-${activeTab}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
          >
            {/* ADMIN PORTAL SECURITY CHECK */}
            {activeRole === 'administrator' && (
              <>
                {currentUser && currentUser.role === 'administrator' ? (
                  <>
                    {activeTab === 'dashboard' && <AdminDashboard onNavigateTab={setActiveTab} />}
                    {activeTab === 'brand-reports' && <BrandPopularityReport />}
                    {activeTab === 'programmes' && <ProgrammeManagement />}
                    {activeTab === 'faculties' && <FacultyManagement />}
                    {activeTab === 'requirements' && <RequirementProfileManagement />}
                    {activeTab === 'requirement-profiles' && <RequirementProfileManagement />}
                    {activeTab === 'brands' && <BrandManagement />}
                    {activeTab === 'devices' && <DeviceManagement />}
                    {activeTab === 'students' && <StudentManagement />}
                    {activeTab === 'profile' && (
                      <UserProfile
                        currentUser={currentUser}
                        onUpdateUser={(updated) => {
                          setCurrentUser(updated);
                          localStorage.setItem('uow_advisor_user', JSON.stringify(updated));
                        }}
                        onLogout={handleLogout}
                        onNavigateTab={setActiveTab}
                        onOpenAuth={handleOpenAuth}
                      />
                    )}
                  </>
                ) : (
                  <div className="max-w-xl mx-auto my-12 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        Administrator Authentication Required
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                        You are currently viewing the Administrator Portal. Please sign in with an official Administrator account to configure academic programmes, hardware profiles, and device catalogues.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => handleOpenAuth('login', 'administrator')}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Sign In as Admin</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('wizard');
                        }}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-all cursor-pointer flex items-center justify-center space-x-2"
                      >
                        <GraduationCap className="w-4 h-4 text-blue-500" />
                        <span>Go to Student Recommendations</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* STUDENT PORTAL VIEWS */}
            {activeRole === 'student' && (
              <>
                {activeTab === 'wizard' && (
                  <RecommendationWizard
                    currentUser={currentUser}
                    onOpenAuth={handleOpenAuth}
                    onNavigateTab={setActiveTab}
                  />
                )}
                {(activeTab === 'saved-recommendations' || activeTab === 'saved') && (
                  <SavedRecommendations
                    currentUser={currentUser}
                    onNavigateTab={setActiveTab}
                    onOpenAuth={handleOpenAuth}
                  />
                )}
                {activeTab === 'catalogue' && <DeviceCatalogue onNavigateTab={setActiveTab} />}
                {activeTab === 'compare' && <DeviceComparison />}
                {activeTab === 'ai-assistant' && <AIAssistant />}
                {activeTab === 'ai-chat' && <AIAssistant />}
                {activeTab === 'feedback' && (
                  <StudentFeedback currentUser={currentUser} />
                )}
                {activeTab === 'profile' && (
                  <UserProfile
                    currentUser={currentUser}
                    onUpdateUser={(updated) => {
                      setCurrentUser(updated);
                      localStorage.setItem('uow_advisor_user', JSON.stringify(updated));
                    }}
                    onLogout={handleLogout}
                    onNavigateTab={setActiveTab}
                    onOpenAuth={handleOpenAuth}
                  />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          const hasSeenTour = localStorage.getItem('uow_has_seen_onboarding_tour');
          if (!hasSeenTour) {
            setTimeout(() => setIsTourOpen(true), 350);
          }
        }}
        onLoginSuccess={handleLoginSuccess}
        initialTab={authInitialTab}
        initialRole={authInitialRole}
      />

      {/* Floating Context-Aware Bot Assistant */}
      <FloatingChatBot
        activeTab={activeTab}
        activeRole={activeRole}
        onNavigateTab={setActiveTab}
      />

      {/* Interactive Platform Onboarding Walkthrough */}
      <OnboardingTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        currentRole={activeRole}
        onNavigateTab={setActiveTab}
      />
    </div>
    </>
  );
}

export default App;
