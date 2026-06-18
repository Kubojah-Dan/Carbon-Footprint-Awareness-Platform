'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface HumanStory {
  id: string;
  name: string;
  age: number;
  city: string;
  habitShift: string;
  avatar: string;
  videoSimUrl: string; // Background gradient / profile
  storyText: string;
  struggle: string;
  joy: string;
}

const STORIES: HumanStory[] = [
  {
    id: '1',
    name: 'Marta',
    age: 29,
    city: 'Warsaw',
    habitShift: 'Giving up plastic packaging completely',
    avatar: '👩',
    videoSimUrl: 'from-emerald-300 to-teal-400',
    storyText: 'Giving up plastic packaging completely in a supermarket was so hard. In the first two weeks, I left stores empty-handed and frustrated. But then I found local bulk markets, started baking my own bread, and made friends with the vendors.',
    struggle: 'Remembering cotton bags, finding stores that sell bulk legumes without plastics, and explaining my jars to cashier staff.',
    joy: 'The smell of fresh sourdough in my kitchen, and no longer overflowing my trash bin with plastic wrappers every Friday.',
  },
  {
    id: '2',
    name: 'Nikhil',
    age: 34,
    city: 'Mumbai',
    habitShift: 'Swapping car commute for electric cargo-cycling',
    avatar: '👨',
    videoSimUrl: 'from-cyan-300 to-sky-400',
    storyText: 'I used to sit in traffic for 90 minutes every morning, staring at tail lights, drinking cold tea. I bought a second-hand cargo e-bike and started commuting along the back lanes. I arrived sweating slightly, but smiling.',
    struggle: 'Monsoon season downpours, navigating heavy roads, and feeling exposed next to huge bus tires at first.',
    joy: 'Waving to the street side chai vendors, feeling the breeze, and saving an hour of traffic congestion stress every single day.',
  },
  {
    id: '3',
    name: 'Kenji',
    age: 42,
    city: 'Tokyo',
    habitShift: 'Transitioning to a 90% plant-based diet',
    avatar: '🧔',
    videoSimUrl: 'from-indigo-300 to-purple-400',
    storyText: 'My family has eaten grilled fish and pork broth for generations. I started cooking locally grown dashi with mushrooms, tofu skins, and organic root veggies. It was a learning curve for my parents, but we adapted.',
    struggle: 'Finding umami flavor without using dried bonito fish flakes, and eating out at traditional izakaya joints with friends.',
    joy: 'Discovering dozens of forgotten heirloom beans, and feeling much lighter and energized after dinner.',
  },
];

export function HumanLibrary() {
  const [activeStory, setActiveStory] = useState<HumanStory | null>(null);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>👥</span> Human Library of Change
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-ink-soft">
          Short, unscripted video/text exchanges from peers who successfully shifted a habit. The focus is on the human journey, struggle, and joy—never on kilograms saved.
        </p>

        {/* Video feed row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STORIES.map((story) => (
            <button
              key={story.id}
              onClick={() => setActiveStory(story)}
              className={`rounded-xl border p-4 text-left cursor-pointer transition-all flex flex-col justify-between h-48 relative overflow-hidden group ${
                activeStory?.id === story.id 
                  ? 'border-forest-action ring-2 ring-forest-action/30 bg-forest-action/5' 
                  : 'border-border hover:border-forest-action/50 bg-white/40'
              }`}
            >
              {/* Profile Card Overlay Visual */}
              <div className={`absolute inset-0 bg-gradient-to-br ${story.videoSimUrl} opacity-10 group-hover:opacity-25 transition-opacity`} />
              
              <div className="space-y-2 relative z-10">
                <span className="text-3xl">{story.avatar}</span>
                <h4 className="text-xs font-bold text-ink">{story.name}, {story.age}</h4>
                <p className="text-[10px] text-ink-soft leading-snug font-medium">📍 {story.city}</p>
                <p className="text-[11px] text-forest-deep font-semibold line-clamp-2 mt-1">"{story.habitShift}"</p>
              </div>

              <div className="relative z-10 w-full flex items-center justify-between text-xs text-forest-action font-semibold pt-2 border-t border-forest-action/10 mt-2">
                <span>🎥 Play Story</span>
                <span>2 min</span>
              </div>
            </button>
          ))}
        </div>

        {/* Story details display */}
        {activeStory ? (
          <div className="p-4 rounded-xl border border-forest-action/20 bg-forest-action/5 animate-scale-in space-y-4">
            <div className="flex justify-between items-start border-b border-forest-action/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{activeStory.avatar}</span>
                <div>
                  <h4 className="text-sm font-bold text-ink">{activeStory.name} ({activeStory.city})</h4>
                  <p className="text-[10px] text-ink-soft">{activeStory.habitShift}</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveStory(null)}
                className="text-xs text-ink-soft hover:text-ink cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-ink-soft leading-relaxed italic bg-white/60 p-3 rounded-lg border border-border">
                "{activeStory.storyText}"
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-red-500/5 border border-red-500/10">
                  <span className="font-bold text-red-700">🧗 The Struggle:</span>
                  <p className="text-[11px] text-ink-soft mt-1">{activeStory.struggle}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <span className="font-bold text-emerald-700">🌸 The Joy:</span>
                  <p className="text-[11px] text-ink-soft mt-1">{activeStory.joy}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-border rounded-xl">
            <p className="text-xs text-ink-soft">Select a card above to watch or read their unscripted habit shift story.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
