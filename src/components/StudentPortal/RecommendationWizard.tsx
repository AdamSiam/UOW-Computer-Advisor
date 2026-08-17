import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { safeFetchJson } from '../../lib/apiUtils';
import {
  Faculty,
  Programme,
  RequirementProfile,
  Brand,
  Device,
  StudentPreference,
  ScoredDevice,
  User,
  UserRole,
} from '../../types';
import {
  Sparkles,
  GraduationCap,
  Building2,
  BookOpen,
  DollarSign,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  Award,
  TrendingUp,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  BookmarkCheck,
  Bot,
  SlidersHorizontal,
  Info,
  ShieldCheck,
  Zap,
  HardDrive,
  Battery,
  CheckSquare,
  Square,
  Edit3,
  X,
  Laptop,
  RotateCcw,
  LogIn,
  UserPlus,
  Check,
  Scale,
} from 'lucide-react';

interface RecommendationWizardProps {
  currentUser?: User | null;
  onOpenAuth?: (tab?: 'login' | 'register', role?: UserRole) => void;
  onNavigateTab?: (tab: string) => void;
}

export const RecommendationWizard: React.FC<RecommendationWizardProps> = ({
  currentUser,
  onOpenAuth,
  onNavigateTab,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Loaded Option Data
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Selections
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null);
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<number | null>(null);
  const [preference, setPreference] = useState<StudentPreference>({
    programme_id: null,
    preferred_brand_ids: [],
    budget: 4000,
    preferred_cpu_brand: 'Any',
    preferred_gpu_brand: 'Any',
    preferred_device_type: 'Any',
    portability_priority: 'Medium',
    battery_priority: 'Medium',
    weight_importance: 3,
  });

  // Results State
  const [loadingResults, setLoadingResults] = useState(false);
  const [resultsData, setResultsData] = useState<{
    programme: Programme;
    requirement_profile: RequirementProfile;
    results: ScoredDevice[];
  } | null>(null);

  // Gemini Explanation State
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [isAiSummaryExpanded, setIsAiSummaryExpanded] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const [expandedBreakdowns, setExpandedBreakdowns] = useState<Record<number, boolean>>({});

  // Report Header Scroll Observer for Sticky AI Button
  const reportHeaderRef = useRef<HTMLDivElement | null>(null);
  const [hasPassedReportHeader, setHasPassedReportHeader] = useState(false);

  useEffect(() => {
    if (step !== 3 || !reportHeaderRef.current) {
      setHasPassedReportHeader(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Appears once the top recommendation report card is scrolled past
        setHasPassedReportHeader(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      {
        threshold: 0.05,
      }
    );

    observer.observe(reportHeaderRef.current);
    return () => observer.disconnect();
  }, [step, resultsData]);

  // Multi-Device Selection & Custom Naming State
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<number[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [customSaveTitle, setCustomSaveTitle] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [facRes, progRes, brandRes] = await Promise.all([
        safeFetchJson<Faculty[]>('/api/faculties'),
        safeFetchJson<Programme[]>('/api/programmes'),
        safeFetchJson<Brand[]>('/api/brands'),
      ]);

      if (facRes.ok && progRes.ok && brandRes.ok) {
        const facs = (Array.isArray(facRes.data) ? facRes.data : []).filter((f: Faculty) => f.is_active);
        const progs = (Array.isArray(progRes.data) ? progRes.data : []).filter((p: Programme) => p.is_active);
        const bnds = (Array.isArray(brandRes.data) ? brandRes.data : []).filter((b: Brand) => b.is_active);

        setFaculties(facs);
        setProgrammes(progs);
        setBrands(bnds);

        // Intelligently preselect user's enrolled programme if available, else first active faculty & programme
        if (currentUser && currentUser.programme_id) {
          const userProg = progs.find((p) => p.id === currentUser.programme_id);
          if (userProg) {
            setSelectedFacultyId(userProg.faculty_id);
            setSelectedProgrammeId(userProg.id);
            return;
          }
        }

        if (facs.length > 0) {
          const defaultFacId = facs[0].id;
          setSelectedFacultyId(defaultFacId);
          const defaultProgs = progs.filter((p) => p.faculty_id === defaultFacId);
          if (defaultProgs.length > 0) {
            setSelectedProgrammeId(defaultProgs[0].id);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFacultySelect = (facId: number) => {
    setSelectedFacultyId(facId);
    const availableProgs = programmes.filter((p) => p.faculty_id === facId);
    if (availableProgs.length > 0) {
      setSelectedProgrammeId(availableProgs[0].id);
    } else {
      setSelectedProgrammeId(null);
    }
  };

  const handleRunRecommendation = async () => {
    if (!selectedProgrammeId) return;
    setLoadingResults(true);
    setStep(3);

    try {
      const res = await safeFetchJson('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programme_id: selectedProgrammeId,
          preference,
        }),
      });

      if (!res.ok || !res.data) throw new Error(res.error || 'Recommendation processing error');
      setResultsData(res.data);

      // Default unticked / no devices selected initially
      setSelectedDeviceIds([]);

      // Automatically fetch Gemini AI Explanation
      fetchAiExplanation(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingResults(false);
    }
  };

  const fetchAiExplanation = async (data: any, customSelectedIds?: number[]) => {
    if (!data) return;
    setLoadingAi(true);
    try {
      const activeIds = customSelectedIds !== undefined ? customSelectedIds : selectedDeviceIds;

      let targetDevices: ScoredDevice[] = [];
      if (activeIds.length > 0) {
        targetDevices = data.results.filter((r: ScoredDevice) => activeIds.includes(r.device.id));
      } else {
        targetDevices = data.results.slice(0, 3);
      }

      const formattedDevices = targetDevices.map((r: ScoredDevice) => ({
        brand: r.device.brand?.name || '',
        model: r.device.model,
        price: r.device.price,
        score: r.score_breakdown.total_score,
        cpu: r.device.cpu_name,
        ram: `${r.device.ram_gb}GB`,
        gpu: r.device.gpu_name,
      }));

      const res = await safeFetchJson('/api/gemini/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programme_name: data.programme.name,
          profile_name: data.requirement_profile.name,
          budget: preference.budget,
          preference: {
            budget: preference.budget,
            battery_priority: preference.battery_priority,
            portability_priority: preference.portability_priority,
            preferred_device_type: preference.preferred_device_type,
            preferred_cpu_brand: preference.preferred_cpu_brand,
            preferred_gpu_brand: preference.preferred_gpu_brand,
          },
          selected_devices: formattedDevices,
          top_devices: formattedDevices,
        }),
      });

      if (res.ok && res.data?.explanation) {
        setAiExplanation(res.data.explanation);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAi(false);
    }
  };

  const toggleDeviceSelection = (deviceId: number) => {
    const nextIds = selectedDeviceIds.includes(deviceId)
      ? selectedDeviceIds.filter((id) => id !== deviceId)
      : [...selectedDeviceIds, deviceId];

    setSelectedDeviceIds(nextIds);
    if (resultsData) {
      fetchAiExplanation(resultsData, nextIds);
    }
  };

  const handleSelectTop3 = () => {
    if (!resultsData) return;
    const top3Ids = resultsData.results.slice(0, 3).map((r) => r.device.id);
    setSelectedDeviceIds(top3Ids);
    fetchAiExplanation(resultsData, top3Ids);
  };

  const handleSelectAll = () => {
    if (!resultsData) return;
    const allIds = resultsData.results.map((r) => r.device.id);
    setSelectedDeviceIds(allIds);
    fetchAiExplanation(resultsData, allIds);
  };

  const handleClearAll = () => {
    setSelectedDeviceIds([]);
    if (resultsData) {
      fetchAiExplanation(resultsData, []);
    }
  };

  const handleCompareSelected = () => {
    if (!resultsData) return;
    if (selectedDeviceIds.length === 0) {
      setSaveWarning('Please select at least 1 laptop model to compare side-by-side.');
      setTimeout(() => setSaveWarning(null), 3500);
      return;
    }
    const targetIds = selectedDeviceIds.slice(0, 4);

    try {
      localStorage.setItem('uow_compare_ids', JSON.stringify(targetIds));
      window.dispatchEvent(
        new CustomEvent('add-to-compare', {
          detail: { deviceIds: targetIds },
        })
      );
    } catch (e) {
      console.error(e);
    }

    if (onNavigateTab) {
      onNavigateTab('compare');
    }
  };

  const handleOpenSaveModal = () => {
    if (!resultsData) return;
    if (selectedDeviceIds.length === 0) {
      setSaveWarning('Please select at least 1 device to save in your recommendation report.');
      setTimeout(() => setSaveWarning(null), 5000);
      return;
    }
    setSaveWarning(null);

    const progName = resultsData.programme.name;
    setCustomSaveTitle(`Top Matches for ${progName}`);

    // Check if user is logged in as a student
    const isLoggedInStudent = currentUser && currentUser.role === 'student';
    if (!isLoggedInStudent) {
      setIsAuthPromptOpen(true);
      return;
    }

    setIsSaveModalOpen(true);
  };

  const handleSaveRecommendation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!resultsData || selectedDeviceIds.length === 0) return;

    setSaving(true);
    try {
      const res = await safeFetchJson('/api/saved-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: customSaveTitle.trim() || `Top Matches for ${resultsData.programme.name}`,
          programme_id: resultsData.programme.id,
          budget: preference.budget,
          user_name: currentUser?.name || 'Student',
          minimum_specification: {
            cpu: resultsData.requirement_profile.minimum_cpu,
            ram_gb: resultsData.requirement_profile.minimum_ram_gb,
            storage_gb: resultsData.requirement_profile.minimum_storage_gb,
            gpu: resultsData.requirement_profile.minimum_gpu,
          },
          recommended_specification: {
            cpu: resultsData.requirement_profile.recommended_cpu,
            ram_gb: resultsData.requirement_profile.recommended_ram_gb,
            storage_gb: resultsData.requirement_profile.recommended_storage_gb,
            gpu: resultsData.requirement_profile.recommended_gpu,
          },
          recommended_device_ids: selectedDeviceIds,
          explanation: aiExplanation || 'Recommended via UOW Computing Advisor weighted rules.',
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setIsSaveModalOpen(false);
        setIsAuthPromptOpen(false);
        setTimeout(() => setSavedSuccess(false), 6000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Hardware compatibility auto-sync logic
  const appleBrand = brands.find((b) => b.name.toLowerCase() === 'apple');
  const appleBrandId = appleBrand?.id;
  const msiBrand = brands.find((b) => b.name.toLowerCase() === 'msi');
  const msiBrandId = msiBrand?.id;

  const handleSelectFormFactor = (type: 'laptop' | 'macbook' | '2-in-1' | 'Any') => {
    let newCpu = preference.preferred_cpu_brand;
    let newGpu = preference.preferred_gpu_brand;
    let newBrands = [...preference.preferred_brand_ids];

    if (type === 'macbook') {
      // Selecting Apple MacBook auto-sets Apple Silicon CPU, Apple GPU, and Apple Brand Manufacturer exclusively
      newCpu = 'Apple';
      newGpu = 'Apple';
      if (appleBrandId) {
        newBrands = [appleBrandId];
      }
    } else if (type === 'laptop' || type === '2-in-1') {
      // Windows/Linux laptops or 2-in-1s cannot be Apple
      if (newCpu === 'Apple') {
        newCpu = 'Any';
      }
      if (newGpu === 'Apple') {
        newGpu = 'Any';
      }
      if (appleBrandId) {
        newBrands = newBrands.filter((id) => id !== appleBrandId);
      }
      if (type === '2-in-1' && msiBrandId) {
        newBrands = newBrands.filter((id) => id !== msiBrandId);
      }
    } else if (type === 'Any') {
      if (newCpu === 'Intel' || newCpu === 'AMD') {
        if (appleBrandId) {
          newBrands = newBrands.filter((id) => id !== appleBrandId);
        }
      }
    }

    setPreference({
      ...preference,
      preferred_device_type: type,
      preferred_cpu_brand: newCpu,
      preferred_gpu_brand: newGpu,
      preferred_brand_ids: newBrands,
    });
  };

  const handleSelectCpuBrand = (cpu: 'Intel' | 'AMD' | 'Apple' | 'Any') => {
    let newDeviceType = preference.preferred_device_type;
    let newGpu = preference.preferred_gpu_brand;
    let newBrands = [...preference.preferred_brand_ids];

    if (cpu === 'Apple') {
      // Selecting Apple Silicon auto-sets Apple MacBook form factor, Apple GPU, and Apple Brand Manufacturer exclusively
      newDeviceType = 'macbook';
      newGpu = 'Apple';
      if (appleBrandId) {
        newBrands = [appleBrandId];
      }
    } else if (cpu === 'Intel' || cpu === 'AMD') {
      // Selecting non-Apple CPUs (Intel, AMD) turns off Apple MacBook form factor, Apple GPU, and Apple Brand
      if (newDeviceType === 'macbook') {
        newDeviceType = 'laptop';
      }
      if (newGpu === 'Apple') {
        newGpu = 'Any';
      }
      if (appleBrandId) {
        newBrands = newBrands.filter((id) => id !== appleBrandId);
      }
    } else if (cpu === 'Any') {
      if (newDeviceType === 'laptop' || newDeviceType === '2-in-1') {
        if (appleBrandId) {
          newBrands = newBrands.filter((id) => id !== appleBrandId);
        }
      }
    }

    setPreference({
      ...preference,
      preferred_cpu_brand: cpu,
      preferred_device_type: newDeviceType,
      preferred_gpu_brand: newGpu,
      preferred_brand_ids: newBrands,
    });
  };

  const handleSelectGpuBrand = (gpu: 'NVIDIA' | 'AMD' | 'Intel' | 'Apple' | 'Any') => {
    let newDeviceType = preference.preferred_device_type;
    let newCpu = preference.preferred_cpu_brand;
    let newBrands = [...preference.preferred_brand_ids];

    if (gpu === 'NVIDIA' || gpu === 'AMD' || gpu === 'Intel') {
      // Selecting non-Apple GPU (NVIDIA, AMD, Intel) automatically turns off Apple options
      if (newDeviceType === 'macbook') {
        newDeviceType = 'laptop';
      }
      if (newCpu === 'Apple') {
        newCpu = 'Any';
      }
      if (appleBrandId) {
        newBrands = newBrands.filter((id) => id !== appleBrandId);
      }
    } else if (gpu === 'Apple') {
      // Selecting Apple GPU auto-sets Apple Silicon CPU, MacBook form factor, and Apple Brand
      newDeviceType = 'macbook';
      newCpu = 'Apple';
      if (appleBrandId) {
        newBrands = [appleBrandId];
      }
    }

    setPreference({
      ...preference,
      preferred_gpu_brand: gpu,
      preferred_device_type: newDeviceType,
      preferred_cpu_brand: newCpu,
      preferred_brand_ids: newBrands,
    });
  };

  const handleToggleBrand = (brandId: number) => {
    const isChecked = preference.preferred_brand_ids.includes(brandId);
    const isApple = appleBrandId === brandId;
    const isMSI = msiBrandId === brandId;
    let newDeviceType = preference.preferred_device_type;
    let newCpu = preference.preferred_cpu_brand;
    let newGpu = preference.preferred_gpu_brand;
    let updatedBrands: number[] = [];

    if (isChecked) {
      // Unchecking this brand
      updatedBrands = preference.preferred_brand_ids.filter((id) => id !== brandId);
      if (isApple) {
        if (newDeviceType === 'macbook') newDeviceType = 'Any';
        if (newCpu === 'Apple') newCpu = 'Any';
        if (newGpu === 'Apple') newGpu = 'Any';
      }
    } else {
      // Checking this brand
      if (isApple) {
        // Checking Apple:
        // Reset CPU/GPU from non-Apple to Any if needed
        if (newCpu === 'Intel' || newCpu === 'AMD') {
          newCpu = 'Any';
        }
        if (newGpu === 'NVIDIA' || newGpu === 'AMD' || newGpu === 'Intel') {
          newGpu = 'Any';
        }
        if (newDeviceType === '2-in-1' || newDeviceType === 'laptop') {
          newDeviceType = 'Any';
        }

        if (preference.preferred_device_type === 'macbook' || preference.preferred_cpu_brand === 'Apple' || preference.preferred_gpu_brand === 'Apple') {
          updatedBrands = [brandId];
        } else {
          updatedBrands = [...preference.preferred_brand_ids, brandId];
        }
      } else {
        // Checking a non-Apple brand
        if (newCpu === 'Apple') {
          newCpu = 'Any';
        }
        if (newGpu === 'Apple') {
          newGpu = 'Any';
        }
        if (newDeviceType === 'macbook') {
          newDeviceType = 'laptop';
        }
        if (isMSI && newDeviceType === '2-in-1') {
          newDeviceType = 'laptop';
        }

        if (
          preference.preferred_device_type === 'macbook' ||
          preference.preferred_cpu_brand === 'Apple' ||
          preference.preferred_gpu_brand === 'Apple' ||
          preference.preferred_cpu_brand === 'Intel' ||
          preference.preferred_cpu_brand === 'AMD' ||
          preference.preferred_device_type === 'laptop' ||
          preference.preferred_device_type === '2-in-1'
        ) {
          updatedBrands = [...preference.preferred_brand_ids.filter((id) => id !== appleBrandId), brandId];
        } else {
          updatedBrands = [...preference.preferred_brand_ids, brandId];
        }
      }
    }

    setPreference({
      ...preference,
      preferred_brand_ids: updatedBrands,
      preferred_device_type: newDeviceType,
      preferred_cpu_brand: newCpu,
      preferred_gpu_brand: newGpu,
    });
  };

  const handleSelectAnyBrand = () => {
    let newDeviceType = preference.preferred_device_type;
    let newCpu = preference.preferred_cpu_brand;
    let newGpu = preference.preferred_gpu_brand;

    if (newDeviceType === 'macbook') {
      newDeviceType = 'Any';
    }
    if (newCpu === 'Apple') {
      newCpu = 'Any';
    }
    if (newGpu === 'Apple') {
      newGpu = 'Any';
    }

    setPreference({
      ...preference,
      preferred_brand_ids: [],
      preferred_device_type: newDeviceType,
      preferred_cpu_brand: newCpu,
      preferred_gpu_brand: newGpu,
    });
  };

  const selectedProgramme = programmes.find((p) => p.id === selectedProgrammeId);
  const activeProgrammeList = programmes.filter((p) => p.faculty_id === selectedFacultyId);

  return (
    <div className="max-w-[1550px] w-full mx-auto space-y-8 pb-16">
      {/* Wizard Progress Stepper */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between max-w-xl mx-auto w-full">
          <StepBadge
            number={1}
            label="Programme"
            active={step === 1}
            completed={step > 1}
            onClick={() => setStep(1)}
          />
          <div className={`h-0.5 sm:h-1 flex-1 mx-2 sm:mx-4 rounded transition-all min-w-[10px] ${step > 1 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`} />
          <StepBadge
            number={2}
            label="Preferences"
            active={step === 2}
            completed={step > 2}
            onClick={() => (selectedProgrammeId ? setStep(2) : undefined)}
          />
          <div className={`h-0.5 sm:h-1 flex-1 mx-2 sm:mx-4 rounded transition-all min-w-[10px] ${step > 2 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`} />
          <StepBadge
            number={3}
            label="Results"
            active={step === 3}
            completed={savedSuccess}
            onClick={() => (resultsData ? setStep(3) : undefined)}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1: FACULTY & ACADEMIC PROGRAMME */}
        {step === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="space-y-6"
          >
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Select Your Academic Programme
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Each UOW Malaysia programme is mapped to verified hardware requirements to ensure smooth running of course software.
            </p>
          </div>

          {/* Selected Programme Summary & Quick Action */}
          {selectedProgramme && (
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 dark:from-blue-950/50 dark:via-indigo-950/40 dark:to-slate-900 border border-blue-200 dark:border-blue-800/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                      {selectedProgramme.code}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {selectedProgramme.duration_years} Years Duration
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedProgramme.name}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 border border-slate-200 dark:border-slate-700 shadow-2xs"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500" />
                  <span>Customize Budget</span>
                </button>

                <button
                  type="button"
                  onClick={handleRunRecommendation}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Instant Recommend</span>
                </button>
              </div>
            </div>
          )}

          {/* Faculty Cards Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {faculties.map((fac) => {
              const isSelected = fac.id === selectedFacultyId;
              return (
                <div
                  key={fac.id}
                  onClick={() => handleFacultySelect(fac.id)}
                  title={`Select ${fac.name} faculty to view its academic programmes`}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-950/60 border-blue-500 shadow-md shadow-blue-500/10'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                      {fac.code}
                    </span>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{fac.name}</h3>
                </div>
              );
            })}
          </div>

          {/* Programmes List under Selected Faculty */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span>Available Programmes in Selected Faculty</span>
            </h3>

            {activeProgrammeList.length === 0 ? (
              <p className="text-sm text-slate-400 py-4">No active programmes listed for this faculty.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeProgrammeList.map((prog) => {
                  const isSelected = prog.id === selectedProgrammeId;
                  return (
                    <div
                      key={prog.id}
                      onClick={() => setSelectedProgrammeId(prog.id)}
                      title={`Select ${prog.name} (${prog.code}) to map hardware requirements`}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                          : 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                      }`}
                    >
                      <div>
                        <span className={`font-mono text-xs font-bold ${isSelected ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'}`}>
                          {prog.code}
                        </span>
                        <h4 className="font-bold text-sm mt-0.5">{prog.name}</h4>
                        <p className={`text-xs mt-1 ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                          Duration: {prog.duration_years} Years
                        </p>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-white" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Hardware Profile Preview Note */}
          {selectedProgramme && selectedProgramme.requirement_profile && (
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2.5 text-slate-700 dark:text-slate-300">
                <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>
                  <strong className="text-slate-900 dark:text-white">Profile: {selectedProgramme.requirement_profile.name}</strong> • Min: {selectedProgramme.requirement_profile.minimum_cpu}, {selectedProgramme.requirement_profile.minimum_ram_gb}GB RAM, {selectedProgramme.requirement_profile.minimum_storage_gb}GB SSD
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 shrink-0 self-start sm:self-auto">
                Verified UOW Syllabus
              </span>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex justify-end pt-4">
            <button
              disabled={!selectedProgrammeId}
              onClick={() => setStep(2)}
              title={selectedProgrammeId ? 'Proceed to Step 2 to configure budget, brand, and device filters' : 'Select a programme first to proceed'}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <span>Next: Set Budget & Preferences</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 2: BUDGET & STUDENT PREFERENCES */}
      {step === 2 && (
        <motion.div
          key="step-2"
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -15 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="space-y-6"
        >
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Set Your Budget & Hardware Preferences
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              The recommendation engine will filter devices and match them against your academic course requirements.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Budget & Physical Priorities */}
              <div className="space-y-6">
                {/* 1. Budget Slider */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                      <span>Target Budget (MYR / RM)</span>
                    </label>
                    <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                      RM {preference.budget.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2000}
                    max={9000}
                    step={250}
                    value={preference.budget}
                    onChange={(e) => setPreference({ ...preference, budget: Number(e.target.value) })}
                    title={`Adjust maximum budget filter (Currently RM ${preference.budget.toLocaleString()})`}
                    className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                  />
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span>RM 2,000 (Entry)</span>
                    <span>RM 5,500 (Mid-Tier)</span>
                    <span>RM 9,000 (High-End)</span>
                  </div>
                </div>

                {/* Portability & Battery Priorities */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Portability & Battery Priorities
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-xs text-slate-700 dark:text-slate-300 block mb-1.5">
                        Weight & Portability
                      </label>
                      <select
                        value={preference.portability_priority}
                        onChange={(e) => setPreference({ ...preference, portability_priority: e.target.value as any })}
                        title="Select weight preference (Under 1.5kg lightweight vs Desktop replacement)"
                        className="w-full py-2.5 px-3 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer shadow-2xs"
                      >
                        <option value="Low">Low (Desktop replacement)</option>
                        <option value="Medium">Medium (Balanced)</option>
                        <option value="High">High (Under 1.5kg lightweight)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-xs text-slate-700 dark:text-slate-300 block mb-1.5">
                        Battery Endurance
                      </label>
                      <select
                        value={preference.battery_priority}
                        onChange={(e) => setPreference({ ...preference, battery_priority: e.target.value as any })}
                        title="Select battery endurance preference (10+ hours vs standard 4-6 hours)"
                        className="w-full py-2.5 px-3 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer shadow-2xs"
                      >
                        <option value="Low">Standard (4-6 Hours)</option>
                        <option value="Medium">Good (7-9 Hours)</option>
                        <option value="High">High Endurance (10+ Hours)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Hardware Compatibility Info Banner */}
                <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/50 flex items-start space-x-3 text-xs text-blue-900 dark:text-blue-200">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Hardware Compatibility Sync:</strong> Options auto-synchronize to ensure valid hardware combinations. For instance, choosing <em>Apple MacBook</em> automatically locks to <em>Apple Silicon CPU</em> and <em>Apple</em> manufacturer. Selecting <em>Intel or AMD</em> CPUs automatically filters for compatible Windows/Linux laptop manufacturers.
                  </p>
                </div>
              </div>

              {/* Right Column: Hardware Brands & Specs Filters */}
              <div className="space-y-5">
                {/* 2. Preferred Form Factor */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-bold text-sm text-slate-900 dark:text-white block">
                      Preferred Form Factor
                    </label>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Select physical design
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Any Device Type', value: 'Any' },
                      { label: 'Standard Windows Laptop', value: 'laptop' },
                      { label: 'Apple MacBook', value: 'macbook', badge: 'Apple Silicon' },
                      { label: '2-in-1 Convertible', value: '2-in-1' },
                    ].map((item) => {
                      const isSelected = preference.preferred_device_type === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => handleSelectFormFactor(item.value as any)}
                          title={`Filter recommendations to ${item.label}`}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer inline-flex items-center space-x-1.5 ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                          }`}
                        >
                          <span>{item.label}</span>
                          {item.badge && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                isSelected
                                  ? 'bg-blue-700 text-blue-100'
                                  : 'bg-slate-200 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Preferred CPU Brand */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-bold text-sm text-slate-900 dark:text-white block">
                      Preferred CPU Brand
                    </label>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Processor architecture
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Any Processor Brand', value: 'Any' },
                      { label: 'Intel Core / Ultra', value: 'Intel' },
                      { label: 'AMD Ryzen', value: 'AMD' },
                      { label: 'Apple Silicon (M1/M2/M3)', value: 'Apple', badge: 'MacBook' },
                    ].map((item) => {
                      const isSelected = preference.preferred_cpu_brand === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => handleSelectCpuBrand(item.value as any)}
                          title={`Filter processor preference to ${item.label}`}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer inline-flex items-center space-x-1.5 ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                          }`}
                        >
                          <span>{item.label}</span>
                          {item.badge && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                isSelected
                                  ? 'bg-blue-700 text-blue-100'
                                  : 'bg-slate-200 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preferred GPU Brand */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-bold text-sm text-slate-900 dark:text-white block">
                      Preferred GPU Brand
                    </label>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Graphics processor
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Any GPU Brand', value: 'Any' },
                      { label: 'NVIDIA GeForce / RTX', value: 'NVIDIA' },
                      { label: 'AMD Radeon', value: 'AMD' },
                      { label: 'Intel Arc / Integrated', value: 'Intel' },
                      { label: 'Apple GPU', value: 'Apple', badge: 'MacBook' },
                    ].map((item) => {
                      const isSelected = (preference.preferred_gpu_brand || 'Any') === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => handleSelectGpuBrand(item.value as any)}
                          title={`Filter graphics processor preference to ${item.label}`}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer inline-flex items-center space-x-1.5 ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                          }`}
                        >
                          <span>{item.label}</span>
                          {item.badge && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                isSelected
                                  ? 'bg-blue-700 text-blue-100'
                                  : 'bg-slate-200 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Preferred Brand Manufacturers */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-bold text-sm text-slate-900 dark:text-white block">
                      Preferred Brand Manufacturers
                    </label>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Filter partner brands
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAnyBrand}
                      title="Allow laptops from all brand manufacturers"
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer inline-flex items-center space-x-1.5 ${
                        preference.preferred_brand_ids.length === 0
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                      }`}
                    >
                      <span>Any Brand</span>
                    </button>

                    {brands.map((b) => {
                      const isChecked = preference.preferred_brand_ids.includes(b.id);
                      const isApple = appleBrandId === b.id;
                      const isMSI = msiBrandId === b.id;
                      const is2in1Brand = !isApple && !isMSI;
                      
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => handleToggleBrand(b.id)}
                          title={`Toggle ${b.name} laptop manufacturer filter`}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer inline-flex items-center space-x-1.5 ${
                            isChecked
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                          }`}
                        >
                          <span>{b.name}</span>
                          {isApple && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                isChecked
                                  ? 'bg-blue-700 text-blue-100'
                                  : 'bg-slate-200 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              MacBook
                            </span>
                          )}
                          {is2in1Brand && preference.preferred_device_type === '2-in-1' && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                isChecked
                                  ? 'bg-blue-700 text-blue-100'
                                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              }`}
                            >
                              2-in-1
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              title="Return to Step 1 to change your faculty or programme"
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={handleRunRecommendation}
              title="Calculate course compatibility scores and display ranked laptops"
              className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Ranked Recommendations</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 3: RECOMMENDATION RESULTS */}
      {step === 3 && resultsData && (
        <motion.div
          key="step-3"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="space-y-6 pb-24"
        >
          {/* Unified Recommendation Report & Ranked Devices Header Card */}
          <div
            ref={reportHeaderRef}
            className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-0"
          >
            {/* Report Title & Primary Actions */}
            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Recommendation Report
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  Top Matches for {resultsData.programme.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Target Budget: RM {preference.budget.toLocaleString()} | Profile: {resultsData.requirement_profile.name}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  onClick={() => setStep(2)}
                  title="Return to Step 2 to modify budget, brand, or device preference filters"
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Adjust Preferences
                </button>
                <button
                  type="button"
                  onClick={handleCompareSelected}
                  title="Compare selected laptop models side-by-side in the Comparison tab"
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <Scale className="w-4 h-4" />
                  <span>
                    Compare Devices {selectedDeviceIds.length > 0 ? `(${selectedDeviceIds.length})` : ''}
                  </span>
                </button>
                <button
                  onClick={handleOpenSaveModal}
                  title="Save selected laptop recommendations to your profile report"
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    savedSuccess
                      ? 'bg-emerald-700 text-white ring-2 ring-emerald-400 shadow-md shadow-emerald-500/30'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20'
                  }`}
                >
                  <BookmarkCheck className="w-4 h-4" />
                  <span>
                    {savedSuccess ? 'Saved to History ✓' : `Save Recommendation (${selectedDeviceIds.length})`}
                  </span>
                </button>
              </div>
            </div>

            {/* Gemini AI Hardware Analysis Banner with Smooth Inline Expansion */}
            <div className="p-5 bg-gradient-to-r from-blue-50/90 via-indigo-50/90 to-slate-50 dark:from-blue-950/70 dark:via-indigo-950/70 dark:to-slate-900 text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">Gemini AI Hardware Summary</h3>
                  {isAiSummaryExpanded && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-400/30">
                      Full Explanation
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsAiSummaryExpanded(!isAiSummaryExpanded)}
                  title={isAiSummaryExpanded ? 'Collapse Gemini AI hardware analysis' : 'Expand full Gemini AI hardware analysis and syllabus breakdown'}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-blue-500/30 dark:hover:bg-blue-500/50 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-400/30 transition-all cursor-pointer"
                >
                  <span>{isAiSummaryExpanded ? 'Show Less' : 'Full Explanation'}</span>
                  {isAiSummaryExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {loadingAi ? (
                <p className="text-xs text-blue-600 dark:text-blue-200 animate-pulse">Generating plain-language student advice with Gemini API...</p>
              ) : !isAiSummaryExpanded ? (
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-normal line-clamp-2">
                  {aiExplanation || 'Analyzed recommended models against UOW computing syllabus requirements.'}
                </p>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="space-y-4 pt-1"
                  >
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900/70 border border-blue-200 dark:border-blue-400/20 text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed font-normal whitespace-pre-line space-y-2 shadow-xs dark:shadow-inner">
                      {aiExplanation || 'Analyzed recommended models against UOW computing syllabus requirements.'}
                    </div>

                    {/* Programme Requirement Hardware Breakdown Pills */}
                    {resultsData?.requirement_profile && (
                      <div className="p-4 rounded-xl bg-white/90 dark:bg-slate-950/70 border border-indigo-200 dark:border-indigo-500/20 space-y-3 shadow-xs">
                        <div className="flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-200 font-bold flex-wrap gap-2">
                          <span className="flex items-center space-x-1.5">
                            <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span>{resultsData.programme.name} Hardware Profile</span>
                          </span>
                          <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold uppercase border border-blue-200 dark:border-blue-400/30">
                            Priority: #1 CPU → #2 RAM → #3 GPU → #4 Storage
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {resultsData.requirement_profile.explanation}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                          {/* 1. CPU */}
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-2">
                            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span>1. CPU (Processor)</span>
                              </span>
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-400/30 uppercase">
                                #1 Priority
                              </span>
                            </div>
                            <div className="space-y-1 text-left text-xs">
                              <div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Minimum Spec:</span>
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{resultsData.requirement_profile.minimum_cpu}</span>
                              </div>
                              <div className="pt-0.5">
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">Recommended Spec:</span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white">{resultsData.requirement_profile.recommended_cpu || resultsData.requirement_profile.minimum_cpu}</span>
                              </div>
                            </div>
                          </div>

                          {/* 2. RAM */}
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-2">
                            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                <span>2. RAM (Memory)</span>
                              </span>
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-400/30 uppercase">
                                #2 Priority
                              </span>
                            </div>
                            <div className="space-y-1 text-left text-xs">
                              <div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Minimum Spec:</span>
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{resultsData.requirement_profile.minimum_ram_gb} GB</span>
                              </div>
                              <div className="pt-0.5">
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">Recommended Spec:</span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white">{resultsData.requirement_profile.recommended_ram_gb || resultsData.requirement_profile.minimum_ram_gb} GB</span>
                              </div>
                            </div>
                          </div>

                          {/* 3. GPU */}
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-2">
                            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <Laptop className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                                <span>3. GPU (Graphics)</span>
                              </span>
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-400/30 uppercase shrink-0">
                                #3 Priority
                              </span>
                            </div>
                            <div className="space-y-1 text-left text-xs">
                              <div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Minimum Spec:</span>
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-200 break-words leading-relaxed">{resultsData.requirement_profile.minimum_gpu}</span>
                              </div>
                              <div className="pt-0.5">
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">Recommended Spec:</span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white break-words leading-relaxed">{resultsData.requirement_profile.recommended_gpu || resultsData.requirement_profile.minimum_gpu}</span>
                              </div>
                            </div>
                          </div>

                          {/* 4. Storage */}
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-2">
                            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <HardDrive className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                <span>4. Storage (SSD)</span>
                              </span>
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-400/30 uppercase">
                                #4 Priority
                              </span>
                            </div>
                            <div className="space-y-1 text-left text-xs">
                              <div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Minimum Spec:</span>
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{resultsData.requirement_profile.minimum_storage_gb} GB SSD</span>
                              </div>
                              <div className="pt-0.5">
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">Recommended Spec:</span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white">{resultsData.requirement_profile.recommended_storage_gb || resultsData.requirement_profile.minimum_storage_gb} GB SSD</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions inside expanded section */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => fetchAiExplanation(resultsData)}
                        disabled={loadingAi}
                        title="Re-run Gemini AI analysis on current course requirements"
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-blue-500/20 dark:hover:bg-blue-500/30 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-400/30 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${loadingAi ? 'animate-spin' : ''}`} />
                        <span>{loadingAi ? 'Regenerating...' : 'Regenerate AI Analysis'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsAiSummaryExpanded(false)}
                        title="Collapse AI hardware analysis section"
                        className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        <span>Show Less</span>
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Ranked Devices Header & Batch Selection Tab (Placed directly on top of Rank 1) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                Ranked Devices ({resultsData.results.length})
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {selectedDeviceIds.length} Selected
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSelectTop3}
                title="Automatically select the top 3 recommended laptop models"
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Select Top 3
              </button>
              <button
                type="button"
                onClick={handleSelectAll}
                title="Select all matching laptop models in this report"
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Select All
              </button>
              {selectedDeviceIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  title="Deselect all laptop models"
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>

          {savedSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold">Recommendation report saved successfully!</span>
              </div>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('saved-recommendations')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-xs self-start sm:self-auto"
                >
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span>View in Saved Recommendations</span>
                </button>
              )}
            </div>
          )}

          {/* Ranked Devices Category Sections */}
          {(() => {
            const withinBudgetDevices = resultsData.results.filter(
              (s) => s.device.price <= preference.budget
            );
            const slightlyExpensiveDevices = resultsData.results.filter(
              (s) => s.device.price > preference.budget
            );

            const renderDeviceCard = (scored: ScoredDevice, index: number, isSlightlyExpensive: boolean) => {
              const dev = scored.device;
              const isExpanded = !!expandedBreakdowns[dev.id];
              const isSelected = selectedDeviceIds.includes(dev.id);
              const scorePct = Math.min(100, Math.round(scored.score_breakdown.total_score || 85));

              return (
                <div
                  key={dev.id}
                  onClick={() => toggleDeviceSelection(dev.id)}
                  className={`p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border shadow-xs transition-all space-y-4 cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-500/20 dark:ring-blue-500/30'
                      : isSlightlyExpensive
                      ? 'border-amber-200 dark:border-amber-900/50 hover:border-amber-300 dark:hover:border-amber-700'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start space-x-3.5">
                      {/* Rank Badge & Laptop Thumbnail */}
                      <div className="relative flex-shrink-0 flex items-center space-x-3">
                        <div className={`w-9 h-9 rounded-xl text-white font-extrabold flex items-center justify-center text-sm shadow-xs flex-shrink-0 ${
                          isSlightlyExpensive ? 'bg-amber-600' : 'bg-blue-600'
                        }`}>
                          #{index + 1}
                        </div>
                        {dev.image_url && (
                          <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 hidden sm:block">
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
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                            {dev.brand ? dev.brand.name : 'Laptop'}
                          </span>
                          {scored.meets_recommended && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                              Exceeds Target
                            </span>
                          )}
                          {!scored.meets_minimum && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                              Below Min Specs
                            </span>
                          )}
                          {isSlightlyExpensive && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-300">
                              +RM {(dev.price - preference.budget).toLocaleString()} Over Target
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white mt-0.5">{dev.model}</h4>
                      </div>
                    </div>

                    {/* Price & Selection Checkbox */}
                    <div className="flex items-center space-x-3 self-end md:self-center">
                      <div className="text-right">
                        <span className={`text-xl sm:text-2xl font-extrabold block ${
                          isSlightlyExpensive ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'
                        }`}>
                          RM {dev.price.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {dev.price <= preference.budget
                            ? 'Within Target Budget'
                            : `+RM ${(dev.price - preference.budget).toLocaleString()} Over Target`}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDeviceSelection(dev.id);
                        }}
                        title={isSelected ? 'Click to deselect this laptop' : 'Click to select this laptop for comparison'}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <CheckSquare className="w-4 h-4 text-white" />
                            <span>Selected</span>
                          </>
                        ) : (
                          <>
                            <Square className="w-4 h-4 text-slate-400" />
                            <span>Select</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Clean Key Specs Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 font-medium flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>{dev.cpu_name}</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 font-medium flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{dev.ram_gb}GB RAM</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 font-medium flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{dev.storage_gb}GB SSD {dev.storage_upgradeable ? '(Upgradeable)' : ''}</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 font-medium flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span>{dev.gpu_name}</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 font-medium flex items-center gap-1">
                      <Battery className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                      <span>~{dev.battery_life_hours || 6}h Battery</span>
                    </span>
                    {dev.weight_kg && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 font-medium flex items-center gap-1">
                        <Scale className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{dev.weight_kg} kg</span>
                      </span>
                    )}
                  </div>

                  {/* Suitability Score Summary Bar & Expand Toggle */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {scorePct}% Compatibility
                      </span>
                      <span className="text-[11px] text-slate-400 hidden sm:inline">•</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                        {scored.meets_recommended
                          ? 'Comfortably exceeds all programme requirements'
                          : scored.meets_minimum
                          ? 'Meets standard syllabus requirements'
                          : 'Below recommended hardware threshold'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedBreakdowns((prev) => ({
                          ...prev,
                          [dev.id]: !prev[dev.id],
                        }));
                      }}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      <span>{isExpanded ? 'Hide Specs Breakdown' : 'View Specs Breakdown'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* On-Demand Component Breakdown */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3 pt-3"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                          {/* Course Requirement Match */}
                          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                                Course Fit
                              </span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                scored.score_breakdown.requirement_match >= 30 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
                              }`}>
                                {scored.score_breakdown.requirement_match >= 30 ? 'Recommended' : 'Standard'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                              {scored.meets_recommended ? 'Exceeds recommended profile' : 'Satisfies basic coursework'}
                            </span>
                          </div>

                          {/* Processor Speed */}
                          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                                CPU Power
                              </span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                scored.score_breakdown.cpu_score >= 8 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
                              }`}>
                                {scored.score_breakdown.cpu_score >= 8 ? 'Strong' : 'Moderate'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                              {dev.cpu_name}
                            </span>
                          </div>

                          {/* Graphics */}
                          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-purple-500" />
                                Graphics
                              </span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                scored.score_breakdown.gpu_score >= 8 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
                              }`}>
                                {scored.score_breakdown.gpu_score >= 8 ? 'Dedicated' : 'Standard'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                              {dev.gpu_name}
                            </span>
                          </div>
                        </div>

                        {/* Match Reasons */}
                        {scored.reasons && scored.reasons.length > 0 && (
                          <div className="pt-1 flex flex-wrap gap-1.5 text-xs">
                            {scored.reasons.map((reason, rIdx) => (
                              <span
                                key={rIdx}
                                className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-[11px]"
                              >
                                ✓ {reason}
                              </span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            };

            return (
              <div className="space-y-6">
                {/* Section 1: Within Target Budget */}
                {withinBudgetDevices.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      <div className="flex items-center space-x-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            Within Target Budget (Up to RM {preference.budget.toLocaleString()})
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Laptops that match or fall below your target budget of RM {preference.budget.toLocaleString()}.
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                        {withinBudgetDevices.length} {withinBudgetDevices.length === 1 ? 'Model' : 'Models'}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {withinBudgetDevices.map((scored, idx) => renderDeviceCard(scored, idx, false))}
                    </div>
                  </div>
                )}

                {/* Section 2: Slightly Expensive Category (+RM 1 to +RM 1,500 Over Target) */}
                {slightlyExpensiveDevices.length > 0 && (
                  <div className="pt-2 space-y-4">
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <div className="flex items-center space-x-2.5">
                        <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                            <span>Slightly Expensive Options (+RM 1 to +RM 1,500 Over Target)</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 uppercase">
                              Higher Specs
                            </span>
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Laptops priced between RM {(preference.budget + 1).toLocaleString()} and RM {(preference.budget + 1500).toLocaleString()} offering premium hardware upgrades.
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shrink-0">
                        {slightlyExpensiveDevices.length} {slightlyExpensiveDevices.length === 1 ? 'Option' : 'Options'}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {slightlyExpensiveDevices.map((scored, idx) =>
                        renderDeviceCard(scored, withinBudgetDevices.length + idx, true)
                      )}
                    </div>
                  </div>
                )}

                {resultsData.results.length === 0 && (
                  <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">No Laptops Found Within RM {(preference.budget + 1500).toLocaleString()}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                      All available devices exceed your target budget + RM 1,500 margin. Please consider increasing your budget target in Step 2.
                    </p>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs transition-colors hover:bg-blue-700 cursor-pointer"
                    >
                      Adjust Target Budget
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Floating Warning Message when no device selected */}
          <AnimatePresence>
            {saveWarning && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="fixed bottom-20 right-4 sm:right-8 z-50 p-4 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-2xl flex items-center space-x-3 border border-amber-400 max-w-md"
              >
                <AlertCircle className="w-5 h-5 shrink-0 text-slate-950" />
                <span className="flex-1 leading-snug">{saveWarning}</span>
                <button
                  type="button"
                  onClick={() => setSaveWarning(null)}
                  className="p-1 rounded-lg hover:bg-amber-600/30 text-slate-950 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ACTION DOCK ALWAYS FIXED AT THE BOTTOM OF THE SCREEN */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 shadow-[0_-10px_30px_-5px_rgba(0,0,0,0.12)] dark:shadow-[0_-10px_30px_-5px_rgba(0,0,0,0.5)] backdrop-blur-md p-2.5 sm:p-4">
            <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-2 sm:gap-4 px-2 sm:px-6">
              {/* LEFT SIDE: Adjust Preferences */}
              <button
                type="button"
                onClick={() => setStep(2)}
                title="Return to Step 2 to modify budget, brand, or device preference filters"
                className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Adjust Preferences</span>
                <span className="sm:hidden">Adjust</span>
              </button>

              {/* MIDDLE (OPTIONAL): View Full AI Explanation when scrolled down */}
              <AnimatePresence>
                {hasPassedReportHeader && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    type="button"
                    onClick={() => {
                      setIsAiSummaryExpanded(!isAiSummaryExpanded);
                      if (!isAiSummaryExpanded) {
                        reportHeaderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    title={isAiSummaryExpanded ? 'Collapse Gemini AI hardware analysis' : 'Expand full Gemini AI hardware analysis and syllabus breakdown'}
                    className="flex items-center justify-center space-x-1.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    <span className="hidden md:inline">{isAiSummaryExpanded ? 'Collapse AI Explanation' : 'View Full AI Explanation'}</span>
                    <span className="md:hidden">{isAiSummaryExpanded ? 'Collapse AI' : 'AI Explanation'}</span>
                    {isAiSummaryExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </motion.button>
                )}
              </AnimatePresence>

              {/* RIGHT SIDE: Save & Compare Buttons (Done removed, Compare moved here) */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={handleOpenSaveModal}
                  title="Save selected laptop recommendations to your profile report"
                  className={`flex items-center space-x-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer shrink-0 ${
                    savedSuccess
                      ? 'bg-emerald-700 text-white ring-2 ring-emerald-400'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20'
                  }`}
                >
                  <BookmarkCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {savedSuccess ? 'Saved ✓' : `Save (${selectedDeviceIds.length})`}
                  </span>
                  <span className="sm:hidden">
                    {savedSuccess ? 'Saved' : `Save (${selectedDeviceIds.length})`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleCompareSelected}
                  title="Compare selected laptop models side-by-side in the comparison matrix"
                  className="flex items-center space-x-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer shrink-0"
                >
                  <Scale className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    Compare ({selectedDeviceIds.length})
                  </span>
                  <span className="sm:hidden">
                    Compare ({selectedDeviceIds.length})
                  </span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}


      </AnimatePresence>

      {/* Save Recommendation Modal */}
      <AnimatePresence>
        {isSaveModalOpen && resultsData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-5 overflow-hidden relative max-h-[90vh] flex flex-col"
            >
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                title="Close save modal"
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner border border-emerald-200 dark:border-emerald-800/50 shrink-0">
                  <BookmarkCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Save Recommendation Report
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Save your matched laptops and syllabus hardware requirements to history.
                  </p>
                </div>
              </div>

              <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                {/* Title Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Report Title
                  </label>
                  <input
                    type="text"
                    value={customSaveTitle}
                    onChange={(e) => setCustomSaveTitle(e.target.value)}
                    placeholder={`Top Matches for ${resultsData.programme.name}`}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                {/* Report Info Pill Summary */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">Programme:</span>
                    <span className="font-bold text-slate-900 dark:text-white truncate max-w-[240px]">
                      {resultsData.programme.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">Target Budget:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      RM {preference.budget.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">Selected Laptops:</span>
                    <span className="font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[11px]">
                      {selectedDeviceIds.length} models selected
                    </span>
                  </div>
                </div>

                {/* Selected Laptops Preview */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Selected Laptops ({selectedDeviceIds.length})</span>
                    <span className="text-[10px] text-slate-400 font-normal">Click outside to adjust selection</span>
                  </label>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {resultsData.results
                      .filter((r) => selectedDeviceIds.includes(r.device.id))
                      .map((scored) => (
                        <div
                          key={scored.device.id}
                          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <Laptop className="w-4 h-4 text-blue-500 shrink-0" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {scored.device.model}
                            </span>
                          </div>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0 text-xs">
                            RM {scored.device.price.toLocaleString()}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRecommendation}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center space-x-2 transition-all cursor-pointer"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <BookmarkCheck className="w-4 h-4" />
                      <span>Save Recommendation</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Required Pop-out Modal for Unauthenticated Students */}
      <AnimatePresence>
        {isAuthPromptOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 text-center space-y-5 overflow-hidden relative"
            >
              <button
                type="button"
                onClick={() => setIsAuthPromptOpen(false)}
                title="Close authorization alert"
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner border border-blue-200 dark:border-blue-800/50">
                <BookmarkCheck className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Save Recommendation Set
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed px-2">
                  Sign in to link this report directly to your student account, or save as guest student.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-left space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-200">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Why Register or Sign In?</span>
                </div>
                <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <li>Store custom laptop recommendation sets to your profile</li>
                  <li>Revisit Gemini AI syllabus advice anytime in your history</li>
                  <li>Track recommended hardware profiles across devices</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAuthPromptOpen(false);
                    onOpenAuth?.('login', 'student');
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 cursor-pointer transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In as Student</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAuthPromptOpen(false);
                    onOpenAuth?.('register', 'student');
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 flex items-center justify-center space-x-2 cursor-pointer transition-all"
                >
                  <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Register Student Account</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAuthPromptOpen(false);
                    setIsSaveModalOpen(true);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center space-x-2 cursor-pointer transition-all"
                >
                  <BookmarkCheck className="w-4 h-4" />
                  <span>Save as Guest Student</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAuthPromptOpen(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 pt-1 font-medium transition-colors cursor-pointer"
                >
                  Cancel / Continue Browsing
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StepBadge: React.FC<{
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
  onClick?: () => void;
}> = ({ number, label, active, completed, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    title={`Step ${number}: ${label} - ${completed ? 'Completed (Click to jump back)' : active ? 'Current active step' : onClick ? 'Click to navigate to this step' : 'Complete previous steps to unlock'}`}
    className={`flex items-center space-x-1.5 sm:space-x-2 transition-all shrink-0 ${
      onClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
    }`}
  >
    <div
      className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs transition-all shrink-0 ${
        completed
          ? 'bg-emerald-600 text-white shadow-sm'
          : active
          ? 'bg-blue-600 text-white ring-2 sm:ring-4 ring-blue-500/20 shadow-md'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
      }`}
    >
      {completed ? '✓' : number}
    </div>
    <span
      className={`text-[10px] sm:text-xs font-semibold whitespace-nowrap ${
        active
          ? 'text-blue-600 dark:text-blue-400 font-bold'
          : completed
          ? 'text-slate-700 dark:text-slate-300'
          : 'text-slate-400 dark:text-slate-500'
      }`}
    >
      {label}
    </span>
  </button>
);
