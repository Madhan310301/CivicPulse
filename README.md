<div align="center">

<!-- Animated Banner -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:1D9E75,50:185FA5,100:534AB7&height=200&section=header&text=Civic%20Pulse&fontSize=72&fontColor=ffffff&fontAlignY=38&desc=Citizens%20Report.%20AI%20Triages.%20Community%20Verifies.%20Govt%20Acts.&descAlignY=58&descSize=16&animation=fadeIn" width="100%"/>

<!-- Badges Row 1 -->
<p>
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=nextdotjs&logoColor=white"/>
  <img src="https://img.shields.io/badge/Gemini%201.5%20Flash-AI%20Powered-4285F4?style=for-the-badge&logo=google&logoColor=white"/>
  <img src="https://img.shields.io/badge/Firebase-Free%20Tier-FFCA28?style=for-the-badge&logo=firebase&logoColor=black"/>
  <img src="https://img.shields.io/badge/Google%20Cloud%20Run-Deployed-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white"/>
</p>

<!-- Badges Row 2 -->
<p>
  <img src="https://img.shields.io/badge/Status-Live-1D9E75?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Cost-$0.00%2Fmonth-brightgreen?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Hackathon-Bharatiya%20Antariksh%202026-orange?style=for-the-badge"/>
</p>

<!-- Live Demo Button -->
<a href="https://civicpulse-xxxxxxxxxxxx-el.a.run.app">
  <img src="https://img.shields.io/badge/🚀%20Live%20Demo-Click%20Here-1D9E75?style=for-the-badge"/>
</a>
&nbsp;
<a href="#-quick-start">
  <img src="https://img.shields.io/badge/⚡%20Quick%20Start-Setup%20Guide-185FA5?style=for-the-badge"/>
</a>

<br/><br/>

</div>

---

## ⚡ What is Civic Pulse?

> **Civic Pulse** is a hyperlocal civic issue reporting and resolution platform that closes the feedback loop between citizens and government — powered by Google Gemini AI, Firebase, and deployed on Google Cloud Run.

Most civic apps are **one-way**: citizen reports → black hole.  
**Civic Pulse is a closed loop:**

```
📸 Citizen Reports  →  🤖 AI Triages  →  👥 Community Verifies  →  🏛️ Govt Acts  →  🔔 Citizen Notified
        ↑_____________________________ Data feeds Prediction Model ___________________________↑
```

---

## 🎯 The Problem

| Pain Point | Reality |
|---|---|
| 🕳️ Pothole reporting | Fragmented, no feedback |
| 💧 Water leakages | Unknown resolution status |
| 💡 Broken streetlights | No accountability |
| 🗑️ Waste management | Reports get lost |
| 📊 Transparency | Citizens left in the dark |

**Civic Pulse solves all five — with AI at the core.**

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 📍 Smart Reporting
- One-tap photo/video upload
- Auto GPS geo-tagging
- Voice-to-text description
- Works offline (queue mode)

### 🤖 Gemini AI Engine
- Auto issue classification
- Severity scoring (1–5)
- Duplicate detection
- Predictive hotspot alerts

### ✅ Community Verification
- "I see this too" upvotes
- Trust score system
- Multi-photo confirmation
- Trusted citizen badges

</td>
<td width="50%">

### 🔄 Real-Time Tracking
```
Reported ──► Verified ──► Assigned
                              │
                        In Progress
                              │
                          Resolved ✅
```
SLA timers, push notifications, dept. routing

### 📊 Impact Dashboard
- City-wide issue heatmap
- Dept. performance scores
- Predictive alert cards
- Monthly ward PDF reports

### 🏆 Gamification
- XP points + leaderboard
- Ward vs. Ward challenges
- Resolution streak badges
- Hero of the Month 🥇

</td>
</tr>
</table>

---

## 🧠 AI Architecture

```mermaid
graph TD
    A[📸 Citizen uploads photo + description] --> B[/api/classify]
    B --> C{Gemini 1.5 Flash Vision}
    C --> D[Category: pothole / leak / light / waste]
    C --> E[Severity: 1–5]
    C --> F[Dept. Assignment]
    D --> G[/api/duplicate]
    G --> H{Duplicate Check}
    H -- Yes --> I[Merge into existing report]
    H -- No --> J[New issue created in Firestore]
    J --> K[Community Verification]
    K --> L[/api/predict — Hotspot Analysis]
    L --> M[📊 Predictive Alert on Dashboard]
```

---

## 🛠️ Tech Stack

| Layer | Technology | Cost |
|---|---|---|
| **Frontend** | Next.js 14 + Tailwind CSS + shadcn/ui | 🟢 Free |
| **Maps** | Leaflet.js + OpenStreetMap | 🟢 Free |
| **AI / Vision** | Google Gemini 1.5 Flash (AI Studio) | 🟢 Free tier |
| **Database** | Firebase Firestore (Spark plan) | 🟢 Free |
| **Storage** | Firebase Storage (5GB) | 🟢 Free |
| **Auth** | Firebase Auth + Google Sign-In | 🟢 Free |
| **Deployment** | Google Cloud Run (asia-south1) | 🟢 Free tier |
| **CI/CD** | GitHub Actions | 🟢 Free |

> **Total monthly cost: $0.00** — entirely within free tier limits.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Google Cloud CLI
- Firebase account (free)
- Gemini API key from [AI Studio](https://aistudio.google.com) (free)

### 1. Clone the repo

```bash
git clone https://github.com/Madhan310301/civic-pulse.git
cd civic-pulse
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=civicpulse-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=civicpulse-app.appspot.com
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=civicpulse-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Run locally

```bash
npm run dev
# Open http://localhost:3000
```

### 4. Deploy to Google Cloud Run

```bash
gcloud run deploy civicpulse \
  --source . \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --max-instances 3 \
  --port 8080 \
  --set-env-vars GEMINI_API_KEY=YOUR_KEY
```

Your live URL: `https://civicpulse-xxxxxxxxxxxx-el.a.run.app`

---

## 📁 Project Structure

```
civic-pulse/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── report/page.tsx           # Issue reporting form
│   ├── feed/page.tsx             # Community feed + map
│   ├── issue/[id]/page.tsx       # Issue detail + timeline
│   ├── dashboard/page.tsx        # Impact dashboard
│   ├── leaderboard/page.tsx      # Gamification
│   └── api/
│       ├── classify/route.ts     # Gemini Vision classification
│       ├── duplicate/route.ts    # Duplicate detection
│       ├── predict/route.ts      # Hotspot prediction
│       └── reports/route.ts      # Firestore CRUD
├── components/
│   ├── ReportForm.tsx
│   ├── IssueCard.tsx
│   ├── StatusTimeline.tsx
│   ├── MapView.tsx               # Leaflet map
│   ├── HeatmapPanel.tsx
│   ├── VerifyButton.tsx
│   └── GamificationBar.tsx
├── lib/
│   ├── firebase.ts
│   ├── gemini.ts
│   └── types.ts
├── Dockerfile
└── README.md
```

---

## 🗺️ Roadmap

- [x] Issue reporting with AI classification
- [x] Community verification system
- [x] Real-time status tracking
- [x] Impact dashboard with heatmap
- [x] Gamification + leaderboard
- [x] Google Cloud Run deployment
- [ ] Mobile app (React Native)
- [ ] WhatsApp bot for reporting
- [ ] Government admin portal
- [ ] Multi-language support (Tamil, Hindi)
- [ ] Offline PWA mode

---

## 🏆 Hackathon Submission

> Built for **Bharatiya Antariksh Hackathon 2026** — Challenge: Community Hero: Hyperlocal Problem Solver

| Criteria | Our Approach |
|---|---|
| **Problem Solving & Impact** (20%) | Closes the civic feedback loop end-to-end |
| **Agentic Depth** (20%) | Gemini autonomously classifies, deduplicates, predicts, routes |
| **Innovation & Creativity** (20%) | Predictive hotspots + community trust scoring |
| **Google Technologies** (15%) | Gemini 1.5 Flash, Firebase, Cloud Run, AI Studio |
| **Product Experience** (10%) | Mobile-first, one-tap reporting, real-time updates |
| **Technical Implementation** (10%) | Serverless, real-time Firestore listeners, Next.js ISR |
| **Completeness** (5%) | All 5 pages functional, auth, reporting, dashboard, leaderboard |

---

## 👥 Team

<table>
<tr>
<td align="center">
  <img src="https://github.com/Madhan310301.png" width="80" style="border-radius:50%"/><br/>
  <b>Madhan Kumar T</b><br/>
  <a href="https://github.com/Madhan310301">@Madhan310301</a><br/>
  <img src="https://img.shields.io/badge/Full%20Stack%20+%20AI-1D9E75?style=flat-square"/>
</td>
<td align="center">
  <img src="https://github.com/identicons/dharshini.png" width="80" style="border-radius:50%"/><br/>
  <b>Dharshini</b><br/>
  <img src="https://img.shields.io/badge/Frontend%20+%20UI-185FA5?style=flat-square"/>
</td>
<td align="center">
  <img src="https://github.com/identicons/eashwer.png" width="80" style="border-radius:50%"/><br/>
  <b>Eashwer</b><br/>
  <img src="https://img.shields.io/badge/Backend%20+%20Cloud-534AB7?style=flat-square"/>
</td>
</tr>
</table>

---
---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:534AB7,50:185FA5,100:1D9E75&height=100&section=footer&animation=fadeIn" width="100%"/>

**Made with ❤️ in Chennai, India 🇮🇳**

<p>
  <img src="https://img.shields.io/badge/Google%20Gemini-Powered-4285F4?style=flat-square&logo=google"/>
  &nbsp;
  <img src="https://img.shields.io/badge/Firebase-Backed-FFCA28?style=flat-square&logo=firebase&logoColor=black"/>
  &nbsp;
  <img src="https://img.shields.io/badge/Cloud%20Run-Deployed-4285F4?style=flat-square&logo=googlecloud&logoColor=white"/>
</p>

*If this project helped you, drop a ⭐ — it means a lot!*

</div>
