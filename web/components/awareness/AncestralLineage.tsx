'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface LineageStep {
  label: string;
  icon: string;
  location: string;
  story: string;
}

interface ProductLineage {
  id: string;
  name: string;
  barcode: string;
  icon: string;
  steps: LineageStep[];
}

const PRODUCTS: ProductLineage[] = [
  {
    id: '1',
    name: '100% Organic Cotton T-Shirt',
    barcode: '501234567890',
    icon: '👕',
    steps: [
      { label: 'Sowing & Harvest', icon: '🌱', location: 'Izmir, Turkey', story: 'Grown in dry clay soils watered by winter rains. Handpicked by organic farmers to avoid oil-intensive mechanical harvesters. No synthetic chemicals were sprayed, protecting local underground aquifers.' },
      { label: 'Ginning & Spinning', icon: '🌀', location: 'Coimbatore, India', story: 'Fibers are separated from seeds and spun into yarns in mills run on 60% wind turbine energy. The workers are organized under a local fair-trade cooperative.' },
      { label: 'Weaving & Dyeing', icon: '🎨', location: 'Da Nang, Vietnam', story: 'Yarns are woven and colored using natural dyes extracted from onion skins and pomegranate rinds, keeping waste waters biodegradable.' },
      { label: 'Sewing & Transport', icon: '🚢', location: 'Hai Phong to London', story: 'Tailored by skilled hands, packed in biodegradable cornstarch sleeves, and shipped via ocean freighter. A slow journey across the seas, carrying the warmth of many hands.' },
    ],
  },
  {
    id: '2',
    name: 'Single-Origin Shade-Grown Coffee',
    barcode: '761234567890',
    icon: '☕',
    steps: [
      { label: 'Shade Agroforestry', icon: '🌳', location: 'Chiapas, Mexico', story: 'Grown under a canopy of native mahogany and cedar trees. This shade protects migrating monarch butterflies and songbirds, maintaining forest biodiversity while feeding the soil organic leaf litter.' },
      { label: 'Wet Milling', icon: '💧', location: 'Chiapas Mill', story: 'Cherries are pulped using a recirculating water system that recycles 90% of water, turning coffee pulp into organic compost for the trees.' },
      { label: 'Sun Drying', icon: '☀️', location: 'Chiapas Cooperativa', story: 'Parchment coffee is spread on brick patios and slowly dried by the sun, requiring zero fuel or mechanical dry kilns.' },
      { label: 'Roasting & Packaging', icon: '🔥', location: 'Local Micro-Roastery', story: 'Roasted in small batches using local wind power. Sealed in compostable kraft paper pouches and delivered to shops via electric cargo bikes.' },
    ],
  },
  {
    id: '3',
    name: 'Recycled Aluminum Water Bottle',
    barcode: '401234567890',
    icon: '🧉',
    steps: [
      { label: 'Scrap Collection', icon: '🥫', location: 'Munich, Germany', story: 'Gathered from beverage cans and auto parts. Recycling aluminum saves 95% of the massive energy cost of mining raw bauxite ore from tropical soils.' },
      { label: 'Smelting', icon: '🏭', location: 'Karlsruhe Smelter', story: 'Melted down in electric arc furnaces powered by hydro-electricity, eliminating carbon emissions from burning fossil coal.' },
      { label: 'Impact Extrusion', icon: '🔨', location: 'Stuttgart Factory', story: 'Pressed into a single seamless bottle shape using cold-forming tools. Built to endure a lifetime of refills, replacing thousands of plastic disposables.' },
      { label: 'Durable Coating', icon: '🎨', location: 'Nuremberg Factory', story: 'Powder-coated with a solvent-free bake finish that releases no volatile compounds. Designed to never flake and return to recycle bins eventually.' },
    ],
  },
];

export function AncestralLineage() {
  const [selectedProduct, setSelectedProduct] = useState<ProductLineage | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanError, setScanError] = useState('');

  const handleScan = () => {
    setIsScanning(true);
    setScanError('');
    setSelectedProduct(null);

    setTimeout(() => {
      const match = PRODUCTS.find(p => p.barcode === barcodeInput.trim() || p.id === barcodeInput.trim());
      if (match) {
        setSelectedProduct(match);
      } else {
        // Fallback: pick a random product if not found, to keep it fun and functional!
        const random = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)]!;
        setSelectedProduct(random);
      }
      setIsScanning(false);
      setBarcodeInput('');
    }, 1500);
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>👕</span> Ancestral Lineage of Objects
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-ink-soft">
          Scan a barcode or select an object to view its "carbon lineage"—a stylized, illustration-based story of where the materials came from, the hands that made it, and the energy cost to Earth.
        </p>

        {/* Scan Barcode interface */}
        <div className="flex gap-2 bg-white/50 p-3 rounded-xl border border-border">
          <select
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-action bg-white"
          >
            <option value="">-- Choose Product to Scan --</option>
            {PRODUCTS.map(p => (
              <option key={p.id} value={p.barcode}>{p.icon} {p.name}</option>
            ))}
          </select>
          <Button variant="primary" size="sm" onClick={handleScan} isLoading={isScanning}>
            Scan Object
          </Button>
        </div>

        {scanError && <p className="text-xs text-earth-coral text-center">{scanError}</p>}

        {isScanning && (
          <div className="flex flex-col items-center py-10 space-y-3">
            <div className="w-10 h-10 border-4 border-forest-action border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-ink-soft">Reading barcode and mapping object lineage...</p>
          </div>
        )}

        {/* Stylized scrollable tapestry */}
        {!isScanning && selectedProduct && (
          <div className="space-y-6 animate-scale-in">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <span className="text-3xl">{selectedProduct.icon}</span>
              <div>
                <h3 className="font-semibold text-sm text-ink">{selectedProduct.name}</h3>
                <p className="text-[10px] text-ink-soft font-mono font-bold">UPC: {selectedProduct.barcode}</p>
              </div>
            </div>

            {/* Tapestry Horizontal Scroll Container */}
            <div className="flex gap-4 overflow-x-auto pb-4 pt-2 snap-x select-none">
              {selectedProduct.steps.map((step, idx) => (
                <div 
                  key={idx} 
                  className="w-72 shrink-0 border border-border rounded-xl bg-white/40 p-4 relative snap-center flex flex-col justify-between"
                >
                  {/* Connective lineage line indicator */}
                  {idx < selectedProduct.steps.length - 1 && (
                    <div className="absolute top-1/2 -right-4 w-4 border-t-2 border-dashed border-forest-action/30 hidden md:block" />
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{step.icon}</span>
                      <span className="text-[9px] font-bold text-forest-deep bg-forest-action/10 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                        Step {idx + 1}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-ink leading-tight">{step.label}</h4>
                      <p className="text-[10px] text-ink-soft font-medium">📍 {step.location}</p>
                    </div>

                    <p className="text-xs text-ink-soft leading-relaxed">
                      {step.story}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-[10px] text-ink-soft text-center italic">
              ← Scroll to explore the complete ancestral tapestry of this object →
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
