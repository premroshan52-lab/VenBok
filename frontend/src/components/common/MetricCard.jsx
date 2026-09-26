import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const MetricCard = ({
  label,
  value,
  trend,
  trendDirection = "up", // 'up' | 'down' | 'neutral'
  description,
  icon,
  onClick,
  className = "",
  style = {},
}) => {
  return (
    <div
      className={`metric-card ${onClick ? "card-interactive" : ""} ${className}`}
      onClick={onClick}
      style={style}
    >
      <div className="metric-card-top">
        <span className="metric-card-label">{label}</span>
        {icon && <div className="metric-card-icon">{icon}</div>}
      </div>

      <div className="metric-card-value">{value}</div>

      {(trend || description) && (
        <div className="metric-card-bottom">
          {trend && (
            <span className={`metric-trend ${trendDirection}`}>
              {trendDirection === "up" && <TrendingUp size={13} />}
              {trendDirection === "down" && <TrendingDown size={13} />}
              {trendDirection === "neutral" && <Minus size={13} />}
              {trend}
            </span>
          )}
          {description && <span className="metric-description">{description}</span>}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
