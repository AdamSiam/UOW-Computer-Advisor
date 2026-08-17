import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Feedback } from '../../types';
import { safeFetchJson } from '../../lib/apiUtils';
import {
  MessageSquareHeart,
  Star,
  Send,
  CheckCircle2,
  Sparkles,
  ThumbsUp,
  MessageSquare,
  User as UserIcon,
  Calendar,
  Layers,
  ShieldCheck,
  ShieldAlert,
  GraduationCap,
  Info,
  Filter,
  UserCheck,
} from 'lucide-react';

interface StudentFeedbackProps {
  currentUser?: User | null;
}

const CATEGORIES = [
  '🎯 Recommendation Accuracy',
  '🎓 Course / Syllabus Fit',
  '💻 Laptop Specs & Prices',
  '⚡ Website Usability',
  '💡 Feature Suggestion',
];

const RATING_LABELS: Record<number, string> = {
  1: '1 - Poor Match',
  2: '2 - Needs Improvement',
  3: '3 - Average Match',
  4: '4 - Good Match',
  5: '5 - Excellent Accuracy',
};

export const StudentFeedback: React.FC<StudentFeedbackProps> = ({ currentUser }) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [userName, setUserName] = useState<string>(currentUser?.nickname || currentUser?.name || '');
  const [comment, setComment] = useState<string>('');
  const [honeypot, setHoneypot] = useState<string>(''); // Anti-bot honeypot
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pastFeedback, setPastFeedback] = useState<Feedback[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'verified' | 'guest'>('all');

  const isVerifiedStudent = Boolean(currentUser && currentUser.role === 'student');

  useEffect(() => {
    const effectiveName = currentUser?.nickname || currentUser?.name || '';
    if (effectiveName && !userName) {
      setUserName(effectiveName);
    }
  }, [currentUser]);

  const loadPastFeedback = async () => {
    const res = await safeFetchJson<Feedback[]>('/api/feedback');
    if (res.ok && Array.isArray(res.data)) {
      setPastFeedback(res.data);
    }
  };

  useEffect(() => {
    loadPastFeedback();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const fullComment = `[${category}] ${comment.trim()}`;
      const payload = {
        rating,
        comment: fullComment,
        user_name: userName.trim() || (isVerifiedStudent ? currentUser?.name : 'Guest Student'),
        user_id: currentUser ? currentUser.id : null,
        user_type: isVerifiedStudent ? 'registered_student' : 'guest',
        is_verified_student: isVerifiedStudent,
        student_id: currentUser?.student_id || undefined,
        faculty_name: currentUser?.faculty_name || undefined,
        programme_name: currentUser?.programme_name || undefined,
        category,
        honeypot_bot_check: honeypot, // Honeypot field for bot detection
      };

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitSuccess(true);
        setComment('');
        await loadPastFeedback();
      } else {
        setSubmitError(data.error || 'Failed to submit feedback. Please try again.');
      }
    } catch (err) {
      console.error('Feedback submit error:', err);
      setSubmitError('Network connection issue. Please try submitting again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStarLevel = hoverRating ?? rating;

  // Filtered feedback wall calculations
  const filteredList = pastFeedback.filter((fb) => {
    if (filterType === 'verified') return fb.is_verified_student;
    if (filterType === 'guest') return !fb.is_verified_student;
    return true;
  });

  const verifiedReviews = pastFeedback.filter((fb) => fb.is_verified_student);
  const guestReviews = pastFeedback.filter((fb) => !fb.is_verified_student);

  const avgVerifiedRating =
    verifiedReviews.length > 0
      ? (verifiedReviews.reduce((sum, f) => sum + f.rating, 0) / verifiedReviews.length).toFixed(1)
      : '5.0';

  const avgOverallRating =
    pastFeedback.length > 0
      ? (pastFeedback.reduce((sum, f) => sum + f.rating, 0) / pastFeedback.length).toFixed(1)
      : '5.0';

  return (
    <div className="max-w-[1550px] w-full mx-auto space-y-6 sm:space-y-8 pb-16 px-1 sm:px-0">
      {/* Header Banner */}
      <div className="p-4 sm:p-7 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-50 via-indigo-50/70 to-slate-100 dark:from-blue-950/60 dark:via-indigo-950/60 dark:to-slate-900 text-slate-800 dark:text-white shadow-xs border border-slate-200 dark:border-blue-800/50 space-y-2.5 sm:space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <MessageSquareHeart className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
            <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-300">
              Web Experience & Advisor Rating
            </span>
          </div>
          <span className="text-[10px] sm:text-xs font-semibold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-blue-100 dark:bg-white/10 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-white/20">
            UOW Computing Hardware Advisor
          </span>
        </div>

        <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Submit Web & Advisor Feedback
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
          Your feedback helps us continuously improve laptop recommendation accuracy, course hardware profile mappings, and prevent bias through verified student authentication.
        </p>

        {/* Account Authentication & Anti-Bias Notice */}
        <div className="pt-1">
          {isVerifiedStudent ? (
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Authenticated as <strong>{currentUser?.name}</strong> ({currentUser?.student_id || 'UOW Student'}) — Your feedback carries <strong>100% verified institutional weight</strong>.
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs font-semibold">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                Submitting as <strong>Guest Account</strong>. Sign in with your UOW student account to receive a <strong>Verified Student Badge</strong>.
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Feedback Submission Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 sm:space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-100 dark:border-slate-800 pb-3 sm:pb-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                Share Your Feedback
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Rate your satisfaction with the recommendations or submit feature suggestions.
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {submitSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-6 sm:p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-4"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                    Feedback Submitted Successfully!
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                    {isVerifiedStudent
                      ? 'Thank you! Your feedback has been verified and registered with institutional weighting.'
                      : 'Thank you for contributing! Your feedback has been recorded for the UOW Advisor team.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSubmitSuccess(false)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  Submit Another Feedback
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                {/* Hidden Honeypot Field for Bot Spam Prevention */}
                <input
                  type="text"
                  name="website_url_honey"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />

                {submitError && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* 1. Star Rating Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    1. Satisfaction Rating
                  </label>

                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center space-x-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          className="p-1 text-amber-400 hover:scale-110 transition-transform focus:outline-none cursor-pointer"
                        >
                          <Star
                            className={`w-6 h-6 sm:w-7 sm:h-7 ${
                              star <= currentStarLevel
                                ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                                : 'text-slate-300 dark:text-slate-700'
                            }`}
                          />
                        </button>
                      ))}
                    </div>

                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-center">
                      {RATING_LABELS[currentStarLevel]}
                    </span>
                  </div>
                </div>

                {/* 2. Feedback Category */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    2. Feedback Topic / Area
                  </label>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                          category === cat
                            ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Your Name & Verification Tag */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      3. Submitter Identity
                    </label>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                        isVerifiedStudent
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isVerifiedStudent ? (
                        <>
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Verified Student ({currentUser?.student_id || 'ID Active'})</span>
                        </>
                      ) : (
                        <span>Guest (Unverified)</span>
                      )}
                    </span>
                  </div>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="e.g. Alex Tan or UOW Student"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>
                </div>

                {/* 4. Detailed Comment */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    4. Your Feedback & Suggestions <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us what worked well or how we can improve the hardware recommendation advisor..."
                    className="w-full p-3.5 rounded-xl sm:rounded-2xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                  />
                  <p className="text-[10px] text-slate-400">
                    Protected by spam prevention rate-limiting and institutional verification.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !comment.trim()}
                  className="w-full py-3 sm:py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting Feedback...' : 'Submit Feedback'}</span>
                </button>
              </form>
            )}
          </AnimatePresence>
        </div>

        {/* Community Feedback Wall Side View */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <ThumbsUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Recent Feedback Wall
                </h3>
              </div>
              <div className="flex items-center space-x-1.5 text-xs">
                <span className="font-extrabold text-amber-500 flex items-center">
                  <Star className="w-3.5 h-3.5 fill-amber-400 mr-0.5" />
                  {avgOverallRating}
                </span>
                <span className="text-[11px] text-slate-400">({pastFeedback.length} total)</span>
              </div>
            </div>

            {/* Filter Tabs: All vs Verified vs Guest */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                All ({pastFeedback.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('verified')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                  filterType === 'verified'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Verified ({verifiedReviews.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterType('guest')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                  filterType === 'guest'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Guest ({guestReviews.length})
              </button>
            </div>

            {/* List of Feedback */}
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {filteredList.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No feedback found in this filter category.
                </div>
              ) : (
                filteredList.map((fb) => (
                  <div
                    key={fb.id}
                    className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1">
                          <UserIcon className="w-3.5 h-3.5 text-blue-500" />
                          <span>{fb.user_name || 'UOW Student'}</span>
                        </span>

                        {fb.is_verified_student ? (
                          <span
                            title="Verified UOW Student with authenticated university enrollment"
                            className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/80 flex items-center space-x-0.5"
                          >
                            <ShieldCheck className="w-2.5 h-2.5" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-200/70 dark:bg-slate-700/70 text-slate-600 dark:text-slate-400">
                            Guest
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-extrabold text-amber-600 dark:text-amber-400">
                          {fb.rating}.0
                        </span>
                      </div>
                    </div>

                    {fb.programme_name && (
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                        🎓 {fb.programme_name}
                      </p>
                    )}

                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic">
                      "{fb.comment}"
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-700/50">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(fb.created_at).toLocaleDateString()}</span>
                      </span>
                      {fb.student_id ? (
                        <span className="font-mono text-[9px] text-slate-500">ID: {fb.student_id}</span>
                      ) : (
                        <span className="text-slate-400">Public Review</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
