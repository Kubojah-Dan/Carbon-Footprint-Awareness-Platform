'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useLogs } from '@/hooks/useLogs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import type { CommunityPost, FriendRequest, UserProfile, LeaderboardEntry, LogEntry, PostComment } from '@earthprint/types';

export default function CommunityPage() {
  const { user, userProfile } = useAuth();
  const uid = user?.uid;

  // State for feed
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedLogId, setSelectedLogId] = useState<string>('');
  const [posting, setPosting] = useState(false);

  // State for comments
  const [expandedPostIds, setExpandedPostIds] = useState<Record<string, boolean>>({});
  const [postComments, setPostComments] = useState<Record<string, PostComment[]>>({});
  const [commentsLoading, setCommentsLoading] = useState<Record<string, boolean>>({});
  const [newCommentTexts, setNewCommentTexts] = useState<Record<string, string>>({});
  const [commentSubmitting, setCommentSubmitting] = useState<Record<string, boolean>>({});

  // State for friends
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<LeaderboardEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // State for leaderboards
  const [leaderboardType, setLeaderboardType] = useState<'global' | 'neighborhood' | 'friends'>('global');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  // Load user's recent logs to potentially link to a post
  const { logs } = useLogs(uid, 10);
  const linkableLogs = useMemo(() => {
    return logs.filter((log) => {
      // Allow linking logs from last 3 days
      const diffTime = Math.abs(new Date().getTime() - new Date(log.activityDate).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 3;
    });
  }, [logs]);

  // Fetch Feed
  const fetchFeed = useCallback(async () => {
    if (!uid) return;
    try {
      setPostsLoading(true);
      const res = await fetch(`/api/v1/posts?uid=${uid}`);
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setPostsLoading(false);
    }
  }, [uid]);

  // Fetch Friends
  const fetchFriends = useCallback(async () => {
    if (!uid) return;
    try {
      setFriendsLoading(true);
      const res = await fetch(`/api/v1/friends?uid=${uid}`);
      const data = await res.json();
      if (data.success) {
        setFriends(data.friends);
        setPendingRequests(data.pendingRequests);
      }
    } catch (err) {
      console.error('Failed to fetch friends:', err);
    } finally {
      setFriendsLoading(false);
    }
  }, [uid]);

  // Fetch Leaderboard
  const fetchLeaderboard = useCallback(async (type: 'global' | 'neighborhood' | 'friends') => {
    if (!uid) return;
    try {
      setLeaderboardLoading(true);
      const res = await fetch(`/api/v1/leaderboards?uid=${uid}&type=${type}`);
      const data = await res.json();
      if (data.success) {
        setLeaderboard(data.leaderboard);
        if (type === 'global') {
          // Keep a list of all users to allow friend searching
          setAllUsers(data.leaderboard);
        }
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLeaderboardLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    if (uid) {
      fetchFeed();
      fetchFriends();
      fetchLeaderboard(leaderboardType);
    }
  }, [uid, leaderboardType, fetchFeed, fetchFriends, fetchLeaderboard]);

  useEffect(() => {
    if (uid) {
      fetchLeaderboard(leaderboardType);
    }
  }, [leaderboardType, uid, fetchLeaderboard]);

  // Create Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !newPostContent.trim()) return;

    try {
      setPosting(true);
      const res = await fetch('/api/v1/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          content: newPostContent.trim(),
          logEntryId: selectedLogId || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewPostContent('');
        setSelectedLogId('');
        // Prepend new post
        setPosts((prev) => [data.post, ...prev]);
        
        // If linked log, update global impact metrics
        if (selectedLogId) {
          const linkedLog = logs.find((l) => l.id === selectedLogId);
          if (linkedLog) {
            fetch('/api/v1/impact/global', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                kgCo2eSaved: linkedLog.kgCo2e ? Number((linkedLog.kgCo2e * 0.25).toFixed(2)) : 5.0,
                isNewLog: false,
              }),
            }).catch((err) => console.error('Failed to update global impact metrics:', err));
          }
        }
      }
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setPosting(false);
    }
  };

  // Fetch Comments
  const fetchComments = async (postId: string) => {
    try {
      setCommentsLoading((prev) => ({ ...prev, [postId]: true }));
      const res = await fetch(`/api/v1/posts/comments?postId=${postId}`);
      const data = await res.json();
      if (data.success) {
        setPostComments((prev) => ({ ...prev, [postId]: data.comments }));
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setCommentsLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Toggle Comments view
  const toggleComments = (postId: string) => {
    const isExpanded = !expandedPostIds[postId];
    setExpandedPostIds((prev) => ({ ...prev, [postId]: isExpanded }));

    // Fetch comments on every expansion to see new replies from friends
    if (isExpanded) {
      fetchComments(postId);
    }
  };

  // Submit new comment
  const handleSubmitComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    const content = (newCommentTexts[postId] || '').trim();
    if (!uid || !content || commentSubmitting[postId]) return;

    try {
      setCommentSubmitting((prev) => ({ ...prev, [postId]: true }));
      const res = await fetch('/api/v1/posts/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, postId, content }),
      });
      const data = await res.json();
      if (data.success) {
        // Clear input field
        setNewCommentTexts((prev) => ({ ...prev, [postId]: '' }));
        // Append new comment
        setPostComments((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), data.comment],
        }));
        // Increment comment count locally on the post
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId ? { ...post, commentCount: post.commentCount + 1 } : post
          )
        );
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setCommentSubmitting((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Toggle Like
  const handleLikePost = async (postId: string) => {
    if (!uid) return;
    // Optimistic update
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const liked = !post.userHasLiked;
          return {
            ...post,
            userHasLiked: liked,
            likeCount: post.likeCount + (liked ? 1 : -1),
          };
        }
        return post;
      })
    );

    try {
      await fetch('/api/v1/posts/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, postId }),
      });
    } catch (err) {
      console.error('Failed to like post:', err);
      // Revert if error
      fetchFeed();
    }
  };

  // Friend Actions
  const handleFriendAction = async (action: 'request' | 'accept' | 'decline', targetUid?: string, requestId?: string) => {
    if (!uid) return;
    try {
      const res = await fetch('/api/v1/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUid: uid,
          toUid: targetUid,
          action,
          requestId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchFriends();
        fetchLeaderboard(leaderboardType);
      } else {
        alert(data.error || 'Action failed');
      }
    } catch (err) {
      console.error('Friend action failed:', err);
    }
  };

  // Filter users for search (excluding self, existing friends, and pending requests)
  const searchableUsers = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const friendUids = new Set(friends.map((f) => f.uid));
    const pendingUids = new Set([
      ...pendingRequests.map((r) => r.fromUid),
      ...pendingRequests.map((r) => r.toUid),
    ]);

    return allUsers.filter((u) => {
      if (u.uid === uid) return false;
      if (friendUids.has(u.uid)) return false;
      if (pendingUids.has(u.uid)) return false;
      
      const query = searchQuery.toLowerCase();
      return (
        u.displayName.toLowerCase().includes(query) ||
        (u.city && u.city.toLowerCase().includes(query))
      );
    });
  }, [allUsers, searchQuery, friends, pendingRequests, uid]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
      {/* ── FEED (Left/Main Columns) ────────────────────────────────────────── */}
      <div className="lg:col-span-2 space-y-6">
        {/* Create Post */}
        <Card id="create-post-card">
          <CardHeader>
            <CardTitle>Share Your Pulse</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="relative">
                <textarea
                  className="w-full min-h-[100px] bg-background-soft text-ink p-4 rounded-xl border border-border focus:ring-2 focus:ring-green-400 focus:outline-none resize-none"
                  placeholder="Share a tip, milestone, or log your carbon-saving activities..."
                  maxLength={280}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                />
                <div className="absolute bottom-3 right-3 text-xs text-ink-soft">
                  {newPostContent.length}/280
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-ink-soft">🔗 Verify Log:</span>
                  <select
                    className="bg-background-soft text-ink border border-border p-2 rounded-xl text-xs focus:ring-2 focus:ring-green-400 focus:outline-none"
                    value={selectedLogId}
                    onChange={(e) => setSelectedLogId(e.target.value)}
                  >
                    <option value="">No Log Linked</option>
                    {linkableLogs.map((log) => (
                      <option key={log.id} value={log.id}>
                        {log.category.toUpperCase()} Log — {log.kgCo2e.toFixed(1)} kg CO₂e
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={posting || !newPostContent.trim()}
                >
                  {posting ? 'Sharing...' : 'Post to Feed'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Posts List */}
        <div className="space-y-4">
          <h2 className="text-xl font-display font-semibold text-ink">Recent Hive Activities</h2>
          
          {postsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="py-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16 mt-1" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-ink-soft">
                <p className="text-4xl mb-3">🍃</p>
                <p className="font-medium text-lg">No posts yet</p>
                <p className="text-sm mt-1">Be the first to share an action in the Community Hive!</p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="relative hover:shadow-md transition-shadow">
                <CardContent className="py-5">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-green flex items-center justify-center text-white text-lg font-bold shadow-sm">
                        {post.authorPhotoURL ? (
                          <img src={post.authorPhotoURL} alt={post.authorName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          post.authorName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-ink text-sm sm:text-base">{post.authorName}</h3>
                        <p className="text-xs text-ink-soft">
                          {post.authorCity ? `📍 ${post.authorCity} • ` : ''}
                          {new Date(post.postedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    {/* Linked Action Badge */}
                    {post.logEntryId && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-green text-emerald-800 text-xs font-mono font-bold">
                        <span>✅ Verified Action</span>
                        {post.kgCo2eSaved && (
                          <span className="bg-emerald-800 text-white px-1.5 py-0.5 rounded-full text-[10px]">
                            -{post.kgCo2eSaved} kg
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <p className="text-ink leading-relaxed text-sm sm:text-base break-words">
                    {post.content}
                  </p>

                  {/* Footer Interaction */}
                  <div className="flex items-center gap-6 mt-4 pt-3 border-t border-border">
                    <button
                      onClick={() => handleLikePost(post.id)}
                      className={`flex items-center gap-2 text-sm transition-colors ${
                        post.userHasLiked
                          ? 'text-rose-500 font-bold'
                          : 'text-ink-soft hover:text-rose-500'
                      }`}
                    >
                      <span>{post.userHasLiked ? '❤️' : '🤍'}</span>
                      <span>{post.likeCount}</span>
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className={`flex items-center gap-2 text-sm transition-colors ${
                        expandedPostIds[post.id]
                          ? 'text-green-600 font-bold'
                          : 'text-ink-soft hover:text-green-500'
                      }`}
                    >
                      <span>💬</span>
                      <span>{post.commentCount}</span>
                    </button>
                  </div>

                  {/* Expanded Comments Section */}
                  {expandedPostIds[post.id] && (
                    <div className="mt-4 pt-4 border-t border-border space-y-4 animate-slide-down">
                      <h4 className="text-xs font-bold text-ink-soft uppercase tracking-wider">Comments</h4>

                      {/* Comments List */}
                      <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                        {commentsLoading[post.id] ? (
                          <div className="space-y-2 py-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                          </div>
                        ) : !postComments[post.id] || postComments[post.id]!.length === 0 ? (
                          <p className="text-xs text-ink-soft italic py-2">No comments yet. Be the first to reply!</p>
                        ) : (
                          postComments[post.id]!.map((comment) => (
                            <div key={comment.id} className="flex items-start gap-2.5 bg-background-soft/40 p-2.5 rounded-xl border border-border/10 text-xs">
                              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-[10px] shrink-0 shadow-sm">
                                {comment.authorPhotoURL ? (
                                  <img src={comment.authorPhotoURL} alt={comment.authorName} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  comment.authorName.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-ink">{comment.authorName}</span>
                                  <span className="text-[10px] text-ink-soft">
                                    {new Date(comment.postedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-ink break-words leading-relaxed">{comment.content}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Comment Form */}
                      <form
                        onSubmit={(e) => handleSubmitComment(e, post.id)}
                        className="flex gap-2 items-center mt-2"
                      >
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          maxLength={280}
                          value={newCommentTexts[post.id] || ''}
                          onChange={(e) =>
                            setNewCommentTexts((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          disabled={commentSubmitting[post.id]}
                          className="flex-1 bg-background-soft text-ink p-2.5 rounded-xl border border-border text-xs focus:ring-2 focus:ring-green-400 focus:outline-none"
                        />
                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          disabled={commentSubmitting[post.id] || !(newCommentTexts[post.id] || '').trim()}
                        >
                          {commentSubmitting[post.id] ? 'Posting...' : 'Reply'}
                        </Button>
                      </form>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* ── SIDEBAR WIDGETS (Right Column) ──────────────────────────────────── */}
      <div className="space-y-6">
        {/* Leaderboard Widget */}
        <Card id="leaderboard-card">
          <CardHeader className="flex flex-col gap-2.5 pb-2">
            <CardTitle>Leaderboard</CardTitle>
            <div className="flex rounded-xl bg-background-soft p-1 text-xs w-full justify-between">
              {(['global', 'neighborhood', 'friends'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setLeaderboardType(t)}
                  className={`flex-1 text-center px-2 py-1.5 rounded-lg font-medium transition-all ${
                    leaderboardType === t
                      ? 'bg-gradient-green text-white shadow-sm'
                      : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {leaderboardLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            ) : leaderboard.length === 0 ? (
              <p className="text-center text-sm text-ink-soft py-4">No rankings available yet.</p>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.uid}
                    className={`flex items-center justify-between p-2.5 rounded-xl transition-all ${
                      entry.isCurrentUser
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'hover:bg-background-soft'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank Indicator */}
                      <span className="w-5 text-center font-mono font-bold text-sm text-ink-soft">
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                      </span>
                      
                      {/* Photo / Initials */}
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-sm text-slate-600">
                        {entry.photoURL ? (
                          <img src={entry.photoURL} alt={entry.displayName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          entry.displayName.charAt(0).toUpperCase()
                        )}
                      </div>

                      {/* Info */}
                      <div>
                        <p className="font-semibold text-sm text-ink flex items-center gap-1">
                          {entry.displayName}
                          {entry.streakDays > 0 && (
                            <span className="text-xs" title={`${entry.streakDays} day streak`}>🔥{entry.streakDays}</span>
                          )}
                        </p>
                        <p className="text-[10px] text-ink-soft">📍 {entry.city || 'Unknown'}</p>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <p className="font-mono font-bold text-sm text-emerald-600">
                        -{entry.kgCo2eSavedThisMonth} kg
                      </p>
                      <p className="text-[10px] text-ink-soft">{entry.points} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Friends Widget */}
        <Card id="friends-card">
          <CardHeader>
            <CardTitle>Friends & Network</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar to find friends */}
            <div className="space-y-2">
              <Input
                placeholder="Search people to add..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchableUsers.length > 0 && (
                <div className="bg-background-soft border border-border rounded-xl p-2 max-h-[200px] overflow-y-auto space-y-2">
                  {searchableUsers.map((u) => (
                    <div key={u.uid} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-tint">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-300 flex items-center justify-center text-xs font-bold">
                          {u.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-ink">{u.displayName}</p>
                          <p className="text-[9px] text-ink-soft">📍 {u.city}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleFriendAction('request', u.uid)}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Incoming Requests */}
            {pendingRequests.length > 0 && (
              <div className="space-y-2 border-t border-border pt-3">
                <p className="text-xs font-bold text-ink-soft uppercase tracking-wider">Pending Requests</p>
                <div className="space-y-2">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                      <div className="text-xs">
                        <span className="font-semibold text-ink">User request received</span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleFriendAction('accept', undefined, req.id)}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleFriendAction('decline', undefined, req.id)}
                          className="px-2.5 py-1 bg-slate-300 text-ink rounded-lg text-xs font-semibold hover:bg-slate-400"
                        >
                          Ignore
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends list */}
            <div className="space-y-2 border-t border-border pt-3">
              <p className="text-xs font-bold text-ink-soft uppercase tracking-wider">Friend Connections</p>
              {friendsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : friends.length === 0 ? (
                <p className="text-xs text-ink-soft">No connections yet. Find people using the search bar above!</p>
              ) : (
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {friends.map((friend) => (
                    <div key={friend.uid} className="flex items-center justify-between p-2 rounded-xl bg-background-soft hover:bg-tint transition-all">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-600">
                          {friend.photoURL ? (
                            <img src={friend.photoURL} alt={friend.displayName || ''} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            (friend.displayName || 'A').charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-ink">{friend.displayName || 'Anonymous'}</p>
                          <p className="text-[10px] text-ink-soft">🔥 {friend.streakDays || 0} day streak</p>
                        </div>
                      </div>
                      <div className="text-xs font-mono font-semibold text-emerald-600">
                        {friend.terraScore || 0} HS
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
