import React, { useState, useEffect } from 'react';
import { SavedRecommendation, Feedback, User } from '../../types';
import { safeFetchJson } from '../../lib/apiUtils';
import {
  Users,
  BookmarkCheck,
  Star,
  ShieldCheck,
  GraduationCap,
  Mail,
  IdCard,
  UserCheck,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Building2,
  BookOpen,
  Calendar,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Camera,
} from 'lucide-react';

export const StudentManagement: React.FC = () => {
  const [saved, setSaved] = useState<SavedRecommendation[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    nickname: '',
    student_id: '',
    staff_id: '',
    faculty_name: '',
    programme_name: '',
    photo_url: '',
    new_password: '',
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Confirmation Modal State
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Expanded User IDs for "Show More" full details view
  const [expandedUserIds, setExpandedUserIds] = useState<Set<number>>(new Set());

  const toggleExpandUser = (userId: number) => {
    setExpandedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const fetchUsersAndData = async () => {
    setLoading(true);
    try {
      const [sRes, fRes, uRes] = await Promise.all([
        safeFetchJson<SavedRecommendation[]>('/api/saved-recommendations'),
        safeFetchJson<Feedback[]>('/api/feedback'),
        safeFetchJson<User[]>('/api/auth/users'),
      ]);
      if (sRes.ok && Array.isArray(sRes.data)) setSaved(sRes.data);
      if (fRes.ok && Array.isArray(fRes.data)) setFeedback(fRes.data);
      if (uRes.ok && Array.isArray(uRes.data)) setUsers(uRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndData();
  }, []);

  const [accountCategory, setAccountCategory] = useState<'all' | 'student' | 'administrator'>('all');

  const students = users.filter((u) => u.role === 'student');
  const admins = users.filter((u) => u.role === 'administrator');

  // Open Edit Modal
  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || '',
      email: user.email || '',
      nickname: user.nickname || '',
      student_id: user.student_id || '',
      staff_id: user.staff_id || '',
      faculty_name: user.faculty_name || '',
      programme_name: user.programme_name || '',
      photo_url: user.photo_url || '',
      new_password: '',
    });
  };

  // Submit Edit Form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmittingEdit(true);

    try {
      const res = await safeFetchJson<{ user: User; message: string }>(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      if (res.ok && res.data) {
        setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? res.data.user : u)));
        setNotification({ type: 'success', message: res.data.message || 'Student account updated successfully!' });
        setEditingUser(null);
      } else {
        setNotification({ type: 'error', message: res.error || res.data?.message || 'Failed to update account.' });
      }
    } catch {
      setNotification({ type: 'error', message: 'A network error occurred while updating the account.' });
    } finally {
      setIsSubmittingEdit(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Delete User Action
  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setIsSubmittingDelete(true);

    try {
      const res = await safeFetchJson<{ success: boolean; message: string }>(`/api/admin/users/${deletingUser.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
        setNotification({ type: 'success', message: res.data?.message || 'Account successfully removed.' });
        setDeletingUser(null);
      } else {
        setNotification({ type: 'error', message: res.error || res.data?.message || 'Failed to delete account.' });
      }
    } catch {
      setNotification({ type: 'error', message: 'A network error occurred while deleting the account.' });
    } finally {
      setIsSubmittingDelete(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  return (
    <div className="max-w-[1550px] w-full mx-auto space-y-6 pb-12">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold shadow-lg transition-all animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>User Accounts & Activity Logs</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage registered student and admin accounts, fix student misinputs (e.g. Student ID, Major), inspect complete student records, and monitor enrolments.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchUsersAndData}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Registered Users Section - Categorized */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <span>Registered Platform Accounts ({users.length})</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Filtered by role permissions & institutional profiles
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setAccountCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                accountCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setAccountCategory('student')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                accountCategory === 'student'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Students ({students.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setAccountCategory('administrator')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                accountCategory === 'administrator'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admins ({admins.length})</span>
            </button>
          </div>
        </div>

        {/* Categorized Displays */}
        <div className="space-y-6">
          {/* Administrator Accounts Category */}
          {(accountCategory === 'all' || accountCategory === 'administrator') && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Administrator Accounts ({admins.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {admins.map((u) => (
                  <UserDetailCard
                    key={u.id}
                    user={u}
                    isExpanded={expandedUserIds.has(u.id)}
                    onToggleExpand={() => toggleExpandUser(u.id)}
                    onEdit={() => handleOpenEdit(u)}
                    onDelete={() => setDeletingUser(u)}
                    canDelete={admins.length > 1}
                  />
                ))}
                {admins.length === 0 && (
                  <p className="text-xs text-slate-400 italic col-span-full">No administrator accounts registered.</p>
                )}
              </div>
            </div>
          )}

          {/* Student Accounts Category */}
          {(accountCategory === 'all' || accountCategory === 'student') && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Student Accounts ({students.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {students.map((u) => (
                  <UserDetailCard
                    key={u.id}
                    user={u}
                    isExpanded={expandedUserIds.has(u.id)}
                    onToggleExpand={() => toggleExpandUser(u.id)}
                    onEdit={() => handleOpenEdit(u)}
                    onDelete={() => setDeletingUser(u)}
                    canDelete={true}
                  />
                ))}
                {students.length === 0 && (
                  <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1 col-span-full">
                    <GraduationCap className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No student accounts registered.</p>
                    <p className="text-[11px] text-slate-400">Student accounts will be listed here with edit/delete actions as soon as they sign up.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <span>Active Student Enrolments ({students.length})</span>
          </h3>

          <div className="space-y-3">
            {students.map((st) => (
              <div key={st.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {st.name}
                  </span>
                  <span className="text-emerald-600 font-mono">ID: {st.student_id || '0139421'}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  <strong>Major:</strong> {st.programme_name || 'School of Computing'}
                </p>
                <p className="text-slate-500">Email: {st.email}</p>
              </div>
            ))}
            {students.length === 0 && (
              <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No active student enrolments yet</p>
                <p className="text-[11px] text-slate-400">Students will appear here once they register their student accounts.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
              <Star className="w-5 h-5 text-amber-500" />
              <span>Student Feedback & Ratings ({feedback.length})</span>
            </h3>
            
            {/* Differentiation pills */}
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Verified: {feedback.filter((f) => f.is_verified_student).length}</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border border-slate-300 dark:border-slate-700">
                Guest: {feedback.filter((f) => !f.is_verified_student).length}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {feedback.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">No feedback submitted yet.</div>
            ) : (
              feedback.map((fb) => (
                <div key={fb.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center flex-wrap gap-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{fb.user_name}</span>
                      {fb.is_verified_student ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
                          🎓 Verified Student {fb.student_id ? `(${fb.student_id})` : ''}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          Guest (Unverified)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex text-amber-400">
                        {Array.from({ length: fb.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`Remove this feedback review from ${fb.user_name}?`)) {
                            await fetch(`/api/feedback/${fb.id}`, { method: 'DELETE' });
                            setFeedback((prev) => prev.filter((item) => item.id !== fb.id));
                          }
                        }}
                        title="Delete spam/inappropriate feedback"
                        className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {fb.programme_name && (
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                      Programme: {fb.programme_name}
                    </p>
                  )}
                  <p className="text-slate-600 dark:text-slate-300 italic">"{fb.comment}"</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Student Account Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Edit {editingUser.role === 'administrator' ? 'Admin Account' : 'Student Record'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Correct student ID, faculty, major, or profile info
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {editingUser.role === 'student' ? '7-digits + @student.uow.edu.my' : '@uow.edu.my'}
                  </span>
                </label>
                <input
                  type="email"
                  required
                  placeholder={editingUser.role === 'student' ? '0135510@student.uow.edu.my' : 'admin@uow.edu.my'}
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white font-mono font-medium"
                />
              </div>

              {editingUser.role === 'student' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Student ID Number (7-digit ID)</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Editable for misinput correction</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0135510"
                    maxLength={7}
                    value={editFormData.student_id}
                    onChange={(e) => setEditFormData({ ...editFormData, student_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white font-mono font-bold"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Staff / Admin Identifier</label>
                  <input
                    type="text"
                    required
                    value={editFormData.staff_id}
                    onChange={(e) => setEditFormData({ ...editFormData, staff_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white font-mono font-bold"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Preferred Nickname (Optional)</label>
                <input
                  type="text"
                  value={editFormData.nickname}
                  onChange={(e) => setEditFormData({ ...editFormData, nickname: e.target.value })}
                  placeholder="e.g. Alex"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white font-medium"
                />
              </div>

              {editingUser.role === 'student' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Enrolled Faculty</label>
                    <input
                      type="text"
                      value={editFormData.faculty_name}
                      onChange={(e) => setEditFormData({ ...editFormData, faculty_name: e.target.value })}
                      placeholder="e.g. School of Computing & Creative Media (FOCM)"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Academic Major / Programme</label>
                    <input
                      type="text"
                      value={editFormData.programme_name}
                      onChange={(e) => setEditFormData({ ...editFormData, programme_name: e.target.value })}
                      placeholder="e.g. Bachelor of Computer Science (Hons) in Software Engineering"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white font-medium"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Profile Photo URL (Optional)</label>
                <input
                  type="text"
                  value={editFormData.photo_url}
                  onChange={(e) => setEditFormData({ ...editFormData, photo_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white font-medium"
                />
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                  <span>Reset Student Password (Optional)</span>
                </label>
                <input
                  type="text"
                  value={editFormData.new_password}
                  onChange={(e) => setEditFormData({ ...editFormData, new_password: e.target.value })}
                  placeholder="Leave blank to retain current password"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none dark:text-white font-medium"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingEdit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/80">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete User Account</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Irreversible institutional operation</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to permanently remove the account for <strong>{deletingUser.name}</strong> ({deletingUser.email})? This will delete their saved recommendations and advisor session records.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmittingDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmittingDelete ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* Detailed Student / User Card with "Show More" Full Details Toggle */
interface UserDetailCardProps {
  user: User;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

const UserDetailCard: React.FC<UserDetailCardProps> = ({
  user,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  canDelete,
}) => {
  const isStudent = user.role === 'student';

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3 text-xs transition-all shadow-2xs hover:border-blue-300 dark:hover:border-blue-700">
      {/* Top Profile Summary */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center space-x-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-xs overflow-hidden shrink-0 ${
              user.role === 'administrator' ? 'bg-indigo-600' : 'bg-blue-600'
            }`}
          >
            {user.photo_url ? (
              <img src={user.photo_url} alt={user.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            ) : (
              (user.nickname || user.name).charAt(0)
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{user.name}</h4>
              {user.nickname && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                  "{user.nickname}"
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1 mt-0.5">
              <Mail className="w-3.5 h-3.5" />
              <span className="truncate max-w-[180px]">{user.email}</span>
            </p>
          </div>
        </div>

        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
            user.role === 'administrator'
              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300'
          }`}
        >
          {user.role === 'administrator' ? 'Admin' : 'Student'}
        </span>
      </div>

      {/* Primary Identifiers */}
      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400">
        <span className="flex items-center space-x-1 font-mono font-bold text-slate-900 dark:text-white">
          <IdCard className="w-3.5 h-3.5 text-blue-500" />
          <span>{isStudent ? `Student ID: ${user.student_id || 'Not set'}` : `Staff ID: ${user.staff_id || 'ADM-01'}`}</span>
        </span>
        {user.programme_name && (
          <span className="font-medium text-blue-600 dark:text-blue-400 truncate max-w-[170px]">
            {user.programme_name}
          </span>
        )}
      </div>

      {/* Expandable Full Student Details Area */}
      {isExpanded && (
        <div className="pt-3 mt-2 border-t border-dashed border-slate-200 dark:border-slate-700 space-y-2.5 bg-white/70 dark:bg-slate-900/70 p-3.5 rounded-xl animate-in fade-in duration-150">
          <h5 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Full Student Profile & Enrolment Information
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80">
              <span className="text-[10px] text-slate-400 font-semibold block">Official Student ID</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{user.student_id || 'None (Unassigned)'}</span>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80">
              <span className="text-[10px] text-slate-400 font-semibold block">Preferred Display Name</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{user.nickname || user.name}</span>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 sm:col-span-2">
              <span className="text-[10px] text-slate-400 font-semibold block flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-400" />
                Faculty / School
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {user.faculty_name || 'School of Computing & Creative Media (FOCM)'}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 sm:col-span-2">
              <span className="text-[10px] text-slate-400 font-semibold block flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-slate-400" />
                Degree Programme
              </span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {user.programme_name || 'Bachelor of Computer Science (Hons)'}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 sm:col-span-2">
              <span className="text-[10px] text-slate-400 font-semibold block flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                Registration Timestamp
              </span>
              <span className="font-mono text-slate-600 dark:text-slate-400">
                {user.created_at ? new Date(user.created_at).toLocaleString() : 'Active Enrolment'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons: Show More, Edit (Misinput Fix), Delete */}
      <div className="pt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onToggleExpand}
          className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 cursor-pointer"
        >
          <span>{isExpanded ? 'Show Less' : 'Show More Details'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={onEdit}
            className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 font-bold text-[11px] flex items-center space-x-1 transition-colors border border-blue-200/80 dark:border-blue-800 cursor-pointer"
            title="Edit student ID or details incase of misinput"
          >
            <Edit2 className="w-3 h-3" />
            <span>Edit</span>
          </button>

          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-400 text-[11px] flex items-center transition-colors border border-rose-200/80 dark:border-rose-800 cursor-pointer"
              title="Delete account"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
