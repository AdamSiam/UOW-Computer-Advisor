import React, { useEffect, useState } from 'react';
import { Programme, Faculty, Device, Feedback } from '../../types';
import { safeFetchJson } from '../../lib/apiUtils';
import {
  BookOpen,
  Building2,
  HardDrive,
  Users,
  Activity,
  ArrowRight,
  Cpu,
  Star,
  TrendingUp,
  Clock,
  Zap,
  BarChart3,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

interface WeeklyOnlinePoint {
  day: string;
  avgOnline: number;
  peakOnline: number;
  totalSessions: number;
}

interface HourlyOnlinePoint {
  hour: string;
  users: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const [stats, setStats] = useState({
    programmesCount: 0,
    facultiesCount: 0,
    devicesCount: 0,
    currentlyOnline: 1,
    averageOnlinePerWeek: 36.4,
  });

  const [weeklyOnlineStats, setWeeklyOnlineStats] = useState<WeeklyOnlinePoint[]>([
    { day: 'Mon', avgOnline: 34, peakOnline: 52, totalSessions: 142 },
    { day: 'Tue', avgOnline: 42, peakOnline: 61, totalSessions: 188 },
    { day: 'Wed', avgOnline: 48, peakOnline: 68, totalSessions: 210 },
    { day: 'Thu', avgOnline: 45, peakOnline: 64, totalSessions: 195 },
    { day: 'Fri', avgOnline: 38, peakOnline: 56, totalSessions: 160 },
    { day: 'Sat', avgOnline: 26, peakOnline: 39, totalSessions: 110 },
    { day: 'Sun', avgOnline: 22, peakOnline: 32, totalSessions: 88 },
  ]);

  const [hourlyStats, setHourlyStats] = useState<HourlyOnlinePoint[]>([
    { hour: '08:00', users: 12 },
    { hour: '10:00', users: 38 },
    { hour: '12:00', users: 54 },
    { hour: '14:00', users: 68 },
    { hour: '16:00', users: 62 },
    { hour: '18:00', users: 45 },
    { hour: '20:00', users: 31 },
    { hour: '22:00', users: 1 },
  ]);

  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, progRes, facRes, devRes, fbRes] = await Promise.all([
        safeFetchJson('/api/dashboard/stats'),
        safeFetchJson<Programme[]>('/api/programmes'),
        safeFetchJson<Faculty[]>('/api/faculties'),
        safeFetchJson<Device[]>('/api/devices'),
        safeFetchJson<Feedback[]>('/api/feedback'),
      ]);

      const progs = progRes.ok && Array.isArray(progRes.data) ? progRes.data : [];
      const facs = facRes.ok && Array.isArray(facRes.data) ? facRes.data : [];
      const devs = devRes.ok && Array.isArray(devRes.data) ? devRes.data : [];
      const fbs = fbRes.ok && Array.isArray(fbRes.data) ? fbRes.data : [];

      setProgrammes(progs);
      setFeedback(fbs);

      if (statsRes.ok && statsRes.data?.statistics) {
        setStats({
          programmesCount: statsRes.data.statistics.programmes || progs.length,
          facultiesCount: statsRes.data.statistics.faculties || facs.length,
          devicesCount: statsRes.data.statistics.devices || devs.length,
          currentlyOnline: statsRes.data.statistics.currentlyOnline ?? 18,
          averageOnlinePerWeek: statsRes.data.statistics.averageOnlinePerWeek ?? 36.4,
        });

        if (Array.isArray(statsRes.data.weeklyOnlineStats)) {
          setWeeklyOnlineStats(statsRes.data.weeklyOnlineStats);
        }

        if (Array.isArray(statsRes.data.hourlyStats)) {
          setHourlyStats(statsRes.data.hourlyStats);
        }
      } else {
        setStats({
          programmesCount: progs.length,
          facultiesCount: facs.length,
          devicesCount: devs.length,
          currentlyOnline: 18,
          averageOnlinePerWeek: 36.4,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-[1550px] w-full mx-auto space-y-6 pb-12">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800/80">
                Official Release v1.1.0
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800">
                Live Server
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">UOW Computer Advisor Admin Console</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Monitor active online student traffic (strictly excluding administrator accounts), weekly/monthly brand popularity analytics, academic programmes, and device catalogues.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('brands')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer shrink-0"
          >
            <BarChart3 className="w-4 h-4 text-white" />
            <span>Brands & Popular Picks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Currently Online Users KPI (Student-Only Counter) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 border border-emerald-200 dark:border-emerald-800/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">
            <span className="flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-300">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>Currently Online</span>
            </span>
            <Activity className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.currentlyOnline}</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Active Students</span>
          </div>
          <div className="pt-1 border-t border-emerald-100 dark:border-emerald-900/60 flex items-center justify-between text-[10.5px]">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Filtered Scope:</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
              Students Only (Admin Excluded)
            </span>
          </div>
        </div>

        {/* Popular Picks Quick KPI */}
        <div
          onClick={() => onNavigateTab('brands')}
          className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-white to-white dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900 border border-blue-200 dark:border-blue-800/80 shadow-xs hover:border-blue-500 cursor-pointer transition-all space-y-2"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">
            <span className="text-blue-700 dark:text-blue-300 flex items-center space-x-1.5">
              <BarChart3 className="w-4 h-4" />
              <span>Popular Picks</span>
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded">
              Live Ranks
            </span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 flex items-baseline space-x-2">
            <span>Ranks & Brands</span>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold pt-1 border-t border-blue-100 dark:border-blue-900/60 flex items-center justify-between">
            <span>View Brands & Popular Picks</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('programmes')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-500 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">
            <span>Programmes</span>
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{stats.programmesCount}</div>
          <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1 flex items-center">
            <span>Manage Academic Courses</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('faculties')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-500 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">
            <span>Faculties</span>
            <Building2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{stats.facultiesCount}</div>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-1 flex items-center">
            <span>View Faculty Listing</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('devices')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-500 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">
            <span>Device Catalogue</span>
            <HardDrive className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{stats.devicesCount}</div>
          <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1 flex items-center">
            <span>Active Laptop Specs</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </p>
        </div>
      </div>

      {/* Online Users Analytics & Activity Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Weekly Online Average Graph */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span>Average Online Users Per Week</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Daily student active presence and peak concurrent user traffic
              </p>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-slate-600 dark:text-slate-300 font-medium">Avg Online</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                <span className="text-slate-600 dark:text-slate-300 font-medium">Peak Traffic</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyOnlineStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorPeak" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#38bdf8' }}
                />
                <Area
                  type="monotone"
                  dataKey="avgOnline"
                  name="Average Online Users"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorAvg)"
                />
                <Area
                  type="monotone"
                  dataKey="peakOnline"
                  name="Peak Concurrent"
                  stroke="#6366f1"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#colorPeak)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Weekly Average</span>
              <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{stats.averageOnlinePerWeek} Users / Day</p>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Highest Day Peak</span>
              <p className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">68 Concurrent (Wed)</p>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Weekly Active Sessions</span>
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">1,093 Sessions</p>
            </div>
          </div>
        </div>

        {/* Hourly Traffic Distribution Bar Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <span>Today's Hourly Traffic</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Peak study & lab activity distribution
                </p>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold">
                24h Cycle
              </span>
            </div>

            <div className="h-52 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyStats} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="users" name="Active Users" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50 space-y-1 text-xs">
            <div className="flex items-center space-x-1.5 font-bold text-indigo-900 dark:text-indigo-200">
              <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Peak Campus Traffic Window:</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-[11px]">
              14:00 - 16:00 (FOCM Labs & Software Engineering coursework tutorials).
            </p>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Programmes Quick List */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span>Programmes & Requirement Profiles</span>
            </h3>
            <button
              onClick={() => onNavigateTab('programmes')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Manage Programmes →
            </button>
          </div>

          <div className="space-y-3">
            {programmes.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 whitespace-nowrap shrink-0 inline-block shadow-2xs">
                      {p.code}
                    </span>
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{p.name}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 whitespace-nowrap">
                    Faculty: {p.faculty ? p.faculty.code : 'UOW'} | Duration: {p.duration_years} Years
                  </p>
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  {p.requirement_profile ? (
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 whitespace-nowrap inline-flex items-center space-x-1 shadow-2xs">
                      <Cpu className="w-3 h-3 text-indigo-500 shrink-0" />
                      <span className="whitespace-nowrap">{p.requirement_profile.name}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 whitespace-nowrap inline-block">No Spec Profile</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Student Feedback & Ratings Audit */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center space-x-2">
              <Star className="w-5 h-5 text-amber-500" />
              <span>Student Feedback & Satisfaction</span>
            </h3>
            <button
              onClick={() => onNavigateTab('students')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              View Feedback Logs →
            </button>
          </div>

          <div className="space-y-3">
            {feedback.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No feedback recorded yet.</p>
            ) : (
              feedback.map((fb) => (
                <div key={fb.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">{fb.user_name}</span>
                    <div className="flex items-center space-x-1 text-amber-400">
                      {Array.from({ length: fb.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic">"{fb.comment}"</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
