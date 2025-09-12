import { useState } from 'react';

const CountryBlock = ({ country, onPositionChange, isPlaced, position, index }) => {
  const [isDragging, setIsDragging] = useState(false);

  const getEventPosition = (e) => {
    // Handle both mouse and touch events
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handleStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    
    const startPos = getEventPosition(e);
    const startPosX = position?.x || 0;
    const startPosY = position?.y || 0;

    const handleMove = (e) => {
      e.preventDefault();
      const currentPos = getEventPosition(e);
      const deltaX = currentPos.x - startPos.x;
      const deltaY = currentPos.y - startPos.y;
      
      onPositionChange(country.name, {
        x: startPosX + deltaX,
        y: startPosY + deltaY
      });
    };

    const handleEnd = (e) => {
      e.preventDefault();
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };

    document.addEventListener('mousemove', handleMove, { passive: false });
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
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
      onMouseDown={handleStart}
      onTouchStart={handleStart}
    >
      {country.name}
    </div>
  );
};

export default CountryBlock;