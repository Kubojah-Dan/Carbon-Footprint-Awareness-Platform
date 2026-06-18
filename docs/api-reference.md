# EarthPrint API Reference

This document maps the REST endpoints, schemas, request payloads, and response signatures implemented in EarthPrint under `/api/v1/`.

---

## 1. Gamification Endpoints

### 1.1 `POST /api/v1/gamification/streak`
* **Description:** Evaluates active user logging streaks and recalculates Terra Score. Usually triggered once on session load.
* **Payload Validation Schema (Zod):**
  ```typescript
  const streakSchema = z.object({
    uid: z.string().optional(),
    all: z.boolean().optional(),
  }).refine((data) => data.uid || data.all === true, {
    message: 'Provide uid or { all: true } in the request body',
  });
  ```
* **Headers:** `Content-Type: application/json`
* **Request Examples:**
  * Single user update:
    ```json
    { "uid": "user_12345" }
    ```
  * Batch update (Admin only):
    ```json
    { "all": true }
    ```
* **Response Example (HTTP 200):**
  ```json
  {
    "success": true,
    "message": "Streak evaluated. Current streak: 5 days. Terra Score: 85.",
    "updatedProfile": {
      "streakDays": 5,
      "graceUsedThisWeek": false,
      "terraScore": 85,
      "updatedAt": "2026-06-18T09:00:00.000Z"
    }
  }
  ```

---

## 2. Notification Endpoints

### 2.1 `POST /api/v1/users/fcm-token`
* **Description:** Registers the client Firebase Cloud Messaging token.
* **Payload Validation Schema (Zod):**
  ```typescript
  const fcmTokenSchema = z.object({
    uid: z.string().min(1, 'uid is required'),
    fcmToken: z.string().min(1, 'fcmToken is required'),
  });
  ```
* **Response Example (HTTP 200):**
  ```json
  {
    "success": true,
    "message": "FCM token registered successfully."
  }
  ```

---

## 3. AI Service Endpoints

### 3.1 `POST /api/v1/ai/haiku`
* **Description:** Queries the Groq API to compile a weekly biophilic Carbon Haiku based on recent carbon savings.
* **Rate Limits:** `20 requests / hour` (IP / User bound)
* **Payload Validation Schema (Zod):**
  ```typescript
  const haikuSchema = z.object({
    uid: z.string().min(1, 'uid is required'),
  });
  ```
* **Response Example (HTTP 200):**
  ```json
  {
    "success": true,
    "haiku": "Soft wind through the grass / Steps upon the mountain path / Earth breathes and resets"
  }
  ```

### 3.2 `POST /api/v1/ai/journal`
* **Description:** Generates a wise, supportive biophilic feedback message based on the user's gratitude journal entry.
* **Rate Limits:** `30 requests / hour`
* **Payload Validation Schema (Zod):**
  ```typescript
  const journalSchema = z.object({
    entryText: z.string().min(1, 'entryText is required'),
  });
  ```
* **Response Example (HTTP 200):**
  ```json
  {
    "success": true,
    "reflection": "Thank you for pausing to appreciate the soil and skies. When you care for the Earth, the Earth feels your heartbeat."
  }
  ```

---

## 4. HTTP Status Codes Mapping

* `200 OK`: Successful data operations.
* `400 Bad Request`: Payload validation failures (Zod parsing mismatch).
* `404 Not Found`: User profile document missing in Firestore.
* `429 Too Many Requests`: Rate limit threshold exceeded.
* `500 Internal Server Error`: Backend library, external API timeouts, or Firestore transaction failure.
