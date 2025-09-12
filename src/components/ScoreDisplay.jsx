const ScoreDisplay = ({ score, showDetails = false }) => {
  if (!score) return null;

  // Calculate performance categories (excluding initial countries)
  const categories = {
    correct: 0,      // >=90%
    almostThere: 0,  // 50-89%
    off: 0           // <50%
  };

  const initialCountries = ['India', 'United States of America', 'UK'];

  Object.entries(score.individualScores).forEach(([country, countryScore]) => {
    // Skip initial countries from category counts
    // Only count countries that were actually placed (score >= 0 means they were placed, -1 means not placed)
    if (!initialCountries.includes(country) && countryScore >= 0) {
      if (countryScore >= 90) {
        categories.correct++;
      } else if (countryScore >= 50) {
        categories.almostThere++;
      } else {
        categories.off++;
      }
    }
  });

  return (
    <div className="score-display">
      <div className="score-summary">
        <div className="score-header">
          <div className="performance-stats-horizontal">
            <div className="stat-item correct">
              <span className="stat-number">{categories.correct}</span>
              <span className="stat-label">Correct</span>
            </div>
            <div className="stat-item almost">
              <span className="stat-number">{categories.almostThere}</span>
              <span className="stat-label">Almost</span>
            </div>
            <div className="stat-item off">
              <span className="stat-number">{categories.off}</span>
              <span className="stat-label">Off</span>
            </div>
          </div>
        </div>
      </div>
      
      {showDetails && (
        <div className="individual-scores">
          <div className="scores-grid">
            {Object.entries(score.individualScores)
              .filter(([country, countryScore]) => {
                // Only show countries that user actually placed (exclude initial countries and unplaced)
                // -1 means not placed, 0+ means placed with score
                const isInitial = ['India', 'United States of America', 'UK'].includes(country);
                return !isInitial && countryScore >= 0;
              })
              .sort(([a], [b]) => a.localeCompare(b)) // Sort alphabetically by country name
              .map(([country, countryScore]) => {
                // Determine category for color coding
                let category = 'off';
                if (countryScore >= 90) {
                  category = 'correct';
                } else if (countryScore >= 50) {
                  category = 'almost';
                }
                
                return (
                  <div key={country} className={`country-score ${category}`}>
                    <span className="country-name">
                      {country}
                    </span>
                    <span className="country-points">{countryScore}/100</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreDisplay;