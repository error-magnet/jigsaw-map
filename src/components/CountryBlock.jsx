import { useState } from 'react';

const CountryBlock = ({ country, onPositionChange, isPlaced, position, index, onPan, gameBoardRef }) => {
  const [isDragging, setIsDragging] = useState(false);

  const getEventPosition = (e) => {
    // Handle both mouse and touch events
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const checkAndPan = (clientX, clientY) => {
    if (!gameBoardRef?.current || !onPan || !isDragging) return;

    const gameBoard = gameBoardRef.current;
    const rect = gameBoard.getBoundingClientRect();
    const edgeThreshold = 30; // Reduced threshold for less intrusive panning
    const panSpeed = 2; // Reduced speed for smoother experience

    // Calculate distances from edges
    const distanceFromLeft = clientX - rect.left;
    const distanceFromRight = rect.right - clientX;
    const distanceFromTop = clientY - rect.top;
    const distanceFromBottom = rect.bottom - clientY;

    let panX = 0;
    let panY = 0;

    // Determine pan direction and speed
    if (distanceFromLeft < edgeThreshold && distanceFromLeft > 0) {
      panX = panSpeed; // Pan right (move viewport left)
    } else if (distanceFromRight < edgeThreshold && distanceFromRight > 0) {
      panX = -panSpeed; // Pan left (move viewport right)
    }

    if (distanceFromTop < edgeThreshold && distanceFromTop > 0) {
      panY = panSpeed; // Pan down (move viewport up)
    } else if (distanceFromBottom < edgeThreshold && distanceFromBottom > 0) {
      panY = -panSpeed; // Pan up (move viewport down)
    }

    // Apply panning if needed
    if (panX !== 0 || panY !== 0) {
      onPan(panX, panY);
    }
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
      
      // Only update position for placed countries (not header countries)
      if (isPlaced) {
        // Update position immediately for responsive dragging
        requestAnimationFrame(() => {
          onPositionChange(country.name, {
            x: startPosX + deltaX,
            y: startPosY + deltaY
          });
        });
      }

      // Only check for panning occasionally to reduce performance impact
      if (Math.abs(deltaX) % 10 === 0 || Math.abs(deltaY) % 10 === 0) {
        checkAndPan(currentPos.x, currentPos.y);
      }
    };

    const handleEnd = (e) => {
      e.preventDefault();
      setIsDragging(false);
      
      // For header countries (not placed), check if dropped on game board
      if (!isPlaced && gameBoardRef?.current) {
        const currentPos = getEventPosition(e.changedTouches ? e.changedTouches[0] : e);
        const rect = gameBoardRef.current.getBoundingClientRect();
        
        // Check if dropped inside the game board
        const isInGameBoard = currentPos.x >= rect.left && 
                             currentPos.x <= rect.right && 
                             currentPos.y >= rect.top && 
                             currentPos.y <= rect.bottom;
        
        if (isInGameBoard) {
          // Convert screen coordinates to game board coordinates
          const gameX = currentPos.x - rect.left;
          const gameY = currentPos.y - rect.top;
          
          onPositionChange(country.name, { x: gameX, y: gameY });
        }
      }
      
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
      className={`country-block ${isDragging ? 'dragging' : ''} ${!isPlaced ? 'header-country' : ''}`}
      style={{
        backgroundColor: backgroundColor,
        borderColor: country.color,
        color: textColor,
        position: isPlaced ? 'absolute' : 'relative',
        left: isPlaced ? (position?.x || 0) : 'auto',
        top: isPlaced ? (position?.y || 0) : 'auto',
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