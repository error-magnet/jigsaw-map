import { useState, useRef, useEffect } from 'react';
import CountryBlock from './CountryBlock';
import ScoreDisplay from './ScoreDisplay';
import allCountriesData from '../data/countries-generated.json';
import { calculateScore } from '../utils/scoring';
import { useZoom } from '../hooks/useZoom';

const GameBoard = () => {
  const countries = allCountriesData.countries;
  const gameBoardRef = useRef(null);
  const { zoom, pan, handleZoom, handlePan, resetZoom, zoomIn, zoomOut } = useZoom();
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  
  const getInitialPositions = () => {
    const positions = {};
    // Start with these countries in their correct positions
    const startingCountries = ['India', 'United States of America', 'UK'];
    
    countries.forEach(country => {
      if (startingCountries.includes(country.name)) {
        positions[country.name] = country.correctPosition;
      }
    });
    return positions;
  };

  const [userPositions, setUserPositions] = useState(getInitialPositions());
  const [gamePhase, setGamePhase] = useState('placing'); // 'placing', 'submitted'
  const [score, setScore] = useState(null);
  const [showCorrectPositions, setShowCorrectPositions] = useState(false);
  const [showScorePopup, setShowScorePopup] = useState(false);
  const [solutionShown, setSolutionShown] = useState(false);

  const handlePositionChange = (countryName, position) => {
    setUserPositions(prev => ({
      ...prev,
      [countryName]: position
    }));
  };

  const handleSubmit = () => {
    const calculatedScore = calculateScore(userPositions, countries);
    setScore(calculatedScore);
    setGamePhase('submitted');
    // Show score popup first, then show solution in background after a delay
    setShowScorePopup(true);
    setTimeout(() => showSolution(), 1000);
  };

  const handleReset = () => {
    setUserPositions(getInitialPositions());
    setGamePhase('placing');
    setScore(null);
    setShowCorrectPositions(false);
    setShowScorePopup(false);
    setSolutionShown(false);
    resetZoom();
  };

  const toggleCorrectPositions = () => {
    setShowCorrectPositions(!showCorrectPositions);
  };

  const showSolution = () => {
    const solutionPositions = {};
    countries.forEach(country => {
      solutionPositions[country.name] = country.correctPosition;
    });
    setUserPositions(solutionPositions);
    setSolutionShown(true);
  };

  // Zoom and pan event handlers
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    handleZoom(delta);
  };

  const handleMouseDown = (e) => {
    if (e.target === gameBoardRef.current || e.target.classList.contains('game-world')) {
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;
      handlePan(deltaX, deltaY);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  useEffect(() => {
    const gameBoard = gameBoardRef.current;
    if (gameBoard) {
      gameBoard.addEventListener('wheel', handleWheel, { passive: false });
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        gameBoard.removeEventListener('wheel', handleWheel);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPanning, lastMousePos, handleZoom, handlePan]);

  return (
    <div className="game-container">
      <div className="game-header-controls">
        <div className="header-content">
          <h1>Jigsaw Map</h1>
          <p>Drag country blocks to their correct positions</p>
        </div>
        
        <div className="controls-section">
          {!solutionShown && (
            <button 
              className="btn-primary" 
              onClick={handleSubmit} 
              disabled={gamePhase === 'submitted'}
            >
              Submit Guess
            </button>
          )}
          <button 
            className="btn-secondary" 
            onClick={handleReset}
          >
            Reset
          </button>
          {gamePhase === 'placing' && !solutionShown && (
            <button 
              className="btn-tertiary" 
              onClick={showSolution}
            >
              Show Solution
            </button>
          )}
          
        </div>
      </div>

      <div 
        className="game-board"
        ref={gameBoardRef}
        onMouseDown={handleMouseDown}
        style={{
          cursor: isPanning ? 'grabbing' : 'grab',
          overflow: 'hidden'
        }}
      >
        <div 
          className="game-world"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: '0 0',
            width: '100%',
            height: '100%',
            position: 'relative'
          }}
        >
          
          {countries.map((country, index) => (
            userPositions[country.name] && (
              <CountryBlock
                key={country.name}
                country={country}
                onPositionChange={handlePositionChange}
                isPlaced={true}
                position={userPositions[country.name]}
                index={index}
              />
            )
          ))}
          
          {gamePhase === 'submitted' && showCorrectPositions && (
            <div className="correct-positions">
              {countries.map(country => (
                <div
                  key={`correct-${country.name}`}
                  className="correct-position"
                  style={{
                    position: 'absolute',
                    left: country.correctPosition.x,
                    top: country.correctPosition.y,
                    backgroundColor: 'rgba(0, 255, 0, 0.3)',
                    border: '2px solid green'
                  }}
                >
                  {country.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Floating Zoom Controls */}
        <div className="floating-zoom-controls">
          <button onClick={zoomIn} title="Zoom In">+</button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <button onClick={zoomOut} title="Zoom Out">-</button>
          <button onClick={resetZoom} title="Reset View">🎯</button>
        </div>
      </div>

      <div className="countries-panel">
        <h3>Countries to Add:</h3>
        {(() => {
          const unplacedCountries = countries.filter(country => !userPositions[country.name]);
          const sectionsCount = 10;
          const countriesPerSection = Math.ceil(unplacedCountries.length / sectionsCount);
          
          return Array.from({ length: sectionsCount }, (_, sectionIndex) => {
            const startIndex = sectionIndex * countriesPerSection;
            const endIndex = Math.min(startIndex + countriesPerSection, unplacedCountries.length);
            const sectionCountries = unplacedCountries.slice(startIndex, endIndex);
            
            if (sectionCountries.length === 0) return null;
            
            return (
              <div key={`section-${sectionIndex}`} className="countries-section">
                <div className="countries-list">
                  {sectionCountries.map((country, index) => {
                    // Convert hex color to muted version (same logic as CountryBlock)
                    const hexToMuted = (hex) => {
                      hex = hex.replace('#', '');
                      const r = parseInt(hex.substr(0, 2), 16);
                      const g = parseInt(hex.substr(2, 2), 16);
                      const b = parseInt(hex.substr(4, 2), 16);
                      
                      const avg = (r + g + b) / 3;
                      const factor = 0.4;
                      const lighten = 0.3;
                      
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
                      <button
                        key={`add-${country.name}`}
                        className="add-country-btn"
                        style={{ 
                          backgroundColor: backgroundColor,
                          borderColor: country.color,
                          color: textColor
                        }}
                        onClick={() => {
                          handlePositionChange(country.name, { x: 20, y: 20 }); // Top corner position
                          // Scroll to top to see the canvas
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        + {country.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          });
        })()}
      </div>

      {/* Score Popup */}
      {showScorePopup && score && (
        <div className="score-popup-overlay" onClick={() => setShowScorePopup(false)}>
          <div className="score-popup" onClick={(e) => e.stopPropagation()}>
            <button 
              className="close-popup" 
              onClick={() => setShowScorePopup(false)}
            >
              ×
            </button>
            <ScoreDisplay score={score} showDetails={true} />
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;