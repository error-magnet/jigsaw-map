import { useState, useRef, useEffect } from 'react';
import CountryBlock from './CountryBlock';
import ScoreDisplay from './ScoreDisplay';
import allCountriesData from '../data/countries-generated.json';
import { calculateScore } from '../utils/scoring';
import { useZoom } from '../hooks/useZoom';

const GameBoard = () => {
  const countries = allCountriesData.countries;
  const gameBoardRef = useRef(null);
  
  // Detect mobile and set appropriate initial zoom
  const isMobile = window.innerWidth <= 768;
  const initialZoom = isMobile ? 0.6 : 1;
  
  const { zoom, pan, handleZoom, handlePan, resetZoom, zoomIn, zoomOut } = useZoom(initialZoom, 0.5, 10);
  
  // Set initial pan position for mobile to show more of the right side of the map
  const [initialPanSet, setInitialPanSet] = useState(false);
  
  useEffect(() => {
    if (isMobile && !initialPanSet) {
      handlePan(-150, 0); // Move view 150px to the right
      setInitialPanSet(true);
    }
  }, [isMobile, initialPanSet, handlePan]);
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState(null);
  const [touches, setTouches] = useState([]);
  
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
  const [isFullSolutionShown, setIsFullSolutionShown] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showCountriesModal, setShowCountriesModal] = useState(false);
  const [currentRandomCountry, setCurrentRandomCountry] = useState(null);

  const [countryScores, setCountryScores] = useState({});
  const [confettiCountry, setConfettiCountry] = useState(null);
  const [feedbackText, setFeedbackText] = useState({});

  const handlePositionChange = (countryName, position) => {
    setUserPositions(prev => ({
      ...prev,
      [countryName]: position
    }));

    // Calculate real-time score for this country
    const country = countries.find(c => c.name === countryName);
    if (country) {
      const distance = Math.sqrt(
        Math.pow(position.x - country.correctPosition.x, 2) + 
        Math.pow(position.y - country.correctPosition.y, 2)
      );
      const maxDistance = 500;
      const normalizedDistance = Math.min(distance / maxDistance, 1);
      const countryScore = Math.max(0, 100 * (1 - normalizedDistance));
      const roundedScore = Math.round(countryScore);
      
      // Always update the score
      setCountryScores(prev => ({
        ...prev,
        [countryName]: roundedScore
      }));
    }
  };

  const handleDragEnd = (countryName) => {
    // Get the current score for this country
    const score = countryScores[countryName];
    if (typeof score !== 'number') return;

    // Show feedback based on score - always show one of these on drag end
    if (score >= 95) {
      // Show confetti for excellent placement
      setConfettiCountry(countryName);
      setTimeout(() => setConfettiCountry(null), 1000);
    } else {
      // Show feedback text
      let feedbackMessage = '';
      if (score >= 90) {
        feedbackMessage = 'Very close!';
      } else if (score >= 50) {
        feedbackMessage = 'Almost there!';
      } else {
        feedbackMessage = 'Far!!';
      }

      setFeedbackText(prev => ({
        ...prev,
        [countryName]: feedbackMessage
      }));

      // Hide feedback text after 1 second
      setTimeout(() => {
        setFeedbackText(prev => {
          const updated = { ...prev };
          delete updated[countryName];
          return updated;
        });
      }, 1000);
    }
  };

  const handleSubmit = () => {
    const calculatedScore = calculateScore(userPositions, countries);
    setScore(calculatedScore);
    setGamePhase('submitted');
    setShowScorePopup(true);
  };

  const handleReset = () => {
    setUserPositions(getInitialPositions());
    setGamePhase('placing');
    setScore(null);
    setShowCorrectPositions(false);
    setShowScorePopup(false);
    setSolutionShown(false);
    setIsFullSolutionShown(false);
    setCountryScores({});
    setConfettiCountry(null);
    setFeedbackText({});
    resetZoom();
    getRandomCountry();
  };

  const toggleCorrectPositions = () => {
    setShowCorrectPositions(!showCorrectPositions);
  };

  const showPartialSolution = () => {
    setShowCorrectPositions(true);
    setSolutionShown(true);
  };

  const showFullSolution = () => {
    const solutionPositions = {};
    countries.forEach(country => {
      solutionPositions[country.name] = country.correctPosition;
    });
    setUserPositions(solutionPositions);
    setIsFullSolutionShown(true);
    setSolutionShown(true);
  };

  const getRandomCountry = () => {
    const unplacedCountries = countries.filter(country => !userPositions[country.name]);
    if (unplacedCountries.length === 0) {
      setCurrentRandomCountry(null);
      return null;
    }
    
    // Calculate total weighted population
    const totalWeightedPopulation = unplacedCountries.reduce((sum, country) => {
      // Use square root to moderate the population bias - still favors high pop but not too extremely
      return sum + Math.sqrt(country.population || 1);
    }, 0);
    
    // Generate random number between 0 and total weighted population
    let randomWeight = Math.random() * totalWeightedPopulation;
    
    // Find the country that corresponds to this random weight
    for (let country of unplacedCountries) {
      const countryWeight = Math.sqrt(country.population || 1);
      if (randomWeight <= countryWeight) {
        setCurrentRandomCountry(country);
        return country;
      }
      randomWeight -= countryWeight;
    }
    
    // Fallback (should not reach here)
    const randomCountry = unplacedCountries[unplacedCountries.length - 1];
    setCurrentRandomCountry(randomCountry);
    return randomCountry;
  };

  const handleRandomCountryPlace = () => {
    if (currentRandomCountry) {
      handlePositionChange(currentRandomCountry.name, { x: 120, y: 20 });
      // Get next random country
      setTimeout(() => getRandomCountry(), 100);
    }
  };

  // Helper function to get distance between two touches
  const getTouchDistance = (touches) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  // Helper function to get center point of two touches
  const getTouchCenter = (touches) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
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

  // Touch event handlers
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touchArray = Array.from(e.touches);
    setTouches(touchArray);

    if (touchArray.length === 1) {
      // Single touch - start panning
      const touch = touchArray[0];
      if (e.target === gameBoardRef.current || e.target.classList.contains('game-world')) {
        setIsPanning(true);
        setLastMousePos({ x: touch.clientX, y: touch.clientY });
      }
    } else if (touchArray.length === 2) {
      // Two touches - prepare for pinch zoom
      setIsPanning(false);
      setLastTouchDistance(getTouchDistance(touchArray));
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touchArray = Array.from(e.touches);
    
    if (touchArray.length === 1 && isPanning) {
      // Single touch panning
      const touch = touchArray[0];
      const deltaX = touch.clientX - lastMousePos.x;
      const deltaY = touch.clientY - lastMousePos.y;
      handlePan(deltaX, deltaY);
      setLastMousePos({ x: touch.clientX, y: touch.clientY });
    } else if (touchArray.length === 2 && lastTouchDistance !== null) {
      // Two touch pinch zoom
      const currentDistance = getTouchDistance(touchArray);
      const distanceChange = currentDistance - lastTouchDistance;
      const zoomDelta = distanceChange * 0.002; // Adjust sensitivity
      
      handleZoom(zoomDelta);
      setLastTouchDistance(currentDistance);
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    const touchArray = Array.from(e.touches);
    
    if (touchArray.length === 0) {
      // All touches ended
      setIsPanning(false);
      setLastTouchDistance(null);
      setTouches([]);
    } else if (touchArray.length === 1) {
      // One touch remaining, switch to panning mode
      setLastTouchDistance(null);
      const touch = touchArray[0];
      setIsPanning(true);
      setLastMousePos({ x: touch.clientX, y: touch.clientY });
    }
  };

  useEffect(() => {
    const gameBoard = gameBoardRef.current;
    if (gameBoard) {
      gameBoard.addEventListener('wheel', handleWheel, { passive: false });
      gameBoard.addEventListener('touchstart', handleTouchStart, { passive: false });
      gameBoard.addEventListener('touchmove', handleTouchMove, { passive: false });
      gameBoard.addEventListener('touchend', handleTouchEnd, { passive: false });
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        gameBoard.removeEventListener('wheel', handleWheel);
        gameBoard.removeEventListener('touchstart', handleTouchStart);
        gameBoard.removeEventListener('touchmove', handleTouchMove);
        gameBoard.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPanning, lastMousePos, lastTouchDistance, handleZoom, handlePan]);

  // Initialize random country on component mount only
  useEffect(() => {
    getRandomCountry();
  }, []); // Empty dependency array - only run on mount

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="header-content">
          <h1>Jigsaw Map</h1>
          <p>Place countries on the map!</p>
        </div>
        
        <div className="header-controls">
          {currentRandomCountry && (
            <div className="random-country-section">
              <div className="random-country-container">
                <CountryBlock
                  country={currentRandomCountry}
                  onPositionChange={(countryName, position) => {
                    handlePositionChange(countryName, position);
                    // Trigger feedback immediately for header drops, then change random country
                    setTimeout(() => {
                      handleDragEnd(countryName);
                      setTimeout(() => getRandomCountry(), 50);
                    }, 50);
                  }}
                  onDragEnd={handleDragEnd}
                  isPlaced={false}
                  position={null}
                  onPan={handlePan}
                  gameBoardRef={gameBoardRef}
                  zoom={zoom}
                  pan={pan}
                  score={countryScores[currentRandomCountry?.name]}
                  showConfetti={confettiCountry === currentRandomCountry?.name}
                  feedbackText={feedbackText[currentRandomCountry?.name]}
                />
              </div>
              <span className="place-this-subtitle">drag this!</span>
            </div>
          )}
          <div className="button-separator"></div>
          <div className="countries-button-section">
            <button 
              className="btn-countries" 
              onClick={() => setShowCountriesModal(true)}
            >
              <span className="plus-icon">+</span> Countries
            </button>
            <span className="countries-subtitle">or select from list</span>
          </div>
          <div className="button-separator"></div>
          <div className="action-buttons">
            {!solutionShown && (
              <button 
                className="btn-primary" 
                onClick={handleSubmit}
              >
                Check Score
              </button>
            )}
            <button 
              className="btn-secondary" 
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
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
          
          {countries.map((country) => (
            userPositions[country.name] && (
              <CountryBlock
                key={country.name}
                country={country}
                onPositionChange={handlePositionChange}
                onDragEnd={handleDragEnd}
                isPlaced={true}
                position={userPositions[country.name]}
                onPan={handlePan}
                gameBoardRef={gameBoardRef}
                zoom={zoom}
                pan={pan}
                score={countryScores[country.name]}
                showConfetti={confettiCountry === country.name}
                feedbackText={feedbackText[country.name]}
              />
            )
          ))}
          
          {showCorrectPositions && !isFullSolutionShown && (
            <div className="correct-positions">
              {countries
                .filter(country => userPositions[country.name]) // Only show correct positions for placed countries
                .map(country => (
                  <div
                    key={`correct-${country.name}`}
                    className="correct-position"
                    style={{
                      position: 'absolute',
                      left: country.correctPosition.x,
                      top: country.correctPosition.y,
                      backgroundColor: 'rgba(0, 255, 0, 0.3)',
                      border: '2px solid green',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '6px',
                      fontSize: '0.6rem',
                      fontWeight: 'bold',
                      display: 'inline-block',
                      minWidth: '40px',
                      textAlign: 'center',
                      zIndex: 1000,
                      transform: `scale(${1/zoom})`, // Counter the zoom scale
                      transformOrigin: 'top left' // Keep position consistent
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

      {/* Bottom Controls */}
      <div className="bottom-controls">
        <div className="bottom-buttons">
          <button 
            className="btn-black" 
            onClick={() => setShowHelpModal(true)}
          >
            How to Play
          </button>
          {!solutionShown && (
            <button 
              className="btn-black" 
              onClick={showPartialSolution}
            >
              Show Solution
            </button>
          )}
        </div>
        <div className="right-controls">
          {!solutionShown && (
            <button 
              className="btn-black" 
              onClick={showFullSolution}
              style={{ marginRight: '0.5rem' }}
            >
              Show Full Solution
            </button>
          )}
          <a 
            href="https://github.com/error-magnet/jigsaw-map" 
            target="_blank" 
            rel="noopener noreferrer"
            className="github-link-bottom"
            title="View source code on GitHub"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
        </div>
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

      {/* Help Modal */}
      {showHelpModal && (
        <div className="score-popup-overlay" onClick={() => setShowHelpModal(false)}>
          <div className="help-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="close-popup" 
              onClick={() => setShowHelpModal(false)}
            >
              ×
            </button>
            <div className="help-content">
              <h2>How to Play Jigsaw Map</h2>
              
              <div className="help-section">
                <h3>🎯 Objective</h3>
                <p>Place countries on the world map as close as possible to their correct geographical positions.</p>
              </div>
              
              <div className="help-section">
                <h3>📍 Getting Started</h3>
                <p>India, USA, and UK are already placed as reference points to help you get oriented.</p>
              </div>
              
              <div className="help-section">
                <h3>🎮 Two Ways to Add Countries</h3>
                <ul>
                  <li><strong>Quick Play:</strong> Drag the suggested country from the top directly to the map</li>
                  <li><strong>Choose Your Own:</strong> Click "+ Countries" to browse and select from the full list</li>
                </ul>
              </div>
              
              
              <div className="help-section">
                <h3>📊 Scoring</h3>
                <ul>
                  <li><strong>Green (90-100):</strong> Correct placement</li>
                  <li><strong>Yellow (50-89):</strong> Almost there</li>
                  <li><strong>Red (0-49):</strong> Off target</li>
                  <li>Click "Check Score" anytime to see your progress</li>
                </ul>
              </div>
              
              <div className="help-section">
                <h3>🌍 Location System</h3>
                <p>Country positions are based on their capital city GPS coordinates. The closer you place a country to its capital, the higher your score!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Countries Modal */}
      {showCountriesModal && (
        <div className="score-popup-overlay" onClick={() => setShowCountriesModal(false)}>
          <div className="countries-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="close-popup" 
              onClick={() => setShowCountriesModal(false)}
            >
              ×
            </button>
            <div className="countries-modal-content">
              <h2>Add Countries to the Map</h2>
              
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
                                // Calculate position in current viewport - place at top-left of visible area
                                const viewportX = -pan.x / zoom + 50; // 50px offset from left edge
                                const viewportY = -pan.y / zoom + 50; // 50px offset from top edge
                                handlePositionChange(country.name, { x: viewportX, y: viewportY });
                                setShowCountriesModal(false); // Close modal after adding
                              }}
                            >
                              {country.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;