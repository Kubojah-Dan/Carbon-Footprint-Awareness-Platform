'use client';

import React, { useState } from 'react';
import { HapticHeartbeat } from '@/components/awareness/HapticHeartbeat';
import { GratitudeJournal } from '@/components/awareness/GratitudeJournal';
import { SilenceHour } from '@/components/awareness/SilenceHour';
import { PlanetaryMirror } from '@/components/awareness/PlanetaryMirror';
import { TimeCapsule } from '@/components/awareness/TimeCapsule';
import { EchoOfChoices } from '@/components/awareness/EchoOfChoices';
import { AncestralLineage } from '@/components/awareness/AncestralLineage';
import { GlobalMosaic } from '@/components/awareness/GlobalMosaic';
import { CommunityMurmur } from '@/components/awareness/CommunityMurmur';
import { HumanLibrary } from '@/components/awareness/HumanLibrary';
import { CarbonQuests } from '@/components/awareness/CarbonQuests';
import { SeedPacketExchange } from '@/components/awareness/SeedPacketExchange';
import { CarbonShadows } from '@/components/awareness/CarbonShadows';
import { WeightOfThings } from '@/components/awareness/WeightOfThings';
import { CarbonHaiku } from '@/components/awareness/CarbonHaiku';

const TABS = [
  { id: 'sensory', label: '🧘 Sensory & Mindful', icon: '🧘' },
  { id: 'narrative', label: '📖 Narrative & Time', icon: '📖' },
  { id: 'collective', label: '🎨 Collective Art', icon: '🎨' },
  { id: 'tangible', label: '🌍 Tangible & AR', icon: '🌍' },
  { id: 'poetic', label: '✍️ Poetic Wisdom', icon: '✍️' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function EarthAwarenessHub() {
  const [activeTab, setActiveTab] = useState<TabId>('sensory');

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-ink">Earth Awareness Hub</h1>
        <p className="text-ink-soft mt-1">
          Connect with the planet through mindfulness, poetry, stories, and collective art.
        </p>
      </div>

      {/* Tabs navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-border select-none">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`tab-pill-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'px-4 py-2.5 rounded-t-xl text-sm font-semibold border-b-2 shrink-0 transition-all cursor-pointer',
              activeTab === tab.id
                ? 'border-forest-action text-forest-deep bg-forest-action/5 font-bold'
                : 'border-transparent text-ink-soft hover:text-ink hover:border-border',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {activeTab === 'sensory' && (
          <>
            <HapticHeartbeat />
            <GratitudeJournal />
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <SilenceHour />
              <PlanetaryMirror />
            </div>
          </>
        )}

        {activeTab === 'narrative' && (
          <>
            <TimeCapsule />
            <EchoOfChoices />
            <div className="md:col-span-2">
              <AncestralLineage />
            </div>
          </>
        )}

        {activeTab === 'collective' && (
          <>
            <GlobalMosaic />
            <CommunityMurmur />
            <div className="md:col-span-2">
              <HumanLibrary />
            </div>
          </>
        )}

        {activeTab === 'tangible' && (
          <>
            <CarbonQuests />
            <SeedPacketExchange />
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <CarbonShadows />
              <WeightOfThings />
            </div>
          </>
        )}

        {activeTab === 'poetic' && (
          <div className="md:col-span-2 max-w-xl mx-auto w-full">
            <CarbonHaiku />
          </div>
        )}
      </div>
    </div>
  );
}
