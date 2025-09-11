const ScoreDisplay = ({ score, showDetails = false }) => {
  if (!score) return null;

  // Calculate performance categories (excluding initial countries)
  const categories = {
    correct: 0,      // >=80%
    almostThere: 0,  // 50-79%
    off: 0           // <50%
  };

  const initialCountries = ['India', 'United States of America', 'UK'];

  Object.entries(score.individualScores).forEach(([country, countryScore]) => {
    // Skip initial countries from category counts
    // Only count countries that were actually placed (score > 0 means they were placed)
    if (!initialCountries.includes(country) && countryScore > 0) {
      if (countryScore >= 80) {
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
      <div className="total-score">
        <div className="score-circle">
          <div className="score-number">{score.percentage}</div>
          <div className="score-label">out of 100</div>
        </div>
        <h2>Final Score</h2>
        <div className="performance-stats">
          <div className="stat-item correct">
            <span className="stat-number">{categories.correct}</span>
            <span className="stat-label">Correct</span>
          </div>
          <div className="stat-item almost">
            <span className="stat-number">{categories.almostThere}</span>
            <span className="stat-label">Almost There</span>
          </div>
          <div className="stat-item off">
            <span className="stat-number">{categories.off}</span>
            <span className="stat-label">Off</span>
          </div>
        </div>
      </div>
      
      {showDetails && (
        <div className="individual-scores">
          <h3>Top Country Scores:</h3>
          <div className="scores-columns">
            {Object.entries(score.individualScores)
              .filter(([country, countryScore]) => {
                // Only show countries that user actually placed (exclude initial countries and unplaced)
                const isInitial = ['India', 'United States of America', 'UK'].includes(country);
                return !isInitial && countryScore > 0;
              })
              .sort(([,a], [,b]) => b - a) // Sort by score (highest first)
              .slice(0, 6) // Show top 6 countries
              .map(([country, countryScore]) => {
                return (
                  <div key={country} className="country-score">
                    <span className="country-name">
                      {country}:
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