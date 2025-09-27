'use client';

import React from 'react';
import type { StrengthAnalysis } from '@/lib/services/aiServiceClaude';

interface StrengthMindMapProps {
  data: StrengthAnalysis;
  userName: string | null;
  className?: string;
}

export const StrengthMindMap: React.FC<StrengthMindMapProps> = ({ 
  data, 
  userName,
  className = '' 
}) => {
  const displayName = userName || 'Your Name';
  
  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Your Strength Profile</h3>
        <p className="text-gray-600">Discover your unique combination of skills, attitudes, and values</p>
      </div>

      {/* Mind Map Container */}
      <div className="relative w-full h-[600px] overflow-hidden">
        <svg viewBox="0 0 800 600" className="w-full h-full">
          {/* Background grid (optional) */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Central Circle with Name */}
          <circle
            cx="400"
            cy="300"
            r="80"
            fill="#3b82f6"
            stroke="#1d4ed8"
            strokeWidth="3"
          />
          <text
            x="400"
            y="300"
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-white font-bold text-xl"
            fontSize="18"
          >
            {displayName}
          </text>

          {/* Skills Branch (Top Left) */}
          <line x1="400" y1="300" x2="200" y2="150" stroke="#ef4444" strokeWidth="3" />
          <circle cx="200" cy="150" r="40" fill="#ef4444" stroke="#dc2626" strokeWidth="2" />
          <text x="200" y="150" textAnchor="middle" dominantBaseline="central" className="fill-white font-semibold" fontSize="14">
            Skills
          </text>
          
          {/* Skills Items - Left side only */}
          {data.skills.slice(0, 6).map((skill, index) => {
            const angle = -150 + (index * 35); // Left side angles with more spacing
            const radian = (angle * Math.PI) / 180;
            const x = 200 + Math.cos(radian) * 140;
            const y = 150 + Math.sin(radian) * 80;
            
            return (
              <g key={index}>
                <line x1="200" y1="150" x2={x} y2={y} stroke="#ef4444" strokeWidth="1.5" />
                <rect
                  x={x - 60}
                  y={y - 12}
                  width="120"
                  height="24"
                  rx="12"
                  fill="#fef2f2"
                  stroke="#ef4444"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-red-700 text-xs font-medium"
                  fontSize="11"
                >
                  {skill.length > 20 ? skill.substring(0, 17) + '...' : skill}
                </text>
              </g>
            );
          })}

          {/* Attitudes Branch (Top Right) */}
          <line x1="400" y1="300" x2="600" y2="150" stroke="#10b981" strokeWidth="3" />
          <circle cx="600" cy="150" r="40" fill="#10b981" stroke="#059669" strokeWidth="2" />
          <text x="600" y="150" textAnchor="middle" dominantBaseline="central" className="fill-white font-semibold" fontSize="14">
            Attitudes
          </text>
          
          {/* Attitudes Items - Right side only */}
          {data.attitudes.slice(0, 6).map((attitude, index) => {
            const angle = -30 + (index * 35); // Right side angles with more spacing
            const radian = (angle * Math.PI) / 180;
            const x = 600 + Math.cos(radian) * 140;
            const y = 150 + Math.sin(radian) * 80;
            
            return (
              <g key={index}>
                <line x1="600" y1="150" x2={x} y2={y} stroke="#10b981" strokeWidth="1.5" />
                <rect
                  x={x - 60}
                  y={y - 12}
                  width="120"
                  height="24"
                  rx="12"
                  fill="#f0fdf4"
                  stroke="#10b981"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-green-700 text-xs font-medium"
                  fontSize="11"
                >
                  {attitude.length > 20 ? attitude.substring(0, 17) + '...' : attitude}
                </text>
              </g>
            );
          })}

          {/* Values Branch (Bottom) */}
          <line x1="400" y1="300" x2="400" y2="480" stroke="#8b5cf6" strokeWidth="3" />
          <circle cx="400" cy="480" r="40" fill="#8b5cf6" stroke="#7c3aed" strokeWidth="2" />
          <text x="400" y="480" textAnchor="middle" dominantBaseline="central" className="fill-white font-semibold" fontSize="14">
            Values
          </text>
          
          {/* Values Items - Bottom area only */}
          {data.values.slice(0, 6).map((value, index) => {
            const angle = 45 + (index * 22); // Bottom area angles with more spacing
            const radian = (angle * Math.PI) / 180;
            const x = 400 + Math.cos(radian) * 130;
            const y = 480 + Math.sin(radian) * 70;
            
            return (
              <g key={index}>
                <line x1="400" y1="480" x2={x} y2={y} stroke="#8b5cf6" strokeWidth="1.5" />
                <rect
                  x={x - 60}
                  y={y - 12}
                  width="120"
                  height="24"
                  rx="12"
                  fill="#faf5ff"
                  stroke="#8b5cf6"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-purple-700 text-xs font-medium"
                  fontSize="11"
                >
                  {value.length > 20 ? value.substring(0, 17) + '...' : value}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-6 flex justify-center space-x-8 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
          <span className="font-medium">Skills ({data.skills.length})</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
          <span className="font-medium">Attitudes ({data.attitudes.length})</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-purple-500 rounded-full mr-2"></div>
          <span className="font-medium">Values ({data.values.length})</span>
        </div>
      </div>

      {/* Detailed Text Lists - Vertical Layout */}
      <div className="mt-8 space-y-6">
        {/* Skills List */}
        <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
          <h4 className="font-bold text-red-700 text-lg mb-3 flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            Skills
          </h4>
          {data.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill, index) => (
                <span key={index} className="text-xs text-red-800 bg-white px-2 py-1 rounded border inline-block">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-red-600 italic text-sm">Continue the conversation to identify skills</p>
          )}
        </div>

        {/* Attitudes List */}
        <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
          <h4 className="font-bold text-green-700 text-lg mb-3 flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            Attitudes
          </h4>
          {data.attitudes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.attitudes.map((attitude, index) => (
                <span key={index} className="text-xs text-green-800 bg-white px-2 py-1 rounded border inline-block">
                  {attitude}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-green-600 italic text-sm">Share more about your approach to work</p>
          )}
        </div>

        {/* Values List */}
        <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
          <h4 className="font-bold text-purple-700 text-lg mb-3 flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
            Values
          </h4>
          {data.values.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.values.map((value, index) => (
                <span key={index} className="text-xs text-purple-800 bg-white px-2 py-1 rounded border inline-block">
                  {value}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-purple-600 italic text-sm">Explore what matters most to you at work</p>
          )}
        </div>
      </div>
    </div>
  );
};
