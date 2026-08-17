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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [pastFeedback, setPastFeedback] = useState<Feedback[]>([]);

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
    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      const fullComment = `[${category}] ${comment.trim()}`;
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment: fullComment,
          user_name: userName.trim() || currentUser?.name || 'UOW Student',
        }),
      });

      if (res.ok) {
        setSubmitSuccess(true);
        setComment('');
        await loadPastFeedback();
      }
    } catch (err) {
      console.error('Feedback submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStarLevel = hoverRating ?? rating;

  return (
    <div className="max-w-[1550px] w-full mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-50 via-indigo-50/70 to-slate-100 dark:from-blue-950/60 dark:via-indigo-950/60 dark:to-slate-900 text-slate-800 dark:text-white shadow-sm dark:shadow-xl space-y-3 border border-slate-200 dark:border-blue-800/50">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <MessageSquareHeart className="w-6 h-6 text-amber-500" />
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-300">
              Web Experience & Advisor Rating
            </span>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 dark:bg-white/10 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-white/20 backdrop-blur-xs">
            UOW Computing Hardware Advisor
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Submit Web & Advisor Feedback
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
          Your feedback helps us continuously improve laptop recommendation accuracy, course hardware profile mappings, and the UOW Malaysia student portal experience.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Feedback Submission Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">
                Share Your Feedback
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rate your overall satisfaction with the recommendation advisor or report an issue.
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
                className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-4"
              >
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                    Feedback Submitted Successfully!
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                    Thank you for contributing! Your feedback has been recorded and will be reviewed by the UOW Computing Hardware Advisor team.
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
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Star Rating Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    1. Satisfaction Rating
                  </label>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
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
                            className={`w-7 h-7 ${
                              star <= currentStarLevel
                                ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                                : 'text-slate-300 dark:text-slate-700'
                            }`}
                          />
                        </button>
                      ))}
                    </div>

                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                      {RATING_LABELS[currentStarLevel]}
                    </span>
                  </div>
                </div>

                {/* 2. Feedback Category */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    2. Feedback Topic / Area
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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

                {/* 3. Your Name */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    3. Your Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="e.g. Alex Tan or UOW Student"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full p-3.5 rounded-2xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !comment.trim()}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
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
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ThumbsUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Recent Web Feedback
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {pastFeedback.length} Submitted
              </span>
            </div>

            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {pastFeedback.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No feedback recorded yet. Be the first to share your thoughts!
                </div>
              ) : (
                pastFeedback.map((fb) => (
                  <div
                    key={fb.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1">
                        <UserIcon className="w-3.5 h-3.5 text-blue-500" />
                        <span>{fb.user_name || 'UOW Student'}</span>
                      </span>

                      <div className="flex items-center space-x-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-extrabold text-amber-600 dark:text-amber-400">
                          {fb.rating}.0
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic">
                      "{fb.comment}"
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(fb.created_at).toLocaleDateString()}</span>
                      </span>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">Verified Feedback</span>
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
