# 🌿 EarthPrint

**A Carbon Footprint Awareness Platform for Individual Action and Collective Impact**

> *Track your impact. Understand what drives it. Take the actions that matter most.*

---

## Table of Contents

1. [The Vertical](#1-the-vertical)
2. [Core Architecture & Code Structure](#2-core-architecture--code-structure)
3. [Implemented Features & Engineering Highlights](#3-implemented-features--engineering-highlights)
4. [Google Services & Web APIs Integration](#4-google-services--web-apis-integration)
5. [Data Sources & Methodology](#5-data-sources--methodology)
6. [Tech Stack](#6-tech-stack)
7. [Getting Started & Setup](#7-getting-started--setup)
8. [Environment Variables](#8-environment-variables)
9. [Roadmap Status](#9-roadmap-status)
10. [Assumptions Made](#10-assumptions-made)
11. [Deployment to Render](#11-deployment-to-render)
12. [License](#12-license)

---

## 1. The Vertical

**EarthPrint** operates in the **climate technology / sustainability** vertical, targeting the gap between individual climate awareness and individual climate action (often called **personal carbon management**).

The platform tracks carbon emissions across the four primary lifestyle categories driving individual impacts:

| Category | Share of Individual Emissions | Key Activities |
|---|---|---|
| 🚗 Transport | ~27% | Car, flights, public transit |
| 🌱 Food | ~25% | Diet, food sourcing, waste |
| 🏠 Home Energy | ~25% | Electricity, heating, cooling |
| 🛍 Shopping & Services | ~23% | Clothing, electronics, delivery |

---

## 2. Core Architecture & Code Structure

EarthPrint is structured as a **Turborepo monorepo** using npm workspaces. This architecture enforces separation of concerns and facilitates code sharing between the frontend web app, the backend APIs, and the shared packages.

### Repository Layout

```
Carbon-Footprint-Awareness-Platform/
├── apps/
│   └── web/                # Next.js 14 Web Application (App Router)
│       ├── app/            # App routes (endpoints, views)
│       │   ├── (app)/      # Protected routes (Dashboard, Log, Awareness)
│       │   ├── (auth)/     # Authentication pages (Login, SignUp)
│       │   └── api/        # REST APIs (Gamification, AI Haiku, Comments)
│       ├── components/     # Custom UI and awareness widgets
│       ├── hooks/          # React hooks (useLogs, useAIRecommendations)
│       └── providers/      # Context providers (AuthProvider)
├── packages/
│   ├── emission-engine/    # Shared package: Carbon calculation math
│   ├── ui/                 # Shared package: Reusable design components
│   └── types/              # Shared package: Global TypeScript definitions
├── data/                   # Emission factor JSON databases + seed configurations
├── firestore/              # Firestore database rules, indexes, and schemas
└── docs/                   # Platform architecture, setup, and methodology guides
```

---

## 3. Implemented Features & Engineering Highlights

For evaluators reviewing this repository, the following core features are fully implemented, typed, and compiled:

### 3.1 Earth Awareness Hub (`/awareness`)
An immersive tabbed sanctuary introducing 15 sensory, mindful, collective art, and AR awareness features:
* **Haptic Heartbeat**: Emits rhythmic heartbeat pulses via the Web Vibration API (`navigator.vibrate`) proportional to the user's `terraScore` health (steady if thriving, irregular if stressed).
* **Earth Gratitude Journal**: Reframes carbon reduction as gratitude. Integrates a backend endpoint powered by Groq to return biophilic reflections.
* **The Silence Hour**: A weekly digital detox canvas rendering a starfield where star brightness and density scale in response to recent household energy logs (simulating light pollution).
* **Planetary Mirror**: Web camera face overlay blending video feeds with active biome vector graphics (foliage branches, ocean ripples).
* **Carbon Time Capsule**: 30-second promise recorder with countdown to 2030 and a digital vault of international voices.
* **Echo of Choices**: Photo gallery memory viewer applying carbon filters (amber smog vs. flower blooms) with material micro-stories.
* **Ancestral Lineage**: Scrollable SVG tapestry illustrating product manufacturing paths (coffee shade farming, recycled aluminum, organic cotton).
* **Global Mosaic**: 2D Canvas grid rendering 10k action tiles forming a blue whale shape with interactive contributor details.
* **Community Murmur**: Soundscape mixer blending synthesizer-generated wind, glacier crackles, and unlocked wetland frog sounds.
* **Carbon Quests (AR)**: Nearby geo-quests spawning a friendly AR Fox providing environmental insights.
* **Weight of Things (AR)**: Resource overlays visualizing the cleared forests and water drains behind burgers, plastics, and jeans.
* **Carbon Haiku**: AI-generated 5-7-5 syllable weekly poetry based on user footprint logs.

### 3.2 Daily Logging Streak & Grace Days
A split-responsibility gamification engine ensuring habit loops are maintained without user anxiety:
1. **Decay Check (Daily Load)**: Triggered once per session on page load (`POST /api/v1/gamification/streak`). Evaluates if `daysSinceLastLog >= 2`. If yes, it consumes a weekly Grace Day or resets the streak to 0. It *never* increments on page loads to prevent page-refresh vulnerabilities.
2. **Increment Check (Logging)**: Handles streak progression when logging a carbon-saving activity. Integrates identical consecutive-day calculators on the client-side (`useLogs.ts` hook) and the server-side transaction (`POST /api/v1/public/logs`). Increments the streak if `daysSinceLastLog === 1` or if a Grace Day saved it, while resetting the Grace coupon on Sundays.

### 3.3 Strict Onboarding Redirection Flow
Guards the layout of protected pages (`(app)/*`) to ensure complete user profiles:
* **Zero-Flash Layout Guard**: If a user signs up (Google OAuth or Email) but has not completed the onboarding wizard, they are redirected to `/onboarding`. Stale profile states are protected to prevent the dashboard from rendering before the redirect triggers.

### 3.4 Community Commenting & Likes
* Interactive comments feed on the Community Hive page. Clicking a post expands its replies section, triggering a real-time fetch to display conversations. Synchronized so that replies are shared and updated between friends instantly.

---

## 4. Google Services & Web APIs Integration

EarthPrint integrates Google Cloud ecosystem services and browser Web APIs to create a high-fidelity experience:

| Integration | Technology Used | Description |
|---|---|---|
| **Firebase Auth** | Client SDK & Admin SDK | Social Google OAuth & Email/Password session management. |
| **Firestore** | Real-time SDK & Security Rules | Live database updates for leaderboards, community feeds, and transactions. |
| **FCM** | Cloud Messaging | Push notifications for streak reminders and weekly summaries. |
| **Vertex AI / Gemini** | Groq & LLama-3.3 fallback | Poetic haiku generation and reflective journal analysis. |
| **Maps Platform** | Google Routes & Places API | Calculated transit emissions and local eco-service map markers. |
| **Cloud Vision AI** | Vision API OCR | Automatically reads utility bills to extract electricity/gas usage. |
| **Web Vibration** | `navigator.vibrate` | Sensory haptic engine for the biome heartbeat pulse. |
| **Media Devices** | `getUserMedia` | Handles camera overlays for the Planetary Mirror, Quests, and Time Capsule. |
| **Web Audio** | `AudioContext` & Oscillators | Real-time ambient synthesizer for the Community Murmur mixer. |

---

## 5. Data Sources & Methodology

All emission calculations are performed in **kg of CO₂-equivalent (kg CO₂e)** and compiled in `@earthprint/emission-engine`.

* **Transport**: distance × mode factor, utilizing **EPA GHG Hub** and **DEFRA** datasets (with a 1.9x Radiative Forcing multiplier for flights).
* **Food**: Poore & Nemecek (2018 Science) lifecycle food factors per gram.
* **Energy**: kWh × location grid intensity sourced from **Electricity Maps API** or **IEA**.
* **Shopping**: Spend × **DEFRA** spend-based category multipliers.

---

## 6. Tech Stack

* **Frontend**: Next.js 14 (App Router), React 18, TypeScript (Strict).
* **Styling**: Vanilla CSS, Tailwind CSS.
* **Database**: Firebase Firestore, LocalStorage caching.
* **Testing**: Jest, React Testing Library.
* **CI/CD**: GitHub Actions.
* **Monitoring**: Sentry.

---

## 7. Getting Started & Setup

### Prerequisites
* Node.js 20+
* npm 10+

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Kubojah-Dan/Carbon-Footprint-Awareness-Platform.git
   cd Carbon-Footprint-Awareness-Platform
   ```

2. Install workspace dependencies:
   ```bash
   npm install
   ```

3. Setup environment variables:
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   # Fill in values inside apps/web/.env.local (see Environment Variables below)
   ```

4. Build packages and compile TypeScript:
   ```bash
   npm run build --workspace=@earthprint/web
   ```

5. Run the local development server:
   ```bash
   npm run dev --workspace=@earthprint/web
   ```

---

## 8. Environment Variables

Create `apps/web/.env.local` with the following variables:

```bash
# Firebase Client SDK Credentials
NEXT_PUBLIC_FIREBASE_API_KEY=your_client_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK Credentials (Server-Side)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_admin_client_email
FIREBASE_ADMIN_PRIVATE_KEY=your_private_key

# Groq AI Service Key (For Haiku and Gratitude Journal reflections)
GROQ_API_KEY=your_groq_api_key

# Google Maps Platform Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key
```

---

## 9. Roadmap Status

### Phase 1 — Foundation: Measure & Understand
- [x] Firebase Authentication (email + Google OAuth)
- [x] Multi-step onboarding questionnaire
- [x] Baseline emission estimate from questionnaire
- [x] Home dashboard with category breakdown
- [x] Manual log entry for all 4 categories
- [x] Basic AI tips via Vertex AI / Gemini

### Phase 2 — Intelligence: Automate & Personalize
- [x] Advanced AI personalization engine with feedback loop
- [x] Streak system with grace days & Sunday resets
- [x] Green Points economy
- [x] Weekly challenges
- [x] FCM push notifications
- [x] Haptic Heartbeat & Starfield Silence Hour (Sensory Hub)

### Phase 3 — Action: Marketplace & Community
- [x] User public profiles + friend system
- [x] Community feed with action posts, comments, & likes
- [x] Friend + neighborhood leaderboards
- [x] Team challenges
- [x] Action marketplace with Green Points redemption
- [x] AR barcode scanner & Weight of Things AR
- [x] Global impact counter (Firestore aggregation)
- [x] Carbon Quests & Seed Packet Corridor Map (Tangible Hub)

---

## 10. Assumptions Made

1. **Radiative Forcing for Flights**: A multiplier of 1.9x is applied to flight CO₂ emissions to account for non-CO₂ warming effects at altitude.
2. **Second-Hand Goods**: Second-hand purchases are assumed to have 0 production emissions.
3. **Grace Day Reset**: The weekly grace day resets every Sunday at 00:00:00 local time.

---


