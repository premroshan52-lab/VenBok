import React, { useState, useMemo } from "react";

const ActivityLineChart = ({ bookings = [] }) => {
  const [timeFilter, setTimeFilter] = useState("30D"); // '7D' | '30D' | '3M' | '1Y'

  // Generate data points based on filter and real bookings
  const chartData = useMemo(() => {
    const now = new Date();
    let days = 30;
    if (timeFilter === "7D") days = 7;
    else if (timeFilter === "3M") days = 90;
    else if (timeFilter === "1Y") days = 365;

    const points = [];
    const interval = Math.max(1, Math.floor(days / 10));

    for (let i = days; i >= 0; i -= interval) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      // Count bookings on or near this date
      const matched = bookings.filter((b) => {
        if (!b.date) return false;
        const bDate = new Date(b.date);
        const diffDays = Math.abs((d - bDate) / (1000 * 60 * 60 * 24));
        return diffDays < interval;
      });

      const total = matched.length;
      const approved = matched.filter((b) => ["Approved", "Confirmed", "Completed"].includes(b.status)).length;
      const cancelled = matched.filter((b) => ["Cancelled", "Rejected"].includes(b.status)).length;

      points.push({
        date: dateStr,
        label,
        total: Math.max(total, 0),
        approved: Math.max(approved, 0),
        cancelled: Math.max(cancelled, 0),
      });
    }

    return points;
  }, [bookings, timeFilter]);

  const maxVal = Math.max(
    ...chartData.map((p) => Math.max(p.total, p.approved, p.cancelled, 1)),
    5
  );

  // SVG dimensions
  const width = 640;
  const height = 220;
  const padding = { top: 20, right: 20, bottom: 30, left: 35 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const getX = (idx) => padding.left + (idx / (chartData.length - 1 || 1)) * graphWidth;
  const getY = (val) => padding.top + graphHeight - (val / maxVal) * graphHeight;

  // Path generators
  const generatePath = (key) => {
    return chartData.reduce((acc, point, i) => {
      const x = getX(i);
      const y = getY(point[key]);
      return i === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`;
    }, "");
  };

  const generateArea = (key) => {
    const line = generatePath(key);
    const startX = getX(0);
    const endX = getX(chartData.length - 1);
    const bottomY = padding.top + graphHeight;
    return `${line} L ${endX},${bottomY} L ${startX},${bottomY} Z`;
  };

  const totalPath = generatePath("total");
  const approvedPath = generatePath("approved");
  const totalArea = generateArea("total");

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", margin: 0 }}>BOOKING ACTIVITY</h3>
          <p className="card-subtitle">Volume and approval velocity over time</p>
        </div>

        {/* Time Filter Pills */}
        <div style={{ display: "flex", gap: "4px", background: "var(--panel-elevated)", padding: "3px", borderRadius: "8px" }}>
          {["7D", "30D", "3M", "1Y"].map((t) => (
            <button
              key={t}
              onClick={() => setTimeFilter(t)}
              style={{
                background: timeFilter === t ? "var(--primary)" : "transparent",
                color: timeFilter === t ? "#fff" : "var(--text-muted)",
                border: "none",
                borderRadius: "6px",
                padding: "4px 10px",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart */}
      <div style={{ width: "100%", overflowX: "auto" }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", minWidth: "480px" }}>
          <defs>
            <linearGradient id="totalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="approvedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = padding.top + graphHeight * pct;
            const val = Math.round(maxVal * (1 - pct));
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  fill="var(--text-muted)"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="inherit"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area under curves */}
          <path d={totalArea} fill="url(#totalGradient)" />

          {/* Line paths */}
          <path d={totalPath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
          <path d={approvedPath} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 2" />

          {/* Data Points */}
          {chartData.map((pt, i) => {
            const x = getX(i);
            const y = getY(pt.total);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="3.5"
                fill="#08090b"
                stroke="#6366f1"
                strokeWidth="2"
              />
            );
          })}

          {/* X Axis labels */}
          {chartData.map((pt, i) => {
            if (i % 2 !== 0 && chartData.length > 8) return null;
            const x = getX(i);
            return (
              <text
                key={i}
                x={x}
                y={height - 8}
                fill="var(--text-muted)"
                fontSize="10"
                textAnchor="middle"
                fontFamily="inherit"
              >
                {pt.label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "20px", alignItems: "center", justifyContent: "flex-end", fontSize: "0.78rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#6366f1" }} />
          <span style={{ color: "var(--text-secondary)" }}>Total Bookings</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981" }} />
          <span style={{ color: "var(--text-secondary)" }}>Approved</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityLineChart;
