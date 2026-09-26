import React from "react";

export const Skeleton = ({ width = "100%", height = "16px", borderRadius = "var(--radius-md)", style = {} }) => {
  return (
    <div
      className="spacio-skeleton"
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
};

export const CardSkeleton = ({ count = 3 }) => {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Skeleton height="140px" borderRadius="var(--radius-lg)" />
          <Skeleton width="60%" height="20px" />
          <Skeleton width="40%" height="14px" />
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <Skeleton width="50%" height="32px" />
            <Skeleton width="50%" height="32px" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="table-wrap">
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} height="18px" width={c === 0 ? "35%" : "15%"} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const LoadingState = ({ type = "table", count = 3 }) => {
  if (type === "card") {
    return <CardSkeleton count={count} />;
  }
  return <TableSkeleton rows={count} />;
};

export default LoadingState;
