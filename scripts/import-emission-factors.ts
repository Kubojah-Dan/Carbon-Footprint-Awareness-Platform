import * as fs from 'fs';
import * as path from 'path';

/**
 * Script: import-emission-factors.ts
 *
 * Converts raw CSV files (e.g. DEFRA transport/shopping factors, IEA grid intensity data)
 * into the standardized JSON schemas used by @earthprint/emission-engine.
 *
 * Usage:
 *   npx tsx scripts/import-emission-factors.ts [path/to/raw.csv] [category]
 */

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log(`
🌍 EarthPrint Emission Factor Importer Utility
=============================================
This script converts raw CSV emission factor datasets into JSON structures
suitable for the @earthprint/emission-engine package.

Usage:
  npx tsx scripts/import-emission-factors.ts <csv-file-path> <category>

Categories:
  transport | food | grid | shopping

Example:
  npx tsx scripts/import-emission-factors.ts ./raw/defra-2023.csv transport
    `);
    return;
  }

  const [csvPath, category] = args;
  const absoluteCsvPath = path.resolve(csvPath);

  if (!fs.existsSync(absoluteCsvPath)) {
    console.error(`❌ CSV File not found at: ${absoluteCsvPath}`);
    process.exit(1);
  }

  console.log(`Reading CSV file from ${absoluteCsvPath}...`);
  const csvContent = fs.readFileSync(absoluteCsvPath, 'utf8');
  const rows = parseCsv(csvContent);

  console.log(`Parsed ${rows.length} rows. Mapping to category: "${category}"...`);

  let destinationFile = '';
  let mappedData: any = null;

  switch (category) {
    case 'transport':
      destinationFile = 'transport-factors.json';
      mappedData = mapTransportFactors(rows);
      break;
    case 'food':
      destinationFile = 'food-factors.json';
      mappedData = mapFoodFactors(rows);
      break;
    case 'grid':
      destinationFile = 'grid-factors.json';
      mappedData = mapGridFactors(rows);
      break;
    case 'shopping':
      destinationFile = 'shopping-factors.json';
      mappedData = mapShoppingFactors(rows);
      break;
    default:
      console.error(`❌ Unknown category "${category}". Must be one of: transport, food, grid, shopping.`);
      process.exit(1);
  }

  const outPath = path.resolve(process.cwd(), 'data/emission-factors', destinationFile);
  fs.writeFileSync(outPath, JSON.stringify(mappedData, null, 2), 'utf8');
  console.log(`✅ Successfully imported factors to: ${outPath}`);
}

/** Simple CSV parser helper */
function parseCsv(content: string): string[][] {
  const lines = content.split(/\r?\n/);
  return lines
    .map((line) => {
      // Split by comma but respect double quotes
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    })
    .filter((row) => row.length > 0 && row.some((cell) => cell !== ''));
}

function mapTransportFactors(rows: string[][]) {
  // Expected headers: Mode, VehicleType, FuelType, FlightClass, KgCo2ePerKm, Source, Year
  const factors = rows.slice(1).map((row, idx) => {
    const [mode, vehicleType, fuelType, flightClass, kgCo2ePerKm, source, year] = row;
    return {
      id: `transport-${idx + 1}`,
      mode: mode || 'car',
      vehicleType: vehicleType || undefined,
      fuelType: fuelType || undefined,
      flightClass: flightClass || undefined,
      kgCo2ePerKm: parseFloat(kgCo2ePerKm || '0'),
      dataSource: source || 'Imported Source',
      dataYear: parseInt(year || '2023', 10),
    };
  });
  return { factors };
}

function mapFoodFactors(rows: string[][]) {
  // Expected headers: FoodType, KgCo2ePerKg, Source, Year
  const factors = rows.slice(1).map((row, idx) => {
    const [foodType, kgCo2ePerKg, source, year] = row;
    return {
      id: `food-${idx + 1}`,
      foodType: foodType || 'unknown',
      kgCo2ePerKg: parseFloat(kgCo2ePerKg || '0'),
      dataSource: source || 'Imported Source',
      dataYear: parseInt(year || '2018', 10),
    };
  });
  return { factors };
}

function mapGridFactors(rows: string[][]) {
  // Expected headers: Region, CountryName, KgCo2ePerKwh, Source, Year
  const factors = rows.slice(1).map((row, idx) => {
    const [region, countryName, kgCo2ePerKwh, source, year] = row;
    return {
      id: `grid-${idx + 1}`,
      region: region || 'GLOBAL',
      countryName: countryName || 'Unknown',
      kgCo2ePerKwh: parseFloat(kgCo2ePerKwh || '0.4'),
      dataSource: source || 'Imported Source',
      dataYear: parseInt(year || '2022', 10),
    };
  });
  return {
    factors,
    fuelFactors: [
      {
        id: "fuel-gas",
        fuelType: "gas",
        kgCo2ePerKwh: 0.183,
        dataSource: "DEFRA 2023",
        dataYear: 2023
      },
      {
        id: "fuel-oil",
        fuelType: "oil",
        kgCo2ePerKwh: 0.246,
        dataSource: "DEFRA 2023",
        dataYear: 2023
      },
      {
        id: "fuel-biomass",
        fuelType: "biomass",
        kgCo2ePerKwh: 0.015,
        dataSource: "DEFRA 2023",
        dataYear: 2023
      }
    ]
  };
}

function mapShoppingFactors(rows: string[][]) {
  // Expected headers: Category, KgCo2ePerGbp, Source, Year
  const factors = rows.slice(1).map((row, idx) => {
    const [category, kgCo2ePerGbp, source, year] = row;
    return {
      id: `shopping-${idx + 1}`,
      category: category || 'clothing',
      kgCo2ePerGbp: parseFloat(kgCo2ePerGbp || '0.5'),
      dataSource: source || 'Imported Source',
      dataYear: parseInt(year || '2023', 10),
    };
  });
  return { factors };
}

main().catch((err) => {
  console.error('Fatal import error:', err);
  process.exit(1);
});
