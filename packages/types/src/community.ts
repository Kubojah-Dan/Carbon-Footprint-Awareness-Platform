// Community & Social Types (Phase 3)

/** A public community post linked to a verified eco-action log */
export interface CommunityPost {
  id: string;
  uid: string;
  authorName: string;
  authorPhotoURL: string | null;
  authorCity?: string;
  content: string;            // Max 280 chars
  logEntryId?: string;        // If post is linked to a verified log entry
  kgCo2eSaved?: number;       // Pulled from linked log entry for the CO₂ badge
  category?: string;          // Emission category of linked log
  postedAt: string;           // ISO datetime
  likeCount: number;
  commentCount: number;
  userHasLiked?: boolean;     // Populated client-side per user
}

/** A comment on a community post */
export interface PostComment {
  id: string;
  postId: string;
  uid: string;
  authorName: string;
  authorPhotoURL: string | null;
  content: string;           // Max 280 chars
  postedAt: string;
}

/** A leaderboard entry — used for friend, neighborhood, and org leaderboards */
export interface LeaderboardEntry {
  rank: number;
  uid: string;
  displayName: string;
  photoURL: string | null;
  city?: string;
  kgCo2eSavedThisMonth: number;
  points: number;
  streakDays: number;
  badges: string[];           // Badge IDs (first 3 for display)
  isCurrentUser?: boolean;
}

/** A team for team challenges (Phase 3) */
export interface Team {
  id: string;
  name: string;
  creatorUid: string;
  memberUids: string[];
  totalKgCo2eSaved: number;
  activeChallengeId?: string;
  createdAt: string;
  inviteCode: string;
}

/** Friend request / friendship record */
export interface FriendRequest {
  id: string;
  fromUid: string;
  toUid: string;
  status: 'pending' | 'accepted' | 'declined';
  sentAt: string;
  respondedAt?: string;
}

/** Global impact aggregate (Firestore aggregated counter) */
export interface GlobalImpact {
  totalKgCo2eSaved: number;
  totalUsers: number;
  totalLogEntries: number;
  lastUpdatedAt: string;
}
