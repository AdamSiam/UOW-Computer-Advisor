import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Device, Brand } from '../../types';
import { safeFetchJson } from '../../lib/apiUtils';
import { Search, Laptop, DollarSign, Filter, SlidersHorizontal, ArrowUpDown, BatteryCharging, Check, X, Layers, Grid, Info, FileSpreadsheet, Scale, ArrowRight } from 'lucide-react';
import { ExcelImportModal } from '../AdminPortal/ExcelImportModal';

interface DeviceCatalogueProps {
  onNavigateTab?: (tab: string) => void;
}

export const DeviceCatalogue: React.FC<DeviceCatalogueProps> = ({ onNavigateTab }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(9000);
  const [minRam, setMinRam] = useState<number>(8);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'ram_desc' | 'battery_desc'>('price_asc');
  const [groupByBrand, setGroupByBrand] = useState<boolean>(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState<boolean>(false);
  const [comparedIds, setComparedIds] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('uow_selected_compare_ids') || '[]');
    } catch {
      return [];
    }
  });

  const toggleCompare = (deviceId: number) => {
    let next: number[];
    if (comparedIds.includes(deviceId)) {
      next = comparedIds.filter((id) => id !== deviceId);
    } else {
      next = [...comparedIds.slice(-3), deviceId]; // keep max 4
    }
    setComparedIds(next);
    localStorage.setItem('uow_selected_compare_ids', JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('uow_set_compare_ids', { detail: next }));
  };

  const loadData = () => {
    Promise.all([
      safeFetchJson<Device[]>('/api/devices'),
      safeFetchJson<Brand[]>('/api/brands'),
    ]).then(([dRes, bRes]) => {
      if (dRes.ok && Array.isArray(dRes.data)) setDevices(dRes.data);
      if (bRes.ok && Array.isArray(bRes.data)) setBrands(bRes.data);
    });
  };

  useEffect(() => {
    loadData();

    const handleUpdated = (e: any) => {
      if (e.detail) {
        const updated: Device = e.detail;
        setDevices((prev) => prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d)));
      } else {
        loadData();
      }
    };

    window.addEventListener('uow_devices_updated', handleUpdated);
    return () => window.removeEventListener('uow_devices_updated', handleUpdated);
  }, []);

  const filtered = useMemo(() => {
    return devices
      .filter((d) => d.is_active)
      .filter((d) => selectedBrand === 'all' || d.brand_id === Number(selectedBrand))
      .filter((d) => d.price <= maxPrice)
      .filter((d) => d.ram_gb >= minRam)
      .filter(
        (d) =>
          d.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.cpu_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.gpu_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (d.brand?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'battery_desc') return (b.battery_life_hours || 0) - (a.battery_life_hours || 0);
        return b.ram_gb - a.ram_gb;
      });
  }, [devices, selectedBrand, maxPrice, minRam, searchTerm, sortBy]);

  // Group devices by brand when groupByBrand is true
  const groupedByBrand = useMemo(() => {
    const map: Record<string, Device[]> = {};
    filtered.forEach((d) => {
      const bName = d.brand?.name || 'Other Brands';
      if (!map[bName]) map[bName] = [];
      map[bName].push(d);
    });
    return map;
  }, [filtered]);

  return (
    <div className="max-w-[1550px] w-full mx-auto space-y-6 pb-12">
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Laptop className="w-5 h-5 text-blue-600" />
              <span>Browse UOW Computing Laptops</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Explore verified laptops categorized by brand, specifications, battery life, and budget.
            </p>
          </div>

          {/* Action Buttons: Group View & Excel Tools */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setIsExcelModalOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel Reader / Import</span>
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

            <button
              type="button"
              onClick={() => setGroupByBrand(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                !groupByBrand
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>All Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setGroupByBrand(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                groupByBrand
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>By Brand</span>
            </button>
          </div>
        </div>

        {/* Brand Category Filter Pills */}
        <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Filter by Brand Category:
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedBrand('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedBrand === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Brands ({devices.filter((d) => d.is_active).length})
            </button>
            {brands.map((b) => {
              const count = devices.filter((d) => d.is_active && d.brand_id === b.id).length;
              const isSelected = selectedBrand === String(b.id);
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBrand(String(b.id))}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{b.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end pt-1">
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1 font-medium">
              <span>Search Laptop:</span>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search model, CPU, GPU..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white h-9"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1 font-medium">
              <span>Min RAM:</span>
              <strong className="text-blue-600">{minRam} GB RAM</strong>
            </div>
            <select
              value={minRam}
              onChange={(e) => setMinRam(Number(e.target.value))}
              className="w-full py-2 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white h-9"
            >
              <option value={8}>8 GB+ RAM</option>
              <option value={16}>16 GB+ RAM (UOW Recommended)</option>
              <option value={32}>32 GB+ RAM (High-End)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1 font-medium">
              <span>Max Budget:</span>
              <strong className="text-blue-600">RM {maxPrice.toLocaleString()}</strong>
            </div>
            <div className="h-9 flex items-center px-1">
              <input
                type="range"
                min={1800}
                max={9000}
                step={200}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1 font-medium">
              <span>Sort Order:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-2 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white h-9"
            >
              <option value="price_asc">Sort: Price Low to High</option>
              <option value="price_desc">Sort: Price High to Low</option>
              <option value="battery_desc">Sort: Longest Battery Life</option>
              <option value="ram_desc">Sort: Highest RAM First</option>
            </select>
          </div>
        </div>

        {/* Battery Life Disclaimer Banner */}
        <div className="mt-3 p-2.5 px-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 flex items-center space-x-2">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Battery Disclaimer:</strong> Battery life figures (hours) are estimated based on normal daily campus usage (web browsing, office tools, document editing). Actual battery life varies depending on workload, screen brightness, and background processes.
          </span>
        </div>
      </div>

      {/* Catalogue Display */}
      {groupByBrand ? (
        /* Categorized by Brand Sections */
        <div className="space-y-8">
          {Object.entries(groupedByBrand).map(([brandName, brandDevices]) => (
            <div key={brandName} className="space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {brandName}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {brandDevices.length} {brandDevices.length === 1 ? 'Model' : 'Models'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {brandDevices.map((dev) => (
                  <DeviceCard
                    key={dev.id}
                    dev={dev}
                    isCompared={comparedIds.includes(dev.id)}
                    onToggleCompare={() => toggleCompare(dev.id)}
                    onNavigateTab={onNavigateTab}
                  />
                ))}
              </div>
            </div>
          ))}
          {Object.keys(groupedByBrand).length === 0 && (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500">
              No laptops found matching your criteria.
            </div>
          )}
        </div>
      ) : (
        /* Flat Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((dev) => (
            <DeviceCard
              key={dev.id}
              dev={dev}
              isCompared={comparedIds.includes(dev.id)}
              onToggleCompare={() => toggleCompare(dev.id)}
              onNavigateTab={onNavigateTab}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500">
              No laptops found matching your filters.
            </div>
          )}
        </div>
      )}

      {/* Floating Compare Floating Dock if laptops are selected */}
      {comparedIds.length > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 dark:bg-slate-800/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-lg flex items-center space-x-4 max-w-lg w-[90%]">
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-xs font-bold">{comparedIds.length} Laptops in Comparison</p>
              <p className="text-[10px] text-slate-400">Up to 4 laptops compared side-by-side</p>
            </div>
          </div>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('compare')}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center space-x-1"
          >
            <span>Compare Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Excel Reader & Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onImportSuccess={loadData}
      />
    </div>
  );
};

/* Sub-component for individual Laptop Card */
const DeviceCard: React.FC<{
  dev: Device;
  isCompared?: boolean;
  onToggleCompare?: () => void;
  onNavigateTab?: (tab: string) => void;
}> = ({ dev, isCompared, onToggleCompare, onNavigateTab }) => (
  <div
    className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all overflow-hidden shadow-xs p-5 space-y-3.5 flex flex-col justify-between ${
      isCompared ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-800'
    }`}
  >
    <div className="space-y-3">
      <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
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
        <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
          {dev.brand ? dev.brand.name : 'Laptop'}
        </span>
        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {dev.ram_gb}GB RAM
          </span>
          {dev.ram_upgradeable && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              ✓ Upgradeable
            </span>
          )}
        </div>
      </div>

      <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">{dev.model}</h3>

      <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
        <p className="flex justify-between">
          <span className="text-slate-400">Processor:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{dev.cpu_name}</span>
        </p>
        <p className="flex justify-between">
          <span className="text-slate-400">Graphics:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{dev.gpu_name}</span>
        </p>
        <p className="flex justify-between">
          <span className="text-slate-400">Storage:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{dev.storage_gb} GB {dev.storage_type}</span>
        </p>
        <p className="flex justify-between items-center text-amber-700 dark:text-amber-300 font-semibold pt-1">
          <span className="text-slate-400 font-normal flex items-center space-x-1" title="Estimated under normal daily usage">
            <BatteryCharging className="w-3.5 h-3.5 text-amber-500" />
            <span>Battery:*</span>
          </span>
          <span className="text-right">
            ~{dev.battery_life_hours} Hours ({dev.weight_kg} kg)
            <span className="block text-[9.5px] font-normal text-slate-400 dark:text-slate-500 leading-tight">normal usage</span>
          </span>
        </p>
      </div>

      {/* Quick Compare Action Button */}
      {onToggleCompare && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onToggleCompare}
            className={`w-full py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              isCompared
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>{isCompared ? 'In Comparison Matrix ✓' : 'Add to Compare'}</span>
          </button>
        </div>
      )}
    </div>
  </div>
);

