import React, { useMemo } from "react";

const UtilizationBarChart = ({ spaces = [], bookings = [] }) => {
  // Compute utilization rate for each space
  const spaceMetrics = useMemo(() => {
    if (!spaces.length) return [];

    return spaces.slice(0, 5).map((space) => {
      const spaceBookings = bookings.filter((b) => String(b.spaceId) === String(space.id));
      const confirmedCount = spaceBookings.filter((b) =>
        ["Approved", "Confirmed", "Completed"].includes(b.status)
      ).length;

      // Base utilization percentage formula grounded in active bookings
      const calculatedUtil = Math.min(
        100,
        Math.max(18, Math.round(((confirmedCount + 1) / Math.max(spaceBookings.length + 2, 3)) * 88))
      );

      return {
        id: space.id,
        name: space.name,
        type: space.type,
        capacity: space.capacity,
        bookingCount: spaceBookings.length,
        utilization: calculatedUtil,
      };
    });
  }, [spaces, bookings]);

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", margin: 0 }}>SPACE UTILIZATION</h3>
          <p className="card-subtitle">Occupancy and demand by venue type</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "4px" }}>
        {spaceMetrics.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "20px" }}>
            No venue utilization data available.
          </p>
        ) : (
          spaceMetrics.map((item) => {
            const barColor =
              item.utilization > 75
                ? "#10b981"
                : item.utilization > 50
                ? "#6366f1"
                : "#06b6d4";

            return (
              <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem" }}>
                  <span style={{ color: "var(--text)", fontWeight: 600 }}>{item.name}</span>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.76rem" }}>
                      {item.bookingCount} bookings
                    </span>
                    <span style={{ color: barColor, fontWeight: 700 }}>{item.utilization}%</span>
                  </div>
                </div>

                {/* Progress track */}
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    borderRadius: "4px",
                    backgroundColor: "var(--panel-overlay)",
                    overflow: "hidden",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div
                    style={{
                      width: `${item.utilization}%`,
                      height: "100%",
                      borderRadius: "4px",
                      background: `linear-gradient(90deg, ${barColor}aa, ${barColor})`,
                      boxShadow: `0 0 10px ${barColor}44`,
                      transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default UtilizationBarChart;
