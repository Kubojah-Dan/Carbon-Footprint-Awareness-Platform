# EarthPrint Firestore Database Schema

This document details the database models, collections, subcollections, and types used in EarthPrint's Cloud Firestore setup.

---

## 1. Collections Hierarchy

```
/users/{uid}                    [User Profile Documents]
  ├── /logs/{logId}             [User Footprint Activity Entries]
  ├── /badges/{badgeId}         [User Earned Badges (Read-Only on client)]
  ├── /challenges/{challengeId} [User Enrolled/Completed Challenges]
  └── /recommendations/{recId}  [AI personalized tips (cached)]

/challenges/{challengeId}       [Global Challenge Templates (Admin Seeded)]
/marketplace-actions/{actionId} [Global Eco Marketplace Actions (Redeemable)]
/aggregated-impact/global       [Global Aggregations - totals, user counts]
```

---

## 2. Document Models Schema

### 2.1 `/users/{uid}`
* **Description:** Represents a user's account settings, points balance, streak metrics, and current ecosystem health.
* **Fields:**
  | Field Name | Type | Description |
  | :--- | :--- | :--- |
  | `uid` | `string` | Unique identifier (matches Firebase Auth UID) |
  | `email` | `string` | User email address |
  | `displayName` | `string` | User display name |
  | `onboardingCompleted` | `boolean` | True if user finished onboarding questionnaire |
  | `monthlyTargetKgCo2e` | `number` | User monthly carbon target limit (defaults to 200) |
  | `points` | `number` | Total Green Points balance (used in marketplace) |
  | `streakDays` | `number` | Daily activity logging streak |
  | `graceUsedThisWeek` | `boolean` | True if weekly streak Grace Day has been consumed |
  | `terraScore` | `number` | Overall ecosystem health index (0 to 100) |
  | `activeBiome` | `string` | Biome type: `temperate-forest` \| `coral-reef` \| `alpine-meadow` |
  | `notificationsEnabled`| `boolean` | Push notification permissions indicator |
  | `fcmToken` | `string` | FCM Registration token for push notifications |
  | `lastLogDate` | `string` | ISO Date String (`YYYY-MM-DD`) of the last logged activity |
  | `createdAt` | `string` | ISO Timestamp |
  | `updatedAt` | `string` | ISO Timestamp |

### 2.2 `/users/{uid}/logs/{logId}`
* **Description:** Individual carbon-related lifestyle entries logged by the user.
* **Fields:**
  | Field Name | Type | Description |
  | :--- | :--- | :--- |
  | `id` | `string` | Log identifier |
  | `userId` | `string` | Owner UID |
  | `category` | `string` | `travel` \| `food` \| `energy` \| `shopping` |
  | `source` | `string` | Activity detail (e.g. `Petrol Car Commute`, `Beef Burger`) |
  | `kgCo2e` | `number` | Calculated footprint in kg CO₂e |
  | `activityDate` | `string` | Date of activity (`YYYY-MM-DD`) |
  | `loggedAt` | `string` | ISO Timestamp of document creation |

### 2.3 `/users/{uid}/badges/{badgeId}`
* **Description:** Gamified accomplishments awarded to the user (Server-side write only).
* **Fields:**
  | Field Name | Type | Description |
  | :--- | :--- | :--- |
  | `id` | `string` | Badge lookup ID (e.g. `first-log`, `streak-7`) |
  | `title` | `string` | User-friendly badge name |
  | `description` | `string` | Explanation of how the badge was unlocked |
  | `imageUrl` | `string` | URL to badge vector graphic asset |
  | `awardedAt` | `string` | ISO Timestamp |

---

## 3. Data Integration Constraints

1. **Transaction Atomicity:** Adding a logging document to `/logs` triggers a synchronized update in the parent `/users` doc to increment points, calculate the new logging streak, update `lastLogDate`, and recompute `terraScore`.
2. **Pruning Rules:** Any object payload containing optional fields must filter out `undefined` properties using conditional spreads before pushing to the Firestore SDK (preventing SDK validation errors).
