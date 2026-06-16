# EarthPrint Carbon Emission Calculation Methodology

This document details the mathematical models, emission factors, and assumptions behind EarthPrint's carbon footprint calculator.

All calculations conform to the Intergovernmental Panel on Climate Change (IPCC) Sixth Assessment Report (AR6) 100-year Global Warming Potential (GWP) standard. The unit of measurement is **kg CO₂e** (kilograms of carbon dioxide equivalent), representing the combined warming impact of CO₂, CH₄ (methane), and N₂O (nitrous oxide).

---

## 1. Travel Category (Transport)

### Formula:
$$\text{Emission (kg CO}_2\text{e)} = \text{Distance (km)} \times \text{Emission Factor (kg CO}_2\text{e/km)}$$

### Data Sources:
- **Land Transport**: UK Government (DEFRA/BEIS) 2023 Greenhouse Gas Reporting Conversion Factors.
- **Aviation**: DEFRA 2023 with a Radiative Forcing Index (RFI) multiplier of **1.9** applied to account for the high-altitude warming effects of non-CO₂ emissions (cirrus cloud generation, water vapor, NOx).

### Factors Table:
- **Petrol Car (Average)**: `0.170` kg/km
- **Diesel Car (Average)**: `0.165` kg/km
- **Hybrid Car**: `0.115` kg/km
- **Electric Vehicle (EV)**: `0.045` kg/km (varies by grid region, local average used)
- **Bus**: `0.095` kg/km
- **Train (National Rail)**: `0.035` kg/km
- **Flight (Short-Haul Economy)**: `0.150` kg/km
- **Flight (Long-Haul Economy)**: `0.190` kg/km
- **Flight (Business Class)**: `0.290` kg/km (accounting for higher seating space footprint)

---

## 2. Food Category

### Formula:
$$\text{Emission (kg CO}_2\text{e)} = \text{Weight of Ingredient (kg)} \times \text{Lifecycle Factor (kg CO}_2\text{e/kg food)}$$

### Data Sources:
- Poore, J., & Nemecek, T. (2018). *Reducing food’s environmental impacts through producers and consumers*. Science.
- Scarborough et al. (2014) *Dietary greenhouse gas emissions of meat-eaters, fish-eaters, vegetarians and vegans in the UK*. Climatic Change.

### Baseline Diet Averages (Annualized):
- **Omnivore (High Meat)**: `2,800` kg CO₂e/year
- **Pescatarian**: `1,600` kg CO₂e/year
- **Vegetarian**: `1,200` kg CO₂e/year
- **Vegan**: `800` kg CO₂e/year

---

## 3. Home Energy Category

### Formula:
$$\text{Electricity (kg CO}_2\text{e)} = \text{Usage (kWh)} \times \text{Local Grid Intensity Factor (kg CO}_2\text{e/kWh)}$$
$$\text{Heating Fuel (kg CO}_2\text{e)} = \text{Usage (kWh)} \times \text{Fuel Combustion Factor (kg CO}_2\text{e/kWh)}$$

### Data Sources:
- **Grid Intensity**: International Energy Agency (IEA) 2022 Grid Intensities & Electricity Maps API.
- **Heating Fuels**: DEFRA 2023 fuel properties database.

### Grid Intensity Examples (kg CO₂e/kWh):
- **US average**: `0.370`
- **UK average**: `0.193`
- **France (Nuclear/Hydro)**: `0.055`
- **India (Coal-heavy)**: `0.720`
- **Global average (fallback)**: `0.490`

---

## 4. Shopping & Services Category

### Formula (Spend-Based):
$$\text{Emission (kg CO}_2\text{e)} = \text{Spend in GBP (£)} \times \text{Economic Input-Output Factor (kg CO}_2\text{e/£)}$$

### Data Sources:
- DEFRA 2023 indirect emissions from consumer spending (EIO-LCA model).

### Factors:
- **Clothing/Fashion**: `0.45` kg/£
- **Electronics**: `0.55` kg/£
- **Home Furnishings**: `0.35` kg/£
- **Second-hand Multiplier**: **0.05** (95% reduction factor applied to clothing and electronics bought used).
