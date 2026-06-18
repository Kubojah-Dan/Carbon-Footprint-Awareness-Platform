import { NextRequest, NextResponse } from 'next/server';
import { calculateFoodEmission } from '@earthprint/emission-engine';
import type { FoodType } from '@earthprint/types';

// Keyword to FoodType map
const KEYWORD_MAP: Array<{ keywords: string[]; type: FoodType }> = [
  { keywords: ['beef', 'steak', 'hamburger', 'mince', 'meatballs'], type: 'beef' },
  { keywords: ['lamb', 'mutton', 'gyros'], type: 'lamb' },
  { keywords: ['pork', 'bacon', 'ham', 'sausage', 'gammon', 'salami'], type: 'pork' },
  { keywords: ['chicken', 'poultry', 'turkey', 'breast', 'nugget'], type: 'chicken' },
  { keywords: ['salmon', 'tuna', 'cod', 'haddock', 'fish', 'trout', 'pollock'], type: 'fish-wild' },
  { keywords: ['prawn', 'shrimp', 'seafood', 'lobster', 'crab', 'mussel'], type: 'seafood' },
  { keywords: ['egg'], type: 'eggs' },
  { keywords: ['cheese', 'cheddar', 'mozzarella', 'parmesan', 'feta'], type: 'dairy-cheese' },
  { keywords: ['butter', 'ghee'], type: 'dairy-butter' },
  { keywords: ['milk', 'yogurt', 'cream', 'latte'], type: 'dairy-milk' },
  { keywords: ['lentils', 'bean', 'chickpea', 'legume', 'lentil', 'hummus'], type: 'legumes' },
  { keywords: ['tofu', 'soy', 'tempeh'], type: 'tofu' },
  { keywords: ['nut', 'almond', 'peanut', 'cashew', 'walnut', 'pistachio', 'hazelnut'], type: 'nuts' },
  { keywords: ['oil', 'margarine', 'olive oil', 'sunflower oil'], type: 'oils' },
  { keywords: ['sugar', 'sweetener', 'candy', 'chocolate', 'syrup', 'honey'], type: 'sugar' },
  { keywords: ['carrot', 'broccoli', 'spinach', 'vegetable', 'tomato', 'potato', 'onion', 'garlic', 'pepper', 'cucumber', 'lettuce'], type: 'vegetables' },
  { keywords: ['apple', 'banana', 'fruit', 'orange', 'berry', 'grape', 'lemon', 'lime', 'peach', 'pear', 'strawberry', 'blueberry'], type: 'fruits' },
  { keywords: ['rice', 'wheat', 'oat', 'grain', 'cereal', 'pasta', 'bread', 'flour', 'spaghetti', 'macaroni'], type: 'grains' },
];

function mapProductToFoodType(productName: string, categories: string): FoodType {
  const searchStr = `${productName} ${categories}`.toLowerCase();
  
  for (const entry of KEYWORD_MAP) {
    for (const word of entry.keywords) {
      if (searchStr.includes(word)) {
        return entry.type;
      }
    }
  }
  
  return 'processed-food';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const barcode = searchParams.get('barcode');

    if (!barcode) {
      return NextResponse.json(
        { success: false, error: 'Query parameter barcode is required' },
        { status: 400 }
      );
    }

    let productName = 'Unknown Product';
    let foodType: FoodType = 'processed-food';
    let weightGrams = 150; // standard default serving size
    let isFallback = false;

    try {
      // Call Open Food Facts API
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`, {
        headers: {
          'User-Agent': 'EarthPrint - WebApp/1.0 - (contact: admin@earthprint.org)',
        },
        next: { revalidate: 3600 }, // Cache lookup for 1 hour
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === 1 && data.product) {
          const prod = data.product;
          productName = prod.product_name_en || prod.product_name || prod.generic_name || 'Scanned Food Item';
          const categories = prod.categories || '';
          
          foodType = mapProductToFoodType(productName, categories);
          
          // Try to extract weight or serving size
          if (prod.serving_quantity) {
            weightGrams = Number(prod.serving_quantity);
          } else if (prod.serving_size) {
            // E.g. "150g" or "150 g"
            const match = prod.serving_size.match(/(\d+)\s*g/i);
            if (match && match[1]) {
              weightGrams = Number(match[1]);
            }
          }
        } else {
          isFallback = true;
        }
      } else {
        isFallback = true;
      }
    } catch (err) {
      console.warn('Open Food Facts API request failed. Using fallback.', err);
      isFallback = true;
    }

    // Fallback deterministic mock mapping if OFF lookup failed or was empty
    if (isFallback) {
      // Create some fun fallback names based on barcode digits
      const lastDigit = Number(barcode.slice(-1)) || 0;
      const choices: Array<{ name: string; type: FoodType; weight: number }> = [
        { name: 'Organic Tofu Pack', type: 'tofu', weight: 200 },
        { name: 'Fresh Vegetables Mix', type: 'vegetables', weight: 250 },
        { name: 'Lentils Soup Can', type: 'legumes', weight: 400 },
        { name: 'Grass-Fed Ribeye Steak', type: 'beef', weight: 220 },
        { name: 'Almond Milk Carton', type: 'dairy-milk', weight: 200 },
        { name: 'Whole Wheat Pasta', type: 'grains', weight: 100 },
        { name: 'Cheddar Cheese Block', type: 'dairy-cheese', weight: 50 },
        { name: 'Fresh Strawberries', type: 'fruits', weight: 150 },
        { name: 'Free-Range Eggs (6 Pack)', type: 'eggs', weight: 120 },
        { name: 'Sustainable Salmon Fillet', type: 'fish-wild', weight: 180 },
      ];
      
      const choice = choices[lastDigit % choices.length]!;
      productName = choice.name;
      foodType = choice.type;
      weightGrams = choice.weight;
    }

    // Calculate emissions using emission-engine
    const calc = calculateFoodEmission({
      foodType,
      weightGrams,
      isOrganic: productName.toLowerCase().includes('organic'),
      isLocal: productName.toLowerCase().includes('local') || productName.toLowerCase().includes('british'),
      wasWasted: false,
    });

    return NextResponse.json({
      success: true,
      barcode,
      productName,
      foodType,
      weightGrams,
      estimatedKgCo2e: Number(calc.kgCo2e.toFixed(3)),
      isFallback,
    });
  } catch (error: any) {
    console.error('[scanner/lookup] GET Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
