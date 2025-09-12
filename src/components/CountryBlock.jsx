import { useState } from 'react';

const CountryBlock = ({ country, onPositionChange, onDragEnd, isPlaced, position, onPan, gameBoardRef, zoom, pan, score, showConfetti, feedbackText }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(null);

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
      
      // Update position for placed countries or track drag position for header countries
      if (isPlaced) {
        // Update position immediately for responsive dragging
        requestAnimationFrame(() => {
          onPositionChange(country.name, {
            x: startPosX + deltaX,
            y: startPosY + deltaY
          });
        });
      } else {
        // For header countries, track drag position for visual feedback
        setDragPosition({
          x: currentPos.x,
          y: currentPos.y
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
      setDragPosition(null);
      
      let feedbackTriggered = false;
      
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
          // Convert screen coordinates to game world coordinates (accounting for zoom and pan)
          const gameX = (currentPos.x - rect.left - pan.x * zoom) / zoom;
          const gameY = (currentPos.y - rect.top - pan.y * zoom) / zoom;
          
          // Offset by half the country block size to center it on the drop point
          const centeredX = gameX - 25; // Approximate half-width of country block
          const centeredY = gameY - 15; // Approximate half-height of country block
          
          onPositionChange(country.name, { x: centeredX, y: centeredY });
          
          // For header countries, feedback is handled in GameBoard's onPositionChange
          // Don't trigger additional feedback here
          feedbackTriggered = true;
        }
      } else if (isPlaced) {
        // For placed countries that were just moved, trigger feedback
        setTimeout(() => onDragEnd && onDragEnd(country.name), 50);
        feedbackTriggered = true;
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

  // Determine background color based on score if available and placed
  let backgroundColor, textColor;
  
  if (isPlaced && typeof score === 'number') {
    // Use score-based colors with dynamic gradients
    if (score >= 90) {
      // Green gradient for excellent scores (90-100)
      const intensity = Math.min((score - 90) / 10, 1); // 0 to 1
      const green = Math.round(155 + intensity * 100); // 155 to 255
      backgroundColor = `rgb(34, ${green}, 94)`;
      textColor = 'white';
    } else if (score >= 70) {
      // Yellow-orange gradient for good scores (70-89)
      const intensity = (score - 70) / 20; // 0 to 1
      const red = Math.round(255 - intensity * 20); // 255 to 235
      const green = Math.round(140 + intensity * 75); // 140 to 215
      backgroundColor = `rgb(${red}, ${green}, 8)`;
      textColor = 'black';
    } else if (score >= 40) {
      // Orange to red gradient for poor scores (40-69)
      const intensity = (score - 40) / 30; // 0 to 1
      const red = 239;
      const green = Math.round(68 + intensity * 100); // 68 to 168
      backgroundColor = `rgb(${red}, ${green}, 68)`;
      textColor = 'white';
    } else {
      // Deep red for very poor scores (0-39)
      const intensity = score / 40; // 0 to 1
      const red = Math.round(139 + intensity * 100); // 139 to 239
      backgroundColor = `rgb(${red}, 68, 68)`;
      textColor = 'white';
    }
  } else {
    // Use original muted country colors for unplaced or unscored countries
    const mutedRgb = hexToMuted(country.color);
    backgroundColor = `rgb(${mutedRgb.r}, ${mutedRgb.g}, ${mutedRgb.b})`;
    const luminance = getLuminance(mutedRgb.r, mutedRgb.g, mutedRgb.b);
    textColor = luminance > 0.5 ? 'black' : 'white';
  }

  return (
    <>
      <div
        className={`country-block ${isDragging ? 'dragging' : ''} ${!isPlaced ? 'header-country' : ''}`}
        style={{
          backgroundColor: backgroundColor,
          borderColor: country.color,
          color: textColor,
          position: isPlaced ? 'absolute' : 'relative',
          left: isPlaced ? (position?.x || 0) : 'auto',
          top: isPlaced ? (position?.y || 0) : 'auto',
          cursor: 'grab',
          opacity: (isDragging && !isPlaced) ? 0.5 : 1,
          transform: isPlaced ? `scale(${1/zoom})` : 'none', // Counter the zoom scale
          transformOrigin: 'top left', // Keep position consistent
          zIndex: 10 // Normal z-index
        }}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        <span style={{ 
          display: 'block',
          textAlign: 'center',
          position: 'relative',
          paddingLeft: '6px' // Make room for the dot on the left
        }}>
          {country.name}
        </span>
        
        {/* Top-left positioning dot - represents the coordinate */}
        <div style={{
          position: 'absolute',
          top: '2px',
          left: '2px',
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          backgroundColor: textColor,
          opacity: 0.7
        }} />
        
        {showConfetti && (
          <span style={{ 
            position: 'absolute', 
            top: '-15px', 
            right: '-10px', 
            fontSize: '16px',
            animation: 'bounce 0.6s ease-in-out',
            zIndex: 1001
          }}>
            🎉
          </span>
        )}
        
        {feedbackText && (
          <span style={{ 
            position: 'absolute', 
            top: '-25px', 
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '10px',
            fontWeight: 'bold',
            color: score >= 90 ? '#22c55e' : score >= 70 ? '#eab308' : '#ef4444',
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '2px 6px',
            borderRadius: '4px',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            animation: 'bounce 0.6s ease-in-out',
            zIndex: 1002,
            whiteSpace: 'nowrap'
          }}>
            {feedbackText}
          </span>
        )}
      </div>
      
      {/* Drag preview for header countries */}
      {isDragging && !isPlaced && dragPosition && (
        <div
          className="country-block drag-preview"
          style={{
            backgroundColor: backgroundColor,
            borderColor: country.color,
            color: textColor,
            position: 'fixed',
            left: dragPosition.x - 30,
            top: dragPosition.y - 15,
            cursor: 'grabbing',
            pointerEvents: 'none',
            zIndex: 1000,
            opacity: 0.9,
            transform: 'scale(1.05)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}
        >
          <span style={{ 
            display: 'block',
            textAlign: 'center',
            position: 'relative',
            paddingLeft: '6px' // Make room for the dot on the left
          }}>
            {country.name}
          </span>
          
          {/* Top-left positioning dot - represents the coordinate */}
          <div style={{
            position: 'absolute',
            top: '2px',
            left: '2px',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            backgroundColor: textColor,
            opacity: 0.7
          }} />
        </div>
      )}
    </>
  );
};

export default CountryBlock;