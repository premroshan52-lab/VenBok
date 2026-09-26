import React, { useState } from "react";
import {
  Building2,
  Users,
  MapPin,
  Star,
  Calendar,
  ShieldCheck,
  Check,
  Sparkles,
  Clock,
  ExternalLink,
  Info,
  CalendarDays,
} from "lucide-react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import FeasibilityAuditModal from "../feasibility/FeasibilityAuditModal";
import { useData } from "../../context/DataContext";

const VenueDetailsModal = ({
  space,
  isOpen,
  onClose,
  onBookVenue,
  isCompared = false,
  onToggleCompare,
}) => {
  const [isFeasibilityOpen, setIsFeasibilityOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const { bookings } = useData();

  if (!isOpen || !space) return null;

  const spaceIdStr = String(space.id || space._id);

  // Find upcoming bookings for this venue
  const venueBookings = (Array.isArray(bookings) ? bookings : []).filter(
    (b) => String(b.spaceId) === spaceIdStr && b.status !== "Rejected"
  );

  const hasAuthenticImage = Boolean(space.imageUrl && !imageFailed);
  const capacityLabel = space.capacity ? `${space.capacity} Pax` : "Capacity not published";

  return (
    <>
      <Modal
        title={space.name}
        subtitle={`${space.type} • ${capacityLabel}`}
        onClose={onClose}
        maxWidth="740px"
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              {onToggleCompare && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleCompare(space.id)}
                >
                  {isCompared ? "Remove from Compare" : "+ Compare"}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFeasibilityOpen(true)}
                icon={<Sparkles size={14} className="text-cyan-400" />}
              >
                Check Feasibility
              </Button>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
              {onBookVenue && (
                <Button
                  variant="primary"
                  onClick={() => {
                    onClose();
                    onBookVenue(space.id);
                  }}
                  icon={<Sparkles size={16} />}
                >
                  Book This Venue
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Large Visual Area */}
          <div
            style={{
              width: "100%",
              height: "220px",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              position: "relative",
              backgroundColor: "var(--panel-elevated)",
              border: space.isVerified ? "1px solid rgba(52, 211, 153, 0.35)" : "1px solid var(--border)",
            }}
          >
            {hasAuthenticImage ? (
              <>
                <img
                  src={space.imageUrl}
                  alt={space.name}
                  loading="lazy"
                  onError={() => setImageFailed(true)}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                {space.imageSource && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "10px",
                      left: "12px",
                      padding: "4px 10px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "rgba(15, 23, 42, 0.88)",
                      backdropFilter: "blur(6px)",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      color: "#e2e8f0",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                    }}
                  >
                    📷 Photo Source: {space.imageSource} ({space.imageSourceType === "official" ? "Official SECE Publication" : "Demo"})
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
                  gap: "8px",
                  background: space.isVerified
                    ? "linear-gradient(135deg, rgba(6, 78, 59, 0.3) 0%, rgba(15, 23, 42, 0.95) 100%)"
                    : "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)",
                }}
              >
                <Building2 size={48} color={space.isVerified ? "#34d399" : "var(--primary-light)"} opacity={0.7} />
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                  Venue image unavailable
                </span>
                {space.isVerified && (
                  <span style={{ fontSize: "0.72rem", color: "#34d399" }}>
                    Sri Eshwar College of Engineering Institutional Facility
                  </span>
                )}
              </div>
            )}

            {/* Verification Badge overlay */}
            {space.isVerified ? (
              <div
                style={{
                  position: "absolute",
                  top: "14px",
                  left: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 12px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "rgba(6, 78, 59, 0.92)",
                  backdropFilter: "blur(8px)",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#34d399",
                  border: "1px solid rgba(52, 211, 153, 0.45)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                }}
              >
                <Check size={14} strokeWidth={3} color="#34d399" />
                Verified SECE Facility
              </div>
            ) : (
              <div
                style={{
                  position: "absolute",
                  top: "14px",
                  left: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "rgba(30, 41, 59, 0.88)",
                  backdropFilter: "blur(8px)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#94a3b8",
                  border: "1px solid rgba(148, 163, 184, 0.3)",
                }}
              >
                Demo Venue
              </div>
            )}

          </div>

          {/* Key Metrics Strip */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "12px",
            }}
          >
            <div
              style={{
                padding: "12px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--panel-elevated)",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Capacity</div>
              <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text)", marginTop: "2px" }}>
                {capacityLabel}
              </div>
            </div>

            <div
              style={{
                padding: "12px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--panel-elevated)",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Rating</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--warning-text)", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                <Star size={16} fill="currentColor" /> {space.rating || 4.8}
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 400 }}>({space.reviewCount || 18})</span>
              </div>
            </div>

            <div
              style={{
                padding: "12px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--panel-elevated)",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Booking Access</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#34d399", marginTop: "2px" }}>
                Free Institutional Use
              </div>
            </div>

            <div
              style={{
                padding: "12px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--panel-elevated)",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Location</div>
              <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--text)", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                <MapPin size={14} color="var(--accent)" /> {space.city || "Coimbatore"}
              </div>
            </div>
          </div>

          {/* Source & Verification Information (Requirement 11) */}
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "var(--radius-md)",
              backgroundColor: space.isVerified ? "rgba(16, 185, 129, 0.08)" : "rgba(148, 163, 184, 0.06)",
              border: `1px solid ${space.isVerified ? "rgba(52, 211, 153, 0.28)" : "var(--border-subtle)"}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <div style={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: space.isVerified ? "#34d399" : "var(--text-muted)" }}>
                {space.isVerified ? "Institutional Source & Verification" : "Data Trust Status"}
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text)", marginTop: "3px" }}>
                <strong>Source:</strong> {space.sourceName || (space.isVerified ? "Sri Eshwar College of Engineering" : "VenBok Prototype Demo")}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "1px" }}>
                <strong>Verified from:</strong>{" "}
                {space.isVerified
                  ? space.sourceUrl?.includes("brochure")
                    ? "Official SECE IT Centre Brochure"
                    : "Official SECE Website (sece.ac.in)"
                  : "Prototype Dataset (Fictional Demo Venue)"}
              </div>
            </div>

            {space.sourceUrl ? (
              <a
                href={space.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 14px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  color: "#34d399",
                  border: "1px solid rgba(52, 211, 153, 0.4)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                }}
              >
                <ExternalLink size={14} />
                View Source
              </a>
            ) : (
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Prototype Venue (No External Source)
              </span>
            )}
          </div>

          {/* Overview Description */}
          <div>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}>Overview</h4>
            <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
              {space.description ||
                "State-of-the-art facility equipped with presentation infrastructure, tailored for academic, corporate, and cultural productions."}
            </p>
          </div>

          {/* Facilities & Amenities */}
          <div>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text)", marginBottom: "10px" }}>
              Included Facilities & Technology
            </h4>
            {space.facilities && space.facilities.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "8px" }}>
                {space.facilities.map((fac, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--panel-elevated)",
                      border: "1px solid var(--border)",
                      fontSize: "0.82rem",
                      color: "var(--text)",
                    }}
                  >
                    <div
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(16, 185, 129, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--success-text)",
                      }}
                    >
                      <Check size={12} />
                    </div>
                    <span>{fac}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--panel-elevated)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-muted)",
                  fontSize: "0.82rem",
                  fontStyle: "italic",
                }}
              >
                No specific peripheral equipment listed in official documentation. Setup arranged per event requisition.
              </div>
            )}
          </div>

          {/* Upcoming Bookings & Availability (Requirement 9) */}
          <div>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <CalendarDays size={16} color="var(--primary-light)" />
              Availability & Upcoming Schedule
            </h4>

            {venueBookings.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {venueBookings.slice(0, 3).map((booking, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--panel-elevated)",
                      border: "1px solid var(--border)",
                      fontSize: "0.82rem",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text)" }}>{booking.title}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "2px" }}>
                        {booking.date} • {booking.start} - {booking.end}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        backgroundColor:
                          booking.status === "Approved"
                            ? "rgba(16, 185, 129, 0.15)"
                            : "rgba(245, 158, 11, 0.15)",
                        color:
                          booking.status === "Approved"
                            ? "var(--success-text)"
                            : "var(--warning-text)",
                      }}
                    >
                      {booking.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(52, 211, 153, 0.2)",
                  color: "#34d399",
                  fontSize: "0.82rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Check size={14} />
                <span>Currently open for reservations — No upcoming booking conflicts on record.</span>
              </div>
            )}
          </div>

          {/* Operational Guidelines & Rules */}
          <div>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>
              Campus Rules & Operational Policies
            </h4>
            <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              {(space.rules && space.rules.length > 0
                ? space.rules
                : [
                    "Advance reservation required through the VenBok portal",
                    "Acoustic volume governance in effect during academic teaching hours (09:00 - 16:30)",
                    "Food and open catering allowed exclusively in designated foyer areas",
                  ]
              ).map((rule, idx) => (
                <li key={idx}>{rule}</li>
              ))}
            </ul>
          </div>
        </div>
      </Modal>

      <FeasibilityAuditModal
        isOpen={isFeasibilityOpen}
        onClose={() => setIsFeasibilityOpen(false)}
        space={space}
        onProceedToBook={(targetSpace) => {
          setIsFeasibilityOpen(false);
          if (onBookVenue) onBookVenue(targetSpace.id || targetSpace._id);
        }}
      />
    </>
  );
};

export default VenueDetailsModal;
