import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI as LLMClient } from '@google/genai';
import {
  initialFaculties,
  initialRequirementProfiles,
  initialProgrammes,
  initialBrands,
  initialDevices,
  initialSavedRecommendations,
  initialFeedback,
} from './src/data/mockData.js';
import { rankDevicesForProgramme } from './src/services/recommendationEngine.js';
import { Faculty, Programme, RequirementProfile, Brand, Device, StudentPreference, SavedRecommendation, Feedback, User } from './src/types.js';

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const PORT = Number(process.env.PORT) || 3000;

// In-Memory Database State
let faculties: Faculty[] = [...initialFaculties];
let requirementProfiles: RequirementProfile[] = [...initialRequirementProfiles];
let programmes: Programme[] = [...initialProgrammes];
let brands: Brand[] = [...initialBrands];
let devices: Device[] = [...initialDevices];
let savedRecommendations: SavedRecommendation[] = [...initialSavedRecommendations];
let feedbackList: Feedback[] = [...initialFeedback];

// In-Memory Users Database
interface StoredUser extends User {
  password_hash: string;
}

let users: StoredUser[] = [
  {
    id: 1,
    name: 'UOW System Administrator',
    email: 'AdminCA@uow.edu.my',
    role: 'administrator',
    staff_id: 'ADM-UOW-01',
    password_hash: 'Abcd@1234',
    created_at: new Date('2026-01-01').toISOString(),
  },
];

// Initialize Gemini Client safely
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new LLMClient({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'uow-advisor-service',
      },
    },
  });
}

// Helper to attach relationships to Programme
function hydradeProgramme(prog: Programme): Programme {
  const faculty = faculties.find((f) => f.id === prog.faculty_id);
  const reqProfile = requirementProfiles.find((r) => r.id === prog.requirement_profile_id);
  return {
    ...prog,
    faculty,
    requirement_profile: reqProfile,
  };
}

// Active online presence tracker (Tracking only student sessions for online count)
interface ActiveSession {
  lastSeen: number;
  role: 'student' | 'administrator';
}

const activeSessionsMap = new Map<string, ActiveSession>();

function registerPresence(req: express.Request) {
  const clientId = (req.headers['x-client-id'] as string) || (req.headers['x-forwarded-for'] as string) || req.ip || 'session-unknown';
  const roleHeader = (req.headers['x-user-role'] as string) || (req.body && req.body.role);
  
  // Check authorization header if user is logged in as admin
  let detectedRole: 'student' | 'administrator' = roleHeader === 'administrator' ? 'administrator' : 'student';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('uow_token_')) {
    const parts = authHeader.split('_');
    const parsedId = Number(parts[2]);
    const matchedUser = users.find((u) => u.id === parsedId);
    if (matchedUser && matchedUser.role === 'administrator') {
      detectedRole = 'administrator';
    }
  }

  activeSessionsMap.set(clientId, {
    lastSeen: Date.now(),
    role: detectedRole,
  });
}

function getActiveOnlineStudentCount(): number {
  const now = Date.now();
  for (const [id, session] of activeSessionsMap.entries()) {
    // 25 seconds timeout window
    if (now - session.lastSeen > 25000) {
      activeSessionsMap.delete(id);
    }
  }

  let studentCount = 0;
  for (const session of activeSessionsMap.values()) {
    // STRICTLY count students and exclude administrators
    if (session.role === 'student') {
      studentCount++;
    }
  }
  return studentCount;
}

// Student Laptop Picks and Brand Popularity Tracking
interface LaptopPickRecord {
  id: number;
  device_id: number;
  brand_id: number;
  brand_name: string;
  model: string;
  programme_id: number;
  programme_name: string;
  budget: number;
  picked_at: string;
}

// Reset initial student laptop picks to empty (0 picks initially)
let laptopPicks: LaptopPickRecord[] = [];

// Middleware to automatically log active presence on all /api requests
app.use('/api', (req, res, next) => {
  registerPresence(req);
  next();
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.1.0',
    app: 'UOW Computer Advisor',
    onlineCount: getActiveOnlineStudentCount(),
    note: 'Online count reflects active student sessions only',
  });
});

app.post('/api/heartbeat', (req, res) => {
  registerPresence(req);
  res.json({
    status: 'ok',
    onlineCount: getActiveOnlineStudentCount(),
    role: (req.headers['x-user-role'] as string) || (req.body && req.body.role) || 'student',
  });
});

// Dashboard Statistics Endpoint (matching DashboardController)
app.get('/api/dashboard/stats', (req, res) => {
  const activeStudentCount = getActiveOnlineStudentCount();

  const weeklyStats = [
    { day: 'Mon', avgOnline: 34, peakOnline: 52, totalSessions: 142 },
    { day: 'Tue', avgOnline: 42, peakOnline: 61, totalSessions: 188 },
    { day: 'Wed', avgOnline: 48, peakOnline: 68, totalSessions: 210 },
    { day: 'Thu', avgOnline: 45, peakOnline: 64, totalSessions: 195 },
    { day: 'Fri', avgOnline: 38, peakOnline: 56, totalSessions: 160 },
    { day: 'Sat', avgOnline: 26, peakOnline: 39, totalSessions: 110 },
    { day: 'Sun', avgOnline: 22, peakOnline: 32, totalSessions: 88 },
  ];

  const totalAvg = Math.round(
    (weeklyStats.reduce((acc, curr) => acc + curr.avgOnline, 0) / weeklyStats.length) * 10
  ) / 10;

  const hourlyStats = [
    { hour: '08:00', users: 12 },
    { hour: '10:00', users: 38 },
    { hour: '12:00', users: 54 },
    { hour: '14:00', users: 68 },
    { hour: '16:00', users: 62 },
    { hour: '18:00', users: 45 },
    { hour: '20:00', users: 31 },
    { hour: '22:00', users: activeStudentCount },
  ];

  res.json({
    statistics: {
      faculties: faculties.length,
      students: users.filter((u) => u.role === 'student').length,
      programmes: programmes.length,
      devices: devices.length,
      currentlyOnline: activeStudentCount,
      averageOnlinePerWeek: totalAvg,
    },
    weeklyOnlineStats: weeklyStats,
    hourlyStats,
    recentFaculties: faculties.slice(0, 5),
  });
});

// --- BRAND POPULARITY REPORT ENDPOINT (Weekly, Monthly, All-Time) ---
app.get('/api/reports/brand-popularity', (req, res) => {
  const period = (req.query.period as 'weekly' | 'monthly' | 'all') || 'weekly';
  const programmeIdFilter = req.query.programme_id ? Number(req.query.programme_id) : undefined;
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  let cutoffTimestamp = 0;
  let previousPeriodStart = 0;
  let periodLabel = 'Last 7 Days (Weekly)';

  if (period === 'weekly') {
    cutoffTimestamp = now - 7 * dayMs;
    previousPeriodStart = now - 14 * dayMs;
    periodLabel = 'Weekly Report (Past 7 Days)';
  } else if (period === 'monthly') {
    cutoffTimestamp = now - 30 * dayMs;
    previousPeriodStart = now - 60 * dayMs;
    periodLabel = 'Monthly Report (Past 30 Days)';
  } else {
    cutoffTimestamp = 0;
    previousPeriodStart = 0;
    periodLabel = 'All-Time Historical Report';
  }

  // Filter current period picks
  let periodPicks = laptopPicks.filter((p) => new Date(p.picked_at).getTime() >= cutoffTimestamp);
  let prevPeriodPicks = laptopPicks.filter(
    (p) => {
      const t = new Date(p.picked_at).getTime();
      return t >= previousPeriodStart && t < cutoffTimestamp;
    }
  );

  if (programmeIdFilter) {
    periodPicks = periodPicks.filter((p) => p.programme_id === programmeIdFilter);
    prevPeriodPicks = prevPeriodPicks.filter((p) => p.programme_id === programmeIdFilter);
  }

  const totalPicks = Math.max(1, periodPicks.length);

  // Group picks by brand
  const brandMap = new Map<number, {
    brandId: number;
    brandName: string;
    pickCount: number;
    modelCounts: Map<string, number>;
    totalBudget: number;
    programmeCounts: Map<string, number>;
  }>();

  // Initialize all known brands so they appear in ranking even with 0 picks
  for (const b of brands) {
    brandMap.set(b.id, {
      brandId: b.id,
      brandName: b.name,
      pickCount: 0,
      modelCounts: new Map(),
      totalBudget: 0,
      programmeCounts: new Map(),
    });
  }

  for (const pick of periodPicks) {
    if (!brandMap.has(pick.brand_id)) {
      brandMap.set(pick.brand_id, {
        brandId: pick.brand_id,
        brandName: pick.brand_name,
        pickCount: 0,
        modelCounts: new Map(),
        totalBudget: 0,
        programmeCounts: new Map(),
      });
    }
    const entry = brandMap.get(pick.brand_id)!;
    entry.pickCount++;
    entry.totalBudget += pick.budget || 3500;
    entry.modelCounts.set(pick.model, (entry.modelCounts.get(pick.model) || 0) + 1);
    entry.programmeCounts.set(pick.programme_name, (entry.programmeCounts.get(pick.programme_name) || 0) + 1);
  }

  // Also calculate previous period brand counts for growth rate calculation
  const prevBrandCounts = new Map<number, number>();
  for (const pick of prevPeriodPicks) {
    prevBrandCounts.set(pick.brand_id, (prevBrandCounts.get(pick.brand_id) || 0) + 1);
  }

  const actualTotalPicks = periodPicks.length;

  const brandItems = Array.from(brandMap.values()).map((b) => {
    // Determine top picked model
    let topModel = 'N/A';
    let maxModelCount = 0;
    for (const [m, count] of b.modelCounts.entries()) {
      if (count > maxModelCount) {
        maxModelCount = count;
        topModel = m;
      }
    }

    // Determine top programmes
    const progSorted = Array.from(b.programmeCounts.entries())
      .map(([progName, count]) => ({ programmeName: progName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const prevCount = prevBrandCounts.get(b.brandId) || 0;
    const growth = prevCount > 0 ? Math.round(((b.pickCount - prevCount) / prevCount) * 1000) / 10 : 0;

    return {
      brandId: b.brandId,
      brandName: b.brandName,
      pickCount: b.pickCount,
      percentage: actualTotalPicks > 0 ? Math.round((b.pickCount / actualTotalPicks) * 1000) / 10 : 0,
      topModel,
      avgBudget: b.pickCount > 0 ? Math.round(b.totalBudget / b.pickCount) : 0,
      growthRate: growth,
      popularInProgrammes: progSorted,
    };
  });

  // Sort by pickCount descending
  brandItems.sort((a, b) => b.pickCount - a.pickCount);

  // Generate trend line points for Recharts
  const trendData: { label: string; [key: string]: any }[] = [];

  if (period === 'weekly') {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const currentDayIdx = new Date().getDay(); // 0 is Sun, 1 is Mon
    // Reorder days ending on today
    for (let i = 6; i >= 0; i--) {
      const targetTime = now - i * dayMs;
      const dayDate = new Date(targetTime);
      const dayName = days[(dayDate.getDay() + 6) % 7];
      const startOfDay = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate()).getTime();
      const endOfDay = startOfDay + dayMs;

      const dayPicks = periodPicks.filter((p) => {
        const t = new Date(p.picked_at).getTime();
        return t >= startOfDay && t < endOfDay;
      });

      const point: { label: string; [key: string]: any } = { label: dayName };
      for (const brand of brandItems.slice(0, 6)) {
        point[brand.brandName] = dayPicks.filter((p) => p.brand_id === brand.brandId).length;
      }
      point['Total Picks'] = dayPicks.length;
      trendData.push(point);
    }
  } else {
    // 4 Weeks for Monthly / All-Time
    const weekLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    for (let w = 3; w >= 0; w--) {
      const startOfWk = now - (w + 1) * 7 * dayMs;
      const endOfWk = now - w * 7 * dayMs;

      const wkPicks = periodPicks.filter((p) => {
        const t = new Date(p.picked_at).getTime();
        return t >= startOfWk && t < endOfWk;
      });

      const point: { label: string; [key: string]: any } = { label: weekLabels[3 - w] };
      for (const brand of brandItems.slice(0, 6)) {
        point[brand.brandName] = wkPicks.filter((p) => p.brand_id === brand.brandId).length;
      }
      point['Total Picks'] = wkPicks.length;
      trendData.push(point);
    }
  }

  const topBrand = actualTotalPicks > 0 && brandItems[0]?.pickCount > 0
    ? brandItems[0]
    : { brandName: 'No picks yet', pickCount: 0, percentage: 0, topModel: 'N/A' };

  res.json({
    period,
    totalPicks: actualTotalPicks,
    periodLabel,
    topBrandName: topBrand.brandName,
    topBrandPicks: topBrand.pickCount,
    topBrandShare: topBrand.percentage,
    topModelName: topBrand.topModel,
    brands: brandItems,
    trendData,
  });
});

// Endpoint to reset student picks to zero
app.post('/api/reports/brand-popularity/reset', (req, res) => {
  laptopPicks = [];
  res.json({ success: true, message: 'All student laptop popularity picks have been reset to zero.' });
});

// Endpoint to explicitly log a student laptop pick/selection
app.post('/api/devices/:id/pick', (req, res) => {
  const deviceId = Number(req.params.id);
  const device = devices.find((d) => d.id === deviceId);
  if (!device) {
    return res.status(404).json({ message: 'Device not found' });
  }

  const brand = brands.find((b) => b.id === device.brand_id);
  const { programme_id, programme_name, budget } = req.body;

  const newPick: LaptopPickRecord = {
    id: Date.now(),
    device_id: device.id,
    brand_id: device.brand_id,
    brand_name: brand ? brand.name : 'Laptop',
    model: device.model,
    programme_id: programme_id ? Number(programme_id) : 1,
    programme_name: programme_name || 'Computing Programme',
    budget: budget ? Number(budget) : device.price,
    picked_at: new Date().toISOString(),
  };

  laptopPicks.push(newPick);
  res.status(201).json({ success: true, pick: newPick });
});

// --- AUTHENTICATION ENDPOINTS ---
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials. No account registered with this email address.' });
  }

  if (user.password_hash !== password) {
    return res.status(401).json({ message: 'Invalid password. Please check your password and try again.' });
  }

  const { password_hash, ...sanitizedUser } = user;
  const token = `uow_token_${user.id}_${Date.now()}`;

  res.json({
    user: sanitizedUser,
    token,
    message: `Welcome back, ${user.name}!`,
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, student_id, faculty_id, programme_id } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'University email and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();

  // Strict format validation: Students must register with exactly 7 digits followed by @student.uow.edu.my
  const studentEmailRegex = /^\d{7}@student\.uow\.edu\.my$/i;
  if (!studentEmailRegex.test(cleanEmail)) {
    return res.status(400).json({
      message: 'Student registration requires a 7-digit student ID number followed by @student.uow.edu.my (e.g., 0135510@student.uow.edu.my). Administrator accounts ending in @uow.edu.my are restricted.',
    });
  }

  // Prevent multiple accounts with the same email
  if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return res.status(409).json({
      message: 'An account with this UOW student email is already registered. Students cannot have more than one account.',
    });
  }

  // Extract 7-digit student ID from email if not explicitly provided
  const emailDigits = cleanEmail.split('@')[0];
  const finalStudentId = student_id ? String(student_id).trim() : emailDigits;
  const finalName = name && String(name).trim() ? String(name).trim() : `Student ${finalStudentId}`;

  // Resolve faculty & programme names
  let faculty_name: string | undefined;
  let programme_name: string | undefined;

  if (faculty_id) {
    const fac = faculties.find((f) => f.id === Number(faculty_id));
    if (fac) faculty_name = fac.name;
  }

  if (programme_id) {
    const prog = programmes.find((p) => p.id === Number(programme_id));
    if (prog) programme_name = prog.name;
  }

  // Registration is strictly for students (only 1 default admin exists)
  const newUser: StoredUser = {
    id: Date.now(),
    name: finalName,
    email: cleanEmail,
    role: 'student',
    student_id: finalStudentId,
    faculty_id: faculty_id ? Number(faculty_id) : undefined,
    programme_id: programme_id ? Number(programme_id) : undefined,
    faculty_name,
    programme_name,
    password_hash: password,
    created_at: new Date().toISOString(),
  };

  users.unshift(newUser);

  const { password_hash, ...sanitizedUser } = newUser;
  const token = `uow_token_${newUser.id}_${Date.now()}`;

  res.status(201).json({
    user: sanitizedUser,
    token,
    message: `Account created successfully! Welcome to UOW Computing Advisor, ${newUser.name}.`,
  });
});

app.get('/api/auth/users', (req, res) => {
  const sanitized = users.map(({ password_hash, ...u }) => u);
  res.json(sanitized);
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const userIdQuery = req.query.user_id;

  let user: StoredUser | undefined;

  if (userIdQuery) {
    user = users.find((u) => u.id === Number(userIdQuery));
  } else if (authHeader) {
    const parts = authHeader.split('_');
    const id = Number(parts[2]);
    if (!isNaN(id)) {
      user = users.find((u) => u.id === id);
    }
  }

  if (!user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { password_hash, ...sanitizedUser } = user;
  res.json(sanitizedUser);
});

// Update Profile Endpoint (User can change nickname and photo_url)
app.put('/api/auth/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  const { id, nickname, photo_url } = req.body;

  let targetId = id ? Number(id) : undefined;
  if (!targetId && authHeader) {
    const parts = authHeader.split('_');
    const parsedId = Number(parts[2]);
    if (!isNaN(parsedId)) {
      targetId = parsedId;
    }
  }

  if (!targetId) {
    return res.status(400).json({ message: 'User ID is required to update profile.' });
  }

  const userIdx = users.findIndex((u) => u.id === targetId);
  if (userIdx === -1) {
    return res.status(404).json({ message: 'User account not found.' });
  }

  const sanitizedNickname = nickname !== undefined ? String(nickname).trim() : users[userIdx].nickname;
  const sanitizedPhoto = photo_url !== undefined ? String(photo_url) : users[userIdx].photo_url;

  users[userIdx] = {
    ...users[userIdx],
    nickname: sanitizedNickname || undefined,
    photo_url: sanitizedPhoto || undefined,
  };

  const { password_hash, ...sanitizedUser } = users[userIdx];
  res.json({
    user: sanitizedUser,
    message: 'Profile updated successfully!',
  });
});

// Admin Update Student / User Account
app.put('/api/admin/users/:id', (req, res) => {
  const id = Number(req.params.id);
  const userIdx = users.findIndex((u) => u.id === id);

  if (userIdx === -1) {
    return res.status(404).json({ message: 'User account not found.' });
  }

  const {
    name,
    email,
    nickname,
    student_id,
    staff_id,
    faculty_id,
    programme_id,
    faculty_name,
    programme_name,
    photo_url,
    new_password,
  } = req.body;

  if (email && email.trim() !== users[userIdx].email) {
    const cleanEmail = email.trim().toLowerCase();
    if (users[userIdx].role === 'student') {
      const studentEmailRegex = /^\d{7}@student\.uow\.edu\.my$/i;
      if (!studentEmailRegex.test(cleanEmail)) {
        return res.status(400).json({ message: 'Student email must be a 7-digit student ID number followed by @student.uow.edu.my (e.g. 0135510@student.uow.edu.my).' });
      }
    } else if (users[userIdx].role === 'administrator') {
      if (!cleanEmail.endsWith('@uow.edu.my')) {
        return res.status(400).json({ message: 'Administrator email must end with @uow.edu.my.' });
      }
    }
    const emailConflict = users.find((u) => u.id !== id && u.email.toLowerCase() === cleanEmail);
    if (emailConflict) {
      return res.status(400).json({ message: 'Another user account with this email already exists.' });
    }
  }

  // Resolve faculty / programme names if IDs changed
  let resolvedFacultyName = faculty_name;
  let resolvedProgrammeName = programme_name;
  if (faculty_id) {
    const fac = faculties.find((f) => f.id === Number(faculty_id));
    if (fac) resolvedFacultyName = fac.name;
  }
  if (programme_id) {
    const prog = programmes.find((p) => p.id === Number(programme_id));
    if (prog) resolvedProgrammeName = prog.name;
  }

  users[userIdx] = {
    ...users[userIdx],
    name: name !== undefined ? String(name).trim() : users[userIdx].name,
    email: email !== undefined ? String(email).trim().toLowerCase() : users[userIdx].email,
    nickname: nickname !== undefined ? (String(nickname).trim() || undefined) : users[userIdx].nickname,
    student_id: student_id !== undefined ? String(student_id).trim() : users[userIdx].student_id,
    staff_id: staff_id !== undefined ? String(staff_id).trim() : users[userIdx].staff_id,
    faculty_id: faculty_id !== undefined ? (faculty_id ? Number(faculty_id) : undefined) : users[userIdx].faculty_id,
    programme_id: programme_id !== undefined ? (programme_id ? Number(programme_id) : undefined) : users[userIdx].programme_id,
    faculty_name: resolvedFacultyName !== undefined ? resolvedFacultyName : users[userIdx].faculty_name,
    programme_name: resolvedProgrammeName !== undefined ? resolvedProgrammeName : users[userIdx].programme_name,
    photo_url: photo_url !== undefined ? String(photo_url) : users[userIdx].photo_url,
    password_hash: new_password ? String(new_password) : users[userIdx].password_hash,
  };

  const { password_hash, ...sanitizedUser } = users[userIdx];
  res.json({
    user: sanitizedUser,
    message: 'User profile and student credentials updated successfully.',
  });
});

// Admin Delete User Account
app.delete('/api/admin/users/:id', (req, res) => {
  const id = Number(req.params.id);
  const user = users.find((u) => u.id === id);

  if (!user) {
    return res.status(404).json({ message: 'User account not found.' });
  }

  if (user.role === 'administrator' && users.filter((u) => u.role === 'administrator').length <= 1) {
    return res.status(400).json({ message: 'Cannot delete the primary system administrator account.' });
  }

  users = users.filter((u) => u.id !== id);
  res.json({ success: true, message: `Account for ${user.name} was successfully removed.` });
});

// Change Password Endpoint
app.put('/api/auth/change-password', (req, res) => {
  const authHeader = req.headers.authorization;
  const { id, email, current_password, new_password } = req.body;

  let user: StoredUser | undefined;

  if (id) {
    user = users.find((u) => u.id === Number(id));
  } else if (email) {
    user = users.find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase());
  } else if (authHeader) {
    const parts = authHeader.split('_');
    const parsedId = Number(parts[2]);
    if (!isNaN(parsedId)) {
      user = users.find((u) => u.id === parsedId);
    }
  }

  if (!user) {
    return res.status(404).json({ message: 'User account not found.' });
  }

  if (!current_password || !new_password) {
    return res.status(400).json({ message: 'Both current password and new password are required.' });
  }

  if (user.password_hash !== current_password) {
    return res.status(400).json({ message: 'The current password entered is incorrect. Please check and try again.' });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
  }

  if (current_password === new_password) {
    return res.status(400).json({ message: 'New password cannot be the same as your current password.' });
  }

  user.password_hash = new_password;

  const { password_hash, ...sanitizedUser } = user;
  res.json({
    success: true,
    user: sanitizedUser,
    message: 'Your password has been changed successfully! Please keep your new credentials secure.',
  });
});

// --- FACULTIES ---
app.get('/api/faculties', (req, res) => {
  const withCount = faculties.map((f) => ({
    ...f,
    programmes_count: programmes.filter((p) => p.faculty_id === f.id).length,
  }));
  res.json(withCount);
});

app.post('/api/faculties', (req, res) => {
  const { name, code, description, is_active } = req.body;
  const newFaculty: Faculty = {
    id: Date.now(),
    name,
    code,
    description: description || null,
    is_active: is_active ?? true,
    programmes_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  faculties.unshift(newFaculty);
  res.status(201).json(newFaculty);
});

app.put('/api/faculties/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = faculties.findIndex((f) => f.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Faculty not found' });

  faculties[idx] = {
    ...faculties[idx],
    ...req.body,
    updated_at: new Date().toISOString(),
  };
  res.json(faculties[idx]);
});

app.delete('/api/faculties/:id', (req, res) => {
  const id = Number(req.params.id);
  const progCount = programmes.filter((p) => p.faculty_id === id).length;
  if (progCount > 0) {
    return res.status(422).json({
      message: `Cannot delete faculty with ${progCount} assigned programmes. Reassign or delete programmes first.`,
    });
  }
  faculties = faculties.filter((f) => f.id !== id);
  res.json({ success: true });
});

// --- REQUIREMENT PROFILES ---
app.get('/api/requirement-profiles', (req, res) => {
  res.json(requirementProfiles);
});

app.post('/api/requirement-profiles', (req, res) => {
  const newProfile: RequirementProfile = {
    id: Date.now(),
    ...req.body,
    is_active: req.body.is_active ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  requirementProfiles.unshift(newProfile);
  res.status(201).json(newProfile);
});

app.put('/api/requirement-profiles/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = requirementProfiles.findIndex((r) => r.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Requirement Profile not found' });

  requirementProfiles[idx] = {
    ...requirementProfiles[idx],
    ...req.body,
    updated_at: new Date().toISOString(),
  };
  res.json(requirementProfiles[idx]);
});

app.delete('/api/requirement-profiles/:id', (req, res) => {
  const id = Number(req.params.id);
  const assignedProgs = programmes.filter((p) => p.requirement_profile_id === id).length;
  if (assignedProgs > 0) {
    return res.status(422).json({
      message: `Cannot delete requirement profile assigned to ${assignedProgs} academic programmes.`,
    });
  }
  requirementProfiles = requirementProfiles.filter((r) => r.id !== id);
  res.json({ success: true });
});

// --- PROGRAMMES (v0.7.0 Milestone Core) ---
app.get('/api/programmes', (req, res) => {
  const { faculty_id, search, is_active } = req.query;
  let result = programmes.map(hydradeProgramme);

  if (faculty_id) {
    result = result.filter((p) => p.faculty_id === Number(faculty_id));
  }
  if (is_active !== undefined) {
    result = result.filter((p) => p.is_active === (is_active === 'true'));
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.faculty && p.faculty.name.toLowerCase().includes(q))
    );
  }

  res.json(result);
});

app.get('/api/programmes/:id', (req, res) => {
  const id = Number(req.params.id);
  const prog = programmes.find((p) => p.id === id);
  if (!prog) return res.status(404).json({ message: 'Programme not found' });
  res.json(hydradeProgramme(prog));
});

app.post('/api/programmes', (req, res) => {
  const { faculty_id, requirement_profile_id, code, name, description, duration_years, is_active } = req.body;

  if (!faculty_id || !code || !name) {
    return res.status(422).json({ message: 'Faculty, Programme Code, and Programme Name are required.' });
  }

  // Check code uniqueness
  if (programmes.some((p) => p.code.toLowerCase() === code.toLowerCase())) {
    return res.status(422).json({ message: 'Programme code must be unique.' });
  }

  const newProg: Programme = {
    id: Date.now(),
    faculty_id: Number(faculty_id),
    requirement_profile_id: requirement_profile_id ? Number(requirement_profile_id) : null,
    code: code.trim().toUpperCase(),
    name: name.trim(),
    description: description || null,
    duration_years: Number(duration_years) || 3,
    is_active: is_active ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  programmes.unshift(newProg);
  res.status(201).json(hydradeProgramme(newProg));
});

app.put('/api/programmes/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = programmes.findIndex((p) => p.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Programme not found' });

  const { faculty_id, requirement_profile_id, code, name, description, duration_years, is_active } = req.body;

  // Check code uniqueness if changing code
  if (code && code.toLowerCase() !== programmes[idx].code.toLowerCase()) {
    if (programmes.some((p) => p.id !== id && p.code.toLowerCase() === code.toLowerCase())) {
      return res.status(422).json({ message: 'Programme code already in use.' });
    }
  }

  programmes[idx] = {
    ...programmes[idx],
    faculty_id: faculty_id ? Number(faculty_id) : programmes[idx].faculty_id,
    requirement_profile_id: requirement_profile_id !== undefined ? (requirement_profile_id ? Number(requirement_profile_id) : null) : programmes[idx].requirement_profile_id,
    code: code ? code.trim().toUpperCase() : programmes[idx].code,
    name: name ? name.trim() : programmes[idx].name,
    description: description !== undefined ? description : programmes[idx].description,
    duration_years: duration_years ? Number(duration_years) : programmes[idx].duration_years,
    is_active: is_active !== undefined ? Boolean(is_active) : programmes[idx].is_active,
    updated_at: new Date().toISOString(),
  };

  res.json(hydradeProgramme(programmes[idx]));
});

app.delete('/api/programmes/:id', (req, res) => {
  const id = Number(req.params.id);
  programmes = programmes.filter((p) => p.id !== id);
  res.json({ success: true });
});

// --- BRANDS ---
app.get('/api/brands', (req, res) => {
  res.json(brands);
});

app.post('/api/brands', (req, res) => {
  const newBrand: Brand = {
    id: Date.now(),
    ...req.body,
    is_active: req.body.is_active ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  brands.unshift(newBrand);
  res.status(201).json(newBrand);
});

// --- DEVICES ---
app.get('/api/devices', (req, res) => {
  const hydrated = devices.map((d) => ({
    ...d,
    brand: brands.find((b) => b.id === d.brand_id),
  }));
  res.json(hydrated);
});

app.post('/api/devices', (req, res) => {
  const newDev: Device = {
    id: Date.now(),
    ...req.body,
    brand_id: Number(req.body.brand_id),
    ram_gb: Number(req.body.ram_gb),
    storage_gb: Number(req.body.storage_gb),
    price: Number(req.body.price),
    battery_life_hours: Number(req.body.battery_life_hours) || 6.0,
    weight_kg: Number(req.body.weight_kg) || 2.0,
    display_size: Number(req.body.display_size) || 15.6,
    cpu_tier: Number(req.body.cpu_tier) || 3,
    gpu_tier: Number(req.body.gpu_tier) || 1,
    ram_upgradeable: Boolean(req.body.ram_upgradeable),
    storage_upgradeable: Boolean(req.body.storage_upgradeable),
    is_active: req.body.is_active ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  devices.unshift(newDev);
  res.status(201).json({
    ...newDev,
    brand: brands.find((b) => b.id === newDev.brand_id),
  });
});

app.post('/api/devices/bulk', (req, res) => {
  const items = Array.isArray(req.body) ? req.body : (Array.isArray(req.body?.items) ? req.body.items : []);

  if (!items.length) {
    return res.status(400).json({ message: 'No devices found in payload.' });
  }

  const addedDevices: Device[] = [];

  items.forEach((item: any, index: number) => {
    // Resolve brand ID or create new brand if brand_name provided
    let brandId = Number(item.brand_id);
    if (!brandId && item.brand_name) {
      const existingBrand = brands.find((b) => b.name.toLowerCase() === String(item.brand_name).trim().toLowerCase());
      if (existingBrand) {
        brandId = existingBrand.id;
      } else {
        const newBrand: Brand = {
          id: Date.now() + Math.floor(Math.random() * 1000) + index,
          name: String(item.brand_name).trim(),
          logo_path: null,
          website_url: null,
          is_partner: false,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        brands.unshift(newBrand);
        brandId = newBrand.id;
      }
    }

    if (!brandId) {
      brandId = brands[0]?.id || 1;
    }

    const newDev: Device = {
      id: Date.now() + Math.floor(Math.random() * 100000) + index,
      brand_id: brandId,
      model: item.model ? String(item.model).trim() : 'Generic Laptop',
      device_type: item.device_type || 'laptop',
      cpu_name: item.cpu_name ? String(item.cpu_name).trim() : 'Intel Core i5',
      cpu_brand: item.cpu_brand || 'Intel',
      cpu_tier: Number(item.cpu_tier) || 3,
      gpu_name: item.gpu_name ? String(item.gpu_name).trim() : 'Integrated Graphics',
      gpu_brand: item.gpu_brand || 'Intel',
      gpu_tier: Number(item.gpu_tier) >= 0 ? Number(item.gpu_tier) : 1,
      ram_gb: Number(item.ram_gb) || 16,
      storage_gb: Number(item.storage_gb) || 512,
      storage_type: item.storage_type ? String(item.storage_type).trim() : 'NVMe SSD',
      display_size: Number(item.display_size) || 15.6,
      weight_kg: Number(item.weight_kg) || 2.0,
      battery_life_hours: Number(item.battery_life_hours) || 6.0,
      ram_upgradeable: item.ram_upgradeable !== undefined ? Boolean(item.ram_upgradeable) : true,
      storage_upgradeable: item.storage_upgradeable !== undefined ? Boolean(item.storage_upgradeable) : true,
      price: Number(item.price) || 3000,
      image_url: item.image_url || 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600',
      purchase_url: item.purchase_url || '',
      source_name: item.source_name || 'Store',
      is_active: item.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    devices.unshift(newDev);
    addedDevices.push({
      ...newDev,
      brand: brands.find((b) => b.id === newDev.brand_id),
    });
  });

  res.status(201).json({
    count: addedDevices.length,
    message: `Successfully imported ${addedDevices.length} devices into the catalogue!`,
    devices: addedDevices,
  });
});

app.put('/api/devices/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = devices.findIndex((d) => d.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Device not found' });

  devices[idx] = {
    ...devices[idx],
    ...req.body,
    brand_id: req.body.brand_id !== undefined ? Number(req.body.brand_id) : devices[idx].brand_id,
    ram_gb: req.body.ram_gb !== undefined ? Number(req.body.ram_gb) : devices[idx].ram_gb,
    storage_gb: req.body.storage_gb !== undefined ? Number(req.body.storage_gb) : devices[idx].storage_gb,
    price: req.body.price !== undefined ? Number(req.body.price) : devices[idx].price,
    battery_life_hours: req.body.battery_life_hours !== undefined ? Number(req.body.battery_life_hours) : devices[idx].battery_life_hours,
    weight_kg: req.body.weight_kg !== undefined ? Number(req.body.weight_kg) : devices[idx].weight_kg,
    display_size: req.body.display_size !== undefined ? Number(req.body.display_size) : devices[idx].display_size,
    cpu_tier: req.body.cpu_tier !== undefined ? Number(req.body.cpu_tier) : devices[idx].cpu_tier,
    gpu_tier: req.body.gpu_tier !== undefined ? Number(req.body.gpu_tier) : devices[idx].gpu_tier,
    ram_upgradeable: req.body.ram_upgradeable !== undefined ? Boolean(req.body.ram_upgradeable) : devices[idx].ram_upgradeable,
    storage_upgradeable: req.body.storage_upgradeable !== undefined ? Boolean(req.body.storage_upgradeable) : devices[idx].storage_upgradeable,
    updated_at: new Date().toISOString(),
  };
  res.json({
    ...devices[idx],
    brand: brands.find((b) => b.id === devices[idx].brand_id),
  });
});

app.delete('/api/devices/:id', (req, res) => {
  const id = Number(req.params.id);
  devices = devices.filter((d) => d.id !== id);
  res.json({ success: true });
});

// --- RECOMMENDATION SERVICE ---
app.post('/api/recommend', (req, res) => {
  const { programme_id, preference } = req.body as {
    programme_id: number;
    preference: StudentPreference;
  };

  const prog = programmes.find((p) => p.id === Number(programme_id));
  if (!prog) return res.status(404).json({ message: 'Programme not found' });

  const profile = requirementProfiles.find((r) => r.id === prog.requirement_profile_id);
  if (!profile) {
    return res.status(400).json({ message: 'Selected programme does not have an assigned hardware requirement profile yet.' });
  }

  const hydratedDevices = devices.map((d) => ({
    ...d,
    brand: brands.find((b) => b.id === d.brand_id),
  }));

  const ranked = rankDevicesForProgramme(hydratedDevices, profile, preference);

  // Automatically record top recommended laptop pick for popularity analytics
  if (ranked.length > 0) {
    const topScored = ranked[0];
    const brand = brands.find((b) => b.id === topScored.device.brand_id);
    laptopPicks.push({
      id: Date.now() + Math.floor(Math.random() * 1000),
      device_id: topScored.device.id,
      brand_id: topScored.device.brand_id,
      brand_name: brand ? brand.name : 'Laptop',
      model: topScored.device.model,
      programme_id: prog.id,
      programme_name: prog.name,
      budget: preference.budget || topScored.device.price,
      picked_at: new Date().toISOString(),
    });
  }

  res.json({
    programme: hydradeProgramme(prog),
    requirement_profile: profile,
    preference,
    results: ranked,
  });
});

// --- SAVED RECOMMENDATIONS ---
app.get('/api/saved-recommendations', (req, res) => {
  const hydrated = savedRecommendations.map((rec) => {
    const recDevices = devices
      .filter((d) => rec.recommended_device_ids.includes(d.id))
      .map((d) => ({ ...d, brand: brands.find((b) => b.id === d.brand_id) }));
    return {
      ...rec,
      recommended_devices: recDevices,
    };
  });
  res.json(hydrated);
});

app.post('/api/saved-recommendations', (req, res) => {
  const { title, programme_id, budget, minimum_specification, recommended_specification, recommended_device_ids, explanation, user_name } = req.body;
  const prog = programmes.find((p) => p.id === Number(programme_id));

  const newSaved: SavedRecommendation = {
    id: Date.now(),
    user_id: 101,
    user_name: user_name || 'UOW Student',
    title: title || (prog ? `${prog.name} Recommendations` : 'Saved Recommendation'),
    programme_id: Number(programme_id),
    programme_name: prog ? prog.name : 'Computing Programme',
    budget: Number(budget),
    minimum_specification,
    recommended_specification,
    recommended_device_ids: recommended_device_ids || [],
    explanation: explanation || 'Recommended based on UOW Computer Advisor weighted rule scoring.',
    created_at: new Date().toISOString(),
  };

  savedRecommendations.unshift(newSaved);

  // Record picks for all saved devices
  if (Array.isArray(recommended_device_ids)) {
    for (const devId of recommended_device_ids) {
      const dev = devices.find((d) => d.id === Number(devId));
      if (dev) {
        const brand = brands.find((b) => b.id === dev.brand_id);
        laptopPicks.push({
          id: Date.now() + Math.floor(Math.random() * 10000),
          device_id: dev.id,
          brand_id: dev.brand_id,
          brand_name: brand ? brand.name : 'Laptop',
          model: dev.model,
          programme_id: prog ? prog.id : 1,
          programme_name: prog ? prog.name : 'Computing Programme',
          budget: Number(budget) || dev.price,
          picked_at: new Date().toISOString(),
        });
      }
    }
  }

  res.status(201).json(newSaved);
});

app.delete('/api/saved-recommendations/:id', (req, res) => {
  const id = Number(req.params.id);
  savedRecommendations = savedRecommendations.filter((rec) => rec.id !== id);
  res.json({ success: true, message: 'Saved recommendation removed successfully.' });
});

// --- FEEDBACK ---
app.get('/api/feedback', (req, res) => {
  res.json(feedbackList);
});

app.post('/api/feedback', (req, res) => {
  const { saved_recommendation_id, rating, comment, user_name } = req.body;
  const newFeedback: Feedback = {
    id: Date.now(),
    user_id: 101,
    user_name: user_name || 'Student',
    saved_recommendation_id: saved_recommendation_id ? Number(saved_recommendation_id) : null,
    rating: Number(rating) || 5,
    comment: comment || '',
    created_at: new Date().toISOString(),
  };
  feedbackList.unshift(newFeedback);
  res.status(201).json(newFeedback);
});

// --- BOT CHAT & GEMINI EXPLANATION ENDPOINTS ---
app.post('/api/bot/chat', (req, res) => {
  const { message } = req.body;
  const q = String(message || '').toLowerCase();

  let reply = '';

  if (q.includes('ram') || q.includes('8gb') || q.includes('16gb') || q.includes('memory') || q.includes('upgrade')) {
    reply = `### 💡 Quick Summary
**16GB RAM is the recommended baseline** for all UOW Computing degrees to handle multi-tasking, IDEs, and local servers smoothly. **32GB RAM** is advised for Game Development, AI model training, and heavy Virtual Machine usage.

### 📊 RAM Compatibility & Recommendation Table

| RAM Capacity | Target UOW Course / Workload | Suitability Level |
| :--- | :--- | :--- |
| **8GB** | Basic Browsing, Office & Light Web Coding | ⚠️ Minimum / Not Recommended |
| **16GB** | Software Eng, Web Dev, CS, Network Security | ✅ **Recommended Standard** |
| **32GB+** | Game Dev (Unreal 5), AI/ML, Multi-VMs | 🚀 Power User / Heavy Duty |

#### 🔑 Key Notes:
- Running VS Code + Chrome tabs + MySQL Database easily uses 10GB–12GB RAM.
- Look for laptops with **upgradeable SODIMM slots** if you start with 16GB and want to expand later.`;
  } else if (q.includes('game') || q.includes('gpu') || q.includes('unreal') || q.includes('graphics') || q.includes('unity') || q.includes('blender')) {
    reply = `### 💡 Quick Summary
Game Development requires a **dedicated NVIDIA GeForce RTX GPU (6GB+ VRAM)** along with a multi-core CPU and fast SSD storage to run Unreal Engine 5, Unity, and Blender effectively.

### 🎮 Game Development Spec Matrix

| Component | Minimum Spec | Recommended Spec |
| :--- | :--- | :--- |
| **GPU** | NVIDIA RTX 3050 (4GB VRAM) | **NVIDIA RTX 4060 (8GB VRAM)** |
| **CPU** | Intel Core i5 / AMD Ryzen 5 | **Intel Core i7/i9 / AMD Ryzen 7/9** |
| **RAM** | 16GB DDR4 | **32GB DDR5** |
| **Storage** | 512GB NVMe SSD | **1TB NVMe SSD** |

#### 🔑 Key Notes:
- Integrated graphics (Intel Iris Xe / AMD Radeon 680M) will struggle with 3D viewport rendering in Unreal 5.
- Thermal management & cooling are crucial for sustained rendering performance.`;
  } else if (q.includes('mac') || q.includes('macbook') || q.includes('windows') || q.includes('apple') || q.includes('os') || q.includes('operating system')) {
    reply = `### 💡 Quick Summary
**Windows laptops** provide 100% software compatibility across all UOW courses (essential for Game Dev DirectX & C# .NET). **MacBooks** offer superior battery life and build quality, ideal for Software Engineering & iOS App Development.

### 💻 Windows vs. MacBook Comparison Table

| Feature / Criteria | Windows Laptop | MacBook (Apple Silicon) |
| :--- | :--- | :--- |
| **Overall Course Compatibility** | ✅ **100% (All UOW Courses)** | ⚠️ ~85% (Needs Workarounds) |
| **Game Dev & 3D (Unreal/Unity)** | ✅ Full DirectX & RTX Support | ❌ Limited / No Dedicated GPU |
| **Software & App Development** | ✅ Full C# / .NET / Java / Web | ✅ Outstanding for iOS & Flutter |
| **Battery Endurance** | 🔋 5 – 8 Hours Average | 🔋 **12 – 18 Hours Outstanding** |

#### 🔑 Key Notes:
- If you are enrolled in **Game Development**, choose a Windows laptop with NVIDIA RTX.
- If you choose a MacBook for Software Engineering, aim for at least **16GB Unified Memory**.`;
  } else if (q.includes('budget') || q.includes('price') || q.includes('cost') || q.includes('rm') || q.includes('cheap') || q.includes('affordable')) {
    reply = `### 💡 Quick Summary
The recommended student budget sweet spot is **RM 3,300 – RM 4,800** for a high-value 16GB laptop that lasts all 3–4 years of university.

### 💰 Student Budget Tier Guide

| Budget Range (MYR) | Hardware Specs Tier | Suitable UOW Programmes |
| :--- | :--- | :--- |
| **RM 2,500 – RM 3,200** | Entry Level (i5 / 8GB-16GB) | Diploma in IT, Info Systems |
| **RM 3,300 – RM 4,800** | **Mid-Range Standard (i7/Ryzen7, 16GB)** | **CS, Software Eng, Security** |
| **RM 4,900 – RM 7,000+** | High End (RTX 4060, 32GB) | Game Dev, AI & Data Science |

#### 🔑 Key Notes:
- Always check for UOW student education discounts or seasonal laptop promos.
- Prioritize RAM (16GB) and CPU over premium metal chassis aesthetics if on a tight budget.`;
  } else if (q.includes('cyber') || q.includes('security') || q.includes('vm') || q.includes('virtual') || q.includes('kali') || q.includes('network')) {
    reply = `### 💡 Quick Summary
Cybersecurity & Network Security require a **multi-core processor with virtualization support (VT-x)** and **16GB–32GB RAM** to host concurrent Virtual Machines (Kali Linux, Windows Server, Metasploitable).

### 🛡️ Cybersecurity Requirements Matrix

| Component | Requirement | Purpose |
| :--- | :--- | :--- |
| **CPU** | Multi-Core Intel i7 / Ryzen 7 | Concurrent Virtual Machine threads |
| **RAM** | **16GB – 32GB DDR4/DDR5** | Allocating memory to guest OSes |
| **Storage** | 512GB – 1TB Fast SSD | Storing multiple .vmdk disk images |
| **Virtualization** | VT-x / AMD-V Enabled | Hypervisor support (VirtualBox/VMware) |`;
  } else if (q.includes('data') || q.includes('ai') || q.includes('machine learning') || q.includes('python') || q.includes('analytics')) {
    reply = `### 💡 Quick Summary
Data Science & AI coursework benefits from an **NVIDIA RTX GPU** for hardware acceleration when training PyTorch/TensorFlow models, along with **16GB–32GB RAM**.

### 📊 Data Science & AI Spec Table

| Hardware Spec | Recommendation | Function in Course |
| :--- | :--- | :--- |
| **GPU** | NVIDIA RTX 3050 / 4050 / 4060 | AI & model training (4GB–8GB VRAM) |
| **RAM** | **16GB – 32GB RAM** | Processing large pandas dataframes |
| **CPU** | Intel Core i7 / Ryzen 7 | Multi-threaded numerical processing |`;
  } else if (q.includes('hello') || q.includes('hi') || q.includes('help') || q.includes('who are you')) {
    reply = `👋 **Hello! I am your UOW Computing Hardware Bot.**

I provide instant specification summaries and comparison tables for UOW Malaysia Computing courses!

### 📌 How I Can Help You:
| Topic | Example Question |
| :--- | :--- |
| **RAM Needs** | *"Is 16GB RAM required for software engineering?"* |
| **Game Dev GPU** | *"What GPU do I need for Unreal Engine 5?"* |
| **OS Choice** | *"MacBook vs Windows for Computer Science"* |
| **Budget Tiers** | *"What is the recommended budget range?"* |`;
  } else {
    reply = `🤖 **UOW Computing Hardware Advisor Bot**

Here is a quick overview of topic guides available:

| Topic | Quick Recommendation |
| :--- | :--- |
| **RAM Baseline** | 16GB RAM for general computing; 32GB for Game Dev & VMs |
| **Game Development** | Dedicated NVIDIA RTX 3050/4050/4060 (6GB+ VRAM) |
| **OS Compatibility** | Windows is 100% compatible; MacBook is great for Software Eng |
| **Student Budget** | RM 3,300 – RM 4,800 sweet spot for 16GB mid-range laptops |

*Try asking specific questions like "Is 16GB RAM enough?" or "Can I use a MacBook?"*`;
  }

  res.json({ reply });
});

app.post('/api/gemini/chat', (req, res, next) => {
  req.url = '/api/bot/chat';
  return (app as any).handle(req, res, next);
});

// In-memory cache for Gemini responses to save quota and speed up duplicate comparisons
const geminiCache = new Map<string, string>();

async function generateWithGeminiFallback(ai: any, prompt: string): Promise<{ text: string | null; modelUsed: string }> {
  const models = ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });
        const text = response.text?.trim();
        if (text) {
          return { text, modelUsed: model };
        }
      } catch (err: any) {
        const errStr = String(err?.message || err?.status || err || '').toLowerCase();
        const isTransientOrQuota =
          err?.status === 'RESOURCE_EXHAUSTED' ||
          err?.status === 429 ||
          err?.status === 503 ||
          err?.status === 'UNAVAILABLE' ||
          errStr.includes('503') ||
          errStr.includes('429') ||
          errStr.includes('quota') ||
          errStr.includes('demand') ||
          errStr.includes('unavailable') ||
          errStr.includes('resource_exhausted') ||
          errStr.includes('overloaded');

        if (isTransientOrQuota) {
          console.warn(`[Gemini API] Model '${model}' encountered transient state (${err?.status || '503/429/high demand'}) on attempt ${attempt + 1}. Retrying / trying fallback...`);
          if (attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            continue;
          }
        } else {
          console.warn(`[Gemini API] Generation warning on ${model}:`, err?.message || err);
          break;
        }
      }
    }
  }
  return { text: null, modelUsed: 'none' };
}

// Gemini is strictly reserved for personalized Recommendation Wizard summaries
app.post('/api/gemini/explain', async (req, res) => {
  const { programme_name, profile_name, budget, preference, selected_devices, top_devices } = req.body;
  const activeDevices = selected_devices && selected_devices.length > 0 ? selected_devices : top_devices;

  const prefSummary = preference ? `
Student Preferences:
- Primary Use: ${preference.primary_use || 'General Academic'}
- Priority Focus: ${preference.importance_priority || 'Balanced'}
- Battery Need: ${preference.battery_priority || 'Standard'}
- Portability Need: ${preference.portability_priority || 'Standard'}
- Preferred CPU/GPU: ${preference.preferred_cpu_brand || 'Any'} / ${preference.preferred_gpu_brand || 'Any'}
` : '';

  const deviceModelsList = Array.isArray(activeDevices)
    ? activeDevices.map((d: any) => `${d.brand ? d.brand + ' ' : ''}${d.model} (${d.cpu || ''}, ${d.ram || ''}, ${d.gpu || ''}, RM ${d.price})`).join('; ')
    : '';

  const fallbackExplanation = `Based on your ${preference?.primary_use ? preference.primary_use.toLowerCase() + ' preferences' : 'preferences'} for ${programme_name} (RM ${Number(budget).toLocaleString()} budget), the selected laptop(s) [${deviceModelsList || 'recommended devices'}] deliver an ideal balance of processor performance, memory, and portability for your coursework.`;

  const cacheKey = `explain_${programme_name}_${profile_name}_${budget}_${JSON.stringify(preference)}_${JSON.stringify(activeDevices)}`;
  if (geminiCache.has(cacheKey)) {
    return res.json({ explanation: geminiCache.get(cacheKey), source: 'cache' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({ explanation: fallbackExplanation, source: 'rule_fallback' });
  }

  try {
    const prompt = `You are the UOW Computing Advisor AI assistant.
Analyze the student's hardware recommendations based on their specific preferences and selected devices:
- Academic Programme: ${programme_name}
- Requirement Profile: ${profile_name}
- Student Target Budget: RM ${budget}
${prefSummary}
- Selected Device(s): ${deviceModelsList || JSON.stringify(activeDevices)}

Provide a concise, highly tailored 2 to 3 sentence summary (max 55 words) explaining why these specific selected device(s) match both their personal preferences (${preference?.primary_use || 'general'}, ${preference?.importance_priority || 'balanced'} priority) and ${programme_name} syllabus demands. Keep it direct, encouraging, and clear.`;

    const result = await generateWithGeminiFallback(ai, prompt);
    const explanationText = result.text || fallbackExplanation;

    if (result.text) {
      geminiCache.set(cacheKey, explanationText);
    }

    res.json({ explanation: explanationText, source: result.modelUsed !== 'none' ? result.modelUsed : 'fallback' });
  } catch (err: any) {
    console.warn('Gemini Explain API Warning:', err?.message || err);
    res.json({ explanation: fallbackExplanation, source: 'fallback_on_error' });
  }
});

// Gemini comparison endpoint for 2 to 4 devices
app.post('/api/gemini/compare', async (req, res) => {
  const { devices } = req.body;

  if (!Array.isArray(devices) || devices.length === 0) {
    return res.status(400).json({ error: 'At least 1 device is required for comparison' });
  }

  // Generate dynamic rule-based fallback
  const bestBatteryDev = [...devices].sort((a, b) => (b.battery_life_hours || 0) - (a.battery_life_hours || 0))[0];
  const lowestPriceDev = [...devices].sort((a, b) => a.price - b.price)[0];
  const highestRamDev = [...devices].sort((a, b) => b.ram_gb - a.ram_gb)[0];

  // Dynamic rule-based fallback advice
  const fallbackAnalysis = `### 🎓 AI Student Fit & Comparison Highlights

- ⚡ **Battery & Mobility:** **${bestBatteryDev.brand?.name || ''} ${bestBatteryDev.model}** leads in battery runtime at **${bestBatteryDev.battery_life_hours} hours**, making it the top choice for back-to-back lectures without carrying a charger.
- 💰 **Best Budget Value:** **${lowestPriceDev.brand?.name || ''} ${lowestPriceDev.model}** is the most affordable at **RM ${lowestPriceDev.price.toLocaleString()}**, perfect for core programming and everyday coursework.
- 🚀 **Performance Champion:** **${highestRamDev.brand?.name || ''} ${highestRamDev.model}** packs **${highestRamDev.ram_gb}GB RAM** and an **${highestRamDev.cpu_name}** CPU, ideal for Docker containers, virtual machines, and compiler workloads.
- 🛠️ **Upgradeability:** ${devices.map(d => `**${d.model}** (${d.ram_upgradeable ? 'Expandable RAM' : 'Soldered RAM'})`).join(' • ')}.`;

  const devIds = devices.map((d: any) => d.id).sort().join('_');
  const cacheKey = `compare_${devIds}`;
  if (geminiCache.has(cacheKey)) {
    return res.json({ analysis: geminiCache.get(cacheKey), source: 'cache' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({ analysis: fallbackAnalysis, source: 'rule_fallback' });
  }

  try {
    const deviceSummaries = devices.map((d: Device) => (
      `- ${d.brand?.name || ''} ${d.model}: Price RM ${d.price.toLocaleString()}, CPU: ${d.cpu_name}, RAM: ${d.ram_gb}GB, Storage: ${d.storage_gb}GB ${d.storage_type}, GPU: ${d.gpu_name}, Weight: ${d.weight_kg}kg, Battery: ${d.battery_life_hours}h, RAM Upgradeable: ${d.ram_upgradeable ? 'Yes' : 'No'}`
    )).join('\n');

    const prompt = `You are the UOW Computing Hardware Advisor AI. Provide a student-friendly comparison breakdown for these ${devices.length} laptops.

DO NOT output a duplicate hardware specs table (the student already has a detailed comparison table above).

Instead, provide a structured, punchy breakdown in clean Markdown covering:
1. 🎯 **Best Student Fit for Each Laptop**: Explicitly state which specialization (e.g. Budget Saver, Software Engineering, AI & Data Science, Game Development/3D) each laptop is best suited for and why.
2. ⚡ **Mobility & Battery Trade-offs**: Quick practical notes on carrying weight and lecture battery life.
3. 🏆 **Final Advisor Recommendation**: A concise closing recommendation on which model offers the best value vs performance balance for a university student.

Device details:
${deviceSummaries}

Keep tone encouraging, objective, concise, and formatted with clean bullet points.`;

    const result = await generateWithGeminiFallback(ai, prompt);
    const analysisText = result.text || fallbackAnalysis;

    if (result.text) {
      geminiCache.set(cacheKey, analysisText);
    }

    res.json({ analysis: analysisText, source: result.modelUsed !== 'none' ? result.modelUsed : 'fallback' });
  } catch (err: any) {
    console.warn('Gemini Compare API Warning:', err?.message || err);
    res.json({ analysis: fallbackAnalysis, source: 'fallback_on_error' });
  }
});

// Vite Middleware for Development / Static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`UOW Computing Advisor server running on http://localhost:${PORT}`);
  });
}

startServer();
