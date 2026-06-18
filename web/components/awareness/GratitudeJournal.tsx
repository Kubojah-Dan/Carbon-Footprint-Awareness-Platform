'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface JournalEntry {
  id: string;
  date: string;
  text: string;
  reflection?: string;
}

export function GratitudeJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newText, setNewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load entries from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('earth_gratitude_journal');
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse journal entries', e);
      }
    }
  }, []);

  // Save entries to localStorage
  const saveEntries = (newEntries: JournalEntry[]) => {
    setEntries(newEntries);
    localStorage.setItem('earth_gratitude_journal', JSON.stringify(newEntries));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/v1/ai/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryText: newText }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch reflection');

      const newEntry: JournalEntry = {
        id: Math.random().toString(36).substring(7),
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        text: newText,
        reflection: data.reflection,
      };

      saveEntries([newEntry, ...entries]);
      setNewText('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not save entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📓</span> Earth Gratitude Journal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-ink-soft">
          Reframer carbon reduction as reciprocity, not sacrifice. Describe one thing the Earth gave you today or an act of care you did for another living being.
        </p>

        {error && (
          <div role="alert" className="p-3 text-xs rounded-lg bg-[rgba(217,79,59,0.1)] border border-earth-coral/30 text-earth-coral">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Today, the sun warmed my face during lunch... or I watered the small sapling outside my window..."
            rows={3}
            maxLength={500}
            className="w-full rounded-lg border border-border p-3 text-sm text-ink resize-none focus:outline-none focus:ring-2 focus:ring-forest-action bg-white/50 backdrop-blur-sm"
            disabled={isSubmitting}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-ink-soft">{newText.length}/500 characters</span>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={!newText.trim() || isSubmitting}
            >
              Record Gratitude
            </Button>
          </div>
        </form>

        {/* Entries list */}
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
          {entries.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-border rounded-xl">
              <p className="text-2xl mb-1">🍃</p>
              <p className="text-xs text-ink-soft">Your gratitude garden is waiting to grow.</p>
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="p-3 rounded-xl bg-[rgba(45,122,79,0.04)] border border-forest-action/10 space-y-2">
                <div className="flex justify-between items-center border-b border-forest-action/5 pb-1">
                  <span className="text-[10px] font-mono font-bold text-forest-deep/60">📅 {entry.date}</span>
                  <button 
                    onClick={() => saveEntries(entries.filter(e => e.id !== entry.id))}
                    className="text-xs text-ink-soft hover:text-earth-coral transition-colors"
                  >
                    🗑
                  </button>
                </div>
                <p className="text-xs text-ink italic leading-relaxed">"{entry.text}"</p>
                {entry.reflection && (
                  <div className="p-2 rounded-lg bg-emerald-500/5 border-l-2 border-emerald-500 text-[11px] text-forest-deep leading-relaxed">
                    <span className="font-semibold">🌍 Earth's Echo:</span> {entry.reflection}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
