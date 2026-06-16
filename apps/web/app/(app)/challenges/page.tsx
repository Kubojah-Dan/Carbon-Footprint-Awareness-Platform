'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useLogs } from '@/hooks/useLogs';
import Link from 'next/link';
import type { Challenge, Team } from '@earthprint/types';

export default function ChallengesPage() {
  const { user, userProfile, refreshProfile } = useAuth();
  const uid = user?.uid;

  // Challenges and teams states
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms states
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [joiningTeam, setJoiningTeam] = useState(false);
  const [creatingTeam, setCreatingTeam] = useState(false);

  // Joined challenges (mock client tracker for opt-ins)
  const [joinedChallengeIds, setJoinedChallengeIds] = useState<string[]>([]);
  const [completedChallengeIds, setCompletedChallengeIds] = useState<string[]>([]);

  // Fetch real user activity logs for progress tracking (last 30 days)
  const { logs } = useLogs(uid, 30);

  const fetchChallengesAndTeams = async () => {
    if (!uid) return;
    try {
      setLoading(true);
      
      const challengesRes = await fetch('/api/v1/challenges');
      const challengesData = await challengesRes.json();
      
      const teamsRes = await fetch(`/api/v1/teams?uid=${uid}`);
      const teamsData = await teamsRes.json();

      if (challengesData.success) {
        setChallenges(challengesData.challenges);
      }
      if (teamsData.success) {
        setTeams(teamsData.teams);
      }
    } catch (err) {
      console.error('Failed to load challenges data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (uid) {
      fetchChallengesAndTeams();
      
      // Load selections from localStorage
      const localJoined = localStorage.getItem(`joined_challenges_${uid}`);
      const localCompleted = localStorage.getItem(`completed_challenges_${uid}`);
      if (localJoined) setJoinedChallengeIds(JSON.parse(localJoined));
      if (localCompleted) setCompletedChallengeIds(JSON.parse(localCompleted));
    }
  }, [uid]);

  const handleJoinChallenge = (challengeId: string) => {
    if (!uid) return;
    const updated = [...joinedChallengeIds, challengeId];
    setJoinedChallengeIds(updated);
    localStorage.setItem(`joined_challenges_${uid}`, JSON.stringify(updated));
  };

  const handleClaimReward = async (challengeId: string, pointsReward: number) => {
    if (!uid) return;

    try {
      // 1. Award points in Firestore via API endpoint
      const res = await fetch('/api/v1/challenges/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          challengeId,
          pointsReward,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Failed to claim reward');
        return;
      }

      // 2. Mark as completed locally
      const updated = [...completedChallengeIds, challengeId];
      setCompletedChallengeIds(updated);
      localStorage.setItem(`completed_challenges_${uid}`, JSON.stringify(updated));

      // 3. Record carbon savings globally
      await fetch('/api/v1/impact/global', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kgCo2eSaved: 25.0,
        }),
      });

      // 4. Refresh auth context profile
      if (refreshProfile) {
        await refreshProfile();
      }

      alert(`Congratulations! You earned +${pointsReward} Bloom Points! 🌿`);
    } catch (err) {
      console.error('Failed to claim challenge reward:', err);
    }
  };

  // Helper to calculate progress of a challenge based on logs
  const getChallengeProgress = useCallback((challengeId: string): number => {
    if (!logs || logs.length === 0) return 0;
    
    switch (challengeId) {
      case 'challenge-001': { // Car-Free Week (target: 5 car-free days)
        const cleanCommutes = logs.filter(
          (l) => l.category === 'travel' && ['bus', 'train-local', 'tram', 'cycling', 'walking'].includes(l.data?.mode)
        );
        const distinctDays = new Set(cleanCommutes.map((l) => l.activityDate));
        return distinctDays.size;
      }
      case 'challenge-002': { // Plant-Based Week (target: 21 meals)
        const plantMeals = logs.filter(
          (l) => l.category === 'food' && ['vegetables', 'fruit', 'legumes', 'nuts', 'tofu', 'oat-milk', 'almond-milk'].includes(l.data?.foodType)
        );
        return plantMeals.length;
      }
      case 'challenge-003': { // Energy Audit Week (target: 7 energy logs)
        const energyLogs = logs.filter((l) => l.category === 'energy');
        const distinctDays = new Set(energyLogs.map((l) => l.activityDate));
        return distinctDays.size;
      }
      case 'challenge-004': { // No New Clothes (target: 30 days without clothes shopping)
        const newClothes = logs.filter(
          (l) => l.category === 'shopping' && ['clothing-fast-fashion', 'clothing-sustainable'].includes(l.data?.category)
        );
        return Math.max(0, 30 - newClothes.length);
      }
      case 'challenge-005': { // Meat-Free Mondays (target: 4 Mondays)
        const foodLogs = logs.filter((l) => l.category === 'food');
        const mondays = new Set<string>();
        foodLogs.forEach((l) => {
          const d = new Date(l.activityDate);
          if (d.getDay() === 1) mondays.add(l.activityDate);
        });
        const meatMondays = new Set<string>();
        foodLogs
          .filter((l) => ['beef', 'pork', 'chicken', 'fish-farmed', 'fish-wild'].includes(l.data?.foodType))
          .forEach((l) => {
            const d = new Date(l.activityDate);
            if (d.getDay() === 1) meatMondays.add(l.activityDate);
          });
        return Array.from(mondays).filter((m) => !meatMondays.has(m)).length;
      }
      case 'challenge-006': { // Walk to Work Week (target: 5 commutes)
        const commutes = logs.filter(
          (l) => l.category === 'travel' && ['walking', 'cycling'].includes(l.data?.mode)
        );
        return commutes.length;
      }
      case 'challenge-007': { // Cold Shower Week (target: 7 showers)
        const coldShowers = logs.filter(
          (l) => l.notes?.toLowerCase().includes('shower') || l.notes?.toLowerCase().includes('cold')
        );
        return coldShowers.length;
      }
      case 'challenge-008': { // Local Food Week (target: 14 logs)
        const localLogs = logs.filter(
          (l) => l.category === 'food' && (l.data?.isLocal === true || l.notes?.toLowerCase().includes('local'))
        );
        return localLogs.length;
      }
      case 'challenge-009': { // Second-Hand First (target: 3 purchases)
        const secondhand = logs.filter(
          (l) => l.category === 'shopping' && (l.data?.isSecondHand === true || l.data?.category === 'clothing-secondhand')
        );
        return secondhand.length;
      }
      case 'challenge-010': { // 100 kg CO2 Reduction (target: 100 kg)
        let saved = 0;
        logs.forEach((l) => {
          if (l.category === 'travel' && ['walking', 'cycling', 'bus', 'train-local', 'tram'].includes(l.data?.mode)) {
            saved += 5.0; // 5kg saved vs driving
          } else if (l.category === 'food' && ['vegetables', 'fruit', 'legumes', 'nuts', 'tofu', 'oat-milk', 'almond-milk'].includes(l.data?.foodType)) {
            saved += 1.5; // 1.5kg saved vs beef
          } else if (l.category === 'shopping' && (l.data?.isSecondHand === true || l.data?.category === 'clothing-secondhand')) {
            saved += 10.0; // 10kg saved vs new clothes
          }
        });
        return Math.min(100, Math.round(saved));
      }
      default:
        return 0;
    }
  }, [logs]);

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !inviteCode.trim()) return;

    try {
      setJoiningTeam(true);
      const res = await fetch('/api/v1/teams/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          inviteCode: inviteCode.trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setInviteCode('');
        alert(data.message || 'Joined team successfully!');
        fetchChallengesAndTeams();
      } else {
        alert(data.error || 'Failed to join team');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setJoiningTeam(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !newTeamName.trim()) return;

    try {
      setCreatingTeam(true);
      const res = await fetch('/api/v1/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorUid: uid,
          name: newTeamName.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewTeamName('');
        alert(`Team "${data.team.name}" created successfully! Invite Code: ${data.team.inviteCode}`);
        fetchChallengesAndTeams();
        
        if (refreshProfile) {
          await refreshProfile();
        }
      } else {
        alert(data.error || 'Failed to create team');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingTeam(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
      {/* ── Challenges Section (Left/Main Columns) ──────────────────────────── */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-gradient-green text-emerald-950 p-6 rounded-2xl shadow-glow">
          <h1 className="font-display text-3xl font-bold text-ink">Ecosystem Challenges</h1>
          <p className="text-emerald-950/80 mt-1 font-medium">
            Complete active weekly habits or collaborate with teammates to lower your collectively tracked carbon footprints.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-display font-semibold text-ink">Active Weekly Challenges</h2>

          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="py-6 space-y-3">
                  <div className="flex gap-4">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-4 w-full mt-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : challenges.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-ink-soft">
                <p className="text-4xl mb-2">🏆</p>
                <p className="font-semibold">No active challenges found.</p>
              </CardContent>
            </Card>
          ) : (
            challenges.map((challenge) => {
              const isJoined = joinedChallengeIds.includes(challenge.id);
              const isCompleted = completedChallengeIds.includes(challenge.id);
              const progress = getChallengeProgress(challenge.id);
              const progressMet = challenge.targetValue ? progress >= challenge.targetValue : false;

              return (
                <Card
                  key={challenge.id}
                  className={`transition-all ${
                    isCompleted ? 'border-emerald-300 bg-emerald-50/20' : isJoined ? 'border-sky-200' : ''
                  }`}
                >
                  <CardContent className="py-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex gap-4 items-start flex-1 min-w-0">
                        <div className="w-12 h-12 bg-background-soft rounded-xl flex items-center justify-center text-2xl shadow-sm flex-shrink-0">
                          {challenge.iconEmoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-ink leading-snug flex items-center gap-2">
                            {challenge.title}
                            <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full ${
                              challenge.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-800' :
                              challenge.difficulty === 'medium' ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {challenge.difficulty}
                            </span>
                          </h3>
                          <p className="text-sm text-ink-soft mt-1 leading-relaxed">{challenge.description}</p>
                          
                          {/* Progress bar */}
                          {isJoined && !isCompleted && challenge.targetValue && (
                            <div className="mt-3 w-full max-w-sm">
                              <div className="flex justify-between text-xs font-mono text-ink-soft mb-1">
                                <span>Progress</span>
                                <span>{Math.min(challenge.targetValue, progress)} / {challenge.targetValue} {challenge.targetUnit}</span>
                              </div>
                              <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                                  style={{ width: `${Math.min(100, (progress / challenge.targetValue) * 100)}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-ink-soft mt-3">
                            <span>🕒 {challenge.durationDays} Days</span>
                            <span>⚡ +{challenge.pointsReward} Green Points</span>
                            {challenge.targetValue && (
                              <span>🎯 Target: {challenge.targetValue} {challenge.targetUnit}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="sm:text-right flex sm:flex-col justify-end gap-2 shrink-0">
                        {isCompleted ? (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-100/50 border border-emerald-300 px-3 py-1.5 rounded-xl block text-center">
                            ✅ Completed
                          </span>
                        ) : isJoined ? (
                          <div className="space-y-2">
                            {progressMet ? (
                              <Button
                                variant="primary"
                                size="sm"
                                className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 animate-pulse"
                                onClick={() => handleClaimReward(challenge.id, challenge.pointsReward)}
                              >
                                Claim Reward ⚡
                              </Button>
                            ) : (
                              <>
                                <span className="text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-100 px-3 py-1.5 rounded-xl block text-center animate-pulse">
                                  🏃 In Progress
                                </span>
                                <Link href="/log/new">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-xs"
                                  >
                                    Log Activity
                                  </Button>
                                </Link>
                              </>
                            )}
                          </div>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleJoinChallenge(challenge.id)}
                          >
                            Opt In
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* ── Team Challenges Section (Right Column) ─────────────────────────── */}
      <div className="space-y-6">
        {/* User's Teams List */}
        <Card id="teams-list-card">
          <CardHeader>
            <CardTitle>My Teams</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : teams.length === 0 ? (
              <p className="text-sm text-ink-soft">
                You are not in any carbon saving teams yet. Create a team or join using an invite code below!
              </p>
            ) : (
              <div className="space-y-3">
                {teams.map((team) => (
                  <div key={team.id} className="p-3 bg-background-soft rounded-xl border border-border">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-ink text-sm sm:text-base">{team.name}</h4>
                      <code className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {team.inviteCode}
                      </code>
                    </div>
                    <div className="flex items-center justify-between text-xs text-ink-soft mt-2 pt-2 border-t border-border/50">
                      <span>👥 {team.memberUids?.length || 1} Members</span>
                      <span>🌱 {team.totalKgCo2eSaved || 0} kg saved</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Join Team Widget */}
        <Card id="join-team-card">
          <CardHeader>
            <CardTitle>Join a Team</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinTeam} className="flex gap-2">
              <Input
                placeholder="Enter Invite Code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                maxLength={6}
                required
              />
              <Button type="submit" variant="primary" disabled={joiningTeam || !inviteCode.trim()}>
                {joiningTeam ? '...' : 'Join'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Create Team Widget */}
        <Card id="create-team-card">
          <CardHeader>
            <CardTitle>Start a Team Challenge</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTeam} className="space-y-3">
              <Input
                placeholder="Team Name (e.g. Eco Neighbors)"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                required
              />
              <Button type="submit" variant="outline" className="w-full border-emerald-600 text-emerald-700 hover:bg-emerald-50" disabled={creatingTeam || !newTeamName.trim()}>
                {creatingTeam ? 'Creating...' : 'Create Team (+50 pts)'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
