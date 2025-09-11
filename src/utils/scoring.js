export const calculateDistance = (pos1, pos2) => {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const calculateScore = (userPositions, countries) => {
  let totalScore = 0;
  const maxDistance = 500;
  const scores = {};
  
  // Countries that are placed initially (exclude from scoring)
  const initialCountries = ['India', 'United States of America', 'UK'];
  
  // Filter out initial countries for scoring
  const scoringCountries = countries.filter(country => !initialCountries.includes(country.name));

  scoringCountries.forEach(country => {
    const userPos = userPositions[country.name];
    if (userPos) {
      const distance = calculateDistance(userPos, country.correctPosition);
      const normalizedDistance = Math.min(distance / maxDistance, 1);
      const countryScore = Math.max(0, 100 * (1 - normalizedDistance));
      scores[country.name] = Math.round(countryScore);
      totalScore += countryScore;
    } else {
      scores[country.name] = 0;
    }
  });

  // Add initial countries to scores but don't count them (for display purposes)
  initialCountries.forEach(countryName => {
    const country = countries.find(c => c.name === countryName);
    if (country) {
      scores[country.name] = 100; // Show as perfect since they're placed correctly
    }
  });

  // Calculate percentage out of 100 based only on user-placed countries
  const maxPossibleScore = scoringCountries.length * 100;
  const percentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 100;

  return {
    totalScore: Math.round(totalScore),
    maxScore: maxPossibleScore,
    individualScores: scores,
    percentage: percentage,
    countriesScored: scoringCountries.length
  };
};