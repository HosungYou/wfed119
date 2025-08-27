'use client';

import React, { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { StrengthAnalysis } from '@/lib/services/aiServiceClaude';

interface StrengthHexagonProps {
  data: StrengthAnalysis;
  className?: string;
  showDetails?: boolean;
}

interface ChartDataPoint {
  category: string;
  value: number;
  items: string[];
  color: string;
}

const CATEGORY_COLORS = {
  Skills: '#3b82f6',
  Attitudes: '#10b981',
  Values: '#8b5cf6',
  Integration: '#f59e0b',
  Application: '#ef4444',
  Growth: '#06b6d4'
};

export const StrengthHexagon: React.FC<StrengthHexagonProps> = ({ 
  data, 
  className = '', 
  showDetails = true 
}) => {
  const chartData = useMemo(() => {
    // Calculate total items to determine proportional percentages
    const totalItems = data.skills.length + data.attitudes.length + data.values.length;
    
    if (totalItems === 0) {
      // Default values when no data
      return [];
    }
    
    // Calculate proportional values based on actual distribution
    const skillProportion = data.skills.length / totalItems;
    const attitudeProportion = data.attitudes.length / totalItems;
    const valueProportion = data.values.length / totalItems;
    
    // Scale to meaningful percentages (30-100 range for better visualization)
    const baseScore = 30;
    const maxScore = 100;
    const scoreRange = maxScore - baseScore;
    
    const skillValue = Math.round(baseScore + (skillProportion * scoreRange) + (data.skills.length * 5));
    const attitudeValue = Math.round(baseScore + (attitudeProportion * scoreRange) + (data.attitudes.length * 5));
    const valueValue = Math.round(baseScore + (valueProportion * scoreRange) + (data.values.length * 5));
    
    // Derived scores based on combinations
    const integrationValue = Math.round((skillValue + attitudeValue + valueValue) / 3);
    const applicationValue = Math.round((skillValue + attitudeValue) / 2);
    const growthValue = Math.round((attitudeValue + valueValue) / 2);

    const chartPoints: ChartDataPoint[] = [
      {
        category: 'Skills',
        value: skillValue,
        items: data.skills,
        color: CATEGORY_COLORS.Skills
      },
      {
        category: 'Attitudes', 
        value: attitudeValue,
        items: data.attitudes,
        color: CATEGORY_COLORS.Attitudes
      },
      {
        category: 'Values',
        value: valueValue,
        items: data.values,
        color: CATEGORY_COLORS.Values
      },
      {
        category: 'Integration',
        value: integrationValue,
        items: ['Combines strengths effectively'],
        color: CATEGORY_COLORS.Integration
      },
      {
        category: 'Application',
        value: applicationValue,
        items: ['Practical implementation'],
        color: CATEGORY_COLORS.Application
      },
      {
        category: 'Growth',
        value: growthValue,
        items: ['Development potential'],
        color: CATEGORY_COLORS.Growth
      }
    ];

    return chartPoints;
  }, [data]);

  const overallStrengthScore = useMemo(() => {
    const totalValue = chartData.reduce((sum, point) => sum + point.value, 0);
    return Math.round(totalValue / chartData.length);
  }, [chartData]);

  const getStrengthLevel = (score: number): { level: string; color: string; description: string } => {
    if (score >= 80) return { 
      level: 'Exceptional', 
      color: 'text-green-600',
      description: 'Strong foundation for career success'
    };
    if (score >= 60) return { 
      level: 'Well-Developed', 
      color: 'text-blue-600',
      description: 'Good strengths with growth potential'
    };
    if (score >= 40) return { 
      level: 'Emerging', 
      color: 'text-yellow-600',
      description: 'Developing strengths to build upon'
    };
    return { 
      level: 'Developing', 
      color: 'text-orange-600',
      description: 'Early stages of strength development'
    };
  };

  const strengthAssessment = getStrengthLevel(overallStrengthScore);

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Your Strength Profile</h3>
        <div className="flex items-center justify-center space-x-4">
          <div className="text-center">
            <div className={`text-3xl font-bold ${strengthAssessment.color}`}>
              {overallStrengthScore}%
            </div>
            <div className="text-sm text-gray-600">Overall Score</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-semibold ${strengthAssessment.color}`}>
              {strengthAssessment.level}
            </div>
            <div className="text-sm text-gray-600">{strengthAssessment.description}</div>
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="w-full h-80 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid stroke="#e0e0e0" />
            <PolarAngleAxis 
              dataKey="category" 
              tick={{ fontSize: 12, fill: '#374151' }}
              className="font-medium"
            />
            <Radar
              name="Strength Level"
              dataKey="value"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Breakdown */}
      {showDetails && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <h4 className="font-semibold text-blue-600 text-lg mb-3 flex items-center justify-center">
              <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
              Skills (역량)
            </h4>
            <div className="text-right mb-2">
              <span className={`text-sm font-medium px-2 py-1 rounded ${ 
                data.skills.length >= 4 ? 'bg-green-100 text-green-800' : 
                data.skills.length >= 2 ? 'bg-yellow-100 text-yellow-800' : 
                'bg-gray-100 text-gray-800'
              }`}>
                {data.skills.length} identified
              </span>
            </div>
            {data.skills.length > 0 ? (
              <ul className="text-sm space-y-2">
                {data.skills.map((skill, i) => (
                  <li key={i} className="py-1 px-3 bg-blue-50 rounded-md border-l-3 border-blue-600">
                    {skill}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500 italic">Continue the conversation to identify skills</div>
            )}
          </div>

          <div className="text-center">
            <h4 className="font-semibold text-green-600 text-lg mb-3 flex items-center justify-center">
              <div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div>
              Attitudes (태도)
            </h4>
            <div className="text-right mb-2">
              <span className={`text-sm font-medium px-2 py-1 rounded ${ 
                data.attitudes.length >= 4 ? 'bg-green-100 text-green-800' : 
                data.attitudes.length >= 2 ? 'bg-yellow-100 text-yellow-800' : 
                'bg-gray-100 text-gray-800'
              }`}>
                {data.attitudes.length} identified
              </span>
            </div>
            {data.attitudes.length > 0 ? (
              <ul className="text-sm space-y-2">
                {data.attitudes.map((attitude, i) => (
                  <li key={i} className="py-1 px-3 bg-green-50 rounded-md border-l-3 border-green-600">
                    {attitude}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500 italic">Share more about your approach to work</div>
            )}
          </div>

          <div className="text-center">
            <h4 className="font-semibold text-purple-600 text-lg mb-3 flex items-center justify-center">
              <div className="w-3 h-3 bg-purple-600 rounded-full mr-2"></div>
              Values (가치)
            </h4>
            <div className="text-right mb-2">
              <span className={`text-sm font-medium px-2 py-1 rounded ${ 
                data.values.length >= 4 ? 'bg-green-100 text-green-800' : 
                data.values.length >= 2 ? 'bg-yellow-100 text-yellow-800' : 
                'bg-gray-100 text-gray-800'
              }`}>
                {data.values.length} identified
              </span>
            </div>
            {data.values.length > 0 ? (
              <ul className="text-sm space-y-2">
                {data.values.map((value, i) => (
                  <li key={i} className="py-1 px-3 bg-purple-50 rounded-md border-l-3 border-purple-600">
                    {value}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500 italic">Explore what matters most to you at work</div>
            )}
          </div>
        </div>
      )}

      {/* Action Insights */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h5 className="font-semibold text-gray-800 mb-2">💡 Key Insights</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Strongest Areas:</strong>
            <ul className="list-disc list-inside mt-1 text-gray-600">
              {chartData
                .filter(point => point.value >= 70)
                .map((point, i) => (
                  <li key={i}>{point.category} ({point.value}%)</li>
                ))}
            </ul>
          </div>
          <div>
            <strong>Growth Opportunities:</strong>
            <ul className="list-disc list-inside mt-1 text-gray-600">
              {chartData
                .filter(point => point.value < 70)
                .map((point, i) => (
                  <li key={i}>{point.category} ({point.value}%)</li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};