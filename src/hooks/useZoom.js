import { useState, useCallback } from 'react';

export const useZoom = (initialZoom = 1, minZoom = 0.5, maxZoom = 5) => {
  const [zoom, setZoom] = useState(initialZoom);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const handleZoom = useCallback((delta) => {
    setZoom(prevZoom => {
      const newZoom = Math.max(minZoom, Math.min(maxZoom, prevZoom + delta));
      return newZoom;
    });
  }, [minZoom, maxZoom]);

  const handlePan = useCallback((deltaX, deltaY) => {
    setPan(prevPan => ({
      x: prevPan.x + deltaX,
      y: prevPan.y + deltaY
    }));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(initialZoom);
    setPan({ x: 0, y: 0 });
  }, [initialZoom]);

  const zoomIn = useCallback(() => handleZoom(0.1), [handleZoom]);
  const zoomOut = useCallback(() => handleZoom(-0.1), [handleZoom]);

  return {
    zoom,
    pan,
    handleZoom,
    handlePan,
    resetZoom,
    zoomIn,
    zoomOut
  };
};