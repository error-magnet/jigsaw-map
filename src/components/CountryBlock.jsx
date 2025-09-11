import { useState } from 'react';

const CountryBlock = ({ country, onPositionChange, isPlaced, position, index }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = position?.x || 0;
    const startPosY = position?.y || 0;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      onPositionChange(country.name, {
        x: startPosX + deltaX,
        y: startPosY + deltaY
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Convert hex color to muted version
  const hexToMuted = (hex) => {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse RGB values
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Desaturate and lighten the colors
    const avg = (r + g + b) / 3;
    const factor = 0.4; // How much to desaturate (0 = gray, 1 = original)
    const lighten = 0.3; // How much to lighten
    
    const newR = Math.min(255, Math.round(r * factor + avg * (1 - factor) + lighten * 255));
    const newG = Math.min(255, Math.round(g * factor + avg * (1 - factor) + lighten * 255));
    const newB = Math.min(255, Math.round(b * factor + avg * (1 - factor) + lighten * 255));
    
    return { r: newR, g: newG, b: newB };
  };

  // Calculate luminance to determine text color
  const getLuminance = (r, g, b) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const mutedRgb = hexToMuted(country.color);
  const backgroundColor = `rgb(${mutedRgb.r}, ${mutedRgb.g}, ${mutedRgb.b})`;
  const luminance = getLuminance(mutedRgb.r, mutedRgb.g, mutedRgb.b);
  const textColor = luminance > 0.5 ? 'black' : 'white';

  return (
    <div
      className={`country-block ${isDragging ? 'dragging' : ''}`}
      style={{
        backgroundColor: backgroundColor,
        borderColor: country.color,
        color: textColor,
        position: isPlaced ? 'absolute' : 'relative',
        left: position?.x || 0,
        top: position?.y || 0,
        cursor: 'grab'
      }}
      onMouseDown={handleMouseDown}
    >
      {country.name}
    </div>
  );
};

export default CountryBlock;