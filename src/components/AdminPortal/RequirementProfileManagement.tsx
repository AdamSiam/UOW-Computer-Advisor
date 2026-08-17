import React, { useState, useEffect } from 'react';
import { RequirementProfile } from '../../types';
import { safeFetchJson } from '../../lib/apiUtils';
import {
  Cpu,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Search,
  Layers,
  Sparkles,
  AlertCircle,
  X,
  XCircle,
  HardDrive,
  Check,
  RefreshCw,
  Info,
} from 'lucide-react';

export const RequirementProfileManagement: React.FC = () => {
  const [profiles, setProfiles] = useState<RequirementProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<RequirementProfile | null>(null);
  const [deletingProfile, setDeletingProfile] = useState<RequirementProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    explanation: '',
    software_examples: '',
    minimum_cpu: '',
    recommended_cpu: '',
    minimum_cpu_tier: 3,
    recommended_cpu_tier: 4,
    minimum_ram_gb: 16,
    recommended_ram_gb: 32,
    minimum_storage_gb: 512,
    recommended_storage_gb: 1000,
    minimum_gpu: '',
    recommended_gpu: '',
    minimum_gpu_tier: 1,
    recommended_gpu_tier: 3,
    is_active: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await safeFetchJson<RequirementProfile[]>('/api/requirement-profiles');
      if (res.ok && Array.isArray(res.data)) {
        setProfiles(res.data);
      } else {
        throw new Error(res.error || 'Failed to fetch requirement profiles');
      }
    } catch (e: any) {
      setError(e.message || 'Error fetching requirement rules');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingProfile(null);
    setFormData({
      name: '',
      description: '',
      explanation: '',
      software_examples: '',
      minimum_cpu: 'Intel Core i5 / AMD Ryzen 5',
      recommended_cpu: 'Intel Core i7 / AMD Ryzen 7 / Apple M2',
      minimum_cpu_tier: 3,
      recommended_cpu_tier: 4,
      minimum_ram_gb: 16,
      recommended_ram_gb: 32,
      minimum_storage_gb: 512,
      recommended_storage_gb: 1000,
      minimum_gpu: 'Integrated Graphics (Iris Xe / Radeon)',
      recommended_gpu: 'Dedicated GPU (NVIDIA RTX 4060)',
      minimum_gpu_tier: 1,
      recommended_gpu_tier: 3,
      is_active: true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prof: RequirementProfile) => {
    setEditingProfile(prof);
    setFormData({
      name: prof.name || '',
      description: prof.description || '',
      explanation: prof.explanation || '',
      software_examples: prof.software_examples || '',
      minimum_cpu: prof.minimum_cpu || '',
      recommended_cpu: prof.recommended_cpu || '',
      minimum_cpu_tier: prof.minimum_cpu_tier || 3,
      recommended_cpu_tier: prof.recommended_cpu_tier || 4,
      minimum_ram_gb: prof.minimum_ram_gb || 16,
      recommended_ram_gb: prof.recommended_ram_gb || 32,
      minimum_storage_gb: prof.minimum_storage_gb || 512,
      recommended_storage_gb: prof.recommended_storage_gb || 1000,
      minimum_gpu: prof.minimum_gpu || '',
      recommended_gpu: prof.recommended_gpu || '',
      minimum_gpu_tier: prof.minimum_gpu_tier !== undefined ? prof.minimum_gpu_tier : 1,
      recommended_gpu_tier: prof.recommended_gpu_tier !== undefined ? prof.recommended_gpu_tier : 3,
      is_active: prof.is_active ?? true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Profile name is required';
    if (!formData.minimum_cpu.trim()) errors.minimum_cpu = 'Minimum CPU required';
    if (!formData.recommended_cpu.trim()) errors.recommended_cpu = 'Recommended CPU required';
    if (!formData.minimum_gpu.trim()) errors.minimum_gpu = 'Minimum GPU required';
    if (!formData.recommended_gpu.trim()) errors.recommended_gpu = 'Recommended GPU required';
    if (formData.minimum_ram_gb <= 0) errors.minimum_ram_gb = 'RAM must be > 0 GB';
    if (formData.recommended_ram_gb < formData.minimum_ram_gb) {
      errors.recommended_ram_gb = 'Recommended RAM should be ≥ Minimum RAM';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    setError(null);

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      explanation: formData.explanation.trim() || formData.description.trim() || null,
      software_examples: formData.software_examples.trim() || null,
      minimum_cpu: formData.minimum_cpu.trim(),
      recommended_cpu: formData.recommended_cpu.trim(),
      minimum_cpu_tier: Number(formData.minimum_cpu_tier),
      recommended_cpu_tier: Number(formData.recommended_cpu_tier),
      minimum_ram_gb: Number(formData.minimum_ram_gb),
      recommended_ram_gb: Number(formData.recommended_ram_gb),
      minimum_storage_gb: Number(formData.minimum_storage_gb),
      recommended_storage_gb: Number(formData.recommended_storage_gb),
      minimum_gpu: formData.minimum_gpu.trim(),
      recommended_gpu: formData.recommended_gpu.trim(),
      minimum_gpu_tier: Number(formData.minimum_gpu_tier),
      recommended_gpu_tier: Number(formData.recommended_gpu_tier),
      is_active: formData.is_active,
    };

    try {
      const url = editingProfile
        ? `/api/requirement-profiles/${editingProfile.id}`
        : '/api/requirement-profiles';
      const method = editingProfile ? 'PUT' : 'POST';

      const res = await safeFetchJson<RequirementProfile>(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok && res.data) {
        setSuccessMsg(
          editingProfile
            ? `Successfully updated profile "${res.data.name}"!`
            : `Successfully created requirement profile "${res.data.name}"!`
        );
        setIsModalOpen(false);
        fetchProfiles();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        throw new Error(res.error || 'Error saving requirement profile rule');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with backend server');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProfile) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await safeFetchJson(`/api/requirement-profiles/${deletingProfile.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSuccessMsg(`Requirement Profile "${deletingProfile.name}" deleted.`);
        setDeletingProfile(null);
        fetchProfiles();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        throw new Error(res.error || 'Failed to delete requirement profile');
      }
    } catch (err: any) {
      setError(err.message || 'Error deleting profile');
      setDeletingProfile(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (prof: RequirementProfile) => {
    try {
      const res = await safeFetchJson<RequirementProfile>(`/api/requirement-profiles/${prof.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !prof.is_active }),
      });
      if (res.ok) {
        setSuccessMsg(
          `Profile "${prof.name}" status set to ${!prof.is_active ? 'Active' : 'Inactive'}.`
        );
        fetchProfiles();
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProfiles = profiles.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.explanation && p.explanation.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.software_examples && p.software_examples.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-[1550px] w-full mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            <span>Requirement Profiles Management</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure minimum and recommended CPU, GPU, RAM, and SSD hardware rules mapped to computing majors.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Requirement Profile</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 text-xs border border-red-200 dark:border-red-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs border border-emerald-200 dark:border-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center space-x-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search profiles by name, software, or spec keywords..."
          className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600 text-xs font-medium">
            Clear
          </button>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="p-12 text-center text-sm font-medium text-slate-500 flex items-center justify-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
          <span>Loading requirement rules from backend server...</span>
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Layers className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Requirement Profiles Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchTerm ? `No profiles match "${searchTerm}".` : 'Get started by adding your first hardware rule profile.'}
          </p>
        </div>
      ) : (
        /* Profiles Cards Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProfiles.map((prof) => (
            <div
              key={prof.id}
              className={`bg-white dark:bg-slate-900 p-6 rounded-2xl border transition-all shadow-xs space-y-4 flex flex-col justify-between ${
                prof.is_active
                  ? 'border-slate-200 dark:border-slate-800'
                  : 'border-slate-200/60 dark:border-slate-800/60 opacity-75 bg-slate-50/50 dark:bg-slate-900/50'
              }`}
            >
              <div className="space-y-3">
                {/* Profile Card Header */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                      <span>{prof.name}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{prof.description}</p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(prof)}
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold border transition-colors cursor-pointer ${
                        prof.is_active
                          ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                      }`}
                      title="Click to toggle active status"
                    >
                      {prof.is_active ? 'Active Rule' : 'Inactive'}
                    </button>

                    {/* EDIT RULE BUTTON */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(prof)}
                      className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer flex items-center space-x-1 text-xs font-bold shadow-xs"
                      title="Edit Requirement Rule Specs"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Rule</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingProfile(prof)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950/50 text-slate-400 hover:text-red-600 transition-all cursor-pointer"
                      title="Delete profile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {prof.explanation && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/70 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    {prof.explanation}
                  </p>
                )}

                {/* Minimum vs Recommended Specs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-blue-50/60 dark:bg-blue-950/30 p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/50 space-y-1.5">
                    <span className="font-bold text-blue-800 dark:text-blue-300 block text-[11px] uppercase tracking-wider">
                      Minimum Baseline
                    </span>
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong className="text-slate-900 dark:text-white">CPU:</strong> {prof.minimum_cpu}
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong className="text-slate-900 dark:text-white">RAM:</strong> {prof.minimum_ram_gb} GB
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong className="text-slate-900 dark:text-white">Storage:</strong> {prof.minimum_storage_gb} GB
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong className="text-slate-900 dark:text-white">GPU:</strong> {prof.minimum_gpu}
                    </p>
                  </div>

                  <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/50 space-y-1.5">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 block text-[11px] uppercase tracking-wider">
                      Recommended Target
                    </span>
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong className="text-slate-900 dark:text-white">CPU:</strong> {prof.recommended_cpu}
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong className="text-slate-900 dark:text-white">RAM:</strong> {prof.recommended_ram_gb} GB
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong className="text-slate-900 dark:text-white">Storage:</strong> {prof.recommended_storage_gb} GB
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong className="text-slate-900 dark:text-white">GPU:</strong> {prof.recommended_gpu}
                    </p>
                  </div>
                </div>

                {prof.software_examples && (
                  <div className="pt-1">
                    <p className="text-[11px] text-slate-500 font-medium">
                      <strong className="text-slate-700 dark:text-slate-300">Required Software:</strong>{' '}
                      {prof.software_examples}
                    </p>
                  </div>
                )}
              </div>

              {/* Card Footer Bar */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  Rule ID: #{prof.id}
                </span>

                <button
                  type="button"
                  onClick={() => handleOpenEditModal(prof)}
                  className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Configure Active Specs</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT / CREATE REQUIREMENT PROFILE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
            <div className="p-6 bg-indigo-900 text-white flex items-center justify-between border-b border-indigo-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-800/80 border border-indigo-700 flex items-center justify-center shrink-0">
                  <Edit2 className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editingProfile ? `Edit Active Rule: ${editingProfile.name}` : 'Create Requirement Profile'}
                  </h2>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    Define hardware thresholds used by the AI Recommendation Engine for student computing majors.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-indigo-800 text-indigo-200 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Profile Meta */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center space-x-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>1. Profile Overview & Software Stack</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Requirement Profile Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Software Engineering Profile"
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none ${
                        formErrors.name ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                      }`}
                    />
                    {formErrors.name && <p className="text-[10px] text-red-500 mt-1">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Rule Active Status
                    </label>
                    <select
                      value={formData.is_active ? 'active' : 'inactive'}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                    >
                      <option value="active">Active (Enforce in Recommendations)</option>
                      <option value="inactive">Inactive (Draft / Archived)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Guidance Explanation / Description
                  </label>
                  <textarea
                    rows={2}
                    value={formData.explanation}
                    onChange={(e) => setFormData({ ...formData, explanation: e.target.value, description: e.target.value })}
                    placeholder="Briefly explain why these hardware specifications are required for this computing discipline..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Software Tools & Framework Examples
                  </label>
                  <input
                    type="text"
                    value={formData.software_examples}
                    onChange={(e) => setFormData({ ...formData, software_examples: e.target.value })}
                    placeholder="e.g. IntelliJ IDEA, Docker, Android Studio, Unity 3D, VS Code"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* Minimum Specs Section */}
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 space-y-4">
                <h3 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center space-x-1">
                  <span>2. Minimum Baseline Hardware Requirements</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Minimum CPU Description *
                    </label>
                    <input
                      type="text"
                      value={formData.minimum_cpu}
                      onChange={(e) => setFormData({ ...formData, minimum_cpu: e.target.value })}
                      placeholder="e.g. Intel Core i5 / AMD Ryzen 5"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Minimum CPU Tier (1-5)
                    </label>
                    <select
                      value={formData.minimum_cpu_tier}
                      onChange={(e) => setFormData({ ...formData, minimum_cpu_tier: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                    >
                      <option value={1}>Tier 1 - Entry (Celeron / i3)</option>
                      <option value={2}>Tier 2 - Basic (Core i3 / Ryzen 3)</option>
                      <option value={3}>Tier 3 - Mid Performance (Core i5 / Ryzen 5 / M1)</option>
                      <option value={4}>Tier 4 - High Performance (Core i7 / Ryzen 7 / M2/M3)</option>
                      <option value={5}>Tier 5 - Extreme (Core i9 / Ryzen 9 / M3 Max)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Minimum RAM (GB)
                    </label>
                    <input
                      type="number"
                      value={formData.minimum_ram_gb}
                      onChange={(e) => setFormData({ ...formData, minimum_ram_gb: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Minimum Storage (GB SSD)
                    </label>
                    <input
                      type="number"
                      value={formData.minimum_storage_gb}
                      onChange={(e) => setFormData({ ...formData, minimum_storage_gb: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Minimum GPU Description *
                    </label>
                    <input
                      type="text"
                      value={formData.minimum_gpu}
                      onChange={(e) => setFormData({ ...formData, minimum_gpu: e.target.value })}
                      placeholder="e.g. Integrated Graphics (Iris Xe / Vega)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Minimum GPU Tier (0-5)
                    </label>
                    <select
                      value={formData.minimum_gpu_tier}
                      onChange={(e) => setFormData({ ...formData, minimum_gpu_tier: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                    >
                      <option value={0}>Tier 0 - Basic Integrated (UHD)</option>
                      <option value={1}>Tier 1 - Iris Xe / Vega Graphics</option>
                      <option value={2}>Tier 2 - Entry Dedicated (RTX 3050/4050)</option>
                      <option value={3}>Tier 3 - Mid 3D/AI (RTX 3060/4060)</option>
                      <option value={4}>Tier 4 - Pro 3D (RTX 4070)</option>
                      <option value={5}>Tier 5 - Extreme (RTX 4080/4090)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Recommended Specs Section */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 space-y-4">
                <h3 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider flex items-center space-x-1">
                  <span>3. Recommended Target Specifications</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Recommended CPU Description *
                    </label>
                    <input
                      type="text"
                      value={formData.recommended_cpu}
                      onChange={(e) => setFormData({ ...formData, recommended_cpu: e.target.value })}
                      placeholder="e.g. Intel Core i7 / AMD Ryzen 7 / Apple M2"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Recommended CPU Tier (1-5)
                    </label>
                    <select
                      value={formData.recommended_cpu_tier}
                      onChange={(e) => setFormData({ ...formData, recommended_cpu_tier: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                    >
                      <option value={1}>Tier 1 - Entry (Celeron / i3)</option>
                      <option value={2}>Tier 2 - Basic (Core i3 / Ryzen 3)</option>
                      <option value={3}>Tier 3 - Mid Performance (Core i5 / Ryzen 5 / M1)</option>
                      <option value={4}>Tier 4 - High Performance (Core i7 / Ryzen 7 / M2/M3)</option>
                      <option value={5}>Tier 5 - Extreme (Core i9 / Ryzen 9 / M3 Max)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Recommended RAM (GB)
                    </label>
                    <input
                      type="number"
                      value={formData.recommended_ram_gb}
                      onChange={(e) => setFormData({ ...formData, recommended_ram_gb: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                    />
                    {formErrors.recommended_ram_gb && (
                      <p className="text-[10px] text-red-500 mt-1">{formErrors.recommended_ram_gb}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Recommended Storage (GB SSD)
                    </label>
                    <input
                      type="number"
                      value={formData.recommended_storage_gb}
                      onChange={(e) => setFormData({ ...formData, recommended_storage_gb: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Recommended GPU Description *
                    </label>
                    <input
                      type="text"
                      value={formData.recommended_gpu}
                      onChange={(e) => setFormData({ ...formData, recommended_gpu: e.target.value })}
                      placeholder="e.g. Dedicated GPU (NVIDIA RTX 4060)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Recommended GPU Tier (0-5)
                    </label>
                    <select
                      value={formData.recommended_gpu_tier}
                      onChange={(e) => setFormData({ ...formData, recommended_gpu_tier: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                    >
                      <option value={0}>Tier 0 - Basic Integrated (UHD)</option>
                      <option value={1}>Tier 1 - Iris Xe / Vega Graphics</option>
                      <option value={2}>Tier 2 - Entry Dedicated (RTX 3050/4050)</option>
                      <option value={3}>Tier 3 - Mid 3D/AI (RTX 3060/4060)</option>
                      <option value={4}>Tier 4 - Pro 3D (RTX 4070)</option>
                      <option value={5}>Tier 5 - Extreme (RTX 4080/4090)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center space-x-2 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Saving Changes...' : editingProfile ? 'Update Requirement Rule' : 'Create Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deletingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Delete Requirement Profile?</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to delete profile <strong>"{deletingProfile.name}"</strong>? Note that profiles assigned to academic programmes cannot be deleted until unassigned.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingProfile(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20 cursor-pointer"
              >
                {isSaving ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
