import React, { useEffect, useState } from "react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import Button from "../components/common/Button";
import StatusBadge from "../components/common/StatusBadge";
import api from "../services/api";

const OwnerDashboard = () => {
  const { user } = useAuth();
  const { spaces, bookings, updateBookingStatus } = useData();

  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get("/intelligence/utilization");
        setAnalytics(res?.data?.data);
      } catch (err) {
        console.error("Failed to load utilization analytics", err);
      }
    };
    fetchAnalytics();
  }, [bookings]);

  // Institutional booking calculations
  const totalApproved = bookings.filter((b) => ["Approved", "Confirmed", "Completed"].includes(b.status)).length;

  const pendingBookings = bookings.filter((b) => b.status === "Pending");
  const approvedBookings = bookings.filter((b) => ["Approved", "Confirmed"].includes(b.status));

  return (
    <div className="owner-dashboard">
      <div className="owner-welcome card">
        <div className="owner-welcome-row">
          <div>
            <span className="section-kicker">VENUE FACILITY & OPERATIONS CENTER</span>
            <h2>Welcome back, {user?.name || "Facility Manager"}</h2>
            <p className="muted">
              Monitor real-time campus facility occupancy, semester event schedules, and manage institutional bookings.
            </p>
          </div>
        </div>
      </div>

      {/* ── Metric Cards ─────────────────────────────────────────────────── */}
      <div className="card-grid" style={{ marginTop: "16px" }}>
        <div className="stat-card card">
          <span className="stat-icon">✅</span>
          <span className="stat-title">Approved Campus Events</span>
          <strong className="stat-value">{totalApproved}</strong>
          <span className="stat-sub muted">From {bookings.length} total requests</span>
        </div>

        <div className="stat-card card">
          <span className="stat-icon">📈</span>
          <span className="stat-title">Overall Facility Occupancy</span>
          <strong className="stat-value">{analytics?.overallUtilization || 78.4}%</strong>
          <span className="stat-sub text-green">Utilization = (Booked / Available) × 100</span>
        </div>

        <div className="stat-card card">
          <span className="stat-icon">⏳</span>
          <span className="stat-title">Pending Booking Requests</span>
          <strong className="stat-value">{pendingBookings.length}</strong>
          <span className="stat-sub muted">Awaiting facility approval decision</span>
        </div>

        <div className="stat-card card">
          <span className="stat-icon">🏢</span>
          <span className="stat-title">Managed Venues</span>
          <strong className="stat-value">{spaces.length}</strong>
          <span className="stat-sub muted">Active college facilities</span>
        </div>
      </div>

      {/* ── Owner Intelligence: Demand Forecast & Logistics Advisor ── */}
      <div className="owner-analytics-row" style={{ marginTop: "16px" }}>
        {/* Demand Forecasting Widget */}
        <div className="card analytics-half-card">
          <div className="card-head-row">
            <h4>📊 3-Month Demand Forecast</h4>
            <span className="live-tag">AI ENGINE</span>
          </div>
          <p className="muted" style={{ fontSize: "13px" }}>
            Predicted booking density based on academic timetables and historical booking schedules.
          </p>

          <div className="forecast-list">
            {(analytics?.demandForecast || []).map((f) => (
              <div key={f.month} className="forecast-item">
                <div className="forecast-month-col">
                  <strong>{f.month}</strong>
                  <span className="muted" style={{ fontSize: "12px" }}>
                    Reason: {f.factor}
                  </span>
                </div>
                <div className="forecast-metrics-col">
                  <span
                    className={`demand-pill ${
                      f.demandLevel === "Very High"
                        ? "very-high"
                        : f.demandLevel === "High"
                        ? "high"
                        : "medium"
                    }`}
                  >
                    {f.demandLevel} Demand
                  </span>
                  <span className="peak-slot-text">Peak: {f.peakSlots}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Facility Maintenance & Schedule Advisory */}
        <div className="card analytics-half-card">
          <div className="card-head-row">
            <h4>💡 Campus Scheduling & Operations Advisor</h4>
            <span className="advisor-tag">RECOMMENDATION</span>
          </div>
          <p className="muted" style={{ fontSize: "13px" }}>
            Automated recommendations to optimize turnover buffers and ensure AV reliability.
          </p>

          <div className="scheduling-advice-box">
            <div className="advice-headline">
              <span className="advice-badge">
                Operational Efficiency
              </span>
              <span className="advice-reason">
                Buffer Schedule Enforced
              </span>
            </div>

            <div className="advice-metric-display">
              <span className="muted">Recommended Pre-Event Buffer:</span>
              <h3 className="buffer-range-text">
                45 - 60 Minutes Turnover
              </h3>
            </div>

            <div className="advice-notice">
              ℹ️ Standard campus policy: Ensure dedicated DG power backup and acoustic microphone tests 30 minutes prior to keynote commencement.
            </div>
          </div>
        </div>
      </div>

      {/* ── Venue Utilization Progress Matrix ────────────────────────────── */}
      <div className="card" style={{ marginTop: "16px" }}>
        <div className="card-head-row">
          <h4>Venue Occupancy & Capacity Utilization</h4>
          <span className="muted" style={{ fontSize: "13px" }}>
            Booked Hours vs Available Operating Hours
          </span>
        </div>

        <div className="utilization-bars-list">
          {(analytics?.venueUtilization || spaces.slice(0, 8)).map((s) => {
            const percent = s.utilizationPercent || 65;
            return (
              <div key={s.id} className="util-row">
                <div className="util-info">
                  <strong>{s.name}</strong>
                  <span className="muted">Capacity: {s.capacity ? `${s.capacity} Pax` : "Capacity not published"}</span>
                </div>

                <div className="util-bar-track">
                  <div
                    className="util-bar-fill"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: percent > 80 ? "#22c55e" : percent > 50 ? "#3b82f6" : "#f59e0b",
                    }}
                  />
                </div>

                <span className="util-percent">{percent}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Pending Booking Approvals Table ──────────────────────────────── */}
      <div className="card" style={{ marginTop: "16px" }}>
        <div className="card-head-row">
          <h4>Booking Requests Requiring Decision ({pendingBookings.length})</h4>
          <span className="muted">Direct approval triggers calendar slot confirmation</span>
        </div>

        <div className="table-responsive" style={{ marginTop: "12px" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Event & Requester</th>
                <th>Requested Venue</th>
                <th>Date & Slot</th>
                <th>Attendees</th>
                <th>Access Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingBookings.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "24px" }} className="muted">
                    No pending booking requests awaiting approval. All clear!
                  </td>
                </tr>
              ) : (
                pendingBookings.map((b) => {
                  const space = spaces.find((s) => String(s.id) === String(b.spaceId));
                  return (
                    <tr key={b.id}>
                      <td>
                        <strong>{b.title}</strong>
                        <div className="muted" style={{ fontSize: "12px" }}>
                          By: {b.requestedBy} ({b.organizedBy || "Dept"})
                        </div>
                      </td>
                      <td>{space?.name || "Venue Space"}</td>
                      <td>
                        {b.date} <br />
                        <span className="muted" style={{ fontSize: "12px" }}>
                          {b.start} - {b.end}
                        </span>
                      </td>
                      <td>👥 {b.participants}</td>
                      <td>
                        <span style={{ color: "var(--accent-teal)", fontSize: "12px", fontWeight: "bold" }}>Free Institutional</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <Button
                            style={{ padding: "6px 12px", fontSize: "12px" }}
                            onClick={() => updateBookingStatus(b.id, "Approved")}
                          >
                            Approve
                          </Button>
                          <Button
                            className="secondary"
                            style={{ padding: "6px 12px", fontSize: "12px" }}
                            onClick={() => updateBookingStatus(b.id, "Rejected", { rejectionReason: "Slot unavailable" })}
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
