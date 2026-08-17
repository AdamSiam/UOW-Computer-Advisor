import React, { useState, useEffect } from 'react';
import { SavedRecommendation, User, UserRole } from '../../types';
import { safeFetchJson } from '../../lib/apiUtils';
import {
  BookmarkCheck,
  Trash2,
  ExternalLink,
  Laptop,
  Calendar,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Scale,
  Lock,
  UserPlus,
  LogIn,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';

interface SavedRecommendationsProps {
  currentUser?: User | null;
  onNavigateTab?: (tab: string) => void;
  onOpenAuth?: (tab: 'login' | 'register', role?: UserRole) => void;
}

export const SavedRecommendations: React.FC<SavedRecommendationsProps> = ({
  currentUser,
  onNavigateTab,
  onOpenAuth,
}) => {
  const [savedReports, setSavedReports] = useState<SavedRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const isLoggedIn = !!currentUser;

  const loadSavedRecommendations = async () => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await safeFetchJson<SavedRecommendation[]>('/api/saved-recommendations');
      if (res.ok && Array.isArray(res.data)) {
        setSavedReports(res.data);
        // Automatically expand the first report by default if available
        if (res.data.length > 0) {
          setExpandedId(res.data[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load saved recommendations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedRecommendations();
  }, [currentUser]);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await safeFetchJson(`/api/saved-recommendations/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSavedReports((prev) => prev.filter((r) => r.id !== id));
        if (expandedId === id) {
          setExpandedId(null);
        }
      }
    } catch (e) {
      console.error('Failed to delete saved recommendation:', e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCompareAllInReport = (report: SavedRecommendation) => {
    if (!report.recommended_devices || report.recommended_devices.length === 0) return;
    const deviceIds = report.recommended_devices.map((d) => d.id).slice(0, 4);

    try {
      localStorage.setItem('uow_compare_ids', JSON.stringify(deviceIds));
      window.dispatchEvent(
        new CustomEvent('add-to-compare', {
          detail: { deviceIds },
        })
      );
    } catch (e) {
      console.error(e);
    }

    if (onNavigateTab) {
      onNavigateTab('compare');
    }
  };

  const handleCompareSingleDevice = (deviceId: number) => {
    try {
      const existing: number[] = JSON.parse(localStorage.getItem('uow_compare_ids') || '[]');
      const next = Array.from(new Set([...existing, deviceId])).slice(0, 4);
      localStorage.setItem('uow_compare_ids', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('add-to-compare', { detail: { deviceId } }));
    } catch (e) {
      console.error(e);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto my-6 p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200/80 dark:border-emerald-800/80 shadow-xs">
          <BookmarkCheck className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Student Account Required
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Guest accounts cannot save or access recommendations without creating an account. Sign in or register with your UOW Student ID to view and manage your saved hardware recommendation reports.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/60 text-left max-w-md mx-auto space-y-2.5">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Benefits of a Student Account:</span>
          </div>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 pl-1">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Save & reload recommended laptop match reports anytime</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              <span>1-click side-by-side comparison of saved laptops</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
              <span>Automatic course syllabus & hardware requirement matching</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {onOpenAuth && (
            <>
              <button
                type="button"
                onClick={() => onOpenAuth('register', 'student')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Student Account</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenAuth('login', 'student')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <LogIn className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Sign In</span>
              </button>
            </>
          )}

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('wizard')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <GraduationCap className="w-4 h-4 text-blue-500" />
              <span>Try Wizard as Guest</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl w-full mx-auto space-y-6 pb-12">
      {/* Simple Header */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <BookmarkCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Saved Recommendations
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {savedReports.length} saved recommendation {savedReports.length === 1 ? 'report' : 'reports'}
            </p>
          </div>
        </div>

        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('wizard')}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>New Recommendation</span>
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading saved recommendations...</p>
        </div>
      ) : savedReports.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <BookmarkCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No saved recommendations
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Recommendations you save from the wizard will appear here for easy reference.
          </p>
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('wizard')}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-all cursor-pointer inline-flex items-center space-x-1.5"
            >
              <span>Get Recommendations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {savedReports.map((report) => {
            const isExpanded = expandedId === report.id;
            const deviceCount = report.recommended_devices?.length || 0;

            return (
              <div
                key={report.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all shadow-xs"
              >
                {/* Header Summary Row (Click to Expand / Collapse) */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 select-none transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {report.programme_name || report.title}
                        </span>
                        {report.budget && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                            RM {report.budget.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(report.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span>•</span>
                        <span>{deviceCount} {deviceCount === 1 ? 'laptop' : 'laptops'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {deviceCount > 0 && (
                      <button
                        type="button"
                        onClick={() => handleCompareAllInReport(report)}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 text-[11px] font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
                        title="Compare all laptops in this report side-by-side"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Compare Devices</span>
                        <span className="sm:hidden">Compare</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(report.id)}
                      disabled={deletingId === report.id}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete recommendation"
                    >
                      {deletingId === report.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : report.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                    {report.explanation && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                        {report.explanation}
                      </p>
                    )}

                    {/* Simple Laptop List */}
                    <div className="space-y-2">
                      {report.recommended_devices && report.recommended_devices.length > 0 ? (
                        report.recommended_devices.map((device) => (
                          <div
                            key={device.id}
                            className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 dark:text-white truncate">
                                  {device.model}
                                </span>
                                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                                  ({device.brand?.name || 'Laptop'})
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {device.cpu_name} • {device.ram_gb}GB RAM • {device.storage_gb}GB SSD
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  handleCompareSingleDevice(device.id);
                                  if (onNavigateTab) onNavigateTab('compare');
                                }}
                                className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-md transition-colors cursor-pointer"
                                title="Add to compare and open Comparison page"
                              >
                                <Scale className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                RM {device.price.toLocaleString()}
                              </span>
                              {device.purchase_url && (
                                <a
                                  href={device.purchase_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-md transition-colors"
                                  title="Store Link"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No laptops recorded in this report.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
