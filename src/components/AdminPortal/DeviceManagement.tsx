import React, { useState, useEffect, useRef } from 'react';
import { Device, Brand } from '../../types';
import { safeFetchJson } from '../../lib/apiUtils';
import { HardDrive, Plus, Search, DollarSign, Cpu, Battery, Weight, Trash2, Edit2, Camera, Link as LinkIcon, Sparkles, FileSpreadsheet, Zap, Upload, Image as ImageIcon } from 'lucide-react';
import { ExcelImportModal } from './ExcelImportModal';

const PRESET_PHOTO_OPTIONS = [
  { label: 'Gaming RGB', url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop&q=80' },
  { label: 'Stealth Gaming', url: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&auto=format&fit=crop&q=80' },
  { label: 'Silver Ultrabook', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80' },
  { label: 'Space Gray', url: 'https://images.unsplash.com/photo-1511385348-a52b4a160dc2?w=800&auto=format&fit=crop&q=80' },
  { label: 'Office Laptop', url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=80' },
  { label: '2-in-1 Touch', url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80' },
];

export const DeviceManagement: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    brand_id: '',
    model: '',
    device_type: 'laptop',
    cpu_name: '',
    cpu_brand: 'Intel',
    cpu_tier: 3,
    gpu_name: '',
    gpu_brand: 'NVIDIA',
    gpu_tier: 3,
    ram_gb: 16,
    storage_gb: 512,
    storage_type: 'NVMe SSD',
    display_size: 15.6,
    weight_kg: 2.0,
    battery_life_hours: 6.0,
    ram_upgradeable: true,
    storage_upgradeable: true,
    price: 3500,
    image_url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600',
    purchase_url: '',
    source_name: 'Store',
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [dRes, bRes] = await Promise.all([
      safeFetchJson<Device[]>('/api/devices'),
      safeFetchJson<Brand[]>('/api/brands'),
    ]);
    if (dRes.ok && Array.isArray(dRes.data)) setDevices(dRes.data);
    if (bRes.ok && Array.isArray(bRes.data)) setBrands(bRes.data);
  };

  const handleOpenModal = (dev?: Device) => {
    if (dev) {
      setEditingDevice(dev);
      setFormData({
        brand_id: String(dev.brand_id),
        model: dev.model,
        device_type: dev.device_type,
        cpu_name: dev.cpu_name,
        cpu_brand: dev.cpu_brand,
        cpu_tier: dev.cpu_tier,
        gpu_name: dev.gpu_name,
        gpu_brand: dev.gpu_brand,
        gpu_tier: dev.gpu_tier,
        ram_gb: dev.ram_gb,
        storage_gb: dev.storage_gb,
        storage_type: dev.storage_type,
        display_size: dev.display_size,
        weight_kg: dev.weight_kg,
        battery_life_hours: dev.battery_life_hours,
        ram_upgradeable: dev.ram_upgradeable,
        storage_upgradeable: dev.storage_upgradeable,
        price: dev.price,
        image_url: dev.image_url || '',
        purchase_url: dev.purchase_url || '',
        source_name: dev.source_name || '',
        is_active: dev.is_active,
      });
    } else {
      setEditingDevice(null);
      setFormData({
        brand_id: brands.length > 0 ? String(brands[0].id) : '1',
        model: '',
        device_type: 'laptop',
        cpu_name: '',
        cpu_brand: 'Intel',
        cpu_tier: 3,
        gpu_name: '',
        gpu_brand: 'NVIDIA',
        gpu_tier: 3,
        ram_gb: 16,
        storage_gb: 512,
        storage_type: 'NVMe SSD',
        display_size: 15.6,
        weight_kg: 2.0,
        battery_life_hours: 6.0,
        ram_upgradeable: true,
        storage_upgradeable: true,
        price: 3500,
        image_url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600',
        purchase_url: '',
        source_name: 'Store',
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingDevice ? `/api/devices/${editingDevice.id}` : '/api/devices';
    const method = editingDevice ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setIsModalOpen(false);
      fetchData();
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this device from catalogue?')) {
      await fetch(`/api/devices/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  const filtered = devices.filter(
    (d) =>
      d.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.cpu_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-[1550px] w-full mx-auto space-y-6 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <HardDrive className="w-5 h-5 text-emerald-600" />
            <span>Computing Device Catalogue</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage computing laptop models, hardware specifications, and retail prices in RM.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExcelModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel Reader / Import</span>
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Single Device</span>
          </button>
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search laptops by model or CPU spec..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((dev) => (
          <div key={dev.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs space-y-3 p-5 flex flex-col justify-between">
            <div>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-3">
                <img
                  src={dev.image_url || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80'}
                  alt={dev.model}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('photo-1588872657578-7efd1f1555ed')) {
                      target.src = 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80';
                    }
                  }}
                  className="w-full h-full object-cover"
                />

                <span className="absolute top-2 right-2 px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-600 text-white shadow-md">
                  RM {dev.price.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                  {dev.brand ? dev.brand.name : 'Laptop'}
                </span>
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {dev.device_type}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    ⚡ {dev.battery_life_hours || 6}h Battery
                  </span>
                </div>
              </div>

              <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">{dev.model}</h3>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <strong>CPU:</strong> {dev.cpu_name}
                </div>
                <div>
                  <strong>RAM:</strong> {dev.ram_gb} GB {dev.ram_upgradeable ? '(Slot)' : '(Soldered)'}
                </div>
                <div>
                  <strong>Storage:</strong> {dev.storage_gb} GB {dev.storage_type || 'SSD'}
                </div>
                <div>
                  <strong>GPU:</strong> {dev.gpu_name}
                </div>
                <div>
                  <strong>Display:</strong> {dev.display_size || 15.6}" Screen
                </div>
                <div>
                  <strong>Weight:</strong> {dev.weight_kg || 2.0} kg
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => handleOpenModal(dev)} title="Edit Device" className="p-1.5 text-slate-500 hover:text-blue-600 cursor-pointer">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(dev.id)} title="Delete Device" className="p-1.5 text-slate-500 hover:text-rose-600 cursor-pointer">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl my-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingDevice ? 'Edit Device Specs' : 'Add New Device'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* SECTION 1: GENERAL INFO */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] text-blue-600 dark:text-blue-400">
                  1. General & Pricing
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">Brand</label>
                    <select
                      value={formData.brand_id}
                      onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Model Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. TUF Gaming A15"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Device Category</label>
                    <select
                      value={formData.device_type}
                      onChange={(e) => setFormData({ ...formData, device_type: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="laptop">Standard Laptop</option>
                      <option value="macbook">MacBook / macOS</option>
                      <option value="2-in-1">2-in-1 Convertible</option>
                      <option value="workstation">Mobile Workstation</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Price (MYR / RM)</label>
                    <input
                      type="number"
                      required
                      min={1000}
                      step={50}
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-blue-600 dark:text-blue-400"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: PORTABILITY & BATTERY LIFE */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] text-amber-600 dark:text-amber-400 flex items-center space-x-1">
                  <Battery className="w-3.5 h-3.5" />
                  <span>2. Battery Life & Portability</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold block mb-1 flex items-center justify-between">
                      <span>Battery Life (Hours)</span>
                      <span className="text-[10px] text-amber-500 font-bold">⚡ {formData.battery_life_hours}h</span>
                    </label>
                    <input
                      type="number"
                      required
                      step="0.5"
                      min="1"
                      max="24"
                      value={formData.battery_life_hours}
                      onChange={(e) => setFormData({ ...formData, battery_life_hours: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      min="0.5"
                      max="5"
                      value={formData.weight_kg}
                      onChange={(e) => setFormData({ ...formData, weight_kg: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Display Size (Inches)</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      min="11"
                      max="18"
                      value={formData.display_size}
                      onChange={(e) => setFormData({ ...formData, display_size: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: PROCESSOR & GRAPHICS */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center space-x-1">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>3. Processor & Graphics</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">CPU Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Intel Core i7-13700H"
                      value={formData.cpu_name}
                      onChange={(e) => setFormData({ ...formData, cpu_name: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">CPU Brand</label>
                    <select
                      value={formData.cpu_brand}
                      onChange={(e) => setFormData({ ...formData, cpu_brand: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="Intel">Intel</option>
                      <option value="AMD">AMD</option>
                      <option value="Apple">Apple</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">CPU Performance Tier (1-5)</label>
                    <select
                      value={formData.cpu_tier}
                      onChange={(e) => setFormData({ ...formData, cpu_tier: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <option value={1}>Tier 1 (Basic / Core i3 / Ryzen 3)</option>
                      <option value={2}>Tier 2 (Mid / Core i5 / Ryzen 5)</option>
                      <option value={3}>Tier 3 (High / Core i7 / Ryzen 7)</option>
                      <option value={4}>Tier 4 (Enthusiast / i9 / Ryzen 9 / M3 Pro)</option>
                      <option value={5}>Tier 5 (Extreme / M3 Max / Workstation)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">GPU Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. NVIDIA RTX 4050 6GB"
                      value={formData.gpu_name}
                      onChange={(e) => setFormData({ ...formData, gpu_name: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">GPU Brand</label>
                    <select
                      value={formData.gpu_brand}
                      onChange={(e) => setFormData({ ...formData, gpu_brand: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="NVIDIA">NVIDIA</option>
                      <option value="AMD">AMD</option>
                      <option value="Intel">Intel</option>
                      <option value="Apple">Apple</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">GPU Performance Tier (0-5)</label>
                    <select
                      value={formData.gpu_tier}
                      onChange={(e) => setFormData({ ...formData, gpu_tier: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <option value={0}>Tier 0 (Integrated Graphics)</option>
                      <option value={1}>Tier 1 (Iris Xe / Radeon Graphics)</option>
                      <option value={2}>Tier 2 (Entry Discrete GTX 1650/RTX 2050)</option>
                      <option value={3}>Tier 3 (Mid Gaming RTX 3050/4050)</option>
                      <option value={4}>Tier 4 (High 3D/AI RTX 4060/4070)</option>
                      <option value={5}>Tier 5 (Pro Studio RTX 4080/4090)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 4: MEMORY & STORAGE */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>4. Memory & Storage Specs</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <label className="font-semibold block">RAM (GB)</label>
                    <input
                      type="number"
                      required
                      min={8}
                      step={8}
                      value={formData.ram_gb}
                      onChange={(e) => setFormData({ ...formData, ram_gb: Number(e.target.value) })}
                      className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                    <label className="flex items-center space-x-2 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.ram_upgradeable}
                        onChange={(e) => setFormData({ ...formData, ram_upgradeable: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        RAM Upgradeable (SODIMM Slot)
                      </span>
                    </label>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold block">Storage (GB)</label>
                      <select
                        value={formData.storage_type}
                        onChange={(e) => setFormData({ ...formData, storage_type: e.target.value as any })}
                        className="text-[11px] p-1 rounded bg-white dark:bg-slate-900 border"
                      >
                        <option value="NVMe SSD">NVMe SSD</option>
                        <option value="SSD">Standard SSD</option>
                      </select>
                    </div>
                    <input
                      type="number"
                      required
                      min={256}
                      step={256}
                      value={formData.storage_gb}
                      onChange={(e) => setFormData({ ...formData, storage_gb: Number(e.target.value) })}
                      className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                    <label className="flex items-center space-x-2 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.storage_upgradeable}
                        onChange={(e) => setFormData({ ...formData, storage_upgradeable: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        Storage Upgradeable (Extra M.2 Slot)
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* SECTION 5: RETAILER & PHOTO */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] text-purple-600 dark:text-purple-400 flex items-center space-x-1">
                  <Camera className="w-3.5 h-3.5" />
                  <span>5. Retail Store & Photo</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">Store / Retailer Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Official ASUS Store / Shopee"
                      value={formData.source_name}
                      onChange={(e) => setFormData({ ...formData, source_name: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Purchase / Store URL</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={formData.purchase_url}
                      onChange={(e) => setFormData({ ...formData, purchase_url: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="w-24 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shrink-0 relative group shadow-xs">
                      {formData.image_url ? (
                        <img
                          src={formData.image_url}
                          alt="Laptop preview"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Camera className="w-5 h-5 opacity-40" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold block text-xs">Laptop Photo (Manual Upload / URL)</label>
                        <input
                          type="file"
                          ref={photoFileInputRef}
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (loadEvt) => {
                              if (loadEvt.target?.result) {
                                setFormData((prev) => ({ ...prev, image_url: String(loadEvt.target?.result) }));
                              }
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => photoFileInputRef.current?.click()}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-300 dark:border-emerald-700 flex items-center space-x-1 transition-all cursor-pointer"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Upload Local Photo</span>
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Paste image link (https://...) or upload file from your computer above"
                        value={formData.image_url.startsWith('data:') ? '[Uploaded Local Photo File Attached]' : formData.image_url}
                        onChange={(e) => {
                          if (!formData.image_url.startsWith('data:')) {
                            setFormData({ ...formData, image_url: e.target.value });
                          }
                        }}
                        className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                      />
                    </div>
                  </div>

                  {/* Quick Presets inside Edit Specs modal */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Or pick a standard laptop photo preset:</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_PHOTO_OPTIONS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormData({ ...formData, image_url: preset.url })}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all border cursor-pointer ${
                            formData.image_url === preset.url
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Active in Catalogue
                  </span>
                </label>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20"
                  >
                    Save Device
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Reader & Bulk Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onImportSuccess={fetchData}
      />
    </div>
  );
};
