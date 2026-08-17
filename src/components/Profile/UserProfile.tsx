import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { User, UserRole, SavedRecommendation, Feedback } from '../../types';
import { safeFetchJson } from '../../lib/apiUtils';
import {
  User as UserIcon,
  Lock,
  Mail,
  IdCard,
  Building2,
  BookOpen,
  KeyRound,
  ShieldCheck,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  LogOut,
  Sparkles,
  BookmarkCheck,
  SlidersHorizontal,
  Laptop,
  ArrowRight,
  Clock,
  RefreshCw,
  Award,
  ChevronRight,
  Check,
  Smile,
  ShieldAlert,
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';

interface UserProfileProps {
  currentUser: User | null;
  onUpdateUser: (updatedUser: User) => void;
  onLogout: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenAuth?: (tab?: 'login' | 'register', role?: UserRole) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  currentUser,
  onUpdateUser,
  onLogout,
  onNavigateTab,
  onOpenAuth,
}) => {
  // Navigation within Profile
  const [activeSection, setActiveSection] = useState<'profile' | 'password' | 'activity'>('profile');

  // Edit Nickname and Photo Form State
  const [nickname, setNickname] = useState(currentUser?.nickname || '');
  const [photoUrl, setPhotoUrl] = useState(currentUser?.photo_url || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats
  const [savedCount, setSavedCount] = useState<number>(0);
  const [feedbackCount, setFeedbackCount] = useState<number>(0);

  // Profile Save UI State
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password Save UI State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  // Load stats
  useEffect(() => {
    safeFetchJson<SavedRecommendation[]>('/api/saved-recommendations').then((res) => {
      if (res.ok && Array.isArray(res.data)) setSavedCount(res.data.length);
    });

    safeFetchJson<Feedback[]>('/api/feedback').then((res) => {
      if (res.ok && Array.isArray(res.data)) {
        if (currentUser) {
          const mine = res.data.filter((f) => f.user_name === currentUser.name || f.user_id === currentUser.id);
          setFeedbackCount(mine.length || res.data.length);
        } else {
          setFeedbackCount(res.data.length);
        }
      }
    });
  }, [currentUser]);

  // Sync state if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setNickname(currentUser.nickname || '');
      setPhotoUrl(currentUser.photo_url || '');
    }
  }, [currentUser]);

  // Handle Image File Upload (converts to data URL preview)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileErrorMsg('Please select a valid image file (PNG, JPG, WebP, etc.).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileErrorMsg('Image file size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPhotoUrl(base64);
      setProfileErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  // Handle Nickname and Photo Update Submission
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);
    setIsSavingProfile(true);

    try {
      const token = localStorage.getItem('uow_advisor_token');
      const res = await safeFetchJson<{ user: User; message: string }>('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          id: currentUser.id,
          nickname: nickname.trim(),
          photo_url: photoUrl.trim(),
        }),
      });

      if (res.ok && res.data?.user) {
        onUpdateUser(res.data.user);
        setProfileSuccessMsg(res.data.message || 'Profile and photo updated successfully!');
        setTimeout(() => setProfileSuccessMsg(null), 4000);
      } else {
        setProfileErrorMsg(res.error || res.data?.message || 'Failed to update profile.');
      }
    } catch (err) {
      setProfileErrorMsg('A network error occurred while updating profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Password Change Submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setPasswordSuccessMsg(null);
    setPasswordErrorMsg(null);

    if (newPassword.length < 6) {
      setPasswordErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('The new password and confirmation password do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordErrorMsg('Your new password cannot be the same as your current password.');
      return;
    }

    setIsChangingPassword(true);

    try {
      const token = localStorage.getItem('uow_advisor_token');
      const res = await safeFetchJson<{ success: boolean; message: string; user?: User }>('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          id: currentUser.id,
          email: currentUser.email,
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (res.ok && res.data?.success) {
        setPasswordSuccessMsg(res.data.message || 'Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        if (res.data.user) {
          onUpdateUser(res.data.user);
        }
        setTimeout(() => setPasswordSuccessMsg(null), 5000);
      } else {
        setPasswordErrorMsg(res.error || res.data?.message || 'Failed to change password. Please verify current password.');
      }
    } catch (err) {
      setPasswordErrorMsg('A network error occurred while changing password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // If user is not logged in, show Guest Prompt
  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto my-8 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner">
          <UserIcon className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Guest Session Active
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            You are currently exploring the UOW Computing Advisor as a guest. Sign in or create an account to personalize your profile, set your nickname, and secure your password.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onOpenAuth && onOpenAuth('login', 'student')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>Sign In to Your Account</span>
          </button>
          <button
            onClick={() => onNavigateTab('wizard')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>Go to Recommendation Wizard</span>
          </button>
        </div>
      </div>
    );
  }

  const isStudent = currentUser.role === 'student';
  const isAdmin = currentUser.role === 'administrator';
  const displayName = currentUser.nickname ? currentUser.nickname : currentUser.name;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Banner Card: Institutional Profile & Monogram */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
        {/* Background gradient decorative element */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center space-x-4">
            {/* User Avatar with Role Badge and Photo Upload Trigger */}
            <div className="relative shrink-0 group">
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center font-bold text-2xl sm:text-3xl text-white shadow-lg overflow-hidden ${
                  isAdmin
                    ? 'bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 shadow-indigo-500/30'
                    : 'bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 shadow-blue-500/30'
                }`}
              >
                {photoUrl || currentUser.photo_url ? (
                  <img
                    src={photoUrl || currentUser.photo_url}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  displayName.charAt(0)
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-2xs"
                title="Change Profile Photo"
              >
                <Camera className="w-5 h-5 text-white" />
                <span className="text-[9px] font-bold mt-0.5">Change</span>
              </button>
              <div
                className={`absolute -bottom-1 -right-1 p-1 rounded-lg text-white ${
                  isAdmin ? 'bg-indigo-600' : 'bg-blue-600'
                } shadow-xs pointer-events-none`}
                title={isAdmin ? 'Administrator Privileges' : 'Enrolled Student'}
              >
                {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
              </div>
            </div>

            {/* Profile Info Details */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {currentUser.nickname ? (
                    <span className="flex items-center space-x-2">
                      <span>{currentUser.nickname}</span>
                      <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                        ({currentUser.name})
                      </span>
                    </span>
                  ) : (
                    <span>{currentUser.name}</span>
                  )}
                </h1>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    isAdmin
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  }`}
                >
                  {isAdmin ? 'System Administrator' : 'UOW Student'}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200/80 dark:border-emerald-800/80 flex items-center space-x-1">
                  <Check className="w-3 h-3" />
                  <span>Active Session</span>
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentUser.email}</span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <IdCard className="w-3.5 h-3.5 text-slate-400" />
                <span>{isAdmin ? currentUser.staff_id || 'ADM-9012' : `ID: ${currentUser.student_id || '0139421'}`}</span>
              </p>

              {currentUser.programme_name && (
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center space-x-1.5 pt-0.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{currentUser.programme_name}</span>
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex items-center space-x-2 self-start sm:self-center">
            <button
              onClick={() => onNavigateTab(isAdmin ? 'dashboard' : 'wizard')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            >
              <span>{isAdmin ? 'Admin Dashboard' : 'Recommendation Wizard'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
            </button>
            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-slate-500 hover:text-red-600 dark:hover:text-red-400 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 border border-slate-200/80 dark:border-slate-700/80 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile Internal Section Tabs */}
        <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setActiveSection('profile')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'profile'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Profile & Nickname</span>
          </button>

          <button
            onClick={() => setActiveSection('password')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'password'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Password & Security</span>
          </button>

          <button
            onClick={() => setActiveSection('activity')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'activity'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Activity & Shortcuts</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: PROFILE DETAILS (ONLY NICKNAME IS EDITABLE) */}
      {activeSection === 'profile' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <UserIcon className="w-5 h-5 text-blue-600" />
                <span>Account Information & Preferred Nickname</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official academic records and identity details are managed by the institution. You can customize your display nickname.
              </p>
            </div>
            <div className="flex items-center space-x-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium self-start sm:self-auto bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <Award className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Official Institutional Profile</span>
            </div>
          </div>

          {/* Feedback message banners */}
          {profileSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-2xl text-xs flex items-center space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            {/* Profile Photo Customizer */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                    <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Profile Photo (Editable)</span>
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Upload a custom profile image or choose from university avatar presets.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                  Editable
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                {/* Photo Preview */}
                <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden bg-white dark:bg-slate-900 shrink-0">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-xl text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400">
                      {displayName.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-[200px] space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                    </button>
                    {photoUrl && (
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center space-x-1.5 transition-all border border-rose-200 dark:border-rose-800 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Photo</span>
                      </button>
                    )}
                  </div>
                  
                  {/* Preset Avatars */}
                  <div className="flex items-center space-x-2 pt-1">
                    <span className="text-[10px] text-slate-400 font-medium">Presets:</span>
                    {[
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
                    ].map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setPhotoUrl(preset)}
                        className={`w-7 h-7 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                          photoUrl === preset ? 'border-blue-600 scale-105 shadow-xs' : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                      >
                        <img src={preset} alt={`Preset ${pIdx + 1}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Editable Field Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label htmlFor="user-nickname-input" className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                    <Smile className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Preferred Nickname (Editable)</span>
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    This preferred name will be used across the advisor headers and greeting banners.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                  Editable
                </span>
              </div>

              <div className="relative">
                <Smile className="w-4 h-4 absolute left-3.5 top-3.5 text-blue-500" />
                <input
                  id="user-nickname-input"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white font-semibold text-slate-800 placeholder:font-normal"
                  placeholder={`e.g. ${currentUser.name.split(' ')[0] || 'Alex'}`}
                  maxLength={30}
                />
              </div>
            </div>

            {/* Read-Only Official Profile Details Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Official Institutional Records (Read-Only)</span>
                </h3>
                <span className="text-[11px] text-slate-400">Locked by Administration</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Official Legal / Registered Name (Read-Only) */}
                <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {isAdmin ? 'Administrator Full Name' : 'Student Full Legal Name'}
                    </span>
                    <Lock className="w-3 h-3 text-slate-400" />
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{currentUser.name}</span>
                  </p>
                </div>

                {/* Email Address (Read-Only) */}
                <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Institutional Email
                    </span>
                    <Lock className="w-3 h-3 text-slate-400" />
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{currentUser.email}</span>
                  </p>
                </div>

                {/* Student / Staff ID (Read-Only) */}
                <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {isAdmin ? 'Staff / Admin Identifier' : 'UOW Student ID'}
                    </span>
                    <Lock className="w-3 h-3 text-slate-400" />
                  </div>
                  <p className="text-xs font-mono font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <IdCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{isAdmin ? currentUser.staff_id || 'ADM-9012' : currentUser.student_id || '0139421'}</span>
                  </p>
                </div>

                {/* Role / Access Level (Read-Only) */}
                <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Role & Permissions
                    </span>
                    <Lock className="w-3 h-3 text-slate-400" />
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{isAdmin ? 'Administrator (Full Access)' : 'Student (Recommendation Access)'}</span>
                  </p>
                </div>

                {/* Faculty Details (for Students) */}
                {isStudent && (
                  <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        Enrolled Faculty / School
                      </span>
                      <Lock className="w-3 h-3 text-slate-400" />
                    </div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{currentUser.faculty_name || 'School of Computing & Creative Media (FOCM)'}</span>
                    </p>
                  </div>
                )}

                {/* Academic Programme (for Students) */}
                {isStudent && (
                  <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        Academic Degree & Major
                      </span>
                      <Lock className="w-3 h-3 text-slate-400" />
                    </div>
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center space-x-2">
                      <BookOpen className="w-3.5 h-3.5 shrink-0" />
                      <span>{currentUser.programme_name || 'Bachelor of Computer Science (Hons) in Software Engineering'}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Save Button for Nickname */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11px] text-slate-400">
                To update password, switch to the <button type="button" onClick={() => setActiveSection('password')} className="text-blue-600 dark:text-blue-400 font-bold underline cursor-pointer">Password tab</button>.
              </p>
              <button
                type="submit"
                id="save-nickname-button"
                disabled={isSavingProfile}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSavingProfile ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Nickname...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Nickname</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* SECTION 2: PASSWORD CHANGE & SECURITY */}
      {activeSection === 'password' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                <span>Change Password & Account Security</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage your credentials and keep your account secure
              </p>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Encrypted Session</span>
            </div>
          </div>

          {/* Feedback message banners */}
          {passwordSuccessMsg && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs flex items-start space-x-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
              <div>
                <p className="font-bold">Password Updated Successfully!</p>
                <p className="text-[11px] mt-0.5">{passwordSuccessMsg}</p>
              </div>
            </div>
          )}

          {passwordErrorMsg && (
            <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-2xl text-xs flex items-start space-x-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="font-bold">Password Update Error</p>
                <p className="text-[11px] mt-0.5">{passwordErrorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-2xl">
            {/* Current Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Current Password</span>
                <span className="text-[11px] font-normal text-slate-400">(Required to verify identity)</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white font-medium"
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>New Password</span>
                <span className="text-[11px] font-normal text-slate-400">Minimum 6 characters</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white font-medium"
                  placeholder="Enter new strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Real-time Password Strength Check */}
              {newPassword && (
                <div className="pt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Password Strength:</span>
                    <span
                      className={`font-bold ${
                        newPassword.length >= 8 && /[0-9]/.test(newPassword)
                          ? 'text-emerald-600'
                          : newPassword.length >= 6
                          ? 'text-amber-600'
                          : 'text-red-500'
                      }`}
                    >
                      {newPassword.length >= 8 && /[0-9]/.test(newPassword)
                        ? 'Strong'
                        : newPassword.length >= 6
                        ? 'Medium'
                        : 'Weak (Too Short)'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-300 ${
                        newPassword.length >= 8 && /[0-9]/.test(newPassword)
                          ? 'w-full bg-emerald-500'
                          : newPassword.length >= 6
                          ? 'w-2/3 bg-amber-500'
                          : 'w-1/3 bg-red-500'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm New Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white font-medium"
                  placeholder="Re-enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {confirmPassword && (
                <p
                  className={`text-[11px] font-medium flex items-center space-x-1 ${
                    confirmPassword === newPassword ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                  }`}
                >
                  {confirmPassword === newPassword ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Passwords match correctly</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Passwords do not match yet</span>
                    </>
                  )}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordErrorMsg(null);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Clear Form
              </button>

              <button
                type="submit"
                id="update-password-button"
                disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isChangingPassword ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Update Password Now</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* SECTION 3: QUICK SHORTCUTS & ACTIVITY */}
      {activeSection === 'activity' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Saved Reports
                </span>
                <BookmarkCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{savedCount}</p>
              <p className="text-[11px] text-slate-400">Stored device recommendations</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Feedback Submissions
                </span>
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{feedbackCount}</p>
              <p className="text-[11px] text-slate-400">Satisfaction ratings recorded</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Access Level
                </span>
                <ShieldCheck className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {isAdmin ? 'Admin' : 'Verified'}
              </p>
              <p className="text-[11px] text-slate-400">Institutional UOW SSO state</p>
            </div>
          </div>

          {/* Direct Navigation Links */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span>Quick Feature Navigation</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {isStudent ? (
                <>
                  <button
                    onClick={() => onNavigateTab('wizard')}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between transition-all group cursor-pointer text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          Recommendation Wizard
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Find laptop matches for your course
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => onNavigateTab('saved-recommendations')}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between transition-all group cursor-pointer text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold">
                        <BookmarkCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                          Saved Recommendations
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          View bookmarked laptops & reports
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => onNavigateTab('catalogue')}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50/60 dark:hover:bg-purple-950/30 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between transition-all group cursor-pointer text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold">
                        <Laptop className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                          Device Catalogue
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Browse verified computing hardware
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => onNavigateTab('compare')}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50/60 dark:hover:bg-amber-950/30 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between transition-all group cursor-pointer text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center font-bold">
                        <SlidersHorizontal className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                          Compare Hardware Specs
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Side-by-side spec comparison table
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onNavigateTab('dashboard')}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between transition-all group cursor-pointer text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          Overview Dashboard
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          System metrics, student traffic & analytics
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => onNavigateTab('devices')}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between transition-all group cursor-pointer text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold">
                        <Laptop className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          Device Catalogue Management
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Manage laptop models, specs & Excel import
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
