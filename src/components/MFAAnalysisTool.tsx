import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';

// Calculate attribute colors for chart
const attributeColors = [
  "#8884d8", // Purple
  "#82ca9d", // Green
  "#ffc658", // Yellow
  "#ff8042", // Orange
  "#0088fe", // Blue
  "#00C49F"  // Teal
];

const MFAAnalysisTool = () => {
  // Use React hooks
  const [attributes, setAttributes] = React.useState([
    { id: 1, name: "Contractor Diversification", weight: 8 },
    { id: 2, name: "Interface & Coordination", weight: 11 },
    { id: 3, name: "Market Resource Availability", weight: 21 },
    { id: 4, name: "Schedule & Delivery Confidence", weight: 30 },
    { id: 5, name: "Financial Certainty", weight: 24 },
    { id: 6, name: "Stakeholder Impact", weight: 6 }
  ]);
  
  const [scenarios, setScenarios] = React.useState([
    { 
      id: 1, 
      name: "Maximum Diversification", 
      description: "All packages separate (5 contractors)",
      ratings: [85, 40, 55, 45, 50, 60] 
    },
    { 
      id: 2, 
      name: "DJT + Regional Stands", 
      description: "DJT + Regional Stands bundled; others separate (4 contractors)",
      ratings: [75, 75, 70, 70, 70, 75] 
    },
    { 
      id: 3, 
      name: "DJT + ITR West", 
      description: "DJT + ITR West bundled; others separate (4 contractors)",
      ratings: [75, 80, 75, 75, 75, 80] 
    },
    { 
      id: 4, 
      name: "Regional + ITR West", 
      description: "Regional Stands + ITR West bundled; others separate (4 contractors)",
      ratings: [75, 65, 65, 60, 60, 65] 
    },
    { 
      id: 5, 
      name: "Three Major Packages", 
      description: "DJT + Regional Stands + ITR West bundled; Renewals separate (3 contractors)",
      ratings: [60, 70, 60, 55, 50, 60] 
    },
    { 
      id: 6, 
      name: "Mega Contractor", 
      description: "DJT + Regional Stands + ITR West + Renewal A bundled; Renewal B separate (2 contractors)",
      ratings: [35, 60, 45, 45, 35, 40] 
    }
  ]);
  
  const [results, setResults] = React.useState([]);
  const [topRecommendation, setTopRecommendation] = React.useState(null);

  // Calculate results when attributes or scenarios change
  React.useEffect(() => {
    // First calculate scores for each scenario
    const calculatedResults = scenarios.map(scenario => {
      let weightedScore = 0;
      let attributeContributions = [];
      
      // Calculate weighted score for each attribute
      attributes.forEach((attr, index) => {
        const rating = scenario.ratings[index];
        const weight = attr.weight / 100;
        const contribution = rating * weight;
        weightedScore += contribution;
        
        attributeContributions.push({
          attributeId: attr.id,
          attributeName: attr.name,
          rating,
          weight: attr.weight,
          contribution
        });
      });
      
      return {
        ...scenario,
        weightedScore: parseFloat(weightedScore.toFixed(1)),
        attributeContributions
      };
    });
    
    // Sort results by weighted score (descending) to get rankings
    const sortedResults = [...calculatedResults].sort((a, b) => b.weightedScore - a.weightedScore);
    
    // Add ranking to each result
    const rankedResults = sortedResults.map((result, index) => ({
      ...result,
      rank: index + 1
    }));
    
    // Now sort back by ID to maintain the same order as scenarios display
    const idSortedResults = [...rankedResults].sort((a, b) => a.id - b.id);
    
    setResults(idSortedResults);
    if (rankedResults.length > 0) {
      setTopRecommendation(rankedResults[0]); // Top recommendation is still the highest score
    }
  }, [attributes, scenarios]);

  // Handle weight change while maintaining total of exactly 100%
  const handleWeightChange = (id, newWeight) => {
    const currentAttr = attributes.find(attr => attr.id === id);
    const weightDifference = newWeight - currentAttr.weight;
    
    const currentTotalWeight = attributes.reduce((sum, attr) => sum + attr.weight, 0);
    
    // Don't allow increase if already at or above 100%
    if (currentTotalWeight >= 100 && weightDifference > 0) {
      return;
    }
    
    // Adjust new weight if it would exceed 100%
    if (currentTotalWeight + weightDifference > 100) {
      newWeight = currentAttr.weight + (100 - currentTotalWeight);
    }
    
    // Update the attributes
    const updatedAttributes = attributes.map(attr =>
      attr.id === id ? { ...attr, weight: newWeight } : attr
    );
    
    setAttributes(updatedAttributes);
  };

  // Handle rating change
  const handleRatingChange = (scenarioId, attrIndex, newRating) => {
    const updatedScenarios = scenarios.map(scenario => {
      if (scenario.id === scenarioId) {
        const newRatings = [...scenario.ratings];
        newRatings[attrIndex] = newRating;
        return { ...scenario, ratings: newRatings };
      }
      return scenario;
    });
    
    setScenarios(updatedScenarios);
  };

  // Chart data preparation - prepare stacked bar data with attribute contributions
  const chartData = React.useMemo(() => {
    return [...results]
      .sort((a, b) => a.rank - b.rank) // Sort by rank for the chart
      .map(result => {
        // Calculate contribution of each attribute to the total score
        const attributeContributions = {};
        attributes.forEach((attr, index) => {
          const rating = result.ratings[index];
          const weight = attr.weight / 100;
          const contribution = parseFloat((rating * weight).toFixed(1));
          attributeContributions[`attr${attr.id}`] = contribution;
          attributeContributions[`attr${attr.id}Name`] = attr.name;
        });
        
        return {
          name: `Scenario ${result.id}`,
          scenarioName: result.name,
          score: result.weightedScore,
          rank: result.rank,
          description: result.description,
          ...attributeContributions
        };
      });
  }, [results, attributes]);

  return (
    <div className="w-full p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold mb-2">MFA Procurement Scenario Analysis Tool</h1>
          <button
            onClick={() => supabase.auth.signOut()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
        <p className="text-gray-700">
          This tool helps analyze different procurement scenarios based on the Multi-Factor Analysis (MFA) approach. 
          Adjust the weights of attributes and scenario ratings using the sliders below to see how they affect the recommendations.
        </p>
      </div>

      {/* Recommendation Summary */}
      {topRecommendation && (
        <div className="bg-green-50 p-6 rounded-lg shadow-sm mb-6">
          <h2 className="text-xl font-bold mb-2">Top Recommendation</h2>
          <div className="flex items-center">
            <div className="text-2xl font-bold mr-4">Scenario {topRecommendation.id}: {topRecommendation.name}</div>
            <div className="bg-green-100 text-green-800 px-2 py-1 rounded">Score: {topRecommendation.weightedScore}</div>
          </div>
          <p className="mt-2 text-gray-700">{topRecommendation.description}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attribute Weights Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold mb-4">Attribute Weights</h2>
          <div className="space-y-6">
            {attributes.map((attr) => (
              <div key={attr.id} className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">{attr.name}</label>
                  <span className="text-sm font-bold">{attr.weight}%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => {
                      if (attr.weight > 0) 
                        handleWeightChange(attr.id, attr.weight - 1)
                    }}
                    className="px-2 py-1 bg-gray-200 rounded text-gray-800 font-bold"
                    disabled={attr.weight <= 0}
                  >
                    -
                  </button>
                  <input
                    type="range"
                    value={attr.weight}
                    min={0}
                    max={100}
                    step={1}
                    onChange={(e) => handleWeightChange(attr.id, parseInt(e.target.value))}
                    className="w-full"
                  />
                  <button 
                    onClick={() => {
                      const totalWeight = attributes.reduce((sum, a) => sum + a.weight, 0);
                      if (totalWeight < 100) 
                        handleWeightChange(attr.id, attr.weight + 1)
                    }}
                    className="px-2 py-1 bg-gray-200 rounded text-gray-800 font-bold"
                    disabled={attributes.reduce((sum, a) => sum + a.weight, 0) >= 100}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
            <div className="mt-4 p-2 border rounded bg-gray-50">
              <div className="text-sm font-medium">Total Weight: {attributes.reduce((sum, attr) => sum + attr.weight, 0)}%</div>
              <div className="text-xs text-gray-500 font-medium">
                {attributes.reduce((sum, attr) => sum + attr.weight, 0) === 100 
                  ? "✓ Weights total exactly 100%" 
                  : "Weights must total exactly 100% - adjust values accordingly"}
              </div>
            </div>
          </div>
        </div>

        {/* Results Visualization */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold mb-4">Scenario Results</h2>
          <div className="mb-3">
            <div className="text-sm text-gray-600">
              Each bar shows how different attributes contribute to the total score:
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {attributes.map((attr, index) => (
                <div key={`legend-${attr.id}`} className="flex items-center">
                  <div 
                    className="w-4 h-4 mr-1" 
                    style={{backgroundColor: attributeColors[index % attributeColors.length]}}
                  ></div>
                  <span className="text-xs">{attr.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="h-64">
            {results.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    formatter={(value, name) => {
                      const attrName = name.replace(/attr\d+/, '');
                      return [`${value}`, attrName];
                    }}
                    labelFormatter={(value) => {
                      const item = chartData.find(d => d.name === value);
                      return `${item.name}: ${item.scenarioName} (Rank: ${item.rank})`;
                    }}
                  />
                  {attributes.map((attr, index) => (
                    <Bar 
                      key={`attr-${attr.id}`}
                      dataKey={`attr${attr.id}`} 
                      name={attr.name}
                      stackId="a" 
                      fill={attributeColors[index % attributeColors.length]}
                      legendType="none"
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Scenario Ratings */}
      <div className="bg-white p-6 rounded-lg shadow-sm mt-6">
        <h2 className="text-xl font-bold mb-4">Scenario Ratings</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attribute / Scenario</th>
                {scenarios.map(scenario => (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" key={scenario.id}>
                    {scenario.id}: {scenario.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attributes.map((attr, attrIndex) => (
                <tr key={attr.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {attr.name} ({attr.weight}%)
                  </td>
                  {scenarios.map(scenario => (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" key={`${scenario.id}-${attr.id}`}>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-bold">{scenario.ratings[attrIndex]}</span>
                        </div>
                        <input
                          type="range"
                          value={scenario.ratings[attrIndex]}
                          min={0}
                          max={100}
                          step={5}
                          onChange={(e) => handleRatingChange(scenario.id, attrIndex, parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">Weighted Score</td>
                {results.map(result => (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900" key={result.id}>
                    {result.weightedScore} (Rank: {result.rank})
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Results Table */}
      <div className="bg-white p-6 rounded-lg shadow-sm mt-6">
        <h2 className="text-xl font-bold mb-4">Detailed Results</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scenario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weighted Score</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...results].sort((a, b) => a.rank - b.rank).map(result => (
                <tr key={result.id} className={result.rank === 1 ? 'bg-green-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.rank}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Scenario {result.id}: {result.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{result.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{result.weightedScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MFAAnalysisTool;