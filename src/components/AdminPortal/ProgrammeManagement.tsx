import React, { useState, useEffect } from 'react';
import { Programme, Faculty, RequirementProfile } from '../../types';
import { safeFetchJson } from '../../lib/apiUtils';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Building2,
  Cpu,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  Clock,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const ProgrammeManagement: React.FC = () => {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [requirementProfiles, setRequirementProfiles] = useState<RequirementProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProg, setEditingProg] = useState<Programme | null>(null);
  const [viewingProg, setViewingProg] = useState<Programme | null>(null);
  const [deletingProg, setDeletingProg] = useState<Programme | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    faculty_id: '',
    requirement_profile_id: '',
    code: '',
    name: '',
    description: '',
    duration_years: 3,
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [progRes, facRes, reqRes] = await Promise.all([
        safeFetchJson<Programme[]>('/api/programmes'),
        safeFetchJson<Faculty[]>('/api/faculties'),
        safeFetchJson<RequirementProfile[]>('/api/requirement-profiles'),
      ]);

      if (!progRes.ok || !facRes.ok || !reqRes.ok) {
        throw new Error(progRes.error || facRes.error || reqRes.error || 'Failed to fetch programme data from backend server.');
      }

      setProgrammes(Array.isArray(progRes.data) ? progRes.data : []);
      setFaculties(Array.isArray(facRes.data) ? facRes.data : []);
      setRequirementProfiles(Array.isArray(reqRes.data) ? reqRes.data : []);
    } catch (err: any) {
      setError(err.message || 'Error loading programmes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingProg(null);
    setFormData({
      faculty_id: faculties.length > 0 ? String(faculties[0].id) : '',
      requirement_profile_id: requirementProfiles.length > 0 ? String(requirementProfiles[0].id) : '',
      code: '',
      name: '',
      description: '',
      duration_years: 3,
      is_active: true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prog: Programme) => {
    setEditingProg(prog);
    setFormData({
      faculty_id: String(prog.faculty_id),
      requirement_profile_id: prog.requirement_profile_id ? String(prog.requirement_profile_id) : '',
      code: prog.code,
      name: prog.name,
      description: prog.description || '',
      duration_years: prog.duration_years,
      is_active: prog.is_active,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.faculty_id) errors.faculty_id = 'Faculty selection is required.';
    if (!formData.code.trim()) errors.code = 'Programme Code is required (e.g., BCS-SE).';
    if (!formData.name.trim()) errors.name = 'Programme Name is required.';
    if (formData.duration_years < 1 || formData.duration_years > 6) {
      errors.duration_years = 'Duration must be between 1 and 6 years.';
    }

    // Check code uniqueness
    const exists = programmes.some(
      (p) =>
        p.code.toLowerCase() === formData.code.trim().toLowerCase() &&
        (!editingProg || p.id !== editingProg.id)
    );
    if (exists) {
      errors.code = 'Programme Code must be unique. A programme with this code already exists.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const url = editingProg ? `/api/programmes/${editingProg.id}` : '/api/programmes';
      const method = editingProg ? 'PUT' : 'POST';

      const payload = {
        faculty_id: Number(formData.faculty_id),
        requirement_profile_id: formData.requirement_profile_id ? Number(formData.requirement_profile_id) : null,
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        duration_years: Number(formData.duration_years),
        is_active: formData.is_active,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error saving programme');
      }

      setSuccessMsg(editingProg ? 'Programme updated successfully!' : 'New programme created successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit form');
    }
  };

  const handleDelete = async () => {
    if (!deletingProg) return;
    try {
      const res = await fetch(`/api/programmes/${deletingProg.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete programme');
      }
      setSuccessMsg(`Programme "${deletingProg.name}" removed successfully.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setDeletingProg(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Delete operation failed');
      setDeletingProg(null);
    }
  };

  const handleToggleStatus = async (prog: Programme) => {
    try {
      const res = await fetch(`/api/programmes/${prog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !prog.is_active }),
      });
      if (!res.ok) throw new Error('Status update failed');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Filter logic
  const filteredProgrammes = programmes.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.faculty && p.faculty.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFaculty = selectedFacultyId === 'all' || p.faculty_id === Number(selectedFacultyId);
    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'active' && p.is_active) ||
      (selectedStatus === 'inactive' && !p.is_active);

    return matchesSearch && matchesFaculty && matchesStatus;
  });

  return (
    <div className="max-w-[1550px] w-full mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300">
              <BookOpen className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Academic Programme Management</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage UOW Malaysia academic programmes and map each programme to its required hardware specification profile.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Programme</span>
          </button>
        </div>
      </div>

      {/* Alert Notifications */}
      {successMsg && (
        <div className="flex items-center space-x-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 dark:text-rose-400 hover:underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Key Metric Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total Programmes</span>
            <BookOpen className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{programmes.length}</div>
          <p className="text-xs text-slate-400 mt-1">Across all UOW faculties</p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Active Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {programmes.filter((p) => p.is_active).length}
          </div>
          <p className="text-xs text-slate-400 mt-1">Available in student wizard</p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Mapped Profiles</span>
            <Cpu className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
            {programmes.filter((p) => p.requirement_profile_id !== null).length}
          </div>
          <p className="text-xs text-slate-400 mt-1">Linked to spec requirements</p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Faculties Count</span>
            <Building2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{faculties.length}</div>
          <p className="text-xs text-slate-400 mt-1">Academic faculties</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by programme code, name, or faculty..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedFacultyId}
              onChange={(e) => setSelectedFacultyId(e.target.value)}
              className="py-2 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Faculties</option>
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.code} - {f.name}
                </option>
              ))}
            </select>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-2 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Programme Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
            <p>Loading academic programmes...</p>
          </div>
        ) : filteredProgrammes.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No Programmes Found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              No academic programmes match your current filter criteria. Try clearing search filters or add a new programme.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5 whitespace-nowrap w-36">Code</th>
                  <th className="py-3.5 px-5 min-w-[220px]">Programme Name</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Faculty</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Requirement Profile</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Duration</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {filteredProgrammes.map((prog) => (
                  <tr key={prog.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Code Badge */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <span className="font-mono font-bold text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/90 text-blue-700 dark:text-blue-300 border border-slate-200 dark:border-slate-700 inline-block whitespace-nowrap shadow-xs tracking-wide">
                        {prog.code}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="py-4 px-5">
                      <div className="font-semibold text-slate-900 dark:text-white">{prog.name}</div>
                      {prog.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs mt-0.5">
                          {prog.description}
                        </p>
                      )}
                    </td>

                    {/* Faculty */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      {prog.faculty ? (
                        <div className="flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-300">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium whitespace-nowrap">{prog.faculty.code}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 whitespace-nowrap">Unassigned</span>
                      )}
                    </td>

                    {/* Requirement Profile Link */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      {prog.requirement_profile ? (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 whitespace-nowrap">
                          <Cpu className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span className="whitespace-nowrap">{prog.requirement_profile.name}</span>
                        </span>
                      ) : (
                        <span className="text-xs italic text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 whitespace-nowrap">
                          Needs Profile Mapping
                        </span>
                      )}
                    </td>

                    {/* Duration */}
                    <td className="py-4 px-5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      <div className="flex items-center space-x-1 whitespace-nowrap">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{prog.duration_years} Years</span>
                      </div>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(prog)}
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          prog.is_active
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {prog.is_active ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setViewingProg(prog)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="View Details & Requirements"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(prog)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          title="Edit Programme"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingProg(prog)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                          title="Delete Programme"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT PROGRAMME MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingProg ? 'Edit Academic Programme' : 'Add New Academic Programme'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Faculty Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Faculty <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.faculty_id}
                  onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- Select Faculty --</option>
                  {faculties.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.code})
                    </option>
                  ))}
                </select>
                {formErrors.faculty_id && <p className="text-xs text-rose-500 mt-1">{formErrors.faculty_id}</p>}
              </div>

              {/* Requirement Profile Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hardware Requirement Profile Mapping
                </label>
                <select
                  value={formData.requirement_profile_id}
                  onChange={(e) => setFormData({ ...formData, requirement_profile_id: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- Unassigned / Select Profile --</option>
                  {requirementProfiles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (Min RAM: {r.minimum_ram_gb}GB)
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Determines the baseline CPU, GPU, RAM & SSD hardware rules used during recommendation scoring.
                </p>
              </div>

              {/* Code & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="BCS-SE"
                    className="w-full py-2.5 px-3 rounded-xl text-sm uppercase bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  {formErrors.code && <p className="text-xs text-rose-500 mt-1">{formErrors.code}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Programme Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Bachelor of Computer Science (Hons) in..."
                    className="w-full py-2.5 px-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  {formErrors.name && <p className="text-xs text-rose-500 mt-1">{formErrors.name}</p>}
                </div>
              </div>

              {/* Duration & Active */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duration (Years)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={formData.duration_years}
                    onChange={(e) => setFormData({ ...formData, duration_years: Number(e.target.value) })}
                    className="w-full py-2.5 px-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                  {formErrors.duration_years && <p className="text-xs text-rose-500 mt-1">{formErrors.duration_years}</p>}
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      Active (Visible to Students)
                    </span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Overview of syllabus, tools used, and career path..."
                  className="w-full py-2 px-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* Submit Controls */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md shadow-blue-500/20"
                >
                  {editingProg ? 'Update Programme' : 'Save Programme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PROGRAMME DETAILS & REQUIREMENT SPECIFICATIONS MODAL */}
      {viewingProg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                  {viewingProg.code}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{viewingProg.name}</h3>
              </div>
              <button onClick={() => setViewingProg(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                <div>
                  <span className="text-xs text-slate-400 block">Faculty</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {viewingProg.faculty ? viewingProg.faculty.name : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Duration</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {viewingProg.duration_years} Years Academic Course
                  </span>
                </div>
              </div>

              {viewingProg.requirement_profile ? (
                <div className="border border-indigo-200 dark:border-indigo-900/80 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                      <Cpu className="w-4 h-4" />
                      <span>Requirement Profile: {viewingProg.requirement_profile.name}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {viewingProg.requirement_profile.explanation}
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                      <span className="font-semibold text-blue-600 dark:text-blue-400 block mb-1">
                        Minimum Specs Needed
                      </span>
                      <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                        <li>
                          <strong>CPU:</strong> {viewingProg.requirement_profile.minimum_cpu}
                        </li>
                        <li>
                          <strong>RAM:</strong> {viewingProg.requirement_profile.minimum_ram_gb} GB
                        </li>
                        <li>
                          <strong>Storage:</strong> {viewingProg.requirement_profile.minimum_storage_gb} GB SSD
                        </li>
                        <li>
                          <strong>GPU:</strong> {viewingProg.requirement_profile.minimum_gpu}
                        </li>
                      </ul>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">
                        Recommended Target Specs
                      </span>
                      <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                        <li>
                          <strong>CPU:</strong> {viewingProg.requirement_profile.recommended_cpu}
                        </li>
                        <li>
                          <strong>RAM:</strong> {viewingProg.requirement_profile.recommended_ram_gb} GB
                        </li>
                        <li>
                          <strong>Storage:</strong> {viewingProg.requirement_profile.recommended_storage_gb} GB SSD
                        </li>
                        <li>
                          <strong>GPU:</strong> {viewingProg.requirement_profile.recommended_gpu}
                        </li>
                      </ul>
                    </div>
                  </div>

                  {viewingProg.requirement_profile.software_examples && (
                    <div className="pt-1 text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Course Software Examples: </span>
                      <span className="text-slate-600 dark:text-slate-400">
                        {viewingProg.requirement_profile.software_examples}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs">
                  This programme currently does not have a linked hardware requirement profile. Please edit the programme and assign a profile to enable recommendation scoring.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setViewingProg(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingProg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Academic Programme?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to remove <strong className="text-slate-800 dark:text-slate-200">"{deletingProg.name}"</strong> ({deletingProg.code})? Students will no longer be able to select this programme during recommendations.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setDeletingProg(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white shadow-md shadow-rose-500/20"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
