import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, UserRole, Faculty, Programme } from '../../types';
import { safeFetchJson } from '../../lib/apiUtils';
import { UowShieldLogo } from '../UowLogo';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  GraduationCap,
  Building2,
  BookOpen,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  IdCard,
  Info,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User, token: string) => void;
  initialRole?: UserRole;
  initialTab?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialTab = 'login',
}) => {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [facultyId, setFacultyId] = useState<number | ''>('');
  const [programmeId, setProgrammeId] = useState<number | ''>('');

  // Dynamic Data
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setTab(initialTab);
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (isOpen && tab === 'register') {
      safeFetchJson<Faculty[]>('/api/faculties').then((res) => {
        if (res.ok && Array.isArray(res.data)) setFaculties(res.data);
      });

      safeFetchJson<Programme[]>('/api/programmes').then((res) => {
        if (res.ok && Array.isArray(res.data)) setProgrammes(res.data);
      });
    }
  }, [isOpen, tab]);

  const filteredProgrammes = facultyId
    ? programmes.filter((p) => p.faculty_id === Number(facultyId))
    : programmes;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();

    if (tab === 'register') {
      // Strict 7-digit number + @student.uow.edu.my student email validation
      const studentEmailRegex = /^\d{7}@student\.uow\.edu\.my$/i;
      if (!studentEmailRegex.test(cleanEmail)) {
        setErrorMsg('Student registration requires a 7-digit student ID number followed by @student.uow.edu.my (e.g., 0135510@student.uow.edu.my).');
        return;
      }

      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please re-enter your password.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const cleanStudentId = studentId.trim() || cleanEmail.split('@')[0];
      const payload =
        tab === 'login'
          ? { email: cleanEmail, password }
          : {
              name: `Student ${cleanStudentId}`,
              email: cleanEmail,
              password,
              student_id: cleanStudentId || undefined,
              faculty_id: facultyId || undefined,
              programme_id: programmeId || undefined,
            };

      const res = await safeFetchJson<{ user: User; token: string; message?: string }>(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok && res.data?.user && res.data?.token) {
        setSuccessMsg(tab === 'login' ? 'Login successful!' : 'Student account registered successfully!');
        setTimeout(() => {
          onLoginSuccess(res.data.user, res.data.token);
          onClose();
        }, 500);
      } else {
        setErrorMsg(res.error || res.data?.message || 'Authentication failed. Please check your inputs.');
      }
    } catch {
      setErrorMsg('Network error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6"
          >
            {/* Header Bar */}
            <div className="relative px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-700 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-1 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center">
                  <UowShieldLogo className="w-6 h-8 text-white filter drop-shadow-2xs" />
                </div>
                <div>
                  <h2 className="font-bold text-base sm:text-lg leading-tight">UOW Computer Advisor</h2>
                  <p className="text-xs text-blue-100/90 leading-tight">Laptop Decision Support System</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Main Auth Tabs: Sign In vs Student Registration */}
              <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    tab === 'login'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                    tab === 'register'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Student Registration</span>
                </button>
              </div>

              {/* Notice for Student Registration */}
              {tab === 'register' && (
                <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80 flex items-start space-x-2 text-xs text-blue-800 dark:text-blue-200">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-[11.5px]">Student Account Eligibility</p>
                    <p className="text-[10.5px] text-blue-700/90 dark:text-blue-300/90 leading-relaxed">
                      Registration is strictly for enrolled UOW students. Use your 7-digit student ID ending with <strong className="font-mono text-blue-900 dark:text-white">@student.uow.edu.my</strong> (e.g. <span className="font-mono font-bold">0135510@student.uow.edu.my</span>).
                    </p>
                  </div>
                </div>
              )}

              {/* Feedback Messages */}
              {errorMsg && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-xs flex items-start space-x-2 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs flex items-start space-x-2 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>
                      {tab === 'register' ? 'Official Student Email' : 'University Email Address'}{' '}
                      <span className="text-red-500">*</span>
                    </span>
                    {tab === 'register' && (
                      <span className="text-[9.5px] text-blue-600 dark:text-blue-400 font-mono font-bold">
                        7-digit ID + @student.uow.edu.my
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="0135510@student.uow.edu.my"
                      value={email}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEmail(val);
                        const match = val.match(/^(\d{7})/);
                        if (match && (!studentId || studentId.length === 7)) {
                          setStudentId(match[1]);
                        }
                      }}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white font-mono"
                    />
                  </div>
                </div>

                {/* Student Registration Profile Fields */}
                {tab === 'register' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                          <span>UOW Student ID</span>
                          <span className="text-[9.5px] text-slate-400">7 digits</span>
                        </label>
                        <div className="relative">
                          <IdCard className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="e.g. 0135510"
                            maxLength={7}
                            value={studentId}
                            onChange={(e) => {
                              const cleanDigits = e.target.value.replace(/\D/g, '').slice(0, 7);
                              setStudentId(cleanDigits);
                              if (cleanDigits.length === 7 && (!email || email.endsWith('@student.uow.edu.my'))) {
                                setEmail(`${cleanDigits}@student.uow.edu.my`);
                              }
                            }}
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-300">
                          Faculty / School
                        </label>
                        <div className="relative">
                          <Building2 className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                          <select
                            value={facultyId}
                            onChange={(e) => {
                              setFacultyId(e.target.value ? Number(e.target.value) : '');
                              setProgrammeId('');
                            }}
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                          >
                            <option value="">Select Faculty...</option>
                            {faculties.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.code} - {f.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-300">
                        Academic Major / Programme
                      </label>
                      <div className="relative">
                        <BookOpen className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                        <select
                          value={programmeId}
                          onChange={(e) => setProgrammeId(e.target.value ? Number(e.target.value) : '')}
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                        >
                          <option value="">Select Programme...</option>
                          {filteredProgrammes.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.code} - {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-300">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder={tab === 'login' ? 'Enter your password' : 'At least 6 characters'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-8 pr-9 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password on Register */}
                {tab === 'register' && (
                  <div className="space-y-1">
                    <label className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-300">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-8 pr-9 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Submit & Guest Actions */}
                <div className="space-y-2 pt-1">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2 px-3.5 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{tab === 'login' ? 'Sign In' : 'Create Student Account'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2 px-3.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Continue as Guest</span>
                  </button>
                </div>
              </form>

              {/* Footer toggle note */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-1.5 border-t border-slate-100 dark:border-slate-800/80">
                {tab === 'login' ? (
                  <p className="text-[11px]">
                    No account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setTab('register');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Register with student ID
                    </button>
                  </p>
                ) : (
                  <p className="text-[11px]">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setTab('login');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Sign in here
                    </button>
                  </p>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer flex items-center space-x-1 transition-colors"
                >
                  <span>Browse as Guest</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
