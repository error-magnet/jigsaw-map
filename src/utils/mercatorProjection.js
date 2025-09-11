export const mercatorProjection = (lat, lon, canvasWidth = 900, canvasHeight = 600) => {
  // Convert latitude and longitude to Mercator projection
  // Longitude: -180 to 180 maps to 0 to canvasWidth
  const x = ((lon + 180) / 360) * canvasWidth;
  
  // Latitude: use Mercator projection formula
  // Convert latitude to radians
  const latRad = (lat * Math.PI) / 180;
  
  // Mercator projection for latitude
  const mercatorY = Math.log(Math.tan((Math.PI / 4) + (latRad / 2)));
  
  // Optimized range for actual country coordinates
  // Greenland (64.18°N) to New Zealand (-41.29°S)
  // Mercator Y for 64.18°N ≈ 1.64, for -41.29°S ≈ -0.73
  const minMercatorY = -0.8;   // Slightly below southernmost country
  const maxMercatorY = 1.7;    // Slightly above northernmost country
  const range = maxMercatorY - minMercatorY;
  
  // Normalize to canvas height and invert Y axis (canvas Y increases downward)
  const y = canvasHeight - ((mercatorY - minMercatorY) / range) * canvasHeight;
  
  return { x: Math.round(x), y: Math.round(y) };
};

export const parseCSVLine = (line) => {
  const result = [];
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
};