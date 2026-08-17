import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCheck,
  Sparkles,
  ArrowRight,
  HardDrive,
  Trash2,
  HelpCircle,
  Camera,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import {
  ParsedImportDevice,
  downloadDeviceExcelTemplate,
  parseDeviceExcelFile,
} from '../../lib/excelDeviceUtils';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedDevices, setParsedDevices] = useState<ParsedImportDevice[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ count: number; message: string } | null>(null);
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);
  const rowPhotoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);
    setParseError(null);
    setImportResult(null);

    try {
      const devices = await parseDeviceExcelFile(file);
      setParsedDevices(devices);
    } catch (err: any) {
      console.error('Excel parse error:', err);
      setParseError(err.message || 'Failed to parse Excel file. Please ensure it uses a supported format (.xlsx, .xls, .csv).');
      setParsedDevices([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleRemoveRow = (index: number) => {
    setParsedDevices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmImport = async () => {
    const validItems = parsedDevices.filter((d) => d.is_valid);
    if (validItems.length === 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/devices/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: validItems }),
      });

      if (res.ok) {
        const data = await res.json();
        setImportResult({
          count: data.count || validItems.length,
          message: data.message || 'Devices successfully added to catalogue!',
        });

        // Trigger global event for components listening
        window.dispatchEvent(new CustomEvent('uow_devices_updated'));

        setTimeout(() => {
          onImportSuccess();
          onClose();
          setParsedDevices([]);
          setFileName('');
          setImportResult(null);
        }, 1800);
      } else {
        const errData = await res.json().catch(() => ({}));
        setParseError(errData.message || 'Error saving devices to backend catalogue.');
      }
    } catch (err: any) {
      setParseError('Network error importing devices into catalogue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validCount = parsedDevices.filter((d) => d.is_valid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white flex items-center justify-between border-b border-emerald-700/40">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 text-emerald-300">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
                <span>Excel Bulk Device Reader & Import</span>
              </h2>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Upload an Excel file (.xlsx / .csv) to auto-fill the device catalogue in bulk.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Top Banner: Download Excel Template with Current Listing */}
          <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-blue-900 dark:text-blue-200 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Current Catalogue Excel Listing (Pre-Populated)</span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Downloads the complete current listing of active laptops with all tier specifications. Modify specs, adjust prices, or append new rows to ensure 100% data consistency.
              </p>
            </div>

            <button
              type="button"
              onClick={() => downloadDeviceExcelTemplate()}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center space-x-2 shrink-0 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download Excel Template (.xlsx)</span>
            </button>
          </div>

          {/* Hidden photo file input for row photo replacement */}
          <input
            type="file"
            ref={rowPhotoInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file || editingPhotoIndex === null) return;
              const reader = new FileReader();
              reader.onload = (loadEvt) => {
                if (loadEvt.target?.result) {
                  const dataUrl = String(loadEvt.target?.result);
                  setParsedDevices((prev) =>
                    prev.map((d, i) => (i === editingPhotoIndex ? { ...d, image_url: dataUrl } : d))
                  );
                }
              };
              reader.readAsDataURL(file);
            }}
          />

          {/* File Upload Drop Zone */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Upload Excel File (.xlsx, .xls, .csv)
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                fileName
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/50'
              }`}
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>

              {fileName ? (
                <div className="space-y-1">
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center space-x-2">
                    <FileCheck className="w-4 h-4" />
                    <span>Loaded File: {fileName}</span>
                  </span>
                  <p className="text-xs text-slate-500">
                    Click to replace with another Excel file
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Click to browse or drop your Excel device file here
                  </span>
                  <p className="text-xs text-slate-500">
                    Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Parsing State / Errors */}
          {isParsing && (
            <div className="p-6 text-center text-sm font-medium text-slate-600 dark:text-slate-300 space-y-2">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Reading and analyzing device rows from Excel file...</p>
            </div>
          )}

          {parseError && (
            <div className="p-4 rounded-2xl bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300 text-xs flex items-center space-x-3 border border-red-200 dark:border-red-800">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {importResult && (
            <div className="p-5 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 text-sm font-bold flex items-center space-x-3 border border-emerald-300 dark:border-emerald-800">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
              <span>{importResult.message}</span>
            </div>
          )}

          {/* Parsed Device Preview Table */}
          {parsedDevices.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <HardDrive className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Parsed Devices Preview ({validCount} / {parsedDevices.length} Valid)
                  </h3>
                </div>

                <span className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold self-start sm:self-auto">
                  Verify laptop specs before adding to catalogue
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold sticky top-0 z-10">
                    <tr>
                      <th className="p-3">Status</th>
                      <th className="p-3">Photo</th>
                      <th className="p-3">Brand & Model</th>
                      <th className="p-3">Price (RM)</th>
                      <th className="p-3">CPU Spec</th>
                      <th className="p-3">GPU Spec</th>
                      <th className="p-3">RAM / Storage</th>
                      <th className="p-3">Display / Weight</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {parsedDevices.map((dev, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                          !dev.is_valid ? 'bg-red-50/40 dark:bg-red-950/20' : ''
                        }`}
                      >
                        <td className="p-3">
                          {dev.is_valid ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Ready</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                              <AlertTriangle className="w-3 h-3 text-red-500" />
                              <span>Error</span>
                            </span>
                          )}
                        </td>

                        <td className="p-3">
                          <div className="relative group/photo w-12 h-9 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0">
                            <img
                              src={dev.image_url}
                              alt={dev.model}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80';
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPhotoIndex(idx);
                                rowPhotoInputRef.current?.click();
                              }}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                              title="Upload custom photo manually"
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {dev.model}
                          </div>
                          <div className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase">
                            {dev.brand_name} • {dev.device_type}
                          </div>
                        </td>

                        <td className="p-3">
                          <span className="font-extrabold text-blue-600 dark:text-blue-400">
                            RM {dev.price.toLocaleString()}
                          </span>
                        </td>

                        <td className="p-3">
                          <div className="font-medium text-slate-800 dark:text-slate-200">{dev.cpu_name}</div>
                          <span className="text-[10px] font-semibold text-slate-500">{dev.cpu_brand}</span>
                        </td>

                        <td className="p-3">
                          <div className="font-medium text-slate-800 dark:text-slate-200">{dev.gpu_name}</div>
                          <span className="text-[10px] font-semibold text-slate-500">{dev.gpu_brand}</span>
                        </td>

                        <td className="p-3">
                          <div className="font-semibold">{dev.ram_gb}GB RAM</div>
                          <div className="text-[10px] text-slate-500">
                            {dev.storage_gb}GB {dev.storage_type}
                          </div>
                        </td>

                        <td className="p-3 text-[11px] text-slate-600 dark:text-slate-400">
                          <div>{dev.display_size}" Display</div>
                          <div>{dev.weight_kg} kg • {dev.battery_life_hours}h Battery</div>
                        </td>

                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                            title="Remove row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {parsedDevices.length > 0 ? (
              <span>
                Ready to import <strong>{validCount}</strong> devices into UOW Hardware Catalogue.
              </span>
            ) : (
              <span>Upload your Excel file above to begin bulk import.</span>
            )}
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={validCount === 0 || isSubmitting}
              onClick={handleConfirmImport}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Importing Devices...'
                  : `Import ${validCount} Device${validCount === 1 ? '' : 's'}`}
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
