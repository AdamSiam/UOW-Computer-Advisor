import { Device, RequirementProfile, StudentPreference, ScoredDevice, ScoreBreakdown } from '../types';

export function calculateDeviceScore(
  device: Device,
  profile: RequirementProfile,
  preference: StudentPreference
): ScoredDevice {
  const reasons: string[] = [];

  // 1. Hard Check Minimum Specs
  const meetsRamMin = device.ram_gb >= profile.minimum_ram_gb;
  const meetsStorageMin = device.storage_gb >= profile.minimum_storage_gb;
  const meetsCpuMin = device.cpu_tier >= profile.minimum_cpu_tier;
  const meetsGpuMin = device.gpu_tier >= profile.minimum_gpu_tier;

  const meets_minimum = meetsRamMin && meetsStorageMin && meetsCpuMin && meetsGpuMin;
  const meets_recommended =
    device.ram_gb >= profile.recommended_ram_gb &&
    device.storage_gb >= profile.recommended_storage_gb &&
    device.cpu_tier >= profile.recommended_cpu_tier &&
    device.gpu_tier >= profile.recommended_gpu_tier;

  // 2. Requirement Match Score (Max 35 pts)
  let requirement_match = 0;
  if (meets_recommended) {
    requirement_match = 35;
    reasons.push('Exceeds recommended hardware requirements for this programme');
  } else if (meets_minimum) {
    requirement_match = 25 + ((device.ram_gb / profile.recommended_ram_gb) * 5) + ((device.storage_gb / profile.recommended_storage_gb) * 5);
    requirement_match = Math.min(34, requirement_match);
    reasons.push('Meets minimum hardware requirements for programme software');
  } else {
    requirement_match = 10;
    if (!meetsRamMin) reasons.push(`Below minimum RAM requirement (${device.ram_gb}GB vs ${profile.minimum_ram_gb}GB needed)`);
    if (!meetsStorageMin) reasons.push(`Below minimum storage (${device.storage_gb}GB vs ${profile.minimum_storage_gb}GB needed)`);
    if (!meetsCpuMin) reasons.push(`CPU tier is lower than required for ${profile.name}`);
    if (!meetsGpuMin) reasons.push(`GPU power is lower than required for 3D/graphics tasks`);
  }

  // 3. Budget Fit Score (Max 25 pts)
  let budget_fit = 0;
  const userBudget = preference.budget;
  const priceDiff = device.price - userBudget;
  let budget_status: 'within_budget' | 'slightly_over' | 'over_budget' = 'within_budget';

  if (device.price <= userBudget) {
    budget_status = 'within_budget';
    const savingRatio = (userBudget - device.price) / userBudget;
    budget_fit = Math.round(25 - Math.min(7, savingRatio * 10)); // Ideal price is close to budget for maximum value
    reasons.push(`Within budget (RM ${device.price.toLocaleString()} vs RM ${userBudget.toLocaleString()})`);
  } else if (device.price <= userBudget + 1500) {
    budget_status = 'slightly_over';
    const priceDiff = device.price - userBudget;
    const overPercent = priceDiff / 1500;
    budget_fit = Math.max(0, Math.round(15 - overPercent * 10));
    reasons.push(`Slightly exceeds target budget (+RM ${priceDiff.toLocaleString()}) but delivers higher hardware specs`);
  } else {
    budget_status = 'over_budget';
    const overRatio = priceDiff / userBudget;
    // Apply heavy penalty for devices far above budget (up to -50 points)
    budget_fit = -Math.min(50, Math.round(overRatio * 35));
    reasons.push(`Exceeds target budget by RM ${priceDiff.toLocaleString()}`);
  }

  // 4. CPU Score (Max 10 pts)
  let cpu_score = Math.min(10, (device.cpu_tier / profile.recommended_cpu_tier) * 10);
  if (preference.preferred_cpu_brand !== 'Any' && device.cpu_brand === preference.preferred_cpu_brand) {
    cpu_score = Math.min(10, cpu_score + 1);
    reasons.push(`Matches preferred CPU brand (${device.cpu_brand})`);
  }

  // 5. GPU Score (Max 10 pts)
  let gpu_score = 0;
  if (profile.minimum_gpu_tier === 0) {
    gpu_score = 10; // GPU not heavily required
  } else {
    gpu_score = Math.min(10, (device.gpu_tier / profile.recommended_gpu_tier) * 10);
  }
  if (preference.preferred_gpu_brand && preference.preferred_gpu_brand !== 'Any' && device.gpu_brand === preference.preferred_gpu_brand) {
    gpu_score = Math.min(10, gpu_score + 1);
    reasons.push(`Matches preferred GPU brand (${device.gpu_brand})`);
  }

  // 6. RAM Score (Max 8 pts)
  const ramRatio = device.ram_gb / profile.recommended_ram_gb;
  const ram_score = Math.min(8, ramRatio * 8);
  if (device.ram_upgradeable) {
    reasons.push('RAM is upgradeable for future expansion');
  }

  // 7. Storage Score (Max 7 pts)
  const storageRatio = device.storage_gb / profile.recommended_storage_gb;
  const storage_score = Math.min(7, storageRatio * 7);
  if (device.storage_upgradeable) {
    reasons.push('SSD / Storage is upgradeable for future expansion');
  } else {
    reasons.push('SSD / Storage is non-upgradeable (soldered)');
  }

  // 8. Preference & Upgradeability Score (Max 5 pts)
  let preference_score = 0;
  if (preference.preferred_brand_ids.length > 0 && preference.preferred_brand_ids.includes(device.brand_id)) {
    preference_score += 2;
    reasons.push('Matches student preferred brand');
  }

  if (preference.preferred_device_type !== 'Any' && device.device_type === preference.preferred_device_type) {
    preference_score += 2;
    reasons.push(`Matches preferred form factor (${device.device_type})`);
  }

  if (preference.portability_priority === 'High' && device.weight_kg <= 1.5) {
    preference_score += 1;
    reasons.push('Highly portable & lightweight design');
  } else if (preference.battery_priority === 'High' && device.battery_life_hours >= 10) {
    preference_score += 1;
    reasons.push('Long battery life suitable for full campus day');
  }

  preference_score = Math.min(5, preference_score);

  const total_score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        requirement_match + budget_fit + cpu_score + gpu_score + ram_score + storage_score + preference_score
      )
    )
  );

  const score_breakdown: ScoreBreakdown = {
    requirement_match: Math.round(requirement_match),
    budget_fit: Math.round(budget_fit),
    cpu_score: Math.round(cpu_score),
    gpu_score: Math.round(gpu_score),
    ram_score: Math.round(ram_score),
    storage_score: Math.round(storage_score),
    preference_score: Math.round(preference_score),
    total_score,
  };

  return {
    device,
    score_breakdown,
    meets_minimum,
    meets_recommended,
    budget_status,
    price_difference: priceDiff,
    reasons,
  };
}

export function rankDevicesForProgramme(
  devices: Device[],
  profile: RequirementProfile,
  preference: StudentPreference
): ScoredDevice[] {
  const maxAllowedPrice = preference.budget + 1500;

  const scored = devices
    .filter((d) => d.is_active && d.price <= maxAllowedPrice)
    .map((device) => calculateDeviceScore(device, profile, preference));

  const budgetRankOrder: Record<string, number> = {
    within_budget: 0,
    slightly_over: 1,
    over_budget: 2,
  };

  return scored.sort((a, b) => {
    // 1. Meets minimum hardware requirements first
    if (a.meets_minimum && !b.meets_minimum) return -1;
    if (!a.meets_minimum && b.meets_minimum) return 1;

    // 2. Budget status priority: within_budget > slightly_over > over_budget
    const budgetDiff = budgetRankOrder[a.budget_status] - budgetRankOrder[b.budget_status];
    if (budgetDiff !== 0) return budgetDiff;

    // 3. If both are over_budget, prioritize devices closer to budget (cheaper first)
    if (a.budget_status === 'over_budget' && b.budget_status === 'over_budget') {
      const priceDiffA = a.device.price - preference.budget;
      const priceDiffB = b.device.price - preference.budget;
      if (Math.abs(priceDiffA - priceDiffB) > 300) {
        return priceDiffA - priceDiffB;
      }
    }

    // 4. Sort by total score descending
    return b.score_breakdown.total_score - a.score_breakdown.total_score;
  });
}
