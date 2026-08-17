import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Device } from '../../types';
import { safeFetchJson } from '../../lib/apiUtils';
import {
  SlidersHorizontal,
  Check,
  X,
  Plus,
  Trash2,
  Sparkles,
  Bot,
  Battery,
  BatteryCharging,
  Cpu,
  HardDrive,
  Monitor,
  RotateCcw,
  Info,
  HelpCircle,
  Zap,
  ChevronDown,
  ChevronUp,
  Award,
  ShieldAlert,
} from 'lucide-react';

export const DeviceComparison: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [isExpandedAi, setIsExpandedAi] = useState<boolean>(false);
  const [expandedSpecGuides, setExpandedSpecGuides] = useState<string[]>([]);

  const devicesByBrand = useMemo(() => {
    const map: Record<string, Device[]> = {};
    devices.forEach((d) => {
      const brandName = d.brand?.name || 'Other Brands';
      if (!map[brandName]) {
        map[brandName] = [];
      }
      map[brandName].push(d);
    });
    return map;
  }, [devices]);

  useEffect(() => {
    const checkStoredCompareIds = () => {
      const stored = localStorage.getItem('uow_selected_compare_ids');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSelectedIds(parsed);
          }
        } catch (e) {
          console.error('Error parsing compare IDs:', e);
        }
      }
    };

    checkStoredCompareIds();

    const handleSetCompareIds = (e: any) => {
      if (e.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        setSelectedIds(e.detail);
      }
    };

    window.addEventListener('uow_set_compare_ids', handleSetCompareIds);
    return () => window.removeEventListener('uow_set_compare_ids', handleSetCompareIds);
  }, []);

  useEffect(() => {
    const fetchDevices = () => {
      safeFetchJson<Device[]>('/api/devices').then((res) => {
        if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
          setDevices(res.data);
          setSelectedIds((prev) => {
            const stored = localStorage.getItem('uow_selected_compare_ids');
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  return parsed;
                }
              } catch (e) {
                console.error(e);
              }
            }
            if (prev.length > 0) return prev;
            if (res.data.length >= 2) return [res.data[0].id, res.data[1].id];
            return [res.data[0].id];
          });
        }
      });
    };

    fetchDevices();

    const handleUpdated = (e: any) => {
      if (e.detail) {
        const updated: Device = e.detail;
        setDevices((prev) => prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d)));
      } else {
        fetchDevices();
      }
    };

    window.addEventListener('uow_devices_updated', handleUpdated);
    return () => window.removeEventListener('uow_devices_updated', handleUpdated);
  }, []);

  const comparedDevices = selectedIds
    .map((id) => devices.find((d) => d.id === id))
    .filter((d): d is Device => d !== undefined);

  // Trigger AI comparison whenever compared devices change
  useEffect(() => {
    if (comparedDevices.length > 0) {
      fetchAiComparison(comparedDevices);
    } else {
      setAiAnalysis(null);
    }
  }, [selectedIds]);

  const fetchAiComparison = async (devsToCompare: Device[]) => {
    if (devsToCompare.length === 0) return;
    setLoadingAi(true);
    try {
      const res = await safeFetchJson<{ analysis: string }>('/api/gemini/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devices: devsToCompare }),
      });

      if (res.ok && res.data?.analysis) {
        setAiAnalysis(res.data.analysis);
      } else {
        setAiAnalysis('AI comparison breakdown currently unavailable.');
      }
    } catch (e) {
      console.error('Error fetching AI comparison:', e);
      setAiAnalysis('Network error generating AI comparison analysis.');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleAddLaptopSlot = () => {
    if (selectedIds.length >= 4) return;
    // Find first device not currently selected
    const unusedDev = devices.find((d) => !selectedIds.includes(d.id));
    if (unusedDev) {
      setSelectedIds([...selectedIds, unusedDev.id]);
    } else if (devices.length > 0) {
      setSelectedIds([...selectedIds, devices[0].id]);
    }
  };

  const handleRemoveLaptopSlot = (indexToRemove: number) => {
    if (selectedIds.length <= 2) return; // Keep at least 2 laptops
    const updated = selectedIds.filter((_, idx) => idx !== indexToRemove);
    setSelectedIds(updated);
  };

  const handleDeviceChange = (index: number, newId: number) => {
    const updated = [...selectedIds];
    updated[index] = newId;
    setSelectedIds(updated);
  };

  // Identify spec leaders among compared devices
  const bestBatteryId = comparedDevices.length > 0
    ? [...comparedDevices].sort((a, b) => (b.battery_life_hours || 0) - (a.battery_life_hours || 0))[0]?.id
    : null;

  const lowestPriceId = comparedDevices.length > 0
    ? [...comparedDevices].sort((a, b) => a.price - b.price)[0]?.id
    : null;

  const maxRamId = comparedDevices.length > 0
    ? [...comparedDevices].sort((a, b) => b.ram_gb - a.ram_gb)[0]?.id
    : null;

  const lightestId = comparedDevices.length > 0
    ? [...comparedDevices].sort((a, b) => a.weight_kg - b.weight_kg)[0]?.id
    : null;

  const specDecoderItems = [
    {
      id: 'battery',
      icon: BatteryCharging,
      title: '⚡ Battery Life & Power Efficiency',
      short: 'Up to 18 hours duration',
      summary:
        'Battery life determines how long you can work without a wall charger. For students attending 6-8 hours of lectures and campus lab sessions daily, 8+ hours of battery life ensures true portable freedom without hunting for power sockets in halls or libraries.',
    },
    {
      id: 'cpu',
      icon: Cpu,
      title: '🧠 Processor (CPU)',
      short: 'Multi-Core Processing Power',
      summary:
        'The CPU is the central brain of the laptop. Higher core counts and modern architecture (Intel Core i5/i7, AMD Ryzen 5/7, Apple M-Series) speed up code compilation, syntax indexing, Docker container instantiation, and IDE responsiveness.',
    },
    {
      id: 'ram',
      icon: Zap,
      title: '💾 RAM (Memory Capacity)',
      short: '16GB vs 32GB System RAM',
      summary:
        'RAM holds active software applications simultaneously. 16GB is the official minimum for UOW computing programmes, allowing smooth execution of VS Code, Android Studio, multiple Chrome browser tabs, and local databases without memory paging or slowdowns.',
    },
    {
      id: 'ssd',
      icon: HardDrive,
      title: '💽 Storage (SSD)',
      short: 'NVMe SSD Speed & Capacity',
      summary:
        'NVMe Solid State Drives (SSD) offer read/write speeds up to 3,500+ MB/s—over 6x faster than legacy SATA SSDs. This guarantees instant operating system boots, near-instant project opening times, and fast file copying.',
    },
    {
      id: 'gpu',
      icon: Monitor,
      title: '🎮 Graphics (GPU)',
      short: 'Integrated vs Discrete GPU',
      summary:
        'Integrated GPUs (Intel Iris Xe, Apple M3) consume minimal battery and suit Software Engineering & Data Science well. Discrete GPUs (NVIDIA RTX 3050/4050/4060) are required for Game Development (Unreal Engine 5, Unity 3D) and Machine Learning acceleration.',
    },
    {
      id: 'upgradeability',
      icon: Info,
      title: '🛠️ RAM & Storage Upgradeability',
      short: 'Soldered vs SODIMM Slots',
      summary:
        'Soldered RAM cannot be expanded later, so buying sufficient RAM (16GB+) upfront is critical. Expandable laptops feature SODIMM RAM slots and extra M.2 NVMe SSD slots, allowing affordable memory and storage upgrades in Year 3 of your degree.',
    },
  ];

  return (
    <div className="max-w-[1550px] w-full mx-auto space-y-6 pb-12">
      {/* Header & Controls Box */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <SlidersHorizontal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Side-by-Side Device Comparison</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Compare specifications, battery life, upgradeability, and pricing across up to <strong>4 laptops</strong> simultaneously.
            </p>
          </div>

          {selectedIds.length < 4 && (
            <button
              type="button"
              onClick={handleAddLaptopSlot}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Laptop ({selectedIds.length}/4)</span>
            </button>
          )}
        </div>

        {/* Laptop Selector Grid (Up to 4) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {selectedIds.map((selectedId, idx) => {
            const curDev = devices.find((d) => d.id === selectedId);

            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Laptop {idx + 1}
                  </span>
                  {selectedIds.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLaptopSlot(idx)}
                      title="Remove from comparison"
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={selectedId || ''}
                  onChange={(e) => handleDeviceChange(idx, Number(e.target.value))}
                  className="w-full py-2 px-2.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(devicesByBrand).map(([brandName, brandDevices]) => (
                    <optgroup key={brandName} label={brandName}>
                      {brandDevices.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.brand?.name || ''} {d.model} (RM {d.price.toLocaleString()})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>

                {curDev && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-0.5">
                    <span>⚡ {curDev.battery_life_hours}h battery</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      RM {curDev.price.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparison Table */}
      <AnimatePresence mode="wait">
        {comparedDevices.length > 0 && (
          <motion.div
            key={selectedIds.join('-')}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-sm"
          >
            <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[640px]">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-4 px-5 w-44 font-extrabold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    SPECIFICATION
                  </th>
                  {comparedDevices.map((dev, idx) => (
                    <th key={dev.id} className="py-4 px-5 font-bold text-slate-900 dark:text-white min-w-[160px]">
                      <div className="space-y-2">
                        {dev.image_url && (
                          <div className="h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                            <img
                              src={dev.image_url}
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
                          </div>
                        )}
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80">
                            Laptop {idx + 1}
                          </span>
                        </div>
                        <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                          {dev.brand?.name} {dev.model}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {/* Retail Price */}
                <tr>
                  <td className="py-3.5 px-5 font-bold text-slate-700 dark:text-slate-300">Retail Price (RM)</td>
                  {comparedDevices.map((dev) => (
                    <td key={dev.id} className="py-3.5 px-5">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-slate-900 dark:text-white text-base">
                          RM {dev.price.toLocaleString()}
                        </span>
                        {dev.id === lowestPriceId && comparedDevices.length > 1 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            Lowest Price
                          </span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Battery Life */}
                <tr>
                  <td className="py-3.5 px-5 font-bold text-slate-700 dark:text-slate-300">
                    <div className="flex items-center space-x-1.5">
                      <BatteryCharging className="w-4 h-4 text-amber-500" />
                      <span>Battery Life*</span>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal block mt-0.5">
                      Normal usage conditions
                    </span>
                  </td>
                  {comparedDevices.map((dev) => (
                    <td key={dev.id} className="py-3.5 px-5">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            Up to {dev.battery_life_hours} hours
                          </span>
                          {dev.id === bestBatteryId && comparedDevices.length > 1 && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                              Best Battery
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                          {dev.battery_life_hours >= 12
                            ? 'All-Day Campus Ready (12h+)'
                            : dev.battery_life_hours >= 8
                            ? 'Full Lecture Day (8h-11h)'
                            : 'Standard Battery (<8h)'}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 italic block">
                          *Estimated for normal workload
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Processor (CPU) */}
                <tr>
                  <td className="py-3.5 px-5 font-bold text-slate-700 dark:text-slate-300">Processor (CPU)</td>
                  {comparedDevices.map((dev) => (
                    <td key={dev.id} className="py-3.5 px-5 text-slate-900 dark:text-slate-200">
                      <span className="font-semibold">{dev.cpu_name}</span>
                      <span className="text-xs text-slate-400 block">Tier {dev.cpu_tier}/5</span>
                    </td>
                  ))}
                </tr>

                {/* RAM Capacity */}
                <tr>
                  <td className="py-3.5 px-5 font-bold text-slate-700 dark:text-slate-300">RAM Capacity</td>
                  {comparedDevices.map((dev) => (
                    <td key={dev.id} className="py-3.5 px-5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 dark:text-white">{dev.ram_gb} GB</span>
                        {dev.id === maxRamId && comparedDevices.length > 1 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                            Max Memory
                          </span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Storage SSD */}
                <tr>
                  <td className="py-3.5 px-5 font-bold text-slate-700 dark:text-slate-300">Storage SSD</td>
                  {comparedDevices.map((dev) => (
                    <td key={dev.id} className="py-3.5 px-5 text-slate-900 dark:text-slate-200 font-medium">
                      {dev.storage_gb} GB {dev.storage_type}
                    </td>
                  ))}
                </tr>

                {/* Graphics (GPU) */}
                <tr>
                  <td className="py-3.5 px-5 font-bold text-slate-700 dark:text-slate-300">Graphics (GPU)</td>
                  {comparedDevices.map((dev) => (
                    <td key={dev.id} className="py-3.5 px-5 text-slate-900 dark:text-slate-200">
                      <span className="font-semibold">{dev.gpu_name}</span>
                      <span className="text-xs text-slate-400 block">
                        {dev.gpu_tier >= 3 ? 'Dedicated Gaming/3D GPU' : 'Integrated Efficiency GPU'}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Weight & Display */}
                <tr>
                  <td className="py-3.5 px-5 font-bold text-slate-700 dark:text-slate-300">Weight & Display</td>
                  {comparedDevices.map((dev) => (
                    <td key={dev.id} className="py-3.5 px-5">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-900 dark:text-slate-200">
                          {dev.weight_kg} kg ({dev.display_size}")
                        </span>
                        {dev.id === lightestId && comparedDevices.length > 1 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                            Lightest
                          </span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* RAM Upgradeable */}
                <tr>
                  <td className="py-3.5 px-5 font-bold text-slate-700 dark:text-slate-300">RAM Upgradeable</td>
                  {comparedDevices.map((dev) => (
                    <td key={dev.id} className="py-3.5 px-5">
                      {dev.ram_upgradeable ? (
                        <span className="inline-flex items-center space-x-1 font-semibold text-emerald-600 dark:text-emerald-400">
                          <Check className="w-4 h-4" />
                          <span>Yes (Expandable)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 font-semibold text-slate-400">
                          <X className="w-4 h-4" />
                          <span>Soldered (Fixed)</span>
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Storage Upgradeable */}
                <tr>
                  <td className="py-3.5 px-5 font-bold text-slate-700 dark:text-slate-300">Storage Upgradeable</td>
                  {comparedDevices.map((dev) => (
                    <td key={dev.id} className="py-3.5 px-5">
                      {dev.storage_upgradeable ? (
                        <span className="inline-flex items-center space-x-1 font-semibold text-emerald-600 dark:text-emerald-400">
                          <Check className="w-4 h-4" />
                          <span>Yes (Extra M.2 Slot)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 font-semibold text-slate-400">
                          <X className="w-4 h-4" />
                          <span>Fixed SSD</span>
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Device Type */}
                <tr>
                  <td className="py-3.5 px-5 font-bold text-slate-700 dark:text-slate-300">Device Type</td>
                  {comparedDevices.map((dev) => (
                    <td key={dev.id} className="py-3.5 px-5 text-slate-900 dark:text-slate-200 capitalize font-medium">
                      {dev.device_type}
                    </td>
                  ))}
                </tr>

                {/* Best Student Fit */}
                <tr>
                  <td className="py-3.5 px-5 font-bold text-slate-700 dark:text-slate-300">
                    <div className="flex items-center space-x-1.5">
                      <Award className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span>Best Student Fit</span>
                    </div>
                  </td>
                  {comparedDevices.map((dev) => {
                    let label = 'General Computing & Web Dev';
                    let color = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

                    if (dev.gpu_tier >= 3 || dev.gpu_name.toLowerCase().includes('rtx')) {
                      label = 'Game Dev, AI & 3D Graphics';
                      color = 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20';
                    } else if (dev.ram_gb >= 16 && dev.cpu_tier >= 3) {
                      label = 'Software Eng & Data Science';
                      color = 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20';
                    } else if (dev.price <= 2500) {
                      label = 'Budget Saver & Core Coding';
                      color = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
                    }

                    return (
                      <td key={dev.id} className="py-3.5 px-5">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold border ${color}`}>
                          {label}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>

            {/* Battery Life Disclaimer Footnote */}
            <div className="p-3 bg-amber-500/10 border-t border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 flex items-start space-x-2">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p>
                <strong className="font-semibold text-amber-900 dark:text-amber-200">*Battery Life Disclaimer:</strong> Battery life specifications represent estimates under normal daily campus usage (web browsing, document editing, and light video streaming). Heavy workloads such as 3D rendering, mobile app compilation, or maximum screen brightness will reduce runtime.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI SIDE-BY-SIDE ANALYSIS BELOW TABLE */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI Side-by-Side Comparison Analysis</h2>
          </div>
          <button
            type="button"
            onClick={() => fetchAiComparison(comparedDevices)}
            disabled={loadingAi}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loadingAi ? 'animate-spin' : ''}`} />
            <span>{loadingAi ? 'Analyzing...' : 'Refresh AI Analysis'}</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {loadingAi ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center space-y-3"
            >
              <div className="w-7 h-7 mx-auto border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 dark:text-slate-400 animate-pulse">
                Gemini AI is analyzing hardware differences and generating a side-by-side breakdown...
              </p>
            </motion.div>
          ) : !isExpandedAi ? (
            /* SUMMARY FIRST VIEW */
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {comparedDevices.map((dev) => {
                  const isBestBattery = dev.id === bestBatteryId;
                  const isLowestPrice = dev.id === lowestPriceId;
                  const isMaxRam = dev.id === maxRamId;

                  let tag = 'Balanced Choice';
                  let tagBg = 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
                  if (isLowestPrice) {
                    tag = '💰 Best Budget Value';
                    tagBg = 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
                  } else if (isBestBattery) {
                    tag = '⚡ Battery & Mobility Leader';
                    tagBg = 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
                  } else if (isMaxRam) {
                    tag = '🚀 Performance Champion';
                    tagBg = 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
                  }

                  return (
                    <div key={dev.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${tagBg}`}>
                          {tag}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          RM {dev.price.toLocaleString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {dev.brand?.name} {dev.model}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {dev.cpu_name} • {dev.ram_gb}GB RAM • {dev.gpu_name}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* AI Advisor Quick Summary Banner */}
              <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-start space-x-3 text-xs sm:text-sm text-indigo-900 dark:text-indigo-200">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold block mb-0.5">AI Executive Summary:</span>
                  <p className="text-indigo-800 dark:text-indigo-300 font-medium leading-relaxed">
                    Comparing <strong>{comparedDevices.map((d) => d.model).join(' vs ')}</strong>. Click <strong>More Details</strong> below to view the complete side-by-side analysis, battery trade-offs, and syllabus fit.
                  </p>
                </div>
              </div>

              {/* More Details Button */}
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsExpandedAi(true)}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 hover:shadow-blue-600/30 transition-all cursor-pointer group"
                >
                  <Info className="w-4 h-4 text-blue-200" />
                  <span>More Details (Full AI Comparative Breakdown)</span>
                  <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                </button>
              </div>
            </motion.div>
          ) : (
            /* FULL DETAILED AI ANALYSIS VIEW */
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="space-y-4"
            >
              <div className="markdown-body text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal space-y-3">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 shadow-xs">
                        <table className="w-full text-left text-xs sm:text-sm divide-y divide-slate-200 dark:divide-slate-800">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px]">
                        {children}
                      </thead>
                    ),
                    th: ({ children }) => <th className="py-3 px-4 border-b border-slate-200 dark:border-slate-800">{children}</th>,
                    td: ({ children }) => <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 font-medium">{children}</td>,
                    h3: ({ children }) => (
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-5 mb-2 flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                        {children}
                      </h3>
                    ),
                    ul: ({ children }) => <ul className="space-y-2.5 my-3">{children}</ul>,
                    li: ({ children }) => (
                      <li className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-start space-x-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                        <div>{children}</div>
                      </li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-slate-900 dark:text-white bg-slate-200/60 dark:bg-slate-700/60 px-1.5 py-0.5 rounded text-slate-900 dark:text-slate-100 border border-slate-300/40 dark:border-slate-600/40">
                        {children}
                      </strong>
                    ),
                  }}
                >
                  {aiAnalysis || 'Select at least 2 laptops above to generate an instant AI comparative analysis.'}
                </Markdown>
              </div>

              <div className="flex justify-center pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsExpandedAi(false)}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  <span>Show Summary View</span>
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SPECIFICATION DECODER: MULTI-TAB OPENING SUPPORT (REQUESTED) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Specification Decoder: What Do These Specs Mean?</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Click any card to expand its guide. Multiple cards can be opened simultaneously.
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setExpandedSpecGuides(specDecoderItems.map((item) => item.id))}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={() => setExpandedSpecGuides([])}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {specDecoderItems.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedSpecGuides.includes(item.id);

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all cursor-pointer h-fit ${
                  isExpanded
                    ? 'bg-blue-50/50 dark:bg-slate-800 border-blue-300 dark:border-blue-700 shadow-xs'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:border-slate-300'
                }`}
                onClick={() => {
                  setExpandedSpecGuides((prev) =>
                    prev.includes(item.id)
                      ? prev.filter((id) => id !== item.id)
                      : [...prev, item.id]
                  );
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h3>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{item.short}</span>
                    </div>
                  </div>
                  <button type="button" className="text-slate-400">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {isExpanded && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60"
                  >
                    {item.summary}
                  </motion.p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
