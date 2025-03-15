import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PlusCircle, FileBarChart, Trash2, CheckCircle, Pin } from 'lucide-react';

const attributeColors = [
  "#8884d8", // Purple
  "#82ca9d", // Green
  "#ffc658", // Yellow
  "#ff8042", // Orange
  "#0088fe", // Blue
  "#00C49F"  // Teal
];

const AnalysisList = () => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get only the most recent RDT Pacific analysis if multiple exist
      const rdtAnalysis = data.find(a => a.name === 'RDT Pacific Aggregated Analysis');
      const otherAnalyses = data.filter(a => a.name !== 'RDT Pacific Aggregated Analysis');
      
      // Combine analyses with RDT Pacific first (if it exists)
      const sortedAnalyses = rdtAnalysis 
        ? [rdtAnalysis, ...otherAnalyses]
        : otherAnalyses;

      setAnalyses(sortedAnalyses);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteAnalysis = async (id) => {
    try {
      const { error } = await supabase
        .from('analyses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh the analyses list after deletion
      await fetchAnalyses();
    } catch (err) {
      setError(err.message);
    }
  };

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
          <h1 className="text-2xl font-bold">MFA Analysis Dashboard</h1>
          <div className="flex gap-4">
            <Link
              to="/new-analysis"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              New Analysis
            </Link>
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {analyses.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-sm text-center">
          <FileBarChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No analyses yet</h2>
          <p className="text-gray-600 mb-6">Create your first analysis to get started</p>
          <Link
            to="/new-analysis"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Create Analysis
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {analyses.map((analysis) => {
            const isRDTPacific = analysis.name === 'RDT Pacific Aggregated Analysis';
            const topScenario = analysis.results?.length > 0 
              ? analysis.results.find(r => r.rank === 1)
              : null;

            return (
              <div 
                key={analysis.id} 
                className={`bg-white rounded-lg shadow-sm overflow-hidden ${isRDTPacific ? 'border-2 border-blue-500' : ''}`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-2">
                      {isRDTPacific && (
                        <Pin className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{analysis.name}</h3>
                        <p className="text-sm text-gray-500">
                          Created {new Date(analysis.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteAnalysis(analysis.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      disabled={isRDTPacific}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {analysis.description && (
                    <p className="text-gray-600 mb-4">{analysis.description}</p>
                  )}

                  {analysis.results?.length > 0 && (
                    <div className="h-64 mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analysis.results.sort((a, b) => a.rank - b.rank)}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name"
                            interval={0}
                            tick={({ x, y, payload }) => {
                              const scenarioNumber = payload.value.match(/\d+/)?.[0] || '';
                              const name = payload.value.split('(')[0].trim();
                              return (
                                <g transform={`translate(${x},${y})`}>
                                  <text
                                    x={0}
                                    y={0}
                                    dy={10}
                                    textAnchor="middle"
                                    fill="#666"
                                    fontSize={11}
                                  >
                                    {`S${scenarioNumber}`}
                                  </text>
                                  <text
                                    x={0}
                                    y={0}
                                    dy={25}
                                    textAnchor="middle"
                                    fill="#666"
                                    fontSize={10}
                                    width={80}
                                  >
                                    {name.split(' ').map((word, i) => (
                                      <tspan x={0} dy={i ? 12 : 0} key={i}>
                                        {word}
                                      </tspan>
                                    ))}
                                  </text>
                                </g>
                              );
                            }}
                            height={100}
                          />
                          <YAxis domain={[0, 100]} />
                          <Tooltip 
                            formatter={(value, name) => [`${value}`, name]}
                            labelFormatter={(value) => {
                              const scenario = analysis.scenarios.find(s => s.name === value);
                              return `${value}\n${scenario?.description || ''}`;
                            }}
                          />
                          {analysis.attributes.map((attr, index) => (
                            <Bar 
                              key={`attr-${attr.id}`}
                              dataKey={(record) => record.contributionByAttr[attr.name]}
                              name={attr.name}
                              stackId="a" 
                              fill={attributeColors[index % attributeColors.length]}
                            />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {topScenario && (
                    <div className="bg-green-50 p-4 rounded-lg mb-6">
                      <div className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-green-900">Recommended Scenario</h4>
                          <p className="text-green-800 font-medium mt-1">
                            {topScenario.name} (Score: {topScenario.weightedScore})
                          </p>
                          <p className="text-green-700 text-sm mt-1">
                            {topScenario.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      {analysis.scenarios?.length || 0} scenarios analyzed
                    </div>
                    <Link
                      to={`/analysis/${analysis.id}`}
                      className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AnalysisList;