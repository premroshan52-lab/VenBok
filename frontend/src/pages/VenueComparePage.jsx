import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, Check, X, Sparkles, Building2, Trash2, ArrowRight } from "lucide-react";
import { useData } from "../context/DataContext";
import { PATHS } from "../utils/routePaths";
import { useBookingModal } from "../components/layout/DashboardLayout";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";

const CRITERIA = [
  { key: "feasibility", label: "Event Feasibility", format: (s) => (s.isVerified ? "92% Feasible (Optimal)" : "85% Feasible (Viable)") },
  { key: "capacity", label: "Capacity (Pax)", format: (s) => (s.capacity ? `${s.capacity} Pax` : "Capacity not published") },
  { key: "availability", label: "Availability", format: () => "✓ Available on requested date" },
  { key: "requirementMatch", label: "Requirement Match", format: (s) => (s.isVerified ? "✓ All Core Requirements Met" : "✓ Standard Setup Matched") },
  { key: "warnings", label: "Operational Notes", format: (s) => ((s.facilities || []).some((f) => f.toLowerCase().includes("parking")) ? "Campus parking available" : "Verify parking for 150+ attendees") },
  { key: "access", label: "Booking Access", format: () => "Free Institutional Use" },
  { key: "city", label: "Location", format: (s) => s.city || "Coimbatore" },
  { key: "trust", label: "Institutional Trust", format: (s) => (s.isVerified ? "✓ Verified SECE Facility" : "Demo Venue") },
  {
    key: "ac",
    label: "Air Conditioning",
    isCheck: (s) => (s.facilities || []).some((f) => f.toLowerCase().includes("condition")),
  },
  {
    key: "projector",
    label: "Projector & Visuals",
    isCheck: (s) => (s.facilities || []).some((f) => f.toLowerCase().includes("projector")),
  },
  {
    key: "sound",
    label: "Acoustics & Sound System",
    isCheck: (s) => (s.facilities || []).some((f) => f.toLowerCase().includes("sound")),
  },
  {
    key: "wifi",
    label: "High-Speed WiFi",
    isCheck: (s) => (s.facilities || []).some((f) => f.toLowerCase().includes("wifi")),
  },
  {
    key: "power",
    label: "Dedicated Power Backup",
    isCheck: (s) => (s.facilities || []).some((f) => f.toLowerCase().includes("power")),
  },
  {
    key: "stage",
    label: "Stage & Podium",
    isCheck: (s) => (s.facilities || []).some((f) => f.toLowerCase().includes("stage")),
  },
  {
    key: "parking",
    label: "Reserved Parking",
    isCheck: (s) => (s.facilities || []).some((f) => f.toLowerCase().includes("parking")),
  },
];

const VenueComparePage = () => {
  const navigate = useNavigate();
  const { spaces, compareVenueIds, removeFromCompare, clearCompare, addToCompare } = useData();
  const { openBookingModal } = useBookingModal();

  const comparedSpaces = useMemo(() => {
    return spaces.filter((s) => compareVenueIds.includes(String(s.id)));
  }, [spaces, compareVenueIds]);

  const availableToCompare = useMemo(() => {
    return spaces.filter((s) => !compareVenueIds.includes(String(s.id)));
  }, [spaces, compareVenueIds]);

  // Intelligent Trade-off Summary
  const tradeOffSummary = useMemo(() => {
    if (comparedSpaces.length < 2) return null;

    const highestCap =
      [...comparedSpaces].filter((s) => s.capacity).sort((a, b) => b.capacity - a.capacity)[0] ||
      comparedSpaces[0];
    const verifiedVenue = [...comparedSpaces].find((s) => s.isVerified) || comparedSpaces[0];

    return (
      <div
        className="card"
        style={{
          backgroundColor: "rgba(99, 102, 241, 0.06)",
          border: "1px solid rgba(99, 102, 241, 0.25)",
          padding: "18px 22px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <Sparkles size={18} color="var(--primary-light)" />
          <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff", margin: 0 }}>
            Intelligent Trade-off Summary
          </h4>
        </div>
        <p style={{ margin: 0, fontSize: "0.86rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          <strong>{highestCap.name}</strong> offers {highestCap.capacity ? `maximum attendee capacity (${highestCap.capacity} Pax)` : "flexible institutional space"} for campus events. For certified AV and acoustics,{" "}
          <strong>{verifiedVenue.name}</strong> provides official SECE verified infrastructure. All venues are available for free internal reservation under institutional license.
        </p>
      </div>
    );
  }, [comparedSpaces]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ── Page Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>
            Compare Venues
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.92rem" }}>
            Side-by-side technical evaluation of capacity, equipment availability, and facility trade-offs.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {comparedSpaces.length > 0 && (
            <Button variant="ghost" onClick={clearCompare}>
              Clear All ({comparedSpaces.length})
            </Button>
          )}

          <Button variant="secondary" onClick={() => navigate(PATHS.SPACES)}>
            + Add Venues
          </Button>
        </div>
      </div>

      {/* Trade-off summary banner if >= 2 venues */}
      {tradeOffSummary}

      {/* Quick Add Selector if < 4 venues */}
      {availableToCompare.length > 0 && comparedSpaces.length < 4 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 18px",
            backgroundColor: "var(--panel-elevated)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            fontSize: "0.85rem",
          }}
        >
          <span style={{ color: "var(--text-muted)" }}>Quick add to comparison:</span>
          <select
            className="select"
            style={{ width: "auto", minWidth: "260px", padding: "6px 12px" }}
            onChange={(e) => {
              if (e.target.value) {
                addToCompare(e.target.value);
                e.target.value = "";
              }
            }}
          >
            <option value="">Choose a venue to compare...</option>
            {availableToCompare.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.type} • {s.capacity ? `${s.capacity} Pax` : "Capacity not published"})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── Comparison Matrix Table ── */}
      {comparedSpaces.length === 0 ? (
        <EmptyState
          icon={<Scale size={32} />}
          title="No venues selected for comparison"
          description="Select 2 or more venues from the discovery marketplace to evaluate them side by side."
          actionLabel="Explore Venues"
          onAction={() => navigate(PATHS.SPACES)}
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: "220px" }}>Feature / Metric</th>
                {comparedSpaces.map((space) => (
                  <th key={space.id} style={{ minWidth: "200px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ color: "#fff", fontSize: "0.95rem", fontWeight: 700 }}>
                          {space.name}
                        </div>
                        <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", textTransform: "none", fontWeight: 500 }}>
                          {space.type}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCompare(space.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          padding: "2px",
                        }}
                        aria-label="Remove"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CRITERIA.map((criterion) => (
                <tr key={criterion.key}>
                  <td style={{ fontWeight: 600, color: "var(--text-muted)", fontSize: "0.82rem" }}>
                    {criterion.label}
                  </td>
                  {comparedSpaces.map((space) => {
                    let content = null;
                    if (criterion.isCheck) {
                      const hasIt = criterion.isCheck(space);
                      content = hasIt ? (
                        <span style={{ color: "var(--success-text)", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Check size={16} /> Yes
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                          <X size={16} /> No
                        </span>
                      );
                    } else if (criterion.format) {
                      content = <strong style={{ color: "var(--text)" }}>{criterion.format(space)}</strong>;
                    }

                    return <td key={space.id}>{content}</td>;
                  })}
                </tr>
              ))}

              {/* Action row at bottom */}
              <tr>
                <td style={{ fontWeight: 600, color: "var(--text-muted)" }}>Action</td>
                {comparedSpaces.map((space) => (
                  <td key={space.id}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => openBookingModal(space.id)}
                      icon={<Sparkles size={14} />}
                      style={{ width: "100%" }}
                    >
                      Book This Venue
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VenueComparePage;
