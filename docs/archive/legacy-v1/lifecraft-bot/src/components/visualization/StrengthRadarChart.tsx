'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';
import { StrengthAnalysis } from '@/lib/services/aiServiceClaude';
import { X, ZoomIn, ZoomOut, RotateCcw, Trash2 } from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  zoomPlugin
);

interface StrengthRadarChartProps {
  data: StrengthAnalysis;
  onUpdateData?: (newData: StrengthAnalysis) => void;
  className?: string;
  showDetails?: boolean;
  enableZoom?: boolean;
  allowDelete?: boolean;
}

export const StrengthRadarChart: React.FC<StrengthRadarChartProps> = ({
  data,
  onUpdateData,
  className = '',
  showDetails = true,
  enableZoom = true,
  allowDelete = true,
}) => {
  const chartRef = useRef<ChartJS<'radar'>>(null);
  const [localData, setLocalData] = useState<StrengthAnalysis>(data);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  // Calculate chart data
  const chartData: ChartData<'radar'> = {
    labels: ['Skills', 'Attitudes', 'Values', 'Integration', 'Application', 'Growth'],
    datasets: [
      {
        label: 'Strength Profile',
        data: [
          localData.skills.length * 16.67, // Scale to 100 (max 6 items)
          localData.attitudes.length * 16.67,
          localData.values.length * 16.67,
          ((localData.skills.length + localData.attitudes.length + localData.values.length) / 3) * 16.67,
          ((localData.skills.length + localData.attitudes.length) / 2) * 16.67,
          ((localData.attitudes.length + localData.values.length) / 2) * 16.67,
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
      },
    ],
  };

  // Chart options with zoom
  const options: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.parsed.r.toFixed(1)}%`;
          },
        },
      },
      zoom: enableZoom ? {
        zoom: {
          wheel: {
            enabled: true,
            modifierKey: 'ctrl',
          },
          pinch: {
            enabled: true,
          },
          mode: 'y',
        },
        pan: {
          enabled: true,
          mode: 'y',
        },
        limits: {
          r: {
            min: 0,
            max: 100,
          },
        },
      } : undefined,
    },
  };

  // Zoom control functions
  const handleZoomIn = () => {
    if (chartRef.current) {
      chartRef.current.zoom(1.1);
    }
  };

  const handleZoomOut = () => {
    if (chartRef.current) {
      chartRef.current.zoom(0.9);
    }
  };

  const handleResetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };

  // Delete strength item
  const handleDeleteItem = (category: 'skills' | 'attitudes' | 'values', index: number) => {
    const newData = { ...localData };
    newData[category] = newData[category].filter((_, i) => i !== index);
    setLocalData(newData);
    
    if (onUpdateData) {
      onUpdateData(newData);
    }

    // Force chart update
    if (chartRef.current) {
      chartRef.current.update();
    }
  };

  const getOverallScore = () => {
    const total = localData.skills.length + localData.attitudes.length + localData.values.length;
    return Math.round((total / 18) * 100); // Max 18 items (6 per category)
  };

  const getStrengthLevel = (score: number) => {
    if (score >= 80) return { level: 'Exceptional', color: 'text-green-600' };
    if (score >= 60) return { level: 'Well-Developed', color: 'text-blue-600' };
    if (score >= 40) return { level: 'Emerging', color: 'text-yellow-600' };
    return { level: 'Developing', color: 'text-orange-600' };
  };

  const strengthLevel = getStrengthLevel(getOverallScore());

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Your Strength Profile</h3>
        <div className="flex items-center justify-center space-x-4">
          <div className="text-center">
            <div className={`text-3xl font-bold ${strengthLevel.color}`}>
              {getOverallScore()}%
            </div>
            <div className="text-sm text-gray-600">Overall Score</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-semibold ${strengthLevel.color}`}>
              {strengthLevel.level}
            </div>
          </div>
        </div>
      </div>

      {/* Chart with Zoom Controls */}
      <div className="relative">
        {/* Zoom Controls */}
        {enableZoom && (
          <div className="absolute top-0 right-0 flex space-x-2 z-10">
            <button
              onClick={handleZoomIn}
              className="p-2 bg-white rounded-lg shadow hover:bg-gray-50 transition-colors"
              title="Zoom In (or Ctrl+Wheel)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 bg-white rounded-lg shadow hover:bg-gray-50 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 bg-white rounded-lg shadow hover:bg-gray-50 transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Chart */}
        <div className="w-full h-80 mb-6">
          <Radar ref={chartRef} data={chartData} options={options} />
        </div>

        {/* Zoom Instructions */}
        {enableZoom && (
          <div className="text-xs text-gray-500 text-center mb-4">
            Tip: Use Ctrl+Mouse Wheel to zoom, or use the buttons above
          </div>
        )}
      </div>

      {/* Detailed Breakdown with Delete Functionality */}
      {showDetails && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Skills */}
          <div className="space-y-2">
            <h4 className="font-semibold text-blue-600 text-lg flex items-center">
              <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
              Skills ({localData.skills.length})
            </h4>
            {localData.skills.length > 0 ? (
              <ul className="space-y-2">
                {localData.skills.map((skill, i) => (
                  <li key={i} className="group flex items-center justify-between py-1 px-3 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors">
                    <span className="text-sm">{skill}</span>
                    {allowDelete && (
                      <button
                        onClick={() => handleDeleteItem('skills', i)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove this skill"
                      >
                        <X className="w-3 h-3 text-red-500 hover:text-red-700" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500 italic text-sm">No skills identified yet</div>
            )}
          </div>

          {/* Attitudes */}
          <div className="space-y-2">
            <h4 className="font-semibold text-green-600 text-lg flex items-center">
              <div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div>
              Attitudes ({localData.attitudes.length})
            </h4>
            {localData.attitudes.length > 0 ? (
              <ul className="space-y-2">
                {localData.attitudes.map((attitude, i) => (
                  <li key={i} className="group flex items-center justify-between py-1 px-3 bg-green-50 rounded-md hover:bg-green-100 transition-colors">
                    <span className="text-sm">{attitude}</span>
                    {allowDelete && (
                      <button
                        onClick={() => handleDeleteItem('attitudes', i)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove this attitude"
                      >
                        <X className="w-3 h-3 text-red-500 hover:text-red-700" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500 italic text-sm">No attitudes identified yet</div>
            )}
          </div>

          {/* Values */}
          <div className="space-y-2">
            <h4 className="font-semibold text-purple-600 text-lg flex items-center">
              <div className="w-3 h-3 bg-purple-600 rounded-full mr-2"></div>
              Values ({localData.values.length})
            </h4>
            {localData.values.length > 0 ? (
              <ul className="space-y-2">
                {localData.values.map((value, i) => (
                  <li key={i} className="group flex items-center justify-between py-1 px-3 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors">
                    <span className="text-sm">{value}</span>
                    {allowDelete && (
                      <button
                        onClick={() => handleDeleteItem('values', i)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove this value"
                      >
                        <X className="w-3 h-3 text-red-500 hover:text-red-700" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500 italic text-sm">No values identified yet</div>
            )}
          </div>
        </div>
      )}

      {/* Clear All Button */}
      {allowDelete && (localData.skills.length > 0 || localData.attitudes.length > 0 || localData.values.length > 0) && (
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              const emptyData = { skills: [], attitudes: [], values: [] };
              setLocalData(emptyData);
              if (onUpdateData) {
                onUpdateData(emptyData);
              }
            }}
            className="inline-flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All Strengths
          </button>
        </div>
      )}
    </div>
  );
};