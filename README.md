# AI Resume Builder — Intelligent Resume Creation Platform

![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Groq AI](https://img.shields.io/badge/Groq-AI_Engine-F55036?style=for-the-badge)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-Payments-0C2451?style=for-the-badge&logo=razorpay&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

A full-stack AI-powered resume building platform built with **React**, **Node.js**, and **Groq AI** — engineered for professional resume generation, ATS score analysis, multi-template PDF export, and secure payment-gated downloads.

---

## 🌟 Platform Highlights

This repository demonstrates a production-grade full-stack architecture with AI integration, real-time preview rendering, OAuth authentication, and payment processing:

### 1. 🤖 AI-Powered Resume Engine
- **Groq AI Content Generation (`groq.service.js`):** Intelligent resume content suggestions, bullet-point generation, and professional summary writing powered by the Groq SDK.
- **Resume Parser AI (`resumeParserAI.service.js`):** Upload an existing resume and auto-extract structured data — work experience, skills, education, and certifications — using AI parsing pipelines.
- **Resume Pipeline (`resumePipeline.service.js`):** Multi-stage processing pipeline that formats, enhances, and scores resume content before rendering or PDF export.
- **ATS Score Analysis (`ats.service.js`):** Real-time Applicant Tracking System score calculation with keyword matching, formatting checks, and actionable improvement suggestions.

### 2. 📄 Multi-Template Resume Builder
- **16+ Resume Layouts:** Professionally designed templates — `Executive`, `TwoColumnPro`, `ModernCompact`, `CreativeFlex`, `SidebarHeavy`, `Infographic`, `Portfolio`, `TechMinimal`, `SkillMatrix`, `HorizontalTimeline`, `TimelineVertical`, `AchievementTimeline`, `ClassicAcademic`, `MinimalLine`, `CardGrid`, `SplitScreen`.
- **Real-Time Preview (`ResumePreview.js`):** Instant live preview as users fill in their details, with a resizable split-pane builder interface.
- **Drag-and-Drop Section Ordering:** Flexible resume section reordering with persistent state management via Zustand.
- **Template Selector (`TemplateSelector.js`):** Visual template gallery with live mini-previews and one-click switching.

### 3. 📥 PDF Generation & Download
- **Server-Side PDF (`pdf.service.js`):** High-fidelity PDF rendering via Puppeteer — pixel-perfect layout preservation across all resume templates.
- **Client-Side PDF (`jsPDF`):** Fast in-browser PDF generation for instant downloads.
- **Payment-Gated Export:** Premium PDF downloads unlocked via Razorpay payment verification — per-resume purchase tracking with webhook validation.

### 4. 🔐 Authentication & User Management
- **Google OAuth (`Passport.js`):** One-click Google Sign-In with JWT session management.
- **JWT Auth Middleware (`authMiddleware.js`):** Stateless token-based authentication with refresh logic and secure device binding.
- **Device Fingerprinting (`deviceMiddleware.js`, `deviceSigner.js`):** Cryptographic device signatures for session integrity and anti-abuse protection.
- **User & Resume Models:** MySQL-backed relational data with structured resume versioning.

### 5. 💳 Payment Integration
- **Razorpay (`payment.controller.js`):** Secure order creation, webhook signature verification, payment status tracking, and purchase recovery scripts.
- **Pro Access Timer (`ProTimerDisplay.js`):** Time-limited download access display after successful payment.
- **Pricing Page (`PricingPage.js`):** Clear tier-based pricing UI with feature comparison.

### 6. 📊 Analytics & Monitoring
- **Analytics Controller (`analytics.controller.js`):** Usage tracking, resume creation metrics, and engagement telemetry.
- **Cron Jobs (`cron.service.js`):** Scheduled background tasks for cleanup, email reminders, and subscription expiry handling.
- **Email Notifications (`email.service.js`):** Transactional emails for account actions, payment receipts, and resume share links.
- **Structured Logging (`logger.js`):** Winston-based logging with file rotation and log levels.

### 7. 🎨 Frontend Architecture
- **Zustand State (`resumeStore.js`, `themeStore.js`):** Lightweight, fast global state for resume data and theme management.
- **Auto-Save Hook (`useAutoSave.js`):** Debounced auto-save with conflict detection and last-saved indicator.
- **ATS Hook (`useATSScore.js`):** Real-time ATS recalculation on every resume change.
- **Framer Motion Animations:** Smooth page transitions, modal animations, and micro-interactions throughout the UI.
- **Error Boundaries (`ErrorBoundary.js`):** Graceful error recovery with user-friendly fallback states.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Tailwind CSS, Zustand, Framer Motion, React Router |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL 8.0 (mysql2) |
| **AI** | Groq SDK |
| **Auth** | Passport.js (Google OAuth), JWT |
| **PDF** | Puppeteer (server), jsPDF (client) |
| **Payments** | Razorpay |
| **Email** | Nodemailer |
| **Testing** | Jest |

---

## 📁 Project Structure

```
Ai-resume-builder/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── constants/       # App-wide constants
│   │   ├── controllers/     # Route handlers (auth, resume, AI, payment, PDF)
│   │   ├── middleware/      # Auth, device, error, validators
│   │   ├── migrations/      # DB schema & migration runner
│   │   ├── models/          # User, Resume, Device models
│   │   ├── routes/          # Express route definitions
│   │   ├── scripts/         # One-off utility scripts
│   │   ├── services/        # Core business logic (AI, PDF, email, cron, ATS)
│   │   ├── utils/           # Helpers (logger, sanitizer, validation, device signer)
│   │   └── server.js        # Express app entry point
│   ├── __tests__/           # Unit tests (controllers, utils)
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ats/         # ATS score panel
│   │   │   ├── auth/        # Login modal
│   │   │   ├── builder/     # Form sections (experience, skills, education…)
│   │   │   ├── dashboard/   # Resume list & management
│   │   │   ├── home/        # Upload & ATS result modals
│   │   │   ├── payment/     # Payment modal & pro timer
│   │   │   ├── preview/     # Resume preview & 16+ layout templates
│   │   │   └── templates/   # Template selector & data
│   │   ├── config/          # Frontend constants
│   │   ├── hooks/           # useATSScore, useAutoSave
│   │   ├── pages/           # HomePage, BuilderPage, DashboardPage, PricingPage, PaymentPage
│   │   ├── services/        # API service layer
│   │   ├── store/           # Zustand stores (resume, theme)
│   │   ├── styles/          # Global CSS
│   │   ├── utils/           # Preview HTML helpers
│   │   └── App.js
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm or yarn
- Groq API Key
- Razorpay Key ID & Secret
- Google OAuth Client ID & Secret

### 1. Clone the Repository
```bash
git clone https://github.com/Dilliraj-S/Ai-resume-builder.git
cd Ai-resume-builder
```

### 2. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Configure Environment

**Backend** — create `backend/.env`:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=resumedb

JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

GROQ_API_KEY=your_groq_api_key

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

CLIENT_URL=http://localhost:3007
```

**Frontend** — create `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### 4. Set Up the Database
```bash
# Run migrations to create tables
cd backend
node src/migrations/migrate.js
```

### 5. Run the Application
```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 3007)
cd frontend
npm start
```

---

## 🧪 Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

---

## 📜 License

MIT License — free to use for learning and development.

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

<p align="center">Built with ❤️ by <a href="https://github.com/Dilliraj-S">Dilliraj-S</a></p>
