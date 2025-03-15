import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';
import { ArrowLeft } from 'lucide-react';
import type { Analysis, Attribute, Result, Scenario } from '../types/analysis';
import PairwiseSlider from './PairwiseSlider';

const attributeColors = [
  "#8884d8", // Purple
  "#82ca9d", // Green
  "#ffc658", // Yellow
  "#ff8042", // Orange
  "#0088fe", // Blue
  "#00C49F"  // Teal
];

const attributeDescriptions = {
  "Contractor Diversification": {
    title: "Optimal Contractor Diversification",
    points: [
      "Minimizes dependency on a single contractor or supplier",
      "Reduces risk exposure if one contractor faces difficulties",
      "Spreads risk across multiple contractors for better resilience"
    ]
  },
  "Interface & Coordination": {
    title: "Ease of Interface and Coordination",
    points: [
      "Clear division of responsibilities with minimal overlap",
      "Simplifies management between contractors",
      "Reduces likelihood of delays from coordination issues"
    ]
  },
  "Market Resource Availability": {
    title: "Certainty of Market Resource Availability",
    points: [
      "Confidence in sufficient skilled labor and specialists",
      "Ensures access to necessary equipment and materials",
      "Mitigates risk of resource-driven delays"
    ]
  },
  "Schedule & Delivery Confidence": {
    title: "High Confidence in Schedule and Delivery",
    points: [
      "Assurance that projects will meet agreed timelines",
      "Minimizes disruption to airport operations",
      "Reliability in meeting critical project milestones"
    ]
  },
  "Financial Certainty": {
    title: "Robust Financial and Commercial Certainty",
    points: [
      "Ensures financial clarity and stability",
      "Minimizes potential for budget overruns",
      "Reduces risk of contractor financial issues impacting completion"
    ]
  },
  "Stakeholder Impact": {
    title: "Strong Positive Stakeholder and Reputational Impact",
    points: [
      "Enhances stakeholder satisfaction (airlines, passengers, community)",
      "Minimizes operational disruption for airport users",
      "Supports long-term market outcomes and industry relationships"
    ]
  }
};

// Helper function to get rating color class
const getRatingColorClass = (rating: number): string => {
  if (rating >= 90) return 'text-purple-600';
  if (rating >= 75) return 'text-green-600';
  if (rating >= 60) return 'text-blue-600';
  if (rating >= 50) return 'text-yellow-600';
  if (rating >= 40) return 'text-orange-500';
  return 'text-red-600';
};

// Helper function to get rating label
const getRatingLabel = (rating: number): string => {
  if (rating >= 90) return 'Excellent';
  if (rating >= 75) return 'Good';
  if (rating >= 60) return 'Above Average';
  if (rating >= 50) return 'Average';
  if (rating >= 40) return 'Below Average';
  return 'Poor';
};

// Helper function to convert between importance scores and slider values
const importanceToSliderValue = (importanceScore: number): number => {
  if (importanceScore >= 5) return -5;      // Left attribute much more important
  if (importanceScore >= 3) return -3;      // Left attribute more important
  if (importanceScore >= 1.5) return -1;    // Left attribute slightly more important
  if (importanceScore >= 1/3) return 3;     // Right attribute more important
  if (importanceScore >= 1/5) return 5;     // Right attribute much more important
  if (importanceScore >= 1/1.5) return 1;   // Right attribute slightly more important
  return -1; // Default to left slightly more important
};

// Helper function to convert from slider values back to importance scores
const sliderValueToImportance = (sliderValue: number): number => {
  switch (sliderValue) {
    case -5: return 5;       // Left attribute much more important
    case -3: return 3;       // Left attribute more important
    case -1: return 1.5;     // Left attribute slightly more important
    case 1: return 1/1.5;    // Right attribute slightly more important
    case 3: return 1/3;      // Right attribute more important
    case 5: return 1/5;      // Right attribute much more important
    default: return 1.5;     // Default to left slightly more important
  }
};

const SimpleMFAToolComponent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pairwise');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [saving, setSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  
  const [attributes, setAttributes] = useState<Attribute[]>([
    { id: 1, name: "Contractor Diversification", weight: 8 },
    { id: 2, name: "Interface & Coordination", weight: 11 },
    { id: 3, name: "Market Resource Availability", weight: 21 },
    { id: 4, name: "Schedule & Delivery Confidence", weight: 30 },
    { id: 5, name: "Financial Certainty", weight: 24 },
    { id: 6, name: "Stakeholder Impact", weight: 6 }
  ]);

  const [scenarios, setScenarios] = useState<Scenario[]>([
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
    }
  ]);

  const [results, setResults] = useState<Result[]>([]);
  const [topRecommendation, setTopRecommendation] = useState<Result | null>(null);
  const [calculatedWeights, setCalculatedWeights] = useState<number[] | null>(null);

  // Initialize pairwise matrix
  const [pairwiseMatrix, setPairwiseMatrix] = useState<number[][]>(() => {
    const matrix: number[][] = [];
    for (let i = 0; i < attributes.length; i++) {
      const row: number[] = [];
      for (let j = 0; j < attributes.length; j++) {
        // Set diagonal to 1 (self-comparison)
        // For non-diagonal elements, default to 1.5 (left slightly more important)
        row.push(i === j ? 1 : (i < j ? 1.5 : 1/1.5));
      }
      matrix.push(row);
    }
    return matrix;
  });

  useEffect(() => {
    if (id) {
      fetchAnalysis();
    }
  }, [id]);

  const fetchAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setAnalysis(data);
      if (data.attributes) setAttributes(data.attributes);
      if (data.scenarios) setScenarios(data.scenarios);
      if (data.results) {
        setResults(data.results);
        setTopRecommendation(data.results.find(r => r.rank === 1) || null);
      }
      if (data.pairwise_matrix) {
        setPairwiseMatrix(data.pairwise_matrix);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const saveAnalysis = async () => {
    if (!id || saving) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('analyses')
        .update({
          attributes,
          scenarios,
          results,
          pairwise_matrix: pairwiseMatrix,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(saveAnalysis, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [attributes, scenarios, results, pairwiseMatrix]);

  const calculateWeights = () => {
    // Ensure no equal importance values exist in the matrix
    const newMatrix = [...pairwiseMatrix];
    for (let i = 0; i < attributes.length; i++) {
      for (let j = i + 1; j < attributes.length; j++) {
        if (Math.abs(newMatrix[i][j] - 1) < 0.1) {
          // If equal importance (1), change to slightly more important (1.5)
          newMatrix[i][j] = 1.5;
          newMatrix[j][i] = 1/1.5;
        }
      }
    }
    setPairwiseMatrix(newMatrix);
    
    const n = attributes.length;
    const weights = new Array(n).fill(0);
    
    // Calculate geometric mean for each row
    for (let i = 0; i < n; i++) {
      let product = 1;
      for (let j = 0; j < n; j++) {
        product *= newMatrix[i][j];
      }
      weights[i] = Math.pow(product, 1/n);
    }
    
    // Normalize weights to percentages
    const sum = weights.reduce((a, b) => a + b, 0);
    const normalizedWeights = weights.map(w => Math.round((w / sum) * 100));
    
    // Adjust to ensure total is 100%
    const total = normalizedWeights.reduce((a, b) => a + b, 0);
    if (total !== 100) {
      const diff = 100 - total;
      const maxIndex = normalizedWeights.indexOf(Math.max(...normalizedWeights));
      normalizedWeights[maxIndex] += diff;
    }
    
    setCalculatedWeights(normalizedWeights);
    setActiveTab('weights');
  };

  const handleRatingChange = (scenarioId: number, attrIndex: number, newRating: number) => {
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

  const getComparisonPairs = () => {
    const pairs: [number, number][] = [];
    for (let i = 0; i < attributes.length; i++) {
      for (let j = i + 1; j < attributes.length; j++) {
        pairs.push([i, j]);
      }
    }
    return pairs;
  };

  useEffect(() => {
    // Calculate results whenever attributes, scenarios, or calculated weights change
    const newResults = scenarios.map(scenario => {
      let weightedScore = 0;
      let contributionByAttr: Record<string, number> = {};
      
      attributes.forEach((attr, index) => {
        const rating = scenario.ratings[index];
        const weight = (calculatedWeights ? calculatedWeights[index] : attr.weight) / 100;
        const contribution = rating * weight;
        weightedScore += contribution;
        contributionByAttr[attr.name] = parseFloat(contribution.toFixed(1));
      });
      
      return {
        ...scenario,
        weightedScore: parseFloat(weightedScore.toFixed(1)),
        contributionByAttr,
        rank: 0 // Will be set after sorting
      };
    });

    // Sort by weighted score and add rankings
    const sortedResults = newResults.sort((a, b) => b.weightedScore - a.weightedScore);
    const rankedResults = sortedResults.map((result, index) => ({
      ...result,
      rank: index + 1
    }));
    
    setResults(rankedResults);
    setTopRecommendation(rankedResults[0]);
  }, [attributes, scenarios, calculatedWeights]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full p-4">
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{analysis?.name || 'MFA Analysis Tool'}</h1>
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Back to Dashboard
            </Link>
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mt-6">
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'pairwise' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('pairwise')}
          >
            Pairwise Comparison
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'weights' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('weights')}
          >
            Weights
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'ratings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('ratings')}
          >
            Ratings
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'results' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('results')}
          >
            Results
          </button>
        </div>
      </div>

      {/* Recommendation Summary */}
      {topRecommendation && (
        <div className="bg-green-50 p-6 rounded-lg shadow-sm mb-6">
          <h2 className="text-xl font-bold mb-2">Recommended Scenario</h2>
          <div className="flex items-center">
            <div className="text-2xl font-bold mr-4">
              {topRecommendation.name}
            </div>
            <div className="bg-green-100 text-green-800 px-2 py-1 rounded">
              Score: {topRecommendation.weightedScore}
            </div>
          </div>
          <p className="mt-2 text-gray-700">{topRecommendation.description}</p>
        </div>
      )}

      {/* Pairwise Comparison */}
      {activeTab === 'pairwise' && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Pairwise Attribute Comparison</h2>
            <button
              onClick={calculateWeights}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Calculate Weights
            </button>
          </div>
          
          <p className="text-gray-600 mb-8">
            Compare attributes by selecting which is more important and to what degree.
          </p>

          <div className="space-y-8">
            {getComparisonPairs().map(([i, j]) => {
              const attr1 = attributes[i];
              const attr2 = attributes[j];
              const desc1 = attributeDescriptions[attr1.name as keyof typeof attributeDescriptions];
              const desc2 = attributeDescriptions[attr2.name as keyof typeof attributeDescriptions];
              const sliderValue = importanceToSliderValue(pairwiseMatrix[i][j]);
              
              return (
                <div key={`${i}-${j}`} className="bg-white rounded-lg border p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Left attribute description */}
                    <div>
                      <h3 className="text-xl font-bold mb-2">{desc1.title}</h3>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {desc1.points.map((point, idx) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Right attribute description */}
                    <div>
                      <h3 className="text-xl font-bold mb-2 md:text-right">{desc2.title}</h3>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 md:text-right">
                        {desc2.points.map((point, idx) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="text-center mb-4">
                    <span className="text-lg font-medium text-gray-700">Which is more important?</span>
                  </div>
                  
                  {/* Use the PairwiseSlider component here */}
                  <PairwiseSlider
                    leftAttribute={attr1.name}
                    rightAttribute={attr2.name}
                    value={sliderValue}
                    onChange={(value) => {
                      const newMatrix = [...pairwiseMatrix];
                      const importanceScore = sliderValueToImportance(value);
                      newMatrix[i][j] = importanceScore;
                      newMatrix[j][i] = 1 / importanceScore;
                      setPairwiseMatrix(newMatrix);
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Attribute Weights */}
      {activeTab === 'weights' && (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h2 className="text-xl font-bold mb-4">Attribute Weights</h2>
          <p className="text-gray-600 mb-4">
            These weights were calculated from your pairwise comparisons.
          </p>
          
          <div className="space-y-6">
            {attributes.map((attr, index) => (
              <div key={attr.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 mr-2 rounded" 
                      style={{backgroundColor: attributeColors[index]}}
                    ></div>
                    <span className="font-medium">{attr.name}</span>
                  </div>
                  <span className="font-bold">{calculatedWeights ? calculatedWeights[index] : attr.weight}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full" 
                    style={{
                      width: `${calculatedWeights ? calculatedWeights[index] : attr.weight}%`,
                      backgroundColor: attributeColors[index]
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scenario Ratings */}
      {activeTab === 'ratings' && (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h2 className="text-xl font-bold mb-4">Scenario Ratings</h2>
          <p className="text-gray-600 mb-4">
            Adjust how well each scenario performs on each attribute using the sliders below. 
            Ratings move in 5% increments and are labeled from Poor to Excellent.
          </p>
          
          {/* Rating guidelines */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 text-sm">
            <div className="flex flex-col items-center p-2 border rounded">
              <span className="text-red-600 font-medium">0-35</span>
              <span className="text-gray-600">Poor</span>
            </div>
            <div className="flex flex-col items-center p-2 border rounded">
              <span className="text-orange-500 font-medium">40-45</span>
              <span className="text-gray-600">Below Average</span>
            </div>
            <div className="flex flex-col items-center p-2 border rounded">
              <span className="text-yellow-600 font-medium">50-55</span>
              <span className="text-gray-600">Average</span>
            </div>
            <div className="flex flex-col items-center p-2 border rounded">
              <span className="text-blue-600 font-medium">60-70</span>
              <span className="text-gray-600">Above Average</span>
            </div>
            <div className="flex flex-col items-center p-2 border rounded">
              <span className="text-green-600 font-medium">75-85</span>
              <span className="text-gray-600">Good</span>
            </div>
            <div className="flex flex-col items-center p-2 border rounded">
              <span className="text-purple-600 font-medium">90-100</span>
              <span className="text-gray-600">Excellent</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attribute / Scenario
                  </th>
                  {scenarios.map(scenario => (
                    <th 
                      key={scenario.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {scenario.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attributes.map((attr, attrIndex) => (
                  <tr key={attr.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 mr-2" 
                          style={{backgroundColor: attributeColors[attrIndex]}}
                        ></div>
                        {attr.name} ({calculatedWeights ? calculatedWeights[attrIndex] : attr.weight}%)
                      </div>
                    </td>
                    {scenarios.map(scenario => (
                      <td 
                        key={`${scenario.id}-${attr.id}`}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className={`text-sm font-bold ${getRatingColorClass(scenario.ratings[attrIndex])}`}>
                              {scenario.ratings[attrIndex]}
                            </span>
                            <span className={`text-xs font-medium ${getRatingColorClass(scenario.ratings[attrIndex])}`}>
                              {getRatingLabel(scenario.ratings[attrIndex])}
                            </span>
                          </div>
                          <input
                            type="range"
                            value={scenario.ratings[attrIndex]}
                            min={0}
                            max={100}
                            step={5}
                            onChange={(e) => handleRatingChange(scenario.id, attrIndex, parseInt(e.target.value))}
                            className="range-slider"
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Results */}
      {activeTab === 'results' && (
        <div className="grid grid-cols-1 gap-6">
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
                      style={{backgroundColor: attributeColors[index]}}
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
                    data={results.sort((a, b) => a.rank - b.rank)}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name"
                      interval={0}
                      tick={({ x, y, payload }) => (
                        <g transform={`translate(${x},${y})`}>
                          <text
                            x={0}
                            y={0}
                            dy={10}
                            textAnchor="middle"
                            fill="#666"
                            fontSize={11}
                          >
                            {`S${payload.value.split(':')[0].replace('Scenario ', '')}`}
                          </text>
                        </g>
                      )}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value, name) => [`${value}`, name]}
                      labelFormatter={(value) => {
                        const scenario = scenarios.find(s => s.name === value);
                        return `${value}\n${scenario?.description || ''}`;
                      }}
                    />
                    {attributes.map((attr, index) => (
                      <Bar 
                        key={`attr-${attr.id}`}
                        dataKey={(record) => record.contributionByAttr[attr.name]}
                        name={attr.name}
                        stackId="a" 
                        fill={attributeColors[index]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          
          {/* Detailed Results Table */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4">Detailed Results</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scenario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.sort((a, b) => a.rank - b.rank).map(result => (
                    <tr key={result.id} className={result.rank === 1 ? 'bg-green-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.rank}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {result.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {result.weightedScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { SimpleMFAToolComponent };
export default SimpleMFAToolComponent;