import React, { useState, useEffect } from 'react';
import { Faculty } from '../../types';
import { safeFetchJson } from '../../lib/apiUtils';
import { Building2, Plus, Edit2, Trash2, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

export const FacultyManagement: React.FC = () => {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '', is_active: true });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFaculties();
  }, []);

  const fetchFaculties = async () => {
    setLoading(true);
    try {
      const res = await safeFetchJson<Faculty[]>('/api/faculties');
      if (res.ok && Array.isArray(res.data)) setFaculties(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (fac?: Faculty) => {
    if (fac) {
      setEditingFaculty(fac);
      setFormData({ name: fac.name, code: fac.code, description: fac.description || '', is_active: fac.is_active });
    } else {
      setEditingFaculty(null);
      setFormData({ name: '', code: '', description: '', is_active: true });
    }
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingFaculty ? `/api/faculties/${editingFaculty.id}` : '/api/faculties';
      const method = editingFaculty ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to save faculty');
      setIsModalOpen(false);
      fetchFaculties();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/faculties/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Cannot delete faculty');
      }
      fetchFaculties();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-[1550px] w-full mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <span>Faculty Management</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage UOW Malaysia faculties and academic schools.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-md shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Faculty</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {faculties.map((fac) => (
          <div key={fac.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                  {fac.code}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${fac.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {fac.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex space-x-1">
                <button onClick={() => handleOpenModal(fac)} className="p-1.5 text-slate-500 hover:text-blue-600">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(fac.id)} className="p-1.5 text-slate-500 hover:text-rose-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white">{fac.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{fac.description || 'No description provided.'}</p>
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              {fac.programmes_count || 0} Academic Programmes Assigned
            </p>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Faculty Code</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="FOCM"
                  className="w-full py-2 px-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Faculty Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="School of Computing & Creative Media"
                  className="w-full py-2 px-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  id="fac_active"
                />
                <label htmlFor="fac_active" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Active Faculty
                </label>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs text-slate-600">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
