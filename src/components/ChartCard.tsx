import React from 'react';

interface ChartCardProps {
  title: string;
  type: 'line' | 'bar' | 'donut';
  data: Array<{ label: string; value: number; color?: string }>;
}

export default function ChartCard({ title, type, data }: ChartCardProps) {
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs select-none">
      <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#0F1B2D] mb-4">
        {title}
      </h3>

      {type === 'line' && (
        <div className="h-48 w-full flex flex-col justify-between">
          {/* Simple Vector Trendline */}
          <div className="relative flex-1">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="20" x2="300" y2="20" stroke="#F1F5F9" strokeWidth="0.5" />
              <line x1="0" y1="50" x2="300" y2="50" stroke="#F1F5F9" strokeWidth="0.5" />
              <line x1="0" y1="80" x2="300" y2="80" stroke="#F1F5F9" strokeWidth="0.5" />

              {/* Area Gradient under curve */}
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F4511E" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#F4511E" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,80 L 50,65 L 100,75 L 150,45 L 200,30 L 250,48 L 300,15 L 300,100 L 0,100 Z"
                fill="url(#chartGrad)"
              />

              {/* Solid Stroke Line */}
              <path
                d="M 0,80 L 50,65 L 100,75 L 150,45 L 200,30 L 250,48 L 300,15"
                fill="none"
                stroke="#F4511E"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Plot dots */}
              <circle cx="0" cy="80" r="3" fill="#0F1B2D" stroke="#FFFFFF" strokeWidth="1" />
              <circle cx="50" cy="65" r="3" fill="#F4511E" stroke="#FFFFFF" strokeWidth="1" />
              <circle cx="100" cy="75" r="3" fill="#F4511E" stroke="#FFFFFF" strokeWidth="1" />
              <circle cx="150" cy="45" r="3" fill="#F4511E" stroke="#FFFFFF" strokeWidth="1" />
              <circle cx="200" cy="30" r="3" fill="#0F1B2D" stroke="#FFFFFF" strokeWidth="1" />
              <circle cx="250" cy="48" r="3" fill="#F4511E" stroke="#FFFFFF" strokeWidth="1" />
              <circle cx="300" cy="15" r="3" fill="#16A34A" stroke="#FFFFFF" strokeWidth="1" />
            </svg>
          </div>

          {/* Timeline labels */}
          <div className="flex justify-between items-center text-[10px] font-mono text-[#64748B] mt-2 border-t border-slate-100 pt-1.5">
            <span>Sep 01</span>
            <span>Sep 10</span>
            <span>Sep 20</span>
            <span>Sep 30</span>
            <span>Oct 03</span>
          </div>
        </div>
      )}

      {type === 'bar' && (
        <div className="space-y-4">
          <div className="h-40 w-full flex items-end gap-3 px-2 pt-4">
            {data.map((item, idx) => {
              const maxVal = Math.max(...data.map((d) => d.value));
              const percentage = maxVal > 0 ? (item.value / maxVal) * 90 : 0; // scale to 90% max height
              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  {/* Hover count */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#0F1B2D] text-white text-[9px] font-mono rounded px-1.5 py-0.5 absolute -translate-y-11 pointer-events-none">
                    {item.value}
                  </div>
                  {/* The bar */}
                  <div
                    style={{ height: `${percentage}%` }}
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      item.color || 'bg-[#2563EB] hover:bg-[#1D4ED8]'
                    }`}
                  />
                  {/* Label */}
                  <span className="text-[9px] text-[#64748B] font-mono mt-2 truncate max-w-[45px] text-center uppercase tracking-wider">
                    {item.label.split(' - ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {type === 'donut' && (
        <div className="grid grid-cols-2 gap-4 items-center h-44">
          {/* Left: Beautiful vector SVG Donut */}
          <div className="relative flex justify-center items-center">
            <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 36 36">
              {/* Backing circle */}
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F1F5F9" strokeWidth="3" />

              {/* Dynamic segmented slices */}
              {(() => {
                let cumulativePercent = 0;
                return data.map((item, idx) => {
                  const percent = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
                  const strokeDasharray = `${percent} ${100 - percent}`;
                  const strokeDashoffset = 100 - cumulativePercent + 25; // start from top
                  cumulativePercent += percent;

                  return (
                    <circle
                      key={idx}
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke={item.color || '#F4511E'}
                      strokeWidth="3.2"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-500"
                    />
                  );
                });
              })()}
            </svg>

            {/* Inner absolute content */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-lg font-extrabold text-[#0F172A] font-mono tabular-nums leading-none">
                {totalValue}
              </span>
              <span className="text-[9px] font-semibold text-[#64748B] uppercase tracking-wider mt-0.5">
                Total
              </span>
            </div>
          </div>

          {/* Right: Key description labels */}
          <div className="space-y-1.5 overflow-y-auto max-h-36 pr-1">
            {data.map((item, idx) => {
              const percent = totalValue > 0 ? Math.round((item.value / totalValue) * 100) : 0;
              return (
                <div key={idx} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[#334155] font-medium truncate max-w-[70px]">
                      {item.label}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-[#0F172A] tabular-nums">{percent}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
