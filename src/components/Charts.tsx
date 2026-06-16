/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  CartesianGrid
} from 'recharts';
import { formatRupiah } from '../data';

interface AreaChartProps {
  data: { month: string; amount: number }[];
  height?: number;
}

export function ElegantAreaChart({ data, height = 180 }: AreaChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const maxAmount = Math.max(...data.map(d => d.amount), 1000000);
  const chartWidth = 500;
  const chartHeight = height;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const usableWidth = chartWidth - paddingLeft - paddingRight;
  const usableHeight = chartHeight - paddingTop - paddingBottom;

  // Generate coordinates
  const points = data.map((d, index) => {
    const x = paddingLeft + (index / (data.length - 1)) * usableWidth;
    const y = paddingTop + usableHeight - (d.amount / maxAmount) * usableHeight;
    return { x, y, month: d.month, amount: d.amount };
  });

  // SVG Line path
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // SVG Area path (closing at the bottom)
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + usableHeight} L ${points[0].x} ${paddingTop + usableHeight} Z`
    : '';

  // Generate Y-axis gridlines
  const yTicks = [0, maxAmount * 0.25, maxAmount * 0.5, maxAmount * 0.75, maxAmount];

  return (
    <div id="elegant-area-chart-container" className="w-full">
      <div className="flex justify-between items-center mb-3">
        <h4 id="chart-title-tren" className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Tren Tabungan (2026)</h4>
        <span id="chart-indicator" className="text-[10px] font-bold font-mono px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full border border-zinc-200 dark:border-zinc-700">Waktu Nyata</span>
      </div>
      
      <div className="relative">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d4d4d8" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#18181b" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#71717a" />
              <stop offset="50%" stopColor="#e4e4e7" />
              <stop offset="100%" stopColor="#f4f4f5" />
            </linearGradient>
          </defs>

          {/* Gridlines */}
          {yTicks.map((tick, idx) => {
            const y = paddingTop + usableHeight - (tick / maxAmount) * usableHeight;
            return (
              <g key={idx} className="opacity-40">
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={chartWidth - paddingRight} 
                  y2={y} 
                  stroke="#3f3f46" 
                  strokeDasharray="3 3" 
                  strokeWidth="1"
                />
                <text 
                  x={paddingLeft - 8} 
                  y={y + 4} 
                  fill="#94a3b8" 
                  fontSize="10" 
                  className="font-mono text-right"
                  textAnchor="end"
                >
                  {tick >= 1000000 ? `${(tick / 1000000).toFixed(1)}M` : formatRupiah(tick)}
                </text>
              </g>
            );
          })}

          {/* Area under the line */}
          <path 
            d={areaPath} 
            fill="url(#chartGradient)"
            className="transition-all duration-500 ease-out"
          />

          {/* The line itself */}
          <motion.path 
            d={linePath} 
            fill="none" 
            stroke="url(#lineGradient)" 
            strokeWidth="3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />

          {/* X axis labels */}
          {points.map((p, idx) => (
            <text 
              key={idx} 
              x={p.x} 
              y={chartHeight - 8} 
              fill="#a1a1aa" 
              fontSize="10" 
              textAnchor="middle"
              className="font-sans font-medium"
            >
              {p.month}
            </text>
          ))}

          {/* Data Circles (interactive) */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle 
                cx={p.x} 
                cy={p.y} 
                r={hoveredIdx === idx ? "7" : "4"} 
                fill={hoveredIdx === idx ? "#fafafa" : "#27272a"} 
                stroke="#a1a1aa" 
                strokeWidth={hoveredIdx === idx ? "3" : "2"}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            </g>
          ))}
        </svg>

        {/* Dynamic Tooltip on Hover */}
        {hoveredIdx !== null && (
          <div 
            style={{
              position: 'absolute',
              left: `${(points[hoveredIdx].x / chartWidth) * 100}%`,
              top: `${(points[hoveredIdx].y / chartHeight) * 100 - 15}%`,
              transform: 'translate(-50%, -100%)'
            }}
            className="bg-zinc-900 border border-zinc-700 text-white rounded px-2.5 py-1.5 shadow-2xl pointer-events-none text-xs z-50 flex flex-col font-sans backdrop-blur-md"
          >
            <span className="text-[10px] text-zinc-400 font-bold">{points[hoveredIdx].month} 2026</span>
            <span className="font-mono text-zinc-100 font-semibold">{formatRupiah(points[hoveredIdx].amount)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface CircularGaugeProps {
  percentage: number;
  label?: string;
  subLabel?: string;
  size?: number;
}

export function CircularTargetGauge({ percentage, label, subLabel, size = 160 }: CircularGaugeProps) {
  const cleanPercentage = Math.min(Math.max(percentage, 0), 100);
  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (cleanPercentage / 100) * circumference;

  return (
    <div id="circular-gauge-container" className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-95">
          {/* Background circle */}
          <circle 
            cx="60" 
            cy="60" 
            r={radius} 
            fill="none" 
            stroke="currentColor" 
            className="text-zinc-800 dark:text-zinc-100/10"
            strokeWidth={strokeWidth} 
          />
          {/* Progress circle with premium modern gradient */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#71717a" />
              <stop offset="40%" stopColor="#e4e4e7" />
              <stop offset="100%" stopColor="#fafafa" />
            </linearGradient>
            <linearGradient id="gaugeGradientDark" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#27272a" />
              <stop offset="40%" stopColor="#18181b" />
              <stop offset="100%" stopColor="#09090b" />
            </linearGradient>
          </defs>
          <motion.circle 
            cx="60" 
            cy="60" 
            r={radius} 
            fill="none" 
            stroke="url(#gaugeGradient)" 
            className="dark:stroke-[url(#gaugeGradientDark)]"
            strokeWidth={strokeWidth} 
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.span 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-black font-mono text-white dark:text-zinc-900"
          >
            {cleanPercentage.toFixed(0)}%
          </motion.span>
          {label && <span className="text-[10px] text-zinc-400 dark:text-zinc-500 tracking-widest uppercase font-bold mt-0.5">{label}</span>}
        </div>
      </div>
      {subLabel && <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2 text-center max-w-[170px] font-medium">{subLabel}</p>}
    </div>
  );
}

interface CustomBarChartProps {
  data: { label: string; amount: number; count?: number }[];
}

export function ElegantBarChart({ data }: CustomBarChartProps) {
  if (!data || data.length === 0) return null;
  const maxAmount = Math.max(...data.map(d => d.amount), 5000000);

  return (
    <div id="bar-chart-container" className="space-y-4">
      {data.map((item, idx) => {
        const pct = (item.amount / maxAmount) * 100;
        return (
          <div key={idx} className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 dark:bg-zinc-300"></span>
                {item.label}
              </span>
              <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-300">{formatRupiah(item.amount)}</span>
            </div>
            <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-300 dark:border-zinc-700/50">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: idx * 0.1 }}
                className="h-full rounded-full bg-gradient-to-r from-zinc-700 via-zinc-500 to-zinc-900 dark:from-zinc-600 dark:via-zinc-400 dark:to-zinc-100"
              />
            </div>
            {item.count !== undefined && (
              <div className="text-[10px] text-zinc-700 dark:text-zinc-400 font-medium text-right mt-0.5">
                {item.count} Transaksi
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function InteractiveJourneyChart() {
  const currentMonth = new Date().getMonth(); // 0 = Jan, 5 = Jun
  const allMonths = [
    { name: 'Jan', amount: 450000 },
    { name: 'Feb', amount: 580000 },
    { name: 'Mar', amount: 620000 },
    { name: 'Apr', amount: 750000 },
    { name: 'Mei', amount: 820000 },
    { name: 'Jun', amount: 950000 },
    { name: 'Jul', amount: 1050000 },
    { name: 'Agu', amount: 1200000 },
    { name: 'Sep', amount: 1350000 },
    { name: 'Okt', amount: 1480000 },
    { name: 'Nov', amount: 1650000 },
    { name: 'Des', amount: 1800000 },
  ];

  // Slice data to show up to current month or Jun (as per user request "sekarang bulan juni")
  const data = allMonths.slice(0, currentMonth + 1);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 p-3 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-300 ring-2 ring-black/5">
          <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1">{payload[0].payload.name} 2026</p>
          <p className="text-sm font-black text-zinc-900 dark:text-white font-mono">{formatRupiah(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-48 w-full group/chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
          onMouseMove={(state: any) => {
            if (state && state.activeTooltipIndex !== undefined) {
              setActiveIndex(state.activeTooltipIndex);
            }
          }}
          onMouseLeave={() => setActiveIndex(null)}
        >
          <defs>
            <linearGradient id="activeBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#27272a" stopOpacity={1} />
              <stop offset="100%" stopColor="#09090b" stopOpacity={1} />
            </linearGradient>
            <linearGradient id="darkActiveBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={1} />
              <stop offset="100%" stopColor="#d4d4d8" stopOpacity={1} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#52525b', fontSize: 10, fontWeight: 800 }}
            dy={10}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
            isAnimationActive={true}
            animationDuration={400}
            animationEasing="ease-out"
          />
          <Bar 
            dataKey="amount" 
            radius={[10, 10, 0, 0]}
            isAnimationActive={true}
            animationDuration={2000}
            animationEasing="cubic-bezier(0.34, 1.56, 0.64, 1)"
          >
            {data.map((entry, index) => {
              const isHighlight = index === (activeIndex ?? data.length - 1);
              return (
                <Cell 
                  key={`cell-${index}`} 
                  className="transition-all duration-700 ease-out cursor-pointer"
                  style={{ 
                    fill: isHighlight
                      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'url(#darkActiveBarGradient)' : 'url(#activeBarGradient)') 
                      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? '#e4e4e7' : '#f4f4f5'),
                    filter: isHighlight ? 'drop-shadow(0 0 8px rgba(0,0,0,0.15))' : 'none'
                  }}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
