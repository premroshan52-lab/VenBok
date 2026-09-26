import React from "react";

const FeasibilityScoreGauge = ({ score = 0, verdictTone = "success", size = 120, strokeWidth = 10, showLabel = true }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  const getColor = () => {
    if (safeScore >= 88) return { primary: "#10b981", bg: "rgba(16, 185, 129, 0.15)", glow: "rgba(16, 185, 129, 0.4)" };
    if (safeScore >= 70) return { primary: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", glow: "rgba(245, 158, 11, 0.4)" };
    if (safeScore >= 45) return { primary: "#f97316", bg: "rgba(249, 115, 22, 0.15)", glow: "rgba(249, 115, 22, 0.4)" };
    return { primary: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", glow: "rgba(239, 68, 68, 0.4)" };
  };

  const colors = getColor();

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)", filter: `drop-shadow(0 0 12px ${colors.glow})` }}>
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
          />
          {/* Dynamic Progress Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={colors.primary}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />
        </svg>

        {/* Center Text */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: size > 90 ? "24px" : "18px", fontWeight: 800, color: "#fff", lineHeight: 1, letterSpacing: "-0.03em" }}>
            {safeScore}
            <span style={{ fontSize: size > 90 ? "13px" : "10px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>%</span>
          </span>
          <span style={{ fontSize: size > 90 ? "10px" : "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: colors.primary, marginTop: "4px" }}>
            VIABILITY
          </span>
        </div>
      </div>

      {showLabel && (
        <div style={{ marginTop: "8px", textAlign: "center" }}>
          <span
            style={{
              display: "inline-block",
              padding: "3px 10px",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.02em",
              backgroundColor: colors.bg,
              color: colors.primary,
              border: `1px solid ${colors.primary}33`,
            }}
          >
            {safeScore >= 88 ? "Highly Feasible" : safeScore >= 70 ? "Feasible (Mitigate)" : safeScore >= 45 ? "High Operational Risk" : "Inviable"}
          </span>
        </div>
      )}
    </div>
  );
};

export default FeasibilityScoreGauge;
