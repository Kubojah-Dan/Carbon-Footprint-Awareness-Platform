import { loadEmissionFactors } from '../packages/emission-engine/src/factors/loader';

function validate() {
  console.log('🔍 Starting emission factors validation...');

  try {
    const tables = loadEmissionFactors();

    console.log(`Loaded emission factors from: ${tables.loadedAt}`);
    
    let errorsCount = 0;

    // Validate transport factors
    console.log(`- Transport factors: ${tables.transport.length} items`);
    tables.transport.forEach((f, index) => {
      if (!f.mode) {
        console.error(`❌ Transport factor at index ${index} is missing 'mode'`);
        errorsCount++;
      }
      if (typeof f.kgCo2ePerPassengerKm !== 'number' || isNaN(f.kgCo2ePerPassengerKm) || f.kgCo2ePerPassengerKm < 0) {
        console.error(`❌ Transport factor ${f.mode} has invalid 'kgCo2ePerPassengerKm': ${f.kgCo2ePerPassengerKm}`);
        errorsCount++;
      }
    });

    // Validate food factors
    console.log(`- Food factors: ${tables.food.length} items`);
    tables.food.forEach((f, index) => {
      if (!f.foodType) {
        console.error(`❌ Food factor at index ${index} is missing 'foodType'`);
        errorsCount++;
      }
      if (typeof f.kgCo2ePerKg !== 'number' || isNaN(f.kgCo2ePerKg) || f.kgCo2ePerKg < 0) {
        console.error(`❌ Food factor ${f.foodType} has invalid 'kgCo2ePerKg': ${f.kgCo2ePerKg}`);
        errorsCount++;
      }
    });

    // Validate grid factors
    console.log(`- Grid intensity factors: ${tables.grid.length} items`);
    tables.grid.forEach((f, index) => {
      if (!f.region) {
        console.error(`❌ Grid factor at index ${index} is missing 'region'`);
        errorsCount++;
      }
      if (typeof f.kgCo2ePerKwh !== 'number' || isNaN(f.kgCo2ePerKwh) || f.kgCo2ePerKwh < 0) {
        console.error(`❌ Grid factor ${f.region} has invalid 'kgCo2ePerKwh': ${f.kgCo2ePerKwh}`);
        errorsCount++;
      }
    });

    // Validate fuel factors
    console.log(`- Fuel combustion factors: ${tables.fuel.length} items`);
    tables.fuel.forEach((f, index) => {
      if (!f.fuelType) {
        console.error(`❌ Fuel factor at index ${index} is missing 'fuelType'`);
        errorsCount++;
      }
      if (typeof f.kgCo2ePerKwh !== 'number' || isNaN(f.kgCo2ePerKwh) || f.kgCo2ePerKwh < 0) {
        console.error(`❌ Fuel factor ${f.fuelType} has invalid 'kgCo2ePerKwh': ${f.kgCo2ePerKwh}`);
        errorsCount++;
      }
    });

    // Validate shopping factors
    console.log(`- Shopping factors: ${tables.shopping.length} items`);
    tables.shopping.forEach((f, index) => {
      if (!f.category) {
        console.error(`❌ Shopping factor at index ${index} is missing 'category'`);
        errorsCount++;
      }
      if (typeof f.kgCo2ePerGbp !== 'number' || isNaN(f.kgCo2ePerGbp) || f.kgCo2ePerGbp < 0) {
        console.error(`❌ Shopping factor ${f.category} has invalid 'kgCo2ePerGbp': ${f.kgCo2ePerGbp}`);
        errorsCount++;
      }
    });

    if (errorsCount > 0) {
      console.error(`❌ Validation failed with ${errorsCount} errors.`);
      process.exit(1);
    } else {
      console.log('✅ All emission factors validated successfully! All schemas matched.');
    }
  } catch (error: any) {
    console.error('❌ Validation crashed:', error.message || error);
    process.exit(1);
  }
}

validate();
