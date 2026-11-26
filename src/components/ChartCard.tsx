import React, { useId } from 'react';

interface ChartCardProps {
  title: string;
  type: 'line' | 'bar' | 'donut';
  data: Array<{ label: string; value: number; color?: string }>;
  language?: 'en' | 'hi';
}

export default function ChartCard({ title, type, data, language = 'en' }: ChartCardProps) {
  const isHi = language === 'hi';
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  const gradId = useId().replace(/:/g, '');

  const linePoints = (() => {
    if (data.length === 0) return [];
    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const step = data.length > 1 ? 300 / (data.length - 1) : 0;
    return data.map((d, idx) => {
      const x = data.length === 1 ? 150 : Number((idx * step).toFixed(1));
      const y = Number((85 - (d.value / maxVal) * 70).toFixed(1));
      return { x, y, label: d.label, value: d.value };
    });
  })();

  const linePath = linePoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
  const areaPath =
    linePoints.length > 0
      ? `${linePath} L ${linePoints[linePoints.length - 1].x},100 L ${linePoints[0].x},100 Z`
      : '';

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs select-none">
      <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#0F1B2D] mb-4">
        {title}
      </h3>

      {type === 'line' && (
        <div className="h-48 w-full flex flex-col justify-between">
          {/* Dynamic Vector Trendline */}
          <div className="relative flex-1">
            {linePoints.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                {isHi ? 'प्रवृत्ति डेटा उपलब्ध नहीं है' : 'No trend data available'}
              </div>
            ) : (
              <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
                <line x1="0" y1="20" x2="300" y2="20" stroke="#F1F5F9" strokeWidth="0.5" />
                <line x1="0" y1="50" x2="300" y2="50" stroke="#F1F5F9" strokeWidth="0.5" />
                <line x1="0" y1="80" x2="300" y2="80" stroke="#F1F5F9" strokeWidth="0.5" />

                <defs>
                  <linearGradient id={`chartGrad-${gradId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F4511E" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#F4511E" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {linePoints.length > 1 && <path d={areaPath} fill={`url(#chartGrad-${gradId})`} />}
                {linePoints.length > 1 && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#F4511E"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                {linePoints.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r="3.2"
                    fill={idx === linePoints.length - 1 ? '#16A34A' : '#F4511E'}
                    stroke="#FFFFFF"
                    strokeWidth="1"
                  >
                    <title>{`${pt.label}: ${pt.value}`}</title>
                  </circle>
                ))}
              </svg>
            )}
          </div>

          {/* Timeline labels */}
          {linePoints.length > 0 && (
            <div className="flex justify-between items-center text-[10px] font-mono text-[#64748B] mt-2 border-t border-slate-100 pt-1.5 gap-1">
              {linePoints.map((pt, idx) => (
                <span key={idx} className="truncate">
                  {pt.label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {type === 'bar' && (
        <div className="space-y-4">
          <div className="h-40 w-full flex items-end gap-3 px-2 pt-4">
            {data.map((item, idx) => {
              const maxVal = Math.max(...data.map((d) => d.value));
              const percentage = maxVal > 0 ? (item.value / maxVal) * 90 : 0; // scale to 90% max height
              return (
                <div key={idx} className="relative flex-1 flex flex-col items-center h-full justify-end group">
                  {/* Hover count */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#0F1B2D] text-white text-[9px] font-mono rounded px-1.5 py-0.5 -top-1 pointer-events-none absolute z-10">
                    {item.value}
                  </div>
                  {/* The bar */}
                  <div
                    style={{
                      height: `${item.value > 0 ? Math.max(percentage, 6) : 0}%`,
                      backgroundColor: item.color || '#2563EB',
                    }}
                    className="w-full rounded-t-sm transition-all duration-300 hover:opacity-85"
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
                {isHi ? 'कुल' : 'Total'}
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
