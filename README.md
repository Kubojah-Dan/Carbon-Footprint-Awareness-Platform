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

EarthPrint is structured as a **Turborepo monorepo** using npm workspaces. This architecture enforces separation of concerns and facilitates code sharing between the frontend web app, the React Native mobile app, Google Cloud Functions, and shared packages.

### Repository Layout

```
Carbon-Footprint-Awareness-Platform/
├── apps/
│   ├── web/                # Next.js 14 Web Application (App Router)
│   │   ├── app/            # App routes (dashboard, logging, awareness)
│   │   ├── components/     # Custom UI and glassmorphic layouts
│   │   ├── hooks/          # React hooks (useLogs, useAIRecommendations)
│   │   └── providers/      # Context providers (AuthProvider)
│   └── mobile/             # React Native / Expo Mobile Application
│       ├── src/app/        # App navigation routes (index, explore)
│       └── src/components/ # Mobile UI components and layouts
├── packages/
│   ├── emission-engine/    # Shared package: Carbon calculation math & formulas
│   ├── ui/                 # Shared package: Reusable design components
│   └── types/              # Shared package: Global TypeScript definitions
├── functions/              # Firebase / Google Cloud Functions (TypeScript)
│   └── src/                # BigQuery sync, streak decay checks, weekly tips
├── data/                   # Emission factor JSON databases + seed configurations
├── firestore/              # Firestore database rules, indexes, and schemas
└── docs/                   # Platform architecture, setup, and methodology guides
```

---

## 3. Implemented Features & Engineering Highlights

For evaluators reviewing this repository, the following core features are fully implemented, typed, compiled, and tested:

### 3.1 Earth Awareness Hub (`/awareness`)
An immersive tabbed sanctuary introducing exactly **15 sensory, mindful, collective art, and AR awareness features**:
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
* **Carbon Shadows**: Simulated ephemeral public light art installation projecting aggregated community care indices (energy savings, bicycle commutes, and reforestation funding) onto building facades using HTML5 Canvas.
* **Human Library of Change**: Unscripted video/text exchanges from peers who successfully shifted a habit, highlighting the human journey, struggle, and joy.
* **Seed Packet Exchange**: Milestone reward system enabling users to claim wildflower seed packets in the mail and geolocate planting coordinates to construct virtual pollinator corridors.

### 3.2 Daily Logging Streak & Grace Days
A split-responsibility gamification engine ensuring habit loops are maintained without user anxiety:
1. **Decay Check (Daily Load)**: Triggered once per session on page load (`POST /api/v1/gamification/streak`). Evaluates if `daysSinceLastLog >= 2`. If yes, it consumes a weekly Grace Day or resets the streak to 0. It *never* increments on page loads to prevent page-refresh vulnerabilities.
2. **Increment Check (Logging)**: Handles streak progression when logging a carbon-saving activity. Integrates identical consecutive-day calculators on the client-side (`useLogs.ts` hook) and the server-side transaction (`POST /api/v1/public/logs`). Increments the streak if `daysSinceLastLog === 1` or if a Grace Day saved it, while resetting the Grace coupon on Sundays.

### 3.3 Strict Onboarding Redirection Flow
Guards the layout of protected pages (`(app)/*`) to ensure complete user profiles:
* **Zero-Flash Layout Guard**: If a user signs up (Google OAuth or Email) but has not completed the onboarding wizard, they are redirected to `/onboarding`. Stale profile states are protected to prevent the dashboard from rendering before the redirect triggers.

### 3.4 Community Commenting & Likes
* Interactive comments feed on the Community Hive page. Clicking a post expands its replies section, triggering a real-time fetch to display conversations. Synchronized so that replies are shared and updated between friends instantly.

### 3.5 Premium Sage Glassmorphic Interface
* **Sidebar to Top Navigation**: Sidebar navigation has been converted into a premium top navigation bar (`Navbar.tsx`) and mobile bottom navigation (`MobileNav.tsx`) with a glassmorphic Sage design theme (`#E6EEC9/85` background with `backdrop-blur-xl`).
* **Text Legibility**: White logo text uses text-shadow filters to ensure readability on the light sage background.
* **Mobile View Chatbot**: Repositioned the chatbot assistant layout in mobile views so that it sits above the bottom navigation bar and does not cover clickable page content.

### 3.6 API Robustness
* **Pruned Document Payloads**: Standardized Firestore transaction endpoints (posts, comment creations, marketplace redemptions) to prune `undefined` values via conditional spreads. This prevents Firebase Admin SDK validation errors and ensures reliable operations.

---

## 4. Google Services & Web APIs Integration

EarthPrint integrates Google Cloud ecosystem services and browser Web APIs to create a high-fidelity experience:

| Integration | Technology Used | Description |
|---|---|---|
| **Firebase Auth** | Client SDK & Admin SDK | Social Google OAuth & Email/Password session management. |
| **Firestore** | Real-time SDK & Security Rules | Live database updates for leaderboards, community feeds, and transactions. |
| **FCM** | Cloud Messaging | Push notifications for streak reminders and weekly summaries. |
| **Vertex AI / Gemini** | Gemini API (`gemini-1.5-flash`) | Context-aware carbon recommendations, monthly coach advice, and utility bill document analysis. |
| **Groq AI** | Groq API (`llama3-8b`) | Real-time biophilic reflections for the gratitude journal, weekly haikus, and chat assistant. |
| **Maps Platform** | Google Routes & Places API | Calculated transit emissions and local eco-service map markers. |
| **Cloud Vision AI** | Vision API OCR | Automatically reads utility bills to extract electricity/gas usage. |
| **Web Vibration** | `navigator.vibrate` | Sensory haptic engine for the biome heartbeat pulse. |
| **Media Devices** | `getUserMedia` | Handles camera overlays for the Planetary Mirror, Quests, and Time Capsule. |
| **Web Audio** | `AudioContext` & Oscillators | Real-time ambient synthesizer for the Community Murmur soundscape mixer. |

---

## 5. Data Sources & Methodology

All emission calculations are performed in **kg of CO₂-equivalent (kg CO₂e)** and compiled in `@earthprint/emission-engine`.

* **Transport**: distance × mode factor, utilizing **EPA GHG Hub** and **DEFRA** datasets (with a 1.9x Radiative Forcing multiplier for flights).
* **Food**: Poore & Nemecek (2018 Science) lifecycle food factors per gram.
* **Energy**: kWh × location grid intensity sourced from **Electricity Maps API** or **IEA**.
* **Shopping**: Spend × **DEFRA** spend-based category multipliers.

---

## 6. Tech Stack

* **Frontend (Web)**: Next.js 14 (App Router), React 18, TypeScript (Strict).
* **Frontend (Mobile)**: React Native, Expo Router.
* **Backend Functions**: Firebase / Google Cloud Functions (Node.js 20).
* **Styling**: Vanilla CSS, Tailwind CSS.
* **Database & Auth**: Firebase Firestore, Firebase Authentication, LocalStorage caching.
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
   > **Note for Windows developers**: Turborepo builds strip path variables by default. Please run builds with `--env-mode=loose` to ensure correct TypeScript resolution:
   ```bash
   npx turbo run build --env-mode=loose
   ```

5. Run the local development server:
   ```bash
   npx turbo run dev
   ```

6. Run the test suite:
   ```bash
   npx turbo run test --env-mode=loose
   ```

7. Run code linting:
   ```bash
   npx turbo run lint --env-mode=loose
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
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key

# Firebase Admin SDK Credentials (Server-Side)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_admin_client_email
FIREBASE_ADMIN_PRIVATE_KEY=your_private_key

# AI Service Keys
GEMINI_API_KEY=your_gemini_api_key_here
VERTEX_AI_MODEL=gemini-1.5-flash
VERTEX_AI_LOCATION=us-central1
GOOGLE_CLOUD_PROJECT_ID=your_google_cloud_project_id
GOOGLE_CLOUD_LOCATION=us-central1
GROQ_API_KEY=your_groq_api_key_here

# Third-Party Integrations
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key
ELECTRICITY_MAPS_API_KEY=your_electricity_maps_key
ELECTRICITY_MAPS_API_URL=https://api.electricitymap.org/v3
OPEN_FOOD_FACTS_API_URL=https://world.openfoodfacts.org
BARCODE_LOOKUP_API_KEY=your_barcode_lookup_key_here

# App settings & Secrets
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=EarthPrint
NODE_ENV=development
API_KEY_SECRET=your_api_key_secret_here
API_RATE_LIMIT_PER_HOUR=100

# Sentry
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SENTRY_AUTH_TOKEN=your_sentry_auth_token_here
SENTRY_ORG=your_sentry_org_here
SENTRY_PROJECT=your_sentry_project_here
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

## 11. Deployment to Render

EarthPrint is optimized for seamless deployment to **Render** using a Web Service setup defined in [render.yaml](file:///d:/EarthPrint/Carbon-Footprint-Awareness-Platform/render.yaml).

### Web App Deployment Steps

1. **Connect Repository**: Sign in to Render, click **New +**, and select **Web Service**. Connect your GitHub repository.
2. **Configure Settings**:
   - **Environment**: `Node`
   - **Build Command**: `npm install --include=dev && npx turbo run build --filter=@earthprint/web...`
   - **Start Command**: `npm run start --workspace=@earthprint/web`
3. **Environment Variables**: Add all environment variables listed in Section 8 (particularly Firebase tokens and Gemini/Groq keys). Ensure `NODE_VERSION` is set to `20.20.2`.
4. **Deploy**: Click **Deploy Web Service**. Render will resolve dependencies, build the workspace packages via Turborepo, compile Next.js in production mode, and serve the application live.

---

## 12. License

This project is licensed under the terms of the MIT License. See [LICENSE](file:///d:/EarthPrint/Carbon-Footprint-Awareness-Platform/LICENSE) for more details.

Copyright (c) 2026 Kuboja Mabuba.
