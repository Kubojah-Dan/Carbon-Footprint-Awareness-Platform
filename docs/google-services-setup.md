# Google Services Setup Guide — EarthPrint

This guide outlines the steps required to set up the Firebase project, Google Cloud Platform (GCP) resources, and Gemini API keys for **EarthPrint**.

---

## 1. Firebase Project Setup

### Step 1.1: Create Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and name it `EarthPrint`.
3. Enable Google Analytics for the project (recommended).
4. Click **Create project** and wait for provisioning.

### Step 1.2: Register Web App
1. On the project overview page, click the **Web icon (`</>`)** to register an app.
2. Enter the app nickname: `EarthPrint Web`.
3. Click **Register app**.
4. Copy the `firebaseConfig` object values. You will paste these into `apps/web/.env.local`:
   - `apiKey` → `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `authDomain` → `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `storageBucket` → `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `measurementId` → `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

### Step 1.3: Enable Firebase Services
- **Authentication**: Enable the **Email/Password** and **Google** sign-in providers in the Firebase Console under **Build → Authentication → Sign-in method**.
- **Cloud Firestore**: Click **Create database**, select a region close to your users, and start in **production mode**. The security rules are configured in `firestore/firestore.rules` and can be deployed via Firebase CLI.
- **Cloud Messaging**: Under **Project settings → Cloud Messaging**, generate a new **Web Push certificate** key pair and copy the VAPID key to `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.

---

## 2. Google Cloud Platform & Vertex AI Setup

### Step 2.1: Enable APIs
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your Firebase project from the dropdown.
3. Navigate to **APIs & Services → Library**.
4. Search for and **Enable** the following APIs:
   - **Vertex AI API**
   - **Cloud Vision API** (required for barcode scanner in Phase 3)
   - **BigQuery API** (required for carbon analytics in Phase 4)

### Step 2.2: Set Up Service Account for Admin access
1. Navigate to **IAM & Admin → Service Accounts**.
2. Click **Create Service Account**.
3. Name it `earthprint-backend` and click **Create and Continue**.
4. Assign the following roles (for Phase 1 and future phases):
   - `Firebase Admin` or `Editor`
   - `Vertex AI User`
   - `BigQuery Data Editor` (for Phase 4)
5. Click **Done**.
6. Select the newly created service account, navigate to the **Keys** tab, click **Add Key → Create New Key**, and choose **JSON**.
7. Securely save this JSON file on your machine.
8. In local development, copy the service account fields into `apps/web/.env.local`:
   - `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
   - `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY`

---

## 3. Gemini API Key (Phase 1 AI Tips)

As a lightweight alternative to full Vertex AI service credentials during local testing, EarthPrint supports the developer-focused Gemini API key:
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Click **Get API key**.
3. Click **Create API key** (select your GCP project or a new one).
4. Copy the API key.
5. Set `GEMINI_API_KEY` in `apps/web/.env.local` to this key.
