# UOW Laptop Recommendation Advisor

> **A Web-Based Decision Support System for Academic Computing Device Recommendations**  
> Designed for University of Wollongong (UOW) Malaysia students and faculty administrators.

[![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript_5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Bundler-Vite_6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Backend-Express_4-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Node.js](https://img.shields.io/badge/Runtime-Node.js_18+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📖 Table of Contents
1. [Project Overview](#-project-overview)
2. [Key Capabilities](#-key-capabilities)
   - [Student Decision Portal](#-student-decision-portal)
   - [Administrative Management Console](#-administrative-management-console)
3. [System Architecture](#-system-architecture)
4. [Hardware Scoring & Evaluation Engine](#-hardware-scoring--evaluation-engine)
5. [Technology Stack](#-technology-stack)
6. [Getting Started](#-getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Environment Configuration](#environment-configuration)
   - [Running in Development](#running-in-development)
7. [Production Build & Deployment](#-production-build--deployment)
   - [Building for Production](#building-for-production)
   - [Deploying to Render.com](#deploying-to-rendercom)
8. [Project Structure](#-project-structure)
9. [REST API Documentation](#-rest-api-documentation)
10. [Code Quality & Linting](#-code-quality--linting)
11. [License](#-license)

---

## 📌 Project Overview

Selecting the right laptop for university coursework is often challenging for students entering technical disciplines (such as Computer Science, Software Engineering, Game Development, Data Science, or Digital Media). Overspending on unnecessary hardware or purchasing underpowered machines that cannot run required virtual machines, IDEs, or 3D rendering engines leads to frustration.

The **UOW Laptop Recommendation Advisor** is a full-stack, syllabus-grounded decision support platform. It correlates academic course requirements with verified laptop hardware specifications using an intelligent multi-criteria scoring algorithm and integrated natural language hardware synthesis.

---

## ✨ Key Capabilities

### 👨‍🎓 Student Decision Portal
- **Guided 3-Step Recommendation Wizard**:
  - **Step 1**: Select Faculty & Academic Programme (e.g., *Bachelor of Computer Science (Hons)*).
  - **Step 2**: Configure budget limit (MYR), hardware priorities (Portability vs. Battery), preferred device format (Clamshell vs. 2-in-1), and brand preferences.
  - **Step 3**: Receive an objectively ranked list divided into *Within Target Budget* and *Slightly Over Budget (High Spec)*.
- **Hardware Requirement Hierarchy & Analysis**:
  - Automatically identifies primary hardware bottlenecks (#1 CPU, #2 RAM, #3 GPU, #4 Storage) specific to the chosen degree.
- **Contextual AI Hardware Synthesis**:
  - Generates plain-language executive summaries explaining *why* specific laptop models match coursework demands (e.g., virtualization overhead for Cybersecurity, CUDA cores for Deep Learning).
- **Side-by-Side Comparison Matrix**:
  - Compare up to 4 shortlisted laptops simultaneously with automatic specification difference detection, benchmark comparisons, and syllabus suitability ratings.
- **Saved Picks & History**:
  - Bookmark favorite devices and persist personalized recommendation reports for future reference.
- **Interactive Bot Advisor**:
  - Integrated rule-based and AI-powered hardware chat assistant for answering syllabus compatibility questions.
- **Feedback & Rating Mechanism**:
  - Submit user feedback and recommendation accuracy ratings directly to faculty administrators.

### 🛡️ Administrative Management Console
- **Role-Based Access Control (RBAC)**:
  - Secure credential authentication separating student users from system administrators.
- **Academic Programme & Requirement Profile Mapping**:
  - Configure minimum and recommended hardware baselines (CPU tiers, RAM capacity, GPU requirements, OS constraints) per degree.
- **Hardware Catalogue Management**:
  - Full CRUD operations on laptop inventory with real-time specification validation.
  - **Excel / CSV Bulk Upload & Export**: Batch import and export laptop inventories via `.xlsx` spreadsheets.
- **Analytics & Engagement Dashboard**:
  - Visualize student engagement, faculty recommendation distributions, and feedback metrics using interactive Recharts visualizers.

---

## 🏗️ System Architecture

```
                                  ┌────────────────────────┐
                                  │      Client (SPA)      │
                                  │  React 19 + TypeScript │
                                  │   Tailwind CSS + Motion│
                                  └───────────┬────────────┘
                                              │ HTTP / JSON
                                              ▼
                                  ┌────────────────────────┐
                                  │  Express Server (ESM)  │
                                  │      (server.ts)       │
                                  └─────┬────────────┬─────┘
                                        │            │
                  ┌─────────────────────┴───┐    ┌───┴─────────────────────┐
                  │ Recommendation Engine   │    │ Google Gemini API SDK   │
                  │ - Multi-Criteria Scoring│    │ - Hardware Explanation  │
                  │ - Tier & Budget Filters │    │ - Natural Language Advice│
                  └─────────────────────────┘    └─────────────────────────┘
```

---

## 🧮 Hardware Scoring & Evaluation Engine

The recommendation engine evaluates devices across multiple weighted criteria:
1. **Academic Syllabus Compliance ($S_{\text{req}}$)**: Evaluates CPU performance, RAM capacity, dedicated GPU VRAM, and storage type against minimum and recommended thresholds defined for the academic programme.
2. **Budget Optimization ($S_{\text{budget}}$)**: Computes a value-for-money score favoring high-spec hardware within the student's target budget, applying progressive penalties for models exceeding the budget.
3. **User Hardware Priorities ($S_{\text{pref}}$)**: Weights device weight (kg) and battery capacity (Wh) according to user-selected portability and battery priority sliders.
4. **Brand & Format Filters**: Applies user-defined preferences for manufacturer and form-factor (standard laptop vs. 2-in-1 convertible).

$$\text{Final Score} = w_1 S_{\text{req}} + w_2 S_{\text{budget}} + w_3 S_{\text{pref}} + \text{Bonus}_{\text{rec}}$$

---

## 💻 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript 5.8, Vite 6 |
| **UI Styling & Icons** | Tailwind CSS v4, Lucide React, Motion (Framer Motion) |
| **Data Visualization** | Recharts (Responsive Analytics Charts) |
| **Document Processing** | XLSX (SheetJS for Excel parsing and export), React Markdown, Remark GFM |
| **Backend API** | Node.js 18+, Express 4.21, esbuild |
| **AI Integration** | Google Gen AI SDK (`@google/genai`) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: Version `18.0.0` or higher
- **npm**: Version `9.0.0` or higher

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/AdamSiam/UOW-Computer-Advisor.git
   cd UOW-Computer-Advisor
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

### Environment Configuration

Create a `.env` file in the root directory (or copy from `.env.example`):

```env
# Server Port (defaults to 3000)
PORT=3000
NODE_ENV=development

# Optional: Google Gemini API Key for AI Explanations
GEMINI_API_KEY=your_gemini_api_key_here
```

### Running in Development

Start the development server with Hot Module Reloading (HMR) and API routing:

```bash
npm run dev
```

Open your browser at `http://localhost:3000`.

---

## 📦 Production Build & Deployment

### Building for Production

Compile both the client-side React single-page application and the server-side TypeScript bundle:

```bash
npm run build
```

Start the compiled production server:

```bash
npm start
```

### Deploying to Render.com

1. Create a new **Web Service** on [Render.com](https://render.com).
2. Connect your GitHub repository (`UOW-Computer-Advisor`).
3. Configure the following build settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add the following **Environment Variables**:
   - `NODE_ENV` = `production`
   - `PORT` = `3000`
   - `GEMINI_API_KEY` = *(Your Gemini API key, optional)*

---

## 📂 Project Structure

```
├── public/                     # Static web assets and icons
├── src/
│   ├── components/
│   │   ├── Admin/              # Administrative console (Analytics, Inventory, Syllabus CRUD)
│   │   ├── Auth/               # Student & Admin Authentication Modals
│   │   ├── StudentPortal/      # Student Wizard, Comparison Matrix, Catalogue, Bot Advisor
│   │   ├── FloatingChatBot.tsx # Global responsive floating assistant widget
│   │   ├── Header.tsx          # Top navigation bar with theme and accessibility controls
│   │   └── OnboardingTour.tsx  # Interactive spotlight guided tour for first-time users
│   ├── data/
│   │   └── mockData.ts         # Seed database (Faculties, Programmes, Devices, Profiles)
│   ├── lib/
│   │   ├── apiUtils.ts         # Type-safe API client wrappers
│   │   └── utils.ts            # General utility and styling helper functions
│   ├── services/
│   │   └── recommendationEngine.ts # Core MCDA hardware scoring algorithm
│   ├── types.ts                # Global TypeScript domain definitions and interfaces
│   ├── App.tsx                 # Primary application controller and routing shell
│   ├── main.tsx                # React DOM root entry point
│   └── index.css               # Global Tailwind CSS styling
├── server.ts                   # Express REST API and Vite middleware server
├── package.json                # Project dependencies and operational scripts
├── tsconfig.json               # TypeScript compiler configuration
└── vite.config.ts              # Vite bundler configuration
```

---

## 🔌 REST API Documentation

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/faculties` | Fetch all academic faculties and departments | Public |
| `GET` | `/api/programmes` | Fetch all degree programmes with requirement profiles | Public |
| `GET` | `/api/devices` | Retrieve verified laptop catalog with filtering | Public |
| `POST` | `/api/recommend` | Compute ranked laptop matches for course and budget | Public |
| `POST` | `/api/gemini/explain` | Generate contextual AI hardware synthesis | Public |
| `POST` | `/api/bot/chat` | Send queries to the interactive hardware advisor bot | Public |
| `POST` | `/api/feedback` | Submit student recommendation feedback and ratings | Public |
| `POST` | `/api/auth/login` | Authenticate student or administrative user | Public |
| `POST` | `/api/admin/devices` | Add new laptop model to the database | Admin |
| `PUT` | `/api/admin/devices/:id` | Update specifications or pricing for a laptop model | Admin |
| `DELETE` | `/api/admin/devices/:id` | Remove a laptop model from the database | Admin |
| `GET` | `/api/admin/stats` | Retrieve platform analytics and usage distribution | Admin |

---

## 🧪 Code Quality & Linting

Run TypeScript type verification:

```bash
npm run lint
```

---

## 📄 License

This project is developed for educational and academic decision-support purposes at the University of Wollongong Malaysia. Distributed under the MIT License.
