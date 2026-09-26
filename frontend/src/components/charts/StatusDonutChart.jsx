import React, { useMemo } from "react";

const StatusDonutChart = ({ bookings = [] }) => {
  const stats = useMemo(() => {
    const total = bookings.length;
    if (total === 0) {
      return {
        total: 0,
        items: [
          { label: "Approved", count: 0, pct: 0, color: "#10b981" },
          { label: "Pending", count: 0, pct: 0, color: "#f59e0b" },
          { label: "Completed", count: 0, pct: 0, color: "#06b6d4" },
          { label: "Cancelled", count: 0, pct: 0, color: "#64748b" },
        ],
      };
    }

    const approved = bookings.filter((b) => ["Approved", "Confirmed"].includes(b.status)).length;
    const pending = bookings.filter((b) => ["Pending", "Requested"].includes(b.status)).length;
    const completed = bookings.filter((b) => b.status === "Completed").length;
    const cancelled = bookings.filter((b) => ["Cancelled", "Rejected"].includes(b.status)).length;

    return {
      total,
      items: [
        { label: "Approved", count: approved, pct: Math.round((approved / total) * 100) || 0, color: "#10b981" },
        { label: "Pending", count: pending, pct: Math.round((pending / total) * 100) || 0, color: "#f59e0b" },
        { label: "Completed", count: completed, pct: Math.round((completed / total) * 100) || 0, color: "#06b6d4" },
        { label: "Cancelled", count: cancelled, pct: Math.round((cancelled / total) * 100) || 0, color: "#64748b" },
      ],
    };
  }, [bookings]);

  // Generate SVG conic path segments
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", margin: 0 }}>BOOKING STATUS</h3>
          <p className="card-subtitle">Distribution by lifecycle stage</p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "24px", flexWrap: "wrap", padding: "10px 0" }}>
        {/* SVG Donut */}
        <div style={{ position: "relative", width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth={strokeWidth}
            />

            {stats.items.map((item, i) => {
              if (item.count === 0 && stats.total > 0) return null;
              const strokeDasharray = `${(item.pct / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += item.pct;

              return (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dasharray 0.5s ease" }}
                />
              );
            })}
          </svg>

          {/* Centered label */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <span style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff", lineHeight: 1 }}>
              {stats.total}
            </span>
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "2px" }}>
              Total
            </span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "140px" }}>
          {stats.items.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.82rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.color }} />
                <span style={{ color: "var(--text-secondary)" }}>{item.label}</span>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <span style={{ color: "var(--text)", fontWeight: 600 }}>{item.count}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>({item.pct}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatusDonutChart;
