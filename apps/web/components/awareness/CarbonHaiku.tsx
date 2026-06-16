'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/providers/AuthProvider';

export function CarbonHaiku() {
  const { user } = useAuth();
  const [haiku, setHaiku] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const generateHaiku = async () => {
    if (!user) return;
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/v1/ai/haiku', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate haiku');

      setHaiku(data.haiku);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not generate haiku. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>✍️</span> Carbon Haiku (Poetic Knowledge)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-ink-soft">
          ABSTRACT carbon statistics are turned into emotional poetry. The AI coach reads your weekly logs and synthesizes them into a non-judgmental, reflective haiku.
        </p>

        {error && (
          <div role="alert" className="p-3 text-xs rounded-lg bg-[rgba(217,79,59,0.1)] border border-earth-coral/30 text-earth-coral">
            {error}
          </div>
        )}

        {haiku ? (
          <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10 border border-emerald-300/30 text-center animate-scale-in relative overflow-hidden">
            {/* Background vector rings */}
            <div className="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-emerald-500/5" />
            <div className="absolute -bottom-12 -right-12 w-24 h-24 rounded-full bg-teal-500/5" />

            <span className="text-2xl mb-3 block">🍃</span>
            <div className="font-serif italic text-forest-deep text-sm md:text-base space-y-1.5 max-w-sm mx-auto leading-relaxed">
              {haiku.split('/').map((line, idx) => (
                <p key={idx} className="tracking-wide">
                  {line.trim()}
                </p>
              ))}
            </div>
            
            <div className="mt-6">
              <Button variant="ghost" size="sm" onClick={generateHaiku} isLoading={isLoading}>
                ↻ Rewrite Haiku
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-border rounded-xl space-y-3">
            <span className="text-3xl block">📜</span>
            <p className="text-xs text-ink-soft">Ready to translate your weekly carbon footprint into poetry.</p>
            <Button variant="primary" size="sm" onClick={generateHaiku} isLoading={isLoading}>
              Generate Carbon Haiku
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
