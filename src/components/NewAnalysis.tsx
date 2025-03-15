import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft } from 'lucide-react';

const NewAnalysis = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateResults = (attributes, scenarios) => {
    // Calculate weighted scores for each scenario
    const calculatedResults = scenarios.map(scenario => {
      let weightedScore = 0;
      let contributionByAttr = {};
      
      // Calculate contribution of each attribute
      attributes.forEach((attr, index) => {
        const rating = scenario.ratings[index];
        const weight = attr.weight / 100;
        const contribution = rating * weight;
        weightedScore += contribution;
        contributionByAttr[attr.name] = parseFloat(contribution.toFixed(1));
      });
      
      return {
        id: scenario.id,
        name: scenario.name,
        description: scenario.description,
        ratings: scenario.ratings,
        weightedScore: parseFloat(weightedScore.toFixed(1)),
        contributionByAttr,
        rank: 0 // Will be set after sorting
      };
    });

    // Sort by weighted score and add rankings
    const sortedResults = calculatedResults.sort((a, b) => b.weightedScore - a.weightedScore);
    return sortedResults.map((result, index) => ({
      ...result,
      rank: index + 1
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session found. Please sign in again.');
      }

      // Define initial attributes with weights
      const attributes = [
        { id: 1, name: "Contractor Diversification", weight: 8 },
        { id: 2, name: "Interface & Coordination", weight: 11 },
        { id: 3, name: "Market Resource Availability", weight: 21 },
        { id: 4, name: "Schedule & Delivery Confidence", weight: 30 },
        { id: 5, name: "Financial Certainty", weight: 24 },
        { id: 6, name: "Stakeholder Impact", weight: 6 }
      ];

      // Define initial scenarios with ratings
      const scenarios = [
        { 
          id: 1, 
          name: "Maximum Diversification (Baseline)", 
          description: "Renewal A, Renewal B, DJT, Regional Stands, ITR West (5 contractors total)",
          ratings: [85, 40, 55, 45, 50, 60] 
        },
        { 
          id: 2, 
          name: "High-Interface Package Consolidation", 
          description: "DJT + ITR West (highest integration requirement), Renewal A, Renewal B, Regional Stands (4 contractors total)",
          ratings: [75, 85, 75, 80, 75, 80] 
        },
        { 
          id: 3, 
          name: "Limited Interface Package Consolidation", 
          description: "DJT, ITR West + Regional Stands (limited integration requirement), Renewal A, Renewal B (4 contractors total)",
          ratings: [75, 60, 65, 60, 60, 65] 
        },
        { 
          id: 4, 
          name: "Operational Grouping", 
          description: "DJT + Regional Stands (operational coordination), ITR West, Renewal A, Renewal B (4 contractors total)",
          ratings: [75, 65, 70, 65, 65, 70] 
        },
        { 
          id: 5, 
          name: "High Concentration", 
          description: "DJT + ITR West + Regional Stands (all major new works), Renewal A, Renewal B (3 contractors total)",
          ratings: [60, 70, 60, 55, 50, 60] 
        },
        { 
          id: 6, 
          name: "Maximum Concentration", 
          description: "DJT + ITR West + Regional Stands + Renewal A (mega contractor), Renewal B (2 contractors total)",
          ratings: [35, 60, 45, 45, 35, 40] 
        }
      ];

      // Calculate initial results
      const results = calculateResults(attributes, scenarios);
      
      // Create the new analysis
      const { data, error: insertError } = await supabase
        .from('analyses')
        .insert([
          {
            name,
            description,
            user_id: session.user.id,
            attributes,
            scenarios,
            results
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;
      
      // Navigate to the new analysis
      navigate(`/analysis/${data.id}`);
    } catch (err) {
      setError(err.message);
      if (err.message.includes('session')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold">New Analysis</h1>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Analysis Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter analysis name"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter analysis description"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Analysis'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewAnalysis;