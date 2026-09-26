import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import Button from "../components/common/Button";
import StatusBadge from "../components/common/StatusBadge";
import StatCard from "../components/common/StatCard";
import Modal from "../components/common/Modal";
import api from "../services/api";

const CustomerDashboard = () => {
  const { user } = useAuth();
  const { spaces, bookings, refreshData, savedVenueIds, toggleSaveVenue, addToCompare } = useData();

  const [activeTab, setActiveTab] = useState("bookings"); // 'bookings' | 'saved' | 'disputes'
  const [complaints, setComplaints] = useState([]);
  const [loadingExtras, setLoadingExtras] = useState(false);

  const [reviewModalBooking, setReviewModalBooking] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewCategories, setReviewCategories] = useState({
    cleanliness: 5,
    facilities: 5,
    staff: 5,
    equipmentSupport: 5,
  });
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [complaintModalBooking, setComplaintModalBooking] = useState(null);
  const [complaintForm, setComplaintForm] = useState({
    subject: "",
    category: "Venue Facility Issue",
    description: "",
  });
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);

  // Load complaints
  const loadExtras = async () => {
    setLoadingExtras(true);
    try {
      const compRes = await api.get("/complaints");
      setComplaints(compRes?.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch customer complaints", err);
    } finally {
      setLoadingExtras(false);
    }
  };

  useEffect(() => {
    loadExtras();
  }, []);

  // Review submission handler
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewModalBooking) return;
    setReviewSubmitting(true);
    try {
      await api.post("/reviews", {
        spaceId: reviewModalBooking.spaceId,
        bookingId: reviewModalBooking.id,
        rating: reviewRating,
        categories: reviewCategories,
        comment: reviewComment,
      });
      alert("Thank you! Your verified review and rating have been published.");
      setReviewModalBooking(null);
      setReviewComment("");
      refreshData();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to publish review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Complaint submission handler
  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    setComplaintSubmitting(true);
    try {
      await api.post("/complaints", {
        spaceId: complaintModalBooking?.spaceId,
        bookingId: complaintModalBooking?.id,
        subject: complaintForm.subject,
        category: complaintForm.category,
        description: complaintForm.description,
      });
      alert("Complaint ticket submitted successfully. Our dispute mediation team is on it.");
      setComplaintModalBooking(null);
      setComplaintForm({ subject: "", category: "Venue Facility Issue", description: "" });
      loadExtras();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to submit dispute ticket.");
    } finally {
      setComplaintSubmitting(false);
    }
  };

  // Filter bookings belonging to this customer/user
  const myBookings = bookings.filter((b) => {
    if (!user) return true;
    if (b.userId === user.id || b.userId?._id === user.id) return true;
    if (b.bookedBy === user.name || b.bookedBy === user.email) return true;
    return user.role === "customer";
  });

  const upcomingCount = myBookings.filter((b) =>
    ["Approved", "Confirmed", "Pending"].includes(b.status)
  ).length;

  const completedCount = myBookings.filter((b) => b.status === "Completed").length;

  const approvedCount = myBookings.filter((b) =>
    ["Approved", "Confirmed"].includes(b.status)
  ).length;

  // Saved spaces objects
  const savedSpaces = spaces.filter((s) => savedVenueIds.includes(String(s.id)));

  // Helper for 5-step status stepper
  const getStepClass = (bookingStatus, stepName) => {
    const steps = ["Requested", "Under Review", "Approved", "Confirmed", "Completed"];
    const statusMap = {
      Pending: 0,
      "Under Review": 1,
      Approved: 2,
      Confirmed: 3,
      "In Progress": 3,
      Completed: 4,
    };
    const currentStepIndex = statusMap[bookingStatus] ?? 0;
    const thisStepIndex = steps.indexOf(stepName);

    if (thisStepIndex < currentStepIndex) return "stepper-step completed";
    if (thisStepIndex === currentStepIndex) return "stepper-step active";
    return "stepper-step upcoming";
  };

  return (
    <div className="customer-dashboard" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Welcome Banner */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
          color: "#fff",
          padding: "28px",
          borderRadius: "16px",
          boxShadow: "0 10px 25px -5px rgba(67, 56, 202, 0.4)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.5px" }}>
                ORGANIZER HUB
              </span>
              <span style={{ color: "#a5b4fc", fontSize: "0.85rem" }}>● Active Session</span>
            </div>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 700, margin: "0 0 6px 0", color: "#ffffff" }}>
              Welcome back, {user?.name || "Event Organizer"}!
            </h1>
            <p style={{ margin: 0, color: "#c7d2fe", fontSize: "0.95rem", maxWidth: "600px" }}>
              Plan campus conferences, hackathons, academic symposiums, and cultural events with fast institutional reservation requests, automated feasibility checks, and live coordinator approval tracking.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link to="/explore">
              <Button style={{ background: "#ffffff", color: "#4338ca", fontWeight: 600, border: "none" }}>
                🔍 Explore Venues
              </Button>
            </Link>
            <Link to="/planner">
              <Button style={{ background: "#4f46e5", color: "#ffffff", border: "1px solid #818cf8" }}>
                🎯 Smart Event Planner
              </Button>
            </Link>
            <Link to="/compare">
              <Button secondary style={{ color: "#ffffff", borderColor: "rgba(255,255,255,0.4)" }}>
                ⚖️ Compare Venues
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        <StatCard
          title="Total Bookings"
          value={myBookings.length}
          subtitle="Lifetime reservations"
          icon="📅"
        />
        <StatCard
          title="Upcoming Events"
          value={upcomingCount}
          subtitle="Scheduled & Confirmed"
          icon="⏳"
        />
        <StatCard
          title="Completed Events"
          value={completedCount}
          subtitle="Successfully hosted"
          icon="🏆"
        />
        <StatCard
          title="Approved Events"
          value={approvedCount}
          subtitle="Official campus events"
          icon="✅"
        />
        <StatCard
          title="Saved Venues"
          value={savedVenueIds.length}
          subtitle="Bookmarked spaces"
          icon="❤️"
        />
      </div>

      {/* Tabs Navigation */}
      <div
        className="card"
        style={{
          display: "flex",
          gap: "8px",
          padding: "10px 14px",
          borderBottom: "1px solid #e2e8f0",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          overflowX: "auto",
        }}
      >
        <button
          onClick={() => setActiveTab("bookings")}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            background: activeTab === "bookings" ? "#4338ca" : "transparent",
            color: activeTab === "bookings" ? "#ffffff" : "#475569",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>📋</span> My Bookings & Events ({myBookings.length})
        </button>

        <button
          onClick={() => setActiveTab("saved")}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            background: activeTab === "saved" ? "#4338ca" : "transparent",
            color: activeTab === "saved" ? "#ffffff" : "#475569",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>❤️</span> Saved Venues ({savedSpaces.length})
        </button>



        <button
          onClick={() => setActiveTab("disputes")}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            background: activeTab === "disputes" ? "#4338ca" : "transparent",
            color: activeTab === "disputes" ? "#ffffff" : "#475569",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>🛡️</span> Dispute & Support Tickets ({complaints.length})
        </button>
      </div>

      {/* TAB CONTENT 1: BOOKINGS */}
      {activeTab === "bookings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {myBookings.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
              <span style={{ fontSize: "3rem" }}>🎪</span>
              <h3 style={{ margin: "16px 0 8px" }}>No event bookings yet</h3>
              <p style={{ color: "#64748b", marginBottom: "20px" }}>
                Ready to find the perfect venue for your next summit, workshop, or banquet?
              </p>
              <Link to="/explore">
                <Button>Discover Top Rated Venues</Button>
              </Link>
            </div>
          ) : (
            myBookings.map((b) => {
              const space = spaces.find((s) => s.id === b.spaceId || s.name === b.spaceName);
              const isConfirmed = ["Confirmed", "Approved", "Completed"].includes(b.status);
              const isFinished = b.status === "Completed";

              return (
                <div
                  key={b.id || b._id}
                  className="card"
                  style={{
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                    borderRadius: "14px",
                    borderLeft: `5px solid ${isConfirmed ? "#10b981" : "#4338ca"}`,
                  }}
                >
                  {/* Top Bar */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a" }}>
                          {b.spaceName || space?.name || "Institutional Space"}
                        </h3>
                        <StatusBadge status={b.status} />
                      </div>
                      <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.9rem" }}>
                        Purpose: <strong>{b.purpose || "Campus Event / Seminar"}</strong> • Ref ID: #{String(b.id || b._id).slice(-6).toUpperCase()}
                      </p>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span style={{ background: "rgba(16, 185, 129, 0.1)", color: "#059669", padding: "6px 12px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 700 }}>
                        Free Institutional Booking
                      </span>
                    </div>
                  </div>

                  {/* Date / Time / Specs grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: "12px",
                      background: "#f8fafc",
                      padding: "14px",
                      borderRadius: "10px",
                      fontSize: "0.9rem",
                    }}
                  >
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>
                        Event Date
                      </span>
                      <strong>📅 {b.date}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>
                        Time Window
                      </span>
                      <strong>⏰ {b.startTime || b.start} – {b.endTime || b.end}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>
                        Attendees / Guests
                      </span>
                      <strong>👥 {b.attendees || space?.capacity || 150} Seats</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>
                        Location / City
                      </span>
                      <strong>📍 {space?.city || "Coimbatore, TN"}</strong>
                    </div>
                  </div>

                  {/* 5-Step Lifecycle Stepper */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "8px 0", position: "relative" }}>
                    {["Requested", "Under Review", "Approved", "Confirmed", "Completed"].map((step, idx) => {
                      const stepClass = getStepClass(b.status, step);
                      const isDone = stepClass.includes("completed");
                      const isActive = stepClass.includes("active");

                      return (
                        <div
                          key={step}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            flex: 1,
                            position: "relative",
                            zIndex: 2,
                          }}
                        >
                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              background: isDone ? "#10b981" : isActive ? "#4338ca" : "#e2e8f0",
                              color: isDone || isActive ? "#fff" : "#64748b",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              marginBottom: "6px",
                              boxShadow: isActive ? "0 0 0 4px rgba(67, 56, 202, 0.2)" : "none",
                            }}
                          >
                            {isDone ? "✓" : idx + 1}
                          </div>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: isActive ? 700 : 500,
                              color: isActive ? "#4338ca" : isDone ? "#059669" : "#94a3b8",
                              textAlign: "center",
                            }}
                          >
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions Footer */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: "1px solid #f1f5f9",
                      paddingTop: "14px",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => {
                          setComplaintModalBooking(b);
                          setComplaintForm({ subject: `Issue regarding ${b.spaceName || "booking"}`, category: "Venue Facility Issue", description: "" });
                        }}
                        style={{
                          background: "transparent",
                          border: "1px solid #cbd5e1",
                          color: "#64748b",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                        }}
                      >
                        ⚠️ Report Issue
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                      {isFinished && (
                        <Button
                          onClick={() => setReviewModalBooking(b)}
                          style={{
                            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                            border: "none",
                          }}
                        >
                          ⭐ Rate & Review Venue
                        </Button>
                      )}

                      {space && (
                        <Link to={`/explore?venue=${space.id}`}>
                          <Button secondary style={{ fontSize: "0.85rem" }}>
                            View Venue Specs
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB CONTENT 2: SAVED VENUES */}
      {activeTab === "saved" && (
        <div>
          {savedSpaces.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
              <span style={{ fontSize: "3rem" }}>❤️</span>
              <h3 style={{ margin: "16px 0 8px" }}>No saved venues yet</h3>
              <p style={{ color: "#64748b", marginBottom: "20px" }}>
                Browse our curated venue catalog and click the heart icon to shortlist venues for future events.
              </p>
              <Link to="/explore">
                <Button>Browse Venues Catalog</Button>
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
              {savedSpaces.map((s) => (
                <div
                  key={s.id}
                  className="card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "20px",
                    borderRadius: "14px",
                    position: "relative",
                  }}
                >
                  <button
                    onClick={() => toggleSaveVenue(s.id)}
                    style={{
                      position: "absolute",
                      top: "14px",
                      right: "14px",
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "none",
                      color: "#ef4444",
                      padding: "6px 10px",
                      borderRadius: "20px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ❤️ Saved
                  </button>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.8rem", color: "#6366f1", fontWeight: 700, textTransform: "uppercase" }}>
                        {s.type} • {s.city || "Coimbatore"}
                      </span>
                      {s.isVerified ? (
                        <span style={{ fontSize: "0.72rem", background: "#d1fae5", color: "#065f46", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
                          ✓ Verified SECE
                        </span>
                      ) : s.isDemo ? (
                        <span style={{ fontSize: "0.72rem", background: "#f1f5f9", color: "#64748b", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
                          Demo Venue
                        </span>
                      ) : null}
                    </div>
                    <h3 style={{ margin: "6px 0 10px", fontSize: "1.2rem", color: "#0f172a" }}>{s.name}</h3>
                    <p style={{ color: "#64748b", fontSize: "0.88rem", marginBottom: "12px", lineHeight: "1.4" }}>
                      {s.description?.slice(0, 110) || "Top tier event venue equipped with high speed WiFi, pro audio and projection."}...
                    </p>

                    <div style={{ display: "flex", gap: "16px", marginBottom: "16px", fontSize: "0.85rem", color: "#334155" }}>
                      <div>👥 <strong>{s.capacity ? `${s.capacity} Pax` : "Capacity not published"}</strong></div>
                      <div>⭐ <strong>{s.rating || "4.8"}</strong> ({s.reviewCount || 12})</div>
                      <div>🏛️ <strong>Free Campus Use</strong></div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
                    <Link to={`/explore?venue=${s.id}`} style={{ flex: 1 }}>
                      <Button style={{ width: "100%", fontSize: "0.85rem" }}>Book Now</Button>
                    </Link>
                    <Button
                      secondary
                      onClick={() => {
                        addToCompare(s.id);
                        alert(`Added ${s.name} to comparison matrix!`);
                      }}
                      style={{ fontSize: "0.85rem" }}
                    >
                      ⚖️ Compare
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}



      {/* TAB CONTENT 4: DISPUTE TICKETS */}
      {activeTab === "disputes" && (
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 style={{ margin: 0 }}>Mediation & Support Tickets</h3>
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "4px 0 0" }}>
                VenBok Pro provides fair dispute arbitration between venue owners, event organizers, and institutions.
              </p>
            </div>
            <Button
              onClick={() => {
                setComplaintModalBooking(myBookings[0] || null);
                setComplaintForm({ subject: "", category: "Venue Facility Issue", description: "" });
              }}
              style={{ fontSize: "0.85rem" }}
            >
              + Create Support Ticket
            </Button>
          </div>

          {complaints.length === 0 ? (
            <p style={{ textAlign: "center", color: "#64748b", padding: "30px" }}>
              No dispute or support tickets logged. All reservations are operating smoothly!
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {complaints.map((c) => (
                <div
                  key={c._id || c.id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "16px",
                    background: c.status === "Resolved" ? "#f8fafc" : "#fffbeb",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div>
                      <span style={{ fontSize: "0.8rem", background: "#e0e7ff", color: "#3730a3", padding: "2px 8px", borderRadius: "4px", fontWeight: 700, marginRight: "8px" }}>
                        {c.category}
                      </span>
                      <strong>{c.subject}</strong>
                    </div>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        background: c.status === "Resolved" ? "#d1fae5" : "#fef3c7",
                        color: c.status === "Resolved" ? "#065f46" : "#92400e",
                      }}
                    >
                      {c.status}
                    </span>
                  </div>
                  <p style={{ color: "#334155", fontSize: "0.9rem", margin: "0 0 10px", lineHeight: "1.4" }}>
                    {c.description}
                  </p>

                  {c.ownerResponse && (
                    <div style={{ background: "#f1f5f9", padding: "10px 12px", borderRadius: "8px", fontSize: "0.85rem", marginTop: "8px" }}>
                      <strong style={{ color: "#0f172a" }}>Venue Owner Response: </strong>
                      <span style={{ color: "#334155" }}>{c.ownerResponse}</span>
                    </div>
                  )}

                  {c.adminNotes && (
                    <div style={{ background: "#ecfdf5", padding: "10px 12px", borderRadius: "8px", fontSize: "0.85rem", marginTop: "8px", borderLeft: "3px solid #10b981" }}>
                      <strong style={{ color: "#065f46" }}>Admin Resolution: </strong>
                      <span style={{ color: "#047857" }}>{c.adminNotes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}



      {/* MODAL 2: RATE & REVIEW */}
      {reviewModalBooking && (
        <Modal title="Rate & Review Your Experience" onClose={() => setReviewModalBooking(null)}>
          <form onSubmit={handleReviewSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <p style={{ margin: "0 0 12px", color: "#64748b", fontSize: "0.9rem" }}>
                Venue: <strong>{reviewModalBooking.spaceName}</strong>
              </p>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "0.9rem" }}>
                Overall Rating: {reviewRating} / 5 ⭐
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={reviewRating}
                onChange={(e) => setReviewRating(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.85rem" }}>
              <div>
                <label style={{ display: "block", color: "#64748b" }}>Cleanliness: {reviewCategories.cleanliness}★</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={reviewCategories.cleanliness}
                  onChange={(e) => setReviewCategories({ ...reviewCategories, cleanliness: Number(e.target.value) })}
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label style={{ display: "block", color: "#64748b" }}>Facilities: {reviewCategories.facilities}★</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={reviewCategories.facilities}
                  onChange={(e) => setReviewCategories({ ...reviewCategories, facilities: Number(e.target.value) })}
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label style={{ display: "block", color: "#64748b" }}>Staff Support: {reviewCategories.staff}★</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={reviewCategories.staff}
                  onChange={(e) => setReviewCategories({ ...reviewCategories, staff: Number(e.target.value) })}
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label style={{ display: "block", color: "#64748b" }}>Technical & AV Support: {reviewCategories.equipmentSupport}★</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={reviewCategories.equipmentSupport}
                  onChange={(e) => setReviewCategories({ ...reviewCategories, equipmentSupport: Number(e.target.value) })}
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "0.9rem" }}>
                Public Review & Feedback:
              </label>
              <textarea
                required
                rows={3}
                placeholder="Share your experience regarding acoustics, air conditioning, stage lighting, and venue hospitality..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <Button type="submit" disabled={reviewSubmitting} style={{ flex: 1 }}>
                {reviewSubmitting ? "Publishing..." : "Post Verified Review"}
              </Button>
              <Button type="button" secondary onClick={() => setReviewModalBooking(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 3: DISPUTE / COMPLAINT TICKET */}
      {complaintModalBooking && (
        <Modal title="File Dispute or Support Ticket" onClose={() => setComplaintModalBooking(null)}>
          <form onSubmit={handleComplaintSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "0.9rem" }}>
                Category
              </label>
              <select
                value={complaintForm.category}
                onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              >
                <option value="Venue Facility Issue">Venue Facility Issue (AV, HVAC, Seating)</option>
                <option value="Slot & Schedule Conflict">Slot & Schedule Conflict</option>
                <option value="Noise / Overcrowding">Noise / Overcrowding</option>
                <option value="Service Breakdown">Service Breakdown / Staff Absence</option>
                <option value="Cancellation Request">Cancellation Request</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "0.9rem" }}>
                Subject
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Projector audio malfunction in Hall B"
                value={complaintForm.subject}
                onChange={(e) => setComplaintForm({ ...complaintForm, subject: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "0.9rem" }}>
                Detailed Description & Evidence
              </label>
              <textarea
                required
                rows={4}
                placeholder="Describe what occurred, impact on your event schedule, and desired outcome..."
                value={complaintForm.description}
                onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <Button type="submit" disabled={complaintSubmitting} style={{ flex: 1, background: "#ef4444", border: "none" }}>
                {complaintSubmitting ? "Submitting..." : "Submit Ticket for Arbitration"}
              </Button>
              <Button type="button" secondary onClick={() => setComplaintModalBooking(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CustomerDashboard;
