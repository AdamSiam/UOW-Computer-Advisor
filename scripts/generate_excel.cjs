const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const SAMPLE_TEMPLATE_DEVICES = [
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
    'Purchase URL': 'https://shopee.com.my/asus-official-store',
    'Photo URL': 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800',
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
    'Purchase URL': 'https://www.lenovo.com/my/en/',
    'Photo URL': 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800',
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
    'Purchase URL': 'https://www.apple.com/my/shop',
    'Photo URL': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
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
    'Purchase URL': 'https://shopee.com.my',
    'Photo URL': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
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
    'Purchase URL': 'https://www.dell.com/en-my',
    'Photo URL': 'https://images.unsplash.com/photo-1511385348-a52b4a160dc2?w=800',
  },
];

const wb = XLSX.utils.book_new();

// Sheet 1: Devices
const wsDevices = XLSX.utils.json_to_sheet(SAMPLE_TEMPLATE_DEVICES);
wsDevices['!cols'] = [
  { wch: 12 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 25 },
  { wch: 12 }, { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 15 },
  { wch: 10 }, { wch: 24 }, { wch: 12 }, { wch: 20 }, { wch: 26 },
  { wch: 20 }, { wch: 12 }, { wch: 20 }, { wch: 22 }, { wch: 35 },
  { wch: 45 }
];
XLSX.utils.book_append_sheet(wb, wsDevices, 'Device Catalogue Template');

// Sheet 2: Instructions
const instructions = [
  { Section: 'EXCEL IMPORT INSTRUCTIONS', Guidance: 'Fill in the rows on the "Device Catalogue Template" sheet and save the file (.xlsx, .xls, or .csv).' },
  { Section: 'Required Columns', Guidance: 'Brand Name, Model Name, Price (RM), CPU Name, RAM (GB), Storage (GB).' },
  { Section: 'CPU Tiers (1-5)', Guidance: '1 = Entry (Celeron/Pentium/Core i3), 2 = Budget (i3/Ryzen 3), 3 = Mid-Performance (i5/Ryzen 5/M1), 4 = High/Enthusiast (i7/Ryzen 7/M2/M3), 5 = Extreme (i9/Ryzen 9/Ultra 9).' },
  { Section: 'GPU Tiers (0-5)', Guidance: '0 = Integrated (UHD/Intel HD), 1 = Basic (Iris Xe/Vega/Radeon), 2 = Mid (RTX 3050/4050/M3 GPU), 3 = High 3D/AI (RTX 4060/3060), 4 = Pro (RTX 4070), 5 = Extreme (RTX 4080/4090).' },
  { Section: 'RAM & Storage Upgradeable', Guidance: 'Enter "Yes" or "No" for expandability.' },
  { Section: 'Photo URL', Guidance: 'Paste any direct image URL (e.g. Unsplash or store product image). If left blank, a default laptop image will be assigned.' },
];
const wsInstructions = XLSX.utils.json_to_sheet(instructions);
wsInstructions['!cols'] = [{ wch: 25 }, { wch: 80 }];
XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions & Tiers');

const projectDir = path.dirname(__dirname);
const publicDir = path.join(projectDir, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const targetPath = path.join(publicDir, 'UOW_Device_Catalogue_Import_Template.xlsx');
XLSX.writeFile(wb, targetPath);

const rootTargetPath = path.join(projectDir, 'UOW_Device_Catalogue_Import_Template.xlsx');
XLSX.writeFile(wb, rootTargetPath);

console.log('Successfully generated Excel template files at:', targetPath, 'and', rootTargetPath);
