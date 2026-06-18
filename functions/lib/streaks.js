"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDailyStreaksAndNotify = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = __importStar(require("firebase-admin"));
// Helper to calculate days between dates
function getDaysDiff(date1, date2) {
    const d1 = new Date(date1.substring(0, 10) + 'T00:00:00Z');
    const d2 = new Date(date2.substring(0, 10) + 'T00:00:00Z');
    return Math.floor(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}
/**
 * Scheduled Cloud Function (v2): Runs daily at 20:00 UTC.
 * Checks active streaks, sends push notifications to users at risk of losing their streak.
 */
exports.checkDailyStreaksAndNotify = (0, scheduler_1.onSchedule)({
    schedule: '0 20 * * *', // Every day at 20:00 UTC
    timeZone: 'UTC',
    memory: '512MiB',
    timeoutSeconds: 300,
}, async () => {
    const db = admin.firestore();
    const messaging = admin.messaging();
    const todayStr = new Date().toISOString().split('T')[0];
    try {
        // Query users with active streaks
        const usersSnap = await db
            .collection('users')
            .where('onboardingCompleted', '==', true)
            .get();
        console.log(`Evaluating daily streaks and notifications for ${usersSnap.size} users...`);
        for (const doc of usersSnap.docs) {
            const uid = doc.id;
            const profile = doc.data();
            const name = profile.displayName?.split(' ')[0] || 'Planet Nurturer';
            const token = profile.fcmToken;
            // Skip if no FCM token or notifications are disabled
            if (!token || !profile.notificationsEnabled) {
                continue;
            }
            const streak = profile.streakDays ?? 0;
            if (streak === 0)
                continue;
            if (profile.lastLogDate) {
                const daysSinceLastLog = getDaysDiff(todayStr, profile.lastLogDate);
                if (daysSinceLastLog === 1) {
                    // Logged yesterday, but not today yet! Send warning push notification
                    try {
                        await messaging.send({
                            token,
                            notification: {
                                title: '🌿 Keep Your Biome Thriving!',
                                body: `Hey ${name}, log an activity before midnight to save your ${streak}-day streak!`,
                            },
                            data: {
                                type: 'streak_warning',
                                streak: String(streak),
                            },
                        });
                        console.log(`Sent streak warning notification to user ${uid}`);
                    }
                    catch (notifyErr) {
                        console.error(`Failed to send notification to user ${uid}:`, notifyErr);
                    }
                }
                else if (daysSinceLastLog >= 2) {
                    // Expired. Check if we will apply grace day or if it reset.
                    const graceUsed = profile.graceUsedThisWeek ?? false;
                    if (!graceUsed) {
                        // Apply grace day and notify
                        try {
                            await messaging.send({
                                token,
                                notification: {
                                    title: '🛡️ Grace Day Applied!',
                                    body: `Hey ${name}, we applied a weekly Grace Day to protect your ${streak}-day streak! Log tomorrow to keep it alive.`,
                                },
                                data: {
                                    type: 'grace_applied',
                                    streak: String(streak),
                                },
                            });
                            console.log(`Sent grace day notification to user ${uid}`);
                        }
                        catch (notifyErr) {
                            console.error(`Failed to send notification to user ${uid}:`, notifyErr);
                        }
                    }
                    else {
                        // Reset and notify
                        try {
                            await messaging.send({
                                token,
                                notification: {
                                    title: '🍂 Ecosystem Reset',
                                    body: `Your logging streak has reset, but your biome is resilient, ${name}! Log an activity today to plant a new seed.`,
                                },
                                data: {
                                    type: 'streak_reset',
                                },
                            });
                            console.log(`Sent streak reset notification to user ${uid}`);
                        }
                        catch (notifyErr) {
                            console.error(`Failed to send notification to user ${uid}:`, notifyErr);
                        }
                    }
                }
            }
        }
    }
    catch (err) {
        console.error('Error in checkDailyStreaksAndNotify scheduler:', err);
    }
});
//# sourceMappingURL=streaks.js.map