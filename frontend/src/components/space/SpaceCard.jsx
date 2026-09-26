import React, { useState } from "react";
import { Building2, Users, MapPin, Star, ShieldCheck, Sparkles, Plus, Check, CalendarCheck, ImageOff, Camera } from "lucide-react";
import Button from "../common/Button";

const SpaceCard = ({
  space,
  onViewDetails,
  onBookNow,
  isCompared = false,
  onToggleCompare,
  onCheckFeasibility,
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  if (!space) return null;

  const facilitiesList = space.facilities || [
    "Air Conditioning",
    "Projector",
    "WiFi",
    "Sound System",
  ];

  const hasAuthenticImage = Boolean(space.imageUrl && !imageFailed);

  return (
    <div
      className="card card-interactive"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 0,
        overflow: "hidden",
        height: "100%",
        border: space.isVerified ? "1px solid rgba(52, 211, 153, 0.3)" : undefined,
      }}
    >
      {/* Venue Photo / Visual */}
      <div
        style={{
          width: "100%",
          height: "165px",
          position: "relative",
          backgroundColor: "var(--panel-elevated)",
          overflow: "hidden",
        }}
      >
        {hasAuthenticImage ? (
          <>
            <img
              src={space.imageUrl}
              alt={space.name}
              loading="lazy"
              onError={() => setImageFailed(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s ease" }}
              className="venue-card-img"
            />
            {space.isVerified && (
              <div
                style={{
                  position: "absolute",
                  bottom: "10px",
                  left: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 8px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "rgba(15, 23, 42, 0.85)",
                  backdropFilter: "blur(6px)",
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  color: "#34d399",
                  border: "1px solid rgba(52, 211, 153, 0.3)",
                }}
              >
                <Camera size={11} /> Real SECE Photo
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              background: space.isVerified
                ? "linear-gradient(135deg, rgba(6, 78, 59, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%)"
                : "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)",
              color: "var(--text-muted)",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <Building2 size={36} color={space.isVerified ? "#34d399" : "var(--primary-light)"} opacity={0.7} />
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              Venue image unavailable
            </span>
            {space.isVerified && (
              <span style={{ fontSize: "0.7rem", color: "#34d399", opacity: 0.9 }}>
                Official SECE Infrastructure
              </span>
            )}
          </div>
        )}

        {/* Verification badge */}
        {space.isVerified ? (
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "3px 9px",
              borderRadius: "var(--radius-full)",
              backgroundColor: "rgba(6, 78, 59, 0.92)",
              backdropFilter: "blur(6px)",
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "#34d399",
              border: "1px solid rgba(52, 211, 153, 0.45)",
              boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
            }}
          >
            <Check size={12} strokeWidth={3} color="#34d399" />
            Verified SECE Facility
          </div>
        ) : (
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "3px 8px",
              borderRadius: "var(--radius-full)",
              backgroundColor: "rgba(30, 41, 59, 0.88)",
              backdropFilter: "blur(6px)",
              fontSize: "0.7rem",
              fontWeight: 600,
              color: "#94a3b8",
              border: "1px solid rgba(148, 163, 184, 0.28)",
            }}
          >
            Demo Venue
          </div>
        )}

        {/* Compare button */}
        {onToggleCompare && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare(space.id);
            }}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: isCompared ? "var(--primary)" : "rgba(11, 13, 16, 0.85)",
              color: "#fff",
              border: isCompared ? "none" : "1px solid var(--border)",
              backdropFilter: "blur(6px)",
              fontSize: "0.7rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {isCompared ? <Check size={12} /> : <Plus size={12} />}
            <span>{isCompared ? "Compared" : "Compare"}</span>
          </button>
        )}

      </div>

      {/* Card Content */}
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
            <div>
              <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>
                {space.name}
              </h4>
              <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontWeight: 500 }}>
                {space.type}
              </span>
            </div>

            {/* Rating */}
            <div style={{ display: "flex", alignItems: "center", gap: "3px", color: "var(--warning-text)", fontSize: "0.8rem", fontWeight: 700 }}>
              <Star size={13} fill="currentColor" />
              <span>{space.rating || 4.8}</span>
            </div>
          </div>

          {/* Quick Specs */}
          <div style={{ display: "flex", gap: "14px", marginTop: "10px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <Users size={14} color="var(--primary-light)" />
              {space.capacity ? `${space.capacity} seats` : "Capacity not published"}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <MapPin size={14} color="var(--accent)" /> {space.city || "Coimbatore"}
            </span>
          </div>

          {/* Facilities pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "10px" }}>
            {facilitiesList.length > 0 ? (
              facilitiesList.slice(0, 3).map((f, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: "0.72rem",
                    padding: "2px 7px",
                    borderRadius: "4px",
                    backgroundColor: "var(--panel-elevated)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-muted)",
                  }}
                >
                  {f}
                </span>
              ))
            ) : (
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                Facilities documented on request
              </span>
            )}
            {facilitiesList.length > 3 && (
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", alignSelf: "center" }}>
                +{facilitiesList.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons: View Details, Check Availability, Plan Event */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px", paddingTop: "12px", borderTop: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onViewDetails && onViewDetails(space)}
            >
              View Details
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => onBookNow && onBookNow(space.id)}
              icon={<Sparkles size={13} />}
            >
              Check Availability
            </Button>
          </div>

          {onCheckFeasibility && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCheckFeasibility(space)}
              icon={<CalendarCheck size={13} className="text-cyan-400" />}
              style={{ width: "100%", justifyContent: "center" }}
            >
              Plan Event / Feasibility
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpaceCard;
