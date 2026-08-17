export type UserRole = 'student' | 'administrator';
export type FontSizeLevel = 'normal' | 'large' | 'xlarge' | 'huge';

export interface User {
  id: number;
  name: string;
  nickname?: string;
  photo_url?: string;
  email: string;
  role: UserRole;
  student_id?: string;
  staff_id?: string;
  faculty_id?: number;
  programme_id?: number;
  faculty_name?: string;
  programme_name?: string;
  created_at?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

export interface LoginCredentials {
  email: string;
  password?: string;
  role: UserRole;
}

export interface RegisterData {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  student_id?: string;
  staff_id?: string;
  faculty_id?: number;
  programme_id?: number;
  admin_passcode?: string;
}

export interface Faculty {
  id: number;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  programmes_count?: number;
  created_at: string;
  updated_at: string;
}

export interface RequirementProfile {
  id: number;
  name: string;
  description: string | null;
  minimum_cpu: string;
  recommended_cpu: string;
  minimum_gpu: string;
  recommended_gpu: string;
  minimum_ram_gb: number;
  recommended_ram_gb: number;
  minimum_storage_gb: number;
  recommended_storage_gb: number;
  minimum_cpu_tier: number; // 1 (Basic) to 5 (High-end)
  recommended_cpu_tier: number;
  minimum_gpu_tier: number; // 0 (Integrated) to 5 (Heavy 3D/AI)
  recommended_gpu_tier: number;
  software_examples: string | null;
  explanation: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Programme {
  id: number;
  faculty_id: number;
  requirement_profile_id: number | null;
  code: string;
  name: string;
  description: string | null;
  duration_years: number;
  is_active: boolean;
  faculty?: Faculty;
  requirement_profile?: RequirementProfile;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: number;
  name: string;
  logo_path: string | null;
  website_url: string | null;
  is_partner: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: number;
  brand_id: number;
  model: string;
  device_type: 'laptop' | 'macbook' | '2-in-1' | 'workstation' | 'desktop' | string;
  cpu_name: string;
  cpu_brand: 'Intel' | 'AMD' | 'Apple' | string;
  cpu_tier: number; // 1 to 5
  gpu_name: string;
  gpu_brand: 'NVIDIA' | 'AMD' | 'Intel' | 'Apple' | string;
  gpu_tier: number; // 0 to 5
  ram_gb: number;
  storage_gb: number;
  storage_type: 'SSD' | 'NVMe SSD' | string;
  display_size: number; // in inches e.g. 15.6
  weight_kg: number;
  battery_life_hours: number;
  ram_upgradeable: boolean;
  storage_upgradeable: boolean;
  price: number; // in MYR / RM
  image_url: string | null;
  purchase_url: string | null;
  source_name: string | null;
  is_active: boolean;
  brand?: Brand;
  created_at: string;
  updated_at: string;
}

export interface StudentPreference {
  id?: number;
  user_id?: number;
  programme_id: number | null;
  preferred_brand_ids: number[];
  budget: number;
  preferred_cpu_brand: 'Intel' | 'AMD' | 'Apple' | 'Any';
  preferred_gpu_brand?: 'NVIDIA' | 'AMD' | 'Intel' | 'Apple' | 'Any';
  preferred_device_type: 'laptop' | 'macbook' | '2-in-1' | 'Any';
  portability_priority: 'Low' | 'Medium' | 'High';
  battery_priority: 'Low' | 'Medium' | 'High';
  weight_importance: number; // 1-5
}

export interface ScoreBreakdown {
  requirement_match: number; // max 35
  budget_fit: number; // max 25
  cpu_score: number; // max 10
  gpu_score: number; // max 10
  ram_score: number; // max 8
  storage_score: number; // max 7
  preference_score: number; // max 5
  total_score: number; // out of 100
}

export interface ScoredDevice {
  device: Device;
  score_breakdown: ScoreBreakdown;
  meets_minimum: boolean;
  meets_recommended: boolean;
  budget_status: 'within_budget' | 'slightly_over' | 'over_budget';
  price_difference: number;
  reasons: string[];
}

export interface SavedRecommendation {
  id: number;
  user_id: number;
  user_name?: string;
  title?: string;
  programme_id: number;
  programme_name?: string;
  budget: number;
  minimum_specification: Record<string, any>;
  recommended_specification: Record<string, any>;
  recommended_device_ids: number[];
  recommended_devices?: Device[];
  explanation: string;
  created_at: string;
}

export interface Feedback {
  id: number;
  user_id: number | null;
  user_name?: string;
  user_type?: 'registered_student' | 'guest';
  is_verified_student?: boolean;
  student_id?: string;
  faculty_name?: string;
  programme_name?: string;
  category?: string;
  saved_recommendation_id: number | null;
  rating: number; // 1-5
  comment: string;
  created_at: string;
}

export interface BrandPopularityItem {
  brandId: number;
  brandName: string;
  pickCount: number;
  percentage: number;
  topModel: string;
  avgBudget: number;
  growthRate: number; // percentage e.g. +14.2
  popularInProgrammes: { programmeName: string; count: number }[];
}

export interface BrandPopularityTrendPoint {
  label: string;
  [brandName: string]: number | string;
}

export interface BrandPopularityReport {
  period: 'weekly' | 'monthly' | 'all';
  totalPicks: number;
  periodLabel: string;
  topBrandName: string;
  topBrandPicks: number;
  topBrandShare: number;
  topModelName: string;
  brands: BrandPopularityItem[];
  trendData: BrandPopularityTrendPoint[];
}
