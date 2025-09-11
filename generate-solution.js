import fs from 'fs';
import { mercatorProjection } from './src/utils/mercatorProjection.js';

try {
  // Read the original GPS data
  const originalData = JSON.parse(fs.readFileSync('./src/data/countries-original-gps.json', 'utf-8'));
  
  const countries = [];
  
  // Default positions for countries that aren't placed yet
  const defaultPositions = [
    { x: 50, y: 50 }, { x: 120, y: 50 }, { x: 190, y: 50 }, { x: 260, y: 50 },
    { x: 50, y: 120 }, { x: 120, y: 120 }, { x: 190, y: 120 }, { x: 260, y: 120 },
    { x: 50, y: 190 }, { x: 120, y: 190 }, { x: 190, y: 190 }, { x: 260, y: 190 }
  ];
  
  let countryIndex = 0;
  
  // Convert each country from GPS coordinates to canvas coordinates
  for (const [countryName, countryInfo] of Object.entries(originalData)) {
    const lat = countryInfo.gps.latitude;
    const lon = countryInfo.gps.longitude;
    
    // Convert GPS to Mercator projection for 900x600 canvas
    const position = mercatorProjection(lat, lon, 900, 550);
    
    const countryData = {
      name: countryName,
      capital: countryInfo.capital,
      correctPosition: position,
      gpsCoordinates: countryInfo.gps,
      population: countryInfo.population,
      color: countryInfo.color,
      // Assign default position based on index (cycling through positions)
      defaultPosition: defaultPositions[countryIndex % defaultPositions.length]
    };
    
    countries.push(countryData);
    countryIndex++;
  }
  
  // Create the generated data structure
  const outputData = {
    projection: 'mercator',
    canvasSize: { width: 900, height: 600 },
    countries: countries.sort((a, b) => b.population - a.population) // Sort by population (highest first)
  };
  
  // Write the generated file
  fs.writeFileSync('./src/data/countries-generated.json', JSON.stringify(outputData, null, 2));
  
  console.log(`✅ Generated countries-generated.json with ${countries.length} countries`);
  console.log(`📊 Canvas size: ${outputData.canvasSize.width}x${outputData.canvasSize.height}`);
  console.log(`🗺️  Projection: ${outputData.projection}`);
  
  // Show a few sample entries
  console.log('\n📍 Sample entries:');
  countries.slice(0, 5).forEach(c => {
    console.log(`   ${c.name} (${c.capital}): GPS(${c.gpsCoordinates.latitude}, ${c.gpsCoordinates.longitude}) → Canvas(${c.correctPosition.x}, ${c.correctPosition.y})`);
  });
  
} catch (error) {
  console.error('❌ Error generating solution:', error);
  console.log('\n💡 Make sure you have:');
  console.log('   - src/data/countries-original-gps.json file');
  console.log('   - src/utils/mercatorProjection.js file');
}