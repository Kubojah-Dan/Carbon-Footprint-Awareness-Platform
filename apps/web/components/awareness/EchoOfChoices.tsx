'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface MemoryItem {
  id: string;
  title: string;
  category: 'travel' | 'food' | 'energy' | 'shopping';
  imagePlaceholder: string; // Emoji
  bgClass: string;
  isHighCarbon: boolean;
  microStory: string;
  filterOverlay: string; // CSS Filter / border
  effectClass: string;
}

const MEMORIES: MemoryItem[] = [
  {
    id: '1',
    title: 'Weekend Flight to Lisbon',
    category: 'travel',
    imagePlaceholder: '✈️',
    bgClass: 'from-amber-200 to-orange-100',
    isHighCarbon: true,
    microStory: 'This journey released exhaust high in the stratosphere. Over weeks, it diffuses, trapping infrared heat. The fuel was piped from pipelines traversing fragile tundra habitats, carrying the quiet echo of steel lines on cold moss.',
    filterOverlay: 'sepia(80%) saturate(140%) hue-rotate(340deg) brightness(85%)',
    effectClass: 'amber-smog-glow',
  },
  {
    id: '2',
    title: 'Organic Quinoa & Avocado Salad',
    category: 'food',
    imagePlaceholder: '🥗',
    bgClass: 'from-emerald-100 to-green-50',
    isHighCarbon: false,
    microStory: 'Sprouted in high Andean terraces, irrigated by mountain runoff. The companion beans fixed nitrogen directly in the soil, allowing the fields to thrive without chemical fertilizers. Bees pollinated the avocado blooms nearby.',
    filterOverlay: 'contrast(105%) saturate(120%) brightness(100%)',
    effectClass: 'flower-sprout-overlay',
  },
  {
    id: '3',
    title: 'Winter Thermostat Cozy Night',
    category: 'energy',
    imagePlaceholder: '🔥',
    bgClass: 'from-red-200 to-amber-100',
    isHighCarbon: true,
    microStory: 'Warmth pumped into the rooms generated smoke at the coal plant miles away. That heat came from fossil layers millions of years old. The light reflecting off the window carries the shadow of dark energy layers.',
    filterOverlay: 'grayscale(30%) brightness(85%) contrast(90%)',
    effectClass: 'grey-soot-border',
  },
  {
    id: '4',
    title: 'Thrift Store Denim Jacket',
    category: 'shopping',
    imagePlaceholder: '🧥',
    bgClass: 'from-teal-100 to-blue-50',
    isHighCarbon: false,
    microStory: 'Worn by a student in Marseille, then donated, washed, and re-loved. By avoiding new manufacture, you saved hundreds of gallons of river water and kept cotton soils fertile for another crop cycle.',
    filterOverlay: 'saturate(115%) contrast(110%)',
    effectClass: 'vine-sprout-border',
  },
];

export function EchoOfChoices() {
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null);
  const [memoryList, setMemoryList] = useState<MemoryItem[]>(MEMORIES);
  const [isUploading, setIsUploading] = useState(false);

  const handleMockUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      const newMem: MemoryItem = {
        id: Math.random().toString(),
        title: 'Bicycle Commute to Work',
        category: 'travel',
        imagePlaceholder: '🚴',
        bgClass: 'from-emerald-200 to-cyan-50',
        isHighCarbon: false,
        microStory: 'Silent spinning wheels along the local creek. You shared the path with nesting ducks and saved clean air for the lungs of the city. The energy was fuel from your own breakfast.',
        filterOverlay: 'brightness(102%) saturate(110%)',
        effectClass: 'flower-sprout-overlay',
      };
      setMemoryList([newMem, ...memoryList]);
      setIsUploading(false);
    }, 1200);
  };

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <span>📸</span> The Echo of Your Choices (Memory View)
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={handleMockUpload} isLoading={isUploading}>
          + Upload Memory
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-ink-soft">
          Weeks after uploading a memory, the app overlays a visual "echo" of its carbon impact. High impact gains an amber smog filter; low-carbon choices sprout digital flowers. Tap a photo to hear its micro-story.
        </p>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {memoryList.map((mem) => {
            const isSelected = selectedMemory?.id === mem.id;
            return (
              <button
                key={mem.id}
                onClick={() => setSelectedMemory(mem)}
                className={`relative aspect-square rounded-xl overflow-hidden border transition-all duration-300 text-left flex flex-col justify-between p-3 cursor-pointer group ${
                  isSelected ? 'ring-2 ring-forest-action scale-95 border-transparent shadow-md' : 'border-border hover:border-forest-action/50 shadow-sm'
                }`}
              >
                {/* Background placeholder simulating photo with filters */}
                <div 
                  className={`absolute inset-0 bg-gradient-to-tr ${mem.bgClass} transition-all duration-300`}
                  style={{ filter: mem.filterOverlay }}
                />

                {/* Smog filter effect overlay */}
                {mem.isHighCarbon && (
                  <div className="absolute inset-0 bg-amber-800/10 mix-blend-color-burn pointer-events-none group-hover:bg-amber-800/20 transition-colors" />
                )}

                {/* Biophilic sprout SVG overlay */}
                {!mem.isHighCarbon && (
                  <div className="absolute bottom-1 right-1 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
                    <span className="text-xl">🌸</span>
                  </div>
                )}

                <div className="relative z-10 w-8 h-8 rounded-lg bg-white/60 backdrop-blur-md flex items-center justify-center text-lg shadow-sm">
                  {mem.imagePlaceholder}
                </div>
                <div className="relative z-10 bg-black/45 backdrop-blur-sm p-1.5 rounded-lg border border-white/10 w-full">
                  <p className="text-[10px] font-bold text-white leading-tight truncate">{mem.title}</p>
                  <p className="text-[8px] text-white/80 font-mono capitalize">{mem.category}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Story Modal/Reveal Card */}
        {selectedMemory ? (
          <div className="p-4 rounded-xl border border-forest-action/20 bg-forest-action/5 animate-scale-in space-y-3 relative overflow-hidden">
            {/* Smog border overlay if high carbon */}
            {selectedMemory.isHighCarbon && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
            )}
            {!selectedMemory.isHighCarbon && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
            )}

            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-semibold text-ink">{selectedMemory.title}</h4>
                <p className="text-[10px] text-ink-soft font-mono uppercase tracking-wider">
                  {selectedMemory.isHighCarbon ? '⚠️ High Impact Echo' : '🌸 Regenerative Sprout'}
                </p>
              </div>
              <button 
                onClick={() => setSelectedMemory(null)}
                className="text-xs text-ink-soft hover:text-ink cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            
            <p className="text-xs text-ink-soft leading-relaxed italic bg-white/60 p-3 rounded-lg border border-border">
              {selectedMemory.microStory}
            </p>
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-border rounded-xl">
            <p className="text-xs text-ink-soft">Tap on a memory photo above to reveal its ecological echo story.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
