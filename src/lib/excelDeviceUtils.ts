import * as XLSX from 'xlsx';
import { Device, Brand } from '../types';
import { safeFetchJson } from './apiUtils';
import { initialDevices, initialBrands } from '../data/mockData';

export interface ParsedImportDevice {
  brand_name: string;
  model: string;
  device_type: 'laptop' | 'macbook' | 'desktop';
  price: number;
  cpu_name: string;
  cpu_brand: 'Intel' | 'AMD' | 'Apple';
  cpu_tier: number;
  gpu_name: string;
  gpu_brand: 'NVIDIA' | 'AMD' | 'Intel' | 'Apple';
  gpu_tier: number;
  ram_gb: number;
  ram_upgradeable: boolean;
  storage_gb: number;
  storage_type: string;
  storage_upgradeable: boolean;
  display_size: number;
  weight_kg: number;
  battery_life_hours: number;
  source_name: string;
  purchase_url: string;
  image_url: string;
  is_valid: boolean;
  validation_errors: string[];
}

export const SAMPLE_TEMPLATE_DEVICES = [
  {
    'Brand Name': 'ASUS',
    'Model Name': 'ROG Zephyrus G16 (2025)',
    'Device Type': 'laptop',
    'Price (RM)': 6899,
    'CPU Name': 'Intel Core i7-13700H',
    'CPU Brand': 'Intel',
    'CPU Tier (1-5)': 4,
    'GPU Name': 'NVIDIA GeForce RTX 4060 8GB',
    'GPU Brand': 'NVIDIA',
    'GPU Tier (0-5)': 3,
    'RAM (GB)': 16,
    'RAM Upgradeable (Yes/No)': 'Yes',
    'Storage (GB)': 1024,
    'Storage Type': 'NVMe PCIe 4.0 SSD',
    'Storage Upgradeable (Yes/No)': 'Yes',
    'Display Size (Inches)': 16.0,
    'Weight (kg)': 1.95,
    'Battery Life (Hours)': 7.5,
    'Retail Source': 'ASUS Official Store',
  },
  {
    'Brand Name': 'Lenovo',
    'Model Name': 'Legion Pro 5i Gen 9',
    'Device Type': 'laptop',
    'Price (RM)': 5499,
    'CPU Name': 'Intel Core i7-14700HX',
    'CPU Brand': 'Intel',
    'CPU Tier (1-5)': 4,
    'GPU Name': 'NVIDIA GeForce RTX 4060 8GB',
    'GPU Brand': 'NVIDIA',
    'GPU Tier (0-5)': 3,
    'RAM (GB)': 16,
    'RAM Upgradeable (Yes/No)': 'Yes',
    'Storage (GB)': 512,
    'Storage Type': 'NVMe SSD',
    'Storage Upgradeable (Yes/No)': 'Yes',
    'Display Size (Inches)': 16.0,
    'Weight (kg)': 2.3,
    'Battery Life (Hours)': 6.0,
    'Retail Source': 'Lenovo Malaysia Direct',
  },
  {
    'Brand Name': 'Apple',
    'Model Name': 'MacBook Air 15" M3',
    'Device Type': 'macbook',
    'Price (RM)': 5499,
    'CPU Name': 'Apple M3 8-Core',
    'CPU Brand': 'Apple',
    'CPU Tier (1-5)': 3,
    'GPU Name': 'Apple M3 10-Core GPU',
    'GPU Brand': 'Apple',
    'GPU Tier (0-5)': 2,
    'RAM (GB)': 16,
    'RAM Upgradeable (Yes/No)': 'No',
    'Storage (GB)': 512,
    'Storage Type': 'Unified NVMe SSD',
    'Storage Upgradeable (Yes/No)': 'No',
    'Display Size (Inches)': 15.3,
    'Weight (kg)': 1.51,
    'Battery Life (Hours)': 18.0,
    'Retail Source': 'Apple Authorised Reseller',
  },
  {
    'Brand Name': 'Acer',
    'Model Name': 'Aspire 5 Slim (Student Edition)',
    'Device Type': 'laptop',
    'Price (RM)': 2499,
    'CPU Name': 'AMD Ryzen 5 7530U',
    'CPU Brand': 'AMD',
    'CPU Tier (1-5)': 2,
    'GPU Name': 'AMD Radeon RX Vega 7',
    'GPU Brand': 'AMD',
    'GPU Tier (0-5)': 1,
    'RAM (GB)': 16,
    'RAM Upgradeable (Yes/No)': 'Yes',
    'Storage (GB)': 512,
    'Storage Type': 'NVMe SSD',
    'Storage Upgradeable (Yes/No)': 'Yes',
    'Display Size (Inches)': 15.6,
    'Weight (kg)': 1.75,
    'Battery Life (Hours)': 8.5,
    'Retail Source': 'IT Comp UOW Partner',
  },
  {
    'Brand Name': 'Dell',
    'Model Name': 'XPS 14 (9440)',
    'Device Type': 'laptop',
    'Price (RM)': 7299,
    'CPU Name': 'Intel Core Ultra 7 155H',
    'CPU Brand': 'Intel',
    'CPU Tier (1-5)': 4,
    'GPU Name': 'NVIDIA GeForce RTX 4050 6GB',
    'GPU Brand': 'NVIDIA',
    'GPU Tier (0-5)': 2,
    'RAM (GB)': 32,
    'RAM Upgradeable (Yes/No)': 'No',
    'Storage (GB)': 1024,
    'Storage Type': 'NVMe PCIe 4.0 SSD',
    'Storage Upgradeable (Yes/No)': 'Yes',
    'Display Size (Inches)': 14.5,
    'Weight (kg)': 1.68,
    'Battery Life (Hours)': 9.0,
    'Retail Source': 'Dell Malaysia Store',
  },
];

export async function downloadDeviceExcelTemplate(customDevices?: Device[], customBrands?: Brand[]) {
  let devicesToExport: Device[] = customDevices && customDevices.length > 0 ? customDevices : [];
  let brandsToExport: Brand[] = customBrands && customBrands.length > 0 ? customBrands : [];

  // Fetch live from server if not explicitly passed
  if (devicesToExport.length === 0) {
    try {
      const fetchedDevices = await safeFetchJson<Device[]>('/api/devices');
      if (Array.isArray(fetchedDevices) && fetchedDevices.length > 0) {
        devicesToExport = fetchedDevices;
      }
    } catch {
      // fallback to initialDevices
    }
  }

  if (devicesToExport.length === 0) {
    devicesToExport = initialDevices;
  }

  if (brandsToExport.length === 0) {
    try {
      const fetchedBrands = await safeFetchJson<Brand[]>('/api/brands');
      if (Array.isArray(fetchedBrands) && fetchedBrands.length > 0) {
        brandsToExport = fetchedBrands;
      }
    } catch {
      // fallback to initialBrands
    }
  }

  if (brandsToExport.length === 0) {
    brandsToExport = initialBrands;
  }

  const brandMap = new Map<number, string>();
  brandsToExport.forEach((b) => brandMap.set(b.id, b.name));

  // Map each active/current device into Excel row format without Purchase and Photo URLs
  const rows = devicesToExport.map((dev) => {
    const brandName = dev.brand?.name || brandMap.get(dev.brand_id) || 'Laptop';
    return {
      'Brand Name': brandName,
      'Model Name': dev.model,
      'Device Type': dev.device_type || 'laptop',
      'Price (RM)': dev.price,
      'CPU Name': dev.cpu_name,
      'CPU Brand': dev.cpu_brand,
      'CPU Tier (1-5)': dev.cpu_tier,
      'GPU Name': dev.gpu_name,
      'GPU Brand': dev.gpu_brand,
      'GPU Tier (0-5)': dev.gpu_tier,
      'RAM (GB)': dev.ram_gb,
      'RAM Upgradeable': dev.ram_upgradeable ? 'Yes' : 'No',
      'Storage (GB)': dev.storage_gb,
      'Storage Type': dev.storage_type || 'SSD',
      'Storage Upgradeable': dev.storage_upgradeable ? 'Yes' : 'No',
      'Display Size (Inches)': dev.display_size,
      'Weight (kg)': dev.weight_kg,
      'Battery Life (Hours)': dev.battery_life_hours,
      'Retail Source': dev.source_name || 'UOW Campus Partner',
    };
  });

  const finalRows = rows.length > 0 ? rows : SAMPLE_TEMPLATE_DEVICES;

  const wb = XLSX.utils.book_new();

  // 1. Devices sheet
  const wsDevices = XLSX.utils.json_to_sheet(finalRows);

  // Auto column width calculation (19 spec columns without Purchase URL and Photo URL)
  const colWidths = [
    { wch: 14 }, // Brand Name
    { wch: 34 }, // Model Name
    { wch: 14 }, // Device Type
    { wch: 12 }, // Price (RM)
    { wch: 28 }, // CPU Name
    { wch: 12 }, // CPU Brand
    { wch: 15 }, // CPU Tier (1-5)
    { wch: 32 }, // GPU Name
    { wch: 12 }, // GPU Brand
    { wch: 15 }, // GPU Tier (0-5)
    { wch: 12 }, // RAM (GB)
    { wch: 25 }, // RAM Upgradeable
    { wch: 14 }, // Storage (GB)
    { wch: 22 }, // Storage Type
    { wch: 28 }, // Storage Upgradeable
    { wch: 22 }, // Display Size
    { wch: 14 }, // Weight (kg)
    { wch: 20 }, // Battery Life (Hours)
    { wch: 24 }, // Retail Source
  ];
  wsDevices['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, wsDevices, 'Device Catalogue Template');

  // 2. Instructions Sheet
  const instructions = [
    { Section: 'EXCEL IMPORT & CATALOGUE INSTRUCTIONS', Guidance: 'This file contains all current catalogue listings. You can edit existing rows, adjust prices/specs, or add new rows directly.' },
    { Section: 'Required Columns', Guidance: 'Brand Name, Model Name, Price (RM), CPU Name, RAM (GB), Storage (GB).' },
    { Section: 'CPU Tiers (1-5)', Guidance: '1 = Entry (Celeron/Pentium/Core i3), 2 = Budget (i3/Ryzen 3), 3 = Mid-Performance (i5/Ryzen 5/M1), 4 = High/Enthusiast (i7/Ryzen 7/M2/M3), 5 = Extreme (i9/Ryzen 9/Ultra 9).' },
    { Section: 'GPU Tiers (0-5)', Guidance: '0 = Integrated (UHD/Intel HD), 1 = Basic (Iris Xe/Vega/Radeon), 2 = Mid (RTX 3050/4050/M3 GPU), 3 = High 3D/AI (RTX 4060/3060), 4 = Pro (RTX 4070), 5 = Extreme (RTX 4080/4090).' },
    { Section: 'RAM & Storage Upgradeable', Guidance: 'Enter "Yes" or "No" for expandability.' },
    { Section: 'Photo & Purchase Links Note', Guidance: 'Device photos and store links are managed directly in the portal. Photos can be uploaded manually or assigned via quick presets after import.' },
  ];
  const wsInstructions = XLSX.utils.json_to_sheet(instructions);
  wsInstructions['!cols'] = [{ wch: 25 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions & Tiers');

  // Save Excel file with timestamp/listing name
  XLSX.writeFile(wb, 'UOW_Device_Catalogue_Current_Listing.xlsx');
}

/** Helper to assign high-quality default photo based on brand and category */
export function inferDefaultPhoto(brand: string, deviceType: string): string {
  const b = (brand || '').toLowerCase();
  const t = (deviceType || '').toLowerCase();
  if (t === 'macbook' || b.includes('apple')) {
    return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80';
  }
  if (b.includes('asus') || b.includes('rog') || b.includes('tuf') || b.includes('legion') || b.includes('alienware') || b.includes('predator') || b.includes('razer')) {
    return 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop&q=80';
  }
  if (b.includes('dell') || b.includes('xps') || b.includes('thinkpad')) {
    return 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80';
  }
  if (b.includes('hp') || b.includes('acer') || b.includes('lenovo')) {
    return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1511385348-a52b4a160dc2?w=800&auto=format&fit=crop&q=80';
}

/** Helper to infer CPU tier if omitted in Excel */
function inferCpuTier(cpuName: string): number {
  const c = cpuName.toLowerCase();
  if (c.includes('i9') || c.includes('ryzen 9') || c.includes('ultra 9') || c.includes('m3 max') || c.includes('m2 max')) return 5;
  if (c.includes('i7') || c.includes('ryzen 7') || c.includes('ultra 7') || c.includes('m3 pro') || c.includes('m2 pro')) return 4;
  if (c.includes('i5') || c.includes('ryzen 5') || c.includes('ultra 5') || c.includes('m3') || c.includes('m2') || c.includes('m1')) return 3;
  if (c.includes('i3') || c.includes('ryzen 3')) return 2;
  return 1;
}

/** Helper to infer GPU tier if omitted in Excel */
function inferGpuTier(gpuName: string): number {
  const g = gpuName.toLowerCase();
  if (g.includes('4090') || g.includes('4080')) return 5;
  if (g.includes('4070') || g.includes('3080')) return 4;
  if (g.includes('4060') || g.includes('3060') || g.includes('3070')) return 3;
  if (g.includes('4050') || g.includes('3050') || g.includes('1650') || g.includes('arc') || g.includes('m3 10-core')) return 2;
  if (g.includes('iris') || g.includes('vega') || g.includes('radeon graphics') || g.includes('uhd')) return 1;
  return 0;
}

/** Safely parse boolean from Excel Yes/No/TRUE/FALSE */
function parseBoolean(val: any, defaultVal = true): boolean {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (typeof val === 'boolean') return val;
  const s = String(val).trim().toLowerCase();
  if (s === 'yes' || s === 'y' || s === 'true' || s === '1') return true;
  if (s === 'no' || s === 'n' || s === 'false' || s === '0') return false;
  return defaultVal;
}

/** Parse uploaded Excel / CSV File into structured devices */
export async function parseDeviceExcelFile(file: File): Promise<ParsedImportDevice[]> {
  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: 'array' });

  // Pick first sheet or sheet with "Template" in name
  const sheetName = wb.SheetNames.find((s) => s.toLowerCase().includes('device') || s.toLowerCase().includes('template')) || wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];

  if (!sheet) {
    throw new Error('No valid sheet found in Excel file.');
  }

  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('The uploaded Excel file contains no data rows.');
  }

  const parsedDevices: ParsedImportDevice[] = rawRows.map((row, idx) => {
    // Helper to extract value from flexible column keys
    const getVal = (...keys: string[]): any => {
      for (const k of keys) {
        const foundKey = Object.keys(row).find((rk) => rk.trim().toLowerCase() === k.trim().toLowerCase());
        if (foundKey && row[foundKey] !== undefined && row[foundKey] !== '') {
          return row[foundKey];
        }
      }
      return '';
    };

    const brandName = String(getVal('Brand Name', 'Brand', 'brand_name', 'brand')).trim() || 'Generic';
    const model = String(getVal('Model Name', 'Model', 'model_name', 'model')).trim();
    const typeStr = String(getVal('Device Type', 'DeviceType', 'type')).toLowerCase();
    let device_type: 'laptop' | 'macbook' | 'desktop' = 'laptop';
    if (typeStr.includes('mac') || brandName.toLowerCase() === 'apple') device_type = 'macbook';
    else if (typeStr.includes('desktop') || typeStr.includes('pc')) device_type = 'desktop';

    const priceRaw = getVal('Price (RM)', 'Price', 'price_rm', 'price');
    const price = Math.max(0, Number(String(priceRaw).replace(/[^0-9.]/g, '')) || 0);

    const cpuName = String(getVal('CPU Name', 'CPU', 'processor', 'cpu_name')).trim() || 'Intel Core i5';
    const cpuBrandRaw = String(getVal('CPU Brand', 'cpu_brand')).trim();
    let cpu_brand: 'Intel' | 'AMD' | 'Apple' = 'Intel';
    if (cpuName.toLowerCase().includes('amd') || cpuName.toLowerCase().includes('ryzen') || cpuBrandRaw.toLowerCase().includes('amd')) {
      cpu_brand = 'AMD';
    } else if (cpuName.toLowerCase().includes('apple') || cpuName.toLowerCase().includes('m1') || cpuName.toLowerCase().includes('m2') || cpuName.toLowerCase().includes('m3') || cpuBrandRaw.toLowerCase().includes('apple')) {
      cpu_brand = 'Apple';
    }

    const cpuTierRaw = Number(getVal('CPU Tier (1-5)', 'CPU Tier', 'cpu_tier'));
    const cpu_tier = cpuTierRaw >= 1 && cpuTierRaw <= 5 ? cpuTierRaw : inferCpuTier(cpuName);

    const gpuName = String(getVal('GPU Name', 'GPU', 'graphics', 'gpu_name')).trim() || 'Integrated Graphics';
    const gpuBrandRaw = String(getVal('GPU Brand', 'gpu_brand')).trim();
    let gpu_brand: 'NVIDIA' | 'AMD' | 'Intel' | 'Apple' = 'Intel';
    if (gpuName.toLowerCase().includes('nvidia') || gpuName.toLowerCase().includes('geforce') || gpuName.toLowerCase().includes('rtx') || gpuBrandRaw.toLowerCase().includes('nvidia')) {
      gpu_brand = 'NVIDIA';
    } else if (gpuName.toLowerCase().includes('amd') || gpuName.toLowerCase().includes('radeon') || gpuBrandRaw.toLowerCase().includes('amd')) {
      gpu_brand = 'AMD';
    } else if (gpuName.toLowerCase().includes('apple') || gpuBrandRaw.toLowerCase().includes('apple')) {
      gpu_brand = 'Apple';
    }

    const gpuTierRaw = Number(getVal('GPU Tier (0-5)', 'GPU Tier', 'gpu_tier'));
    const gpu_tier = gpuTierRaw >= 0 && gpuTierRaw <= 5 ? gpuTierRaw : inferGpuTier(gpuName);

    const ramRaw = getVal('RAM (GB)', 'RAM', 'ram_gb', 'ram');
    const ram_gb = Number(String(ramRaw).replace(/[^0-9]/g, '')) || 16;

    const storageRaw = getVal('Storage (GB)', 'Storage', 'storage_gb', 'ssd');
    const storage_gb = Number(String(storageRaw).replace(/[^0-9]/g, '')) || 512;

    const storageType = String(getVal('Storage Type', 'storage_type')).trim() || 'NVMe SSD';

    const displaySizeRaw = getVal('Display Size (Inches)', 'Display Size', 'display_size');
    const display_size = Number(String(displaySizeRaw).replace(/[^0-9.]/g, '')) || 15.6;

    const weightRaw = getVal('Weight (kg)', 'Weight', 'weight_kg');
    const weight_kg = Number(String(weightRaw).replace(/[^0-9.]/g, '')) || 1.9;

    const batteryRaw = getVal('Battery Life (Hours)', 'Battery Life', 'battery_life_hours');
    const battery_life_hours = Number(String(batteryRaw).replace(/[^0-9.]/g, '')) || 6.0;

    const ram_upgradeable = parseBoolean(getVal('RAM Upgradeable (Yes/No)', 'RAM Upgradeable', 'ram_upgradeable'), true);
    const storage_upgradeable = parseBoolean(getVal('Storage Upgradeable (Yes/No)', 'Storage Upgradeable', 'storage_upgradeable'), true);

    const source_name = String(getVal('Retail Source', 'Source', 'source_name')).trim() || 'Retail Partner';
    const purchase_url = String(getVal('Purchase URL', 'PurchaseURL', 'url')).trim();
    let image_url = String(getVal('Photo URL', 'Image URL', 'image_url', 'photo')).trim();
    if (!image_url || (!image_url.startsWith('http') && !image_url.startsWith('data:image'))) {
      image_url = inferDefaultPhoto(brandName, device_type);
    }

    const validationErrors: string[] = [];
    if (!model) validationErrors.push('Missing model name');
    if (price <= 0) validationErrors.push('Price must be greater than RM 0');

    return {
      brand_name: brandName,
      model: model || `Laptop Row ${idx + 1}`,
      device_type,
      price,
      cpu_name: cpuName,
      cpu_brand,
      cpu_tier,
      gpu_name: gpuName,
      gpu_brand,
      gpu_tier,
      ram_gb,
      ram_upgradeable,
      storage_gb,
      storage_type: storageType,
      storage_upgradeable,
      display_size,
      weight_kg,
      battery_life_hours,
      source_name,
      purchase_url,
      image_url,
      is_valid: validationErrors.length === 0,
      validation_errors: validationErrors,
    };
  });

  return parsedDevices;
}
