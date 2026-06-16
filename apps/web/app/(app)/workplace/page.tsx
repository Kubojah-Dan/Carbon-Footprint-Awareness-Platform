'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';

interface Organization {
  id: string;
  name: string;
  creatorUid: string;
  inviteCode: string;
  memberUids: string[];
  createdAt: string;
  totalKgCo2eSaved: number;
}

interface DepartmentStat {
  department: string;
  membersCount: number;
  totalKgCo2eSaved: number;
  totalPoints: number;
}

interface MemberEntry {
  uid: string;
  displayName: string;
  photoURL: string | null;
  points: number;
  streakDays: number;
  orgRole: string;
  department: string;
  kgCo2eSavedThisMonth: number;
}

export default function WorkplacePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [org, setOrg] = useState<Organization | null>(null);
  const [deptStats, setDeptStats] = useState<DepartmentStat[]>([]);
  const [memberLeaderboard, setMemberLeaderboard] = useState<MemberEntry[]>([]);

  // Join Org Form States
  const [inviteCode, setInviteCode] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  // Create Org Form States
  const [newOrgName, setNewOrgName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Offsetting State
  const [offsetLoadingId, setOffsetLoadingId] = useState<string | null>(null);
  const [offsetSuccessMsg, setOffsetSuccessMsg] = useState('');

  async function fetchOrgData() {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/organizations?uid=${user.uid}`);
      const data = await res.json();
      if (data.success && data.joined) {
        setJoined(true);
        setOrg(data.organization);
        setDeptStats(data.departmentStats || []);
        setMemberLeaderboard(data.memberLeaderboard || []);
      } else {
        setJoined(false);
        setOrg(null);
      }
    } catch (err) {
      console.error('Error fetching org data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrgData();
  }, [user]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!inviteCode) {
      setJoinError('Please enter an invite code.');
      return;
    }
    try {
      setJoinLoading(true);
      setJoinError('');
      const res = await fetch('/api/v1/organizations/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          inviteCode: inviteCode.trim().toUpperCase(),
          department,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchOrgData();
      } else {
        setJoinError(data.error || 'Failed to join organization. Please verify your invite code.');
      }
    } catch (err) {
      setJoinError('An unexpected error occurred. Please try again.');
    } finally {
      setJoinLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!newOrgName) {
      setCreateError('Please enter an organization name.');
      return;
    }
    try {
      setCreateLoading(true);
      setCreateError('');
      const res = await fetch('/api/v1/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorUid: user.uid,
          name: newOrgName.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchOrgData();
      } else {
        setCreateError(data.error || 'Failed to create organization.');
      }
    } catch (err) {
      setCreateError('An unexpected error occurred. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleOffset(initiativeId: string, name: string) {
    setOffsetLoadingId(initiativeId);
    setOffsetSuccessMsg('');
    try {
      // Simulate offsetting sponsor logic
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setOffsetSuccessMsg(`Successfully sponsored carbon offsetting for "${name}" on behalf of your workplace!`);
      await fetchOrgData();
    } catch (err) {
      console.error(err);
    } finally {
      setOffsetLoadingId(null);
    }
  }

  function handleCopyCode() {
    if (org?.inviteCode) {
      navigator.clipboard.writeText(org.inviteCode);
      alert('Invite code copied to clipboard!');
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="text-center space-y-3 mb-10">
          <span className="text-5xl">🏢</span>
          <h1 className="font-display text-4xl text-ink font-bold">EarthPrint Workplace Edition</h1>
          <p className="text-ink-soft text-lg max-w-2xl mx-auto">
            Empower your team to track their footprints, compete across departments, and coordinate corporate sustainability and carbon offsetting initiatives together.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Join existing org */}
          <Card padding="lg" className="h-full border border-border flex flex-col justify-between">
            <CardHeader className="block mb-4">
              <div className="space-y-2 text-left">
                <CardTitle className="text-xl font-bold text-ink">Join Your Organization</CardTitle>
                <p className="text-sm text-ink-soft leading-relaxed">Enter the unique invite code provided by your organization administrator.</p>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoin} className="space-y-4">
                <Input
                  label="Invite Code"
                  placeholder="ORG-XXXXXX"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  isRequired
                />
                
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="dept-select" className="text-sm font-medium text-ink">
                    Select Your Department *
                  </label>
                  <select
                    id="dept-select"
                    className="w-full rounded-lg border bg-white px-3 py-2.5 font-body text-base text-ink focus:outline-none focus:ring-2 focus:ring-forest-action focus:border-forest-action border-border"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Sales">Sales</option>
                    <option value="Marketing">Marketing</option>
                    <option value="HR & Admin">HR & Admin</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                    <option value="Product & Design">Product & Design</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {joinError && <p className="text-sm text-earth-coral font-medium">⚠️ {joinError}</p>}
                
                <Button type="submit" variant="primary" fullWidth isLoading={joinLoading}>
                  Join Organization
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Create new org */}
          <Card padding="lg" className="h-full border border-border flex flex-col justify-between">
            <CardHeader className="block mb-4">
              <div className="space-y-2 text-left">
                <CardTitle className="text-xl font-bold text-ink">Register Your Organization</CardTitle>
                <p className="text-sm text-ink-soft leading-relaxed">Create a new corporate ecosystem. As the creator, you will be the organization administrator.</p>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <Input
                  label="Organization Name"
                  placeholder="e.g. Acme Corp"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  isRequired
                />

                {createError && <p className="text-sm text-earth-coral font-medium">⚠️ {createError}</p>}
                
                <Button type="submit" variant="secondary" fullWidth isLoading={createLoading}>
                  Register Organization
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Target sustainability goal calculation
  const targetSaved = 1000;
  const currentSaved = org?.totalKgCo2eSaved || 0;
  const progressPercent = Math.min(100, (currentSaved / targetSaved) * 100);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-3xl">🏢</span>
            <h1 className="font-display text-3xl font-bold text-ink">{org?.name}</h1>
          </div>
          <p className="text-ink-soft text-sm mt-1">
            Workplace Portal · Created {org?.createdAt ? new Date(org.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-pale-green/60 px-4 py-2 rounded-xl border border-growth-green/30">
          <div>
            <span className="text-xs text-ink-soft font-mono uppercase block">Invite Code</span>
            <span className="font-mono text-base font-bold text-forest-deep">{org?.inviteCode}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCopyCode} className="px-2 py-1 ml-2">
            Copy
          </Button>
        </div>
      </div>

      {/* Aggregate Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-forest-deep to-forest-mid text-white md:col-span-2">
          <CardContent className="py-6 flex flex-col justify-between h-full">
            <div>
              <p className="text-ink-soft text-sm font-medium uppercase tracking-wider text-opacity-80">Total Corporate Carbon Saved</p>
              <h2 className="font-mono text-5xl font-extrabold mt-2 text-ink-inverse">
                {currentSaved.toLocaleString()} <span className="text-2xl font-body font-normal text-pale-green">kg CO₂e</span>
              </h2>
            </div>
            
            <div className="mt-6">
              <ProgressBar
                value={progressPercent}
                max={100}
                showValue
                label="Sustainability milestone progress (1,000 kg CO₂e)"
                size="md"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="py-6 flex flex-col justify-center items-center text-center h-full">
            <span className="text-4xl mb-2">👥</span>
            <h3 className="font-mono text-4xl font-extrabold text-ink">
              {org?.memberUids.length || 0}
            </h3>
            <p className="text-sm text-ink-soft font-medium mt-1">Active Team Members</p>
            <p className="text-xs text-ink-soft mt-3">Sharing and competing coordinates change</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Left Depts & Offsetting, Right Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Department Leaderboard */}
          <Card className="border border-border">
            <CardHeader>
              <CardTitle>Department Leaderboard</CardTitle>
              <p className="text-xs text-ink-soft">See how departments rank in reducing their carbon footprint.</p>
            </CardHeader>
            <CardContent>
              {deptStats.length === 0 ? (
                <div className="text-center py-8 text-ink-soft text-sm">
                  No department statistics available.
                </div>
              ) : (
                <div className="space-y-4">
                  {deptStats.map((dept, index) => {
                    const maxSaved = Math.max(...deptStats.map(d => d.totalKgCo2eSaved), 1);
                    const percentOfMax = (dept.totalKgCo2eSaved / maxSaved) * 100;
                    
                    return (
                      <div key={dept.department} className="space-y-1">
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-ink-soft w-5">{index + 1}.</span>
                            <span className="font-semibold text-ink">{dept.department}</span>
                            <span className="text-xs text-ink-soft bg-tint px-2 py-0.5 rounded-full">
                              {dept.membersCount} {dept.membersCount === 1 ? 'member' : 'members'}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-forest-action">
                            {dept.totalKgCo2eSaved} kg saved
                          </span>
                        </div>
                        <div className="w-full bg-tint rounded-full h-3.5 overflow-hidden">
                          <div
                            className="bg-growth-green h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentOfMax}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Offsetting Initiatives */}
          <div>
            <h3 className="font-display text-2xl font-bold text-ink mb-4">Workplace Offsetting Initiatives</h3>
            
            {offsetSuccessMsg && (
              <div className="bg-pale-green border border-growth-green text-forest-deep px-4 py-3 rounded-lg mb-4 text-sm font-medium flex items-center gap-2">
                <span>✅</span> {offsetSuccessMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InitiativeCard
                id="init-reforest"
                name="Reforest The Amazon"
                description="Restore critical ecosystems in Brazil. Planting trees directly captures atmospheric CO₂."
                impact="Est. 120 kg CO₂e offset per tree"
                icon="🌳"
                isLoading={offsetLoadingId === 'init-reforest'}
                onOffset={() => handleOffset('init-reforest', 'Reforest The Amazon')}
              />
              <InitiativeCard
                id="init-wind"
                name="Wind Farms in India"
                description="Invest in renewable infrastructure to displace coal energy generators on local grids."
                impact="Displaces ~0.8 kg CO₂e per kWh"
                icon="💨"
                isLoading={offsetLoadingId === 'init-wind'}
                onOffset={() => handleOffset('init-wind', 'Wind Farms in India')}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Member Leaderboard */}
        <Card className="border border-border h-fit">
          <CardHeader>
            <CardTitle>Member Leaderboard</CardTitle>
            <p className="text-xs text-ink-soft">Top monthly reductions within {org?.name}.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 divide-y divide-border">
              {memberLeaderboard.map((member, index) => {
                const isMe = user?.uid === member.uid;
                return (
                  <div
                    key={member.uid}
                    className={[
                      'flex items-center gap-3 pt-3 first:pt-0',
                      isMe ? 'bg-pale-green/30 p-2 rounded-lg -mx-2 border border-growth-green/10' : '',
                    ].join(' ')}
                  >
                    <div className="font-mono text-base font-bold text-ink-soft w-6 text-center">
                      {index + 1}
                    </div>

                    <div className="w-10 h-10 rounded-full bg-tint flex items-center justify-center text-lg shrink-0 border border-border">
                      {member.photoURL ? (
                        <img
                          src={member.photoURL}
                          alt={member.displayName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span>👤</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-ink truncate">
                          {member.displayName}
                        </p>
                        {isMe && (
                          <span className="text-[10px] bg-forest-action text-ink-inverse px-1.5 py-0.5 rounded-full font-medium shrink-0">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-soft truncate font-medium">
                        {member.department} · {member.points} pts
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-mono font-bold text-forest-action">
                        -{member.kgCo2eSavedThisMonth} kg
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface InitiativeCardProps {
  id: string;
  name: string;
  description: string;
  impact: string;
  icon: string;
  isLoading: boolean;
  onOffset: () => void;
}

function InitiativeCard({ name, description, impact, icon, isLoading, onOffset }: InitiativeCardProps) {
  return (
    <Card className="flex flex-col justify-between h-full border border-border">
      <CardContent className="pt-5 flex-1">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-3xl">{icon}</span>
          <h4 className="font-display font-semibold text-base text-ink leading-tight">{name}</h4>
        </div>
        <p className="text-sm text-ink-soft mb-4 leading-relaxed">{description}</p>
        <span className="text-xs font-mono bg-tint text-forest-deep px-2.5 py-1 rounded-full font-bold">
          {impact}
        </span>
      </CardContent>
      <div className="p-4 pt-0 border-t border-border mt-4">
        <Button variant="secondary" size="sm" fullWidth isLoading={isLoading} onClick={onOffset}>
          Sponsor Project
        </Button>
      </div>
    </Card>
  );
}
