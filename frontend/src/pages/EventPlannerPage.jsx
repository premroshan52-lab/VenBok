import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  Check,
  Building2,
  Users,
  ArrowRight,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Scale,
  Sparkles,
  Calendar,
  Layers,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { useData } from "../context/DataContext";
import { useBookingModal } from "../components/layout/DashboardLayout";
import Button from "../components/common/Button";
import VenueDetailsModal from "../components/space/VenueDetailsModal";
import FeasibilityAuditModal from "../components/feasibility/FeasibilityAuditModal";
import FeasibilityScoreGauge from "../components/feasibility/FeasibilityScoreGauge";
import { PATHS } from "../utils/routePaths";
import api from "../services/api";
import { useToast } from "../components/common/Toast";

const EVENT_TYPES = [
  "Seminar",
  "Hackathon",
  "Workshop",
  "Conference",
  "Cultural",
  "Sports",
  "Meeting",
  "Training",
];

const FAST_PRESETS = [
  {
    label: "200-Pax Technical Symposium",
    name: "Annual Technical Symposium 2026",
    type: "Seminar",
    attendance: 200,
    department: "Department of Computer Science & Engineering",
    time: { start: "09:00", end: "13:00" },
    reqs: { projector: true, audioSystem: true, microphone: true, wifi: true, ac: true, stage: true, computers: false, parking: true, technicalSupport: true, powerBackup: true },
  },
  {
    label: "Leadership Guest Lecture",
    name: "Executive Leadership & Industry Connect",
    type: "Seminar",
    attendance: 120,
    department: "Corporate Relations & Industry Connect",
    time: { start: "14:00", end: "17:00" },
    reqs: { projector: true, audioSystem: true, microphone: true, wifi: true, ac: true, stage: true, computers: false, parking: true, technicalSupport: true, powerBackup: true },
  },
  {
    label: "Full-Day Hands-on Workshop",
    name: "AI & Cloud Architecture Hands-on Workshop",
    type: "Workshop",
    attendance: 60,
    department: "Information Technology Department",
    time: { start: "09:30", end: "16:30" },
    reqs: { projector: true, audioSystem: true, microphone: true, wifi: true, ac: true, stage: false, computers: true, parking: false, technicalSupport: true, powerBackup: true },
  },
];

const EventPlannerPage = () => {
  const navigate = useNavigate();
  const { spaces, addToCompare, clearCompare } = useData();
  const { openBookingModal } = useBookingModal();
  const toast = useToast();

  // Form State
  const [form, setForm] = useState({
    eventName: "SECE Technical Symposium 2026",
    eventType: "Seminar",
    attendance: 200,
    date: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
    start: "09:00",
    end: "13:00",
    department: "Department of Computer Science & Engineering",
    requirements: {
      projector: true,
      audioSystem: true,
      microphone: true,
      wifi: true,
      ac: true,
      stage: true,
      computers: false,
      parking: true,
      technicalSupport: true,
      powerBackup: true,
    },
  });

  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [feasibilityResult, setFeasibilityResult] = useState(null);
  const [rankedVenues, setRankedVenues] = useState([]);
  const [selectedVenueModal, setSelectedVenueModal] = useState(null);
  const [detailedAuditSpace, setDetailedAuditSpace] = useState(null);

  const handleRequirementToggle = (key) => {
    setForm((prev) => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        [key]: !prev.requirements[key],
      },
    }));
  };

  const handleApplyPreset = (preset) => {
    setForm((prev) => ({
      ...prev,
      eventName: preset.name,
      eventType: preset.type,
      attendance: preset.attendance,
      department: preset.department,
      start: preset.time.start,
      end: preset.time.end,
      requirements: { ...preset.reqs },
    }));
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!form.eventName.trim()) errors.eventName = "Event name is required";
    if (!form.attendance || Number(form.attendance) <= 0) errors.attendance = "Valid attendee count is required";
    if (!form.date) errors.date = "Event date is required";
    if (!form.start) errors.start = "Start time is required";
    if (!form.end) errors.end = "End time is required";
    if (form.start && form.end && form.start >= form.end) {
      errors.end = "End time must be after start time";
    }
    if (!form.department.trim()) errors.department = "Department / Organizer is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Run Rule-Based Feasibility Analysis via backend intelligence service
  const handleAnalyzeFeasibility = async () => {
    if (!validateForm()) {
      toast.error("Please fill in all required event details.");
      return;
    }

    setLoading(true);
    setFeasibilityResult(null);

    try {
      // 1. Request recommendations to find best-fit venues
      const recPayload = {
        capacity: Number(form.attendance),
        eventType: form.eventType,
        facilities: Object.keys(form.requirements).filter((k) => form.requirements[k]),
      };

      const recRes = await api.post("/intelligence/recommend", recPayload);
      const candidates = recRes?.data?.data || spaces;

      // Select top recommended candidate
      const topSpace = candidates[0] || spaces[0];

      // 2. Request deep feasibility audit on the top recommended candidate
      const auditPayload = {
        spaceId: topSpace.id || topSpace._id,
        eventName: form.eventName,
        eventType: form.eventType,
        participants: Number(form.attendance),
        date: form.date,
        start: form.start,
        end: form.end,
        department: form.department,
        requirements: form.requirements,
      };

      const auditRes = await api.post("/intelligence/feasibility", auditPayload);
      const auditData = auditRes?.data?.data;

      setFeasibilityResult(auditData);
      setRankedVenues(candidates);
      toast.success("Feasibility analysis completed!");

      // Scroll smoothly to result
      setTimeout(() => {
        const el = document.getElementById("feasibility-result-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error("Feasibility analysis error", err);
      toast.error("Analysis calculation failed. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger initial analysis on mount
  useEffect(() => {
    if (spaces.length > 0 && !feasibilityResult) {
      handleAnalyzeFeasibility();
    }
  }, [spaces]);

  // Navigate to compare view with recommended venue + top alternatives
  const handleCompareWithAlternatives = (recVenue, altVenues = []) => {
    clearCompare();
    if (recVenue?.id || recVenue?._id) {
      addToCompare(String(recVenue.id || recVenue._id));
    }
    altVenues.slice(0, 2).forEach((alt) => {
      if (alt.id || alt._id) addToCompare(String(alt.id || alt._id));
    });

    toast.info("Venues added to comparison matrix.");
    navigate(PATHS.COMPARE);
  };

  // Pre-fill booking modal with entered event details
  const handleProceedToBook = (targetSpace) => {
    const bookingData = {
      title: form.eventName,
      type: form.eventType,
      participants: Number(form.attendance),
      date: form.date,
      start: form.start,
      end: form.end,
      organizedBy: form.department,
      spaceId: targetSpace.id || targetSpace._id,
      requirements: form.requirements,
    };
    openBookingModal(targetSpace.id || targetSpace._id, bookingData);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* ── Page Header ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary-light)", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
          <CalendarCheck size={16} />
          <span>Event Feasibility & Venue Selection</span>
        </div>
        <h1 style={{ fontSize: "1.9rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", margin: 0 }}>
          Plan an Event
        </h1>
        <p style={{ margin: "6px 0 0", color: "var(--text-muted)", fontSize: "0.92rem" }}>
          Enter your institutional event requirements to analyze rule-based feasibility, evaluate capacity fits, and discover verified campus venues.
        </p>
      </div>

      {/* ── 1-Click Fast Presets Bar ── */}
      <div
        className="card"
        style={{
          padding: "14px 18px",
          backgroundColor: "var(--panel-elevated)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
          ⚡ Quick Demo Presets:
        </span>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {FAST_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p)}
              style={{
                backgroundColor: "var(--panel)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-full)",
                padding: "6px 14px",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--primary-light)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section 1: ENTER EVENT REQUIREMENTS FORM ── */}
      <div
        className="card"
        style={{
          backgroundColor: "var(--panel-elevated)",
          border: "1px solid var(--border-strong)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingBottom: "12px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "var(--radius-md)",
              background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
            }}
          >
            <CalendarCheck size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#fff", margin: 0 }}>
              Event Specifications & Logistics
            </h3>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              All fields are verified against real venue capacity, audio-visual inventory, and campus schedules.
            </span>
          </div>
        </div>

        {/* 2-Column Form Fields */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
          {/* Event Name */}
          <div className="input-field">
            <label className="input-label">Event Name *</label>
            <input
              type="text"
              className="input"
              value={form.eventName}
              onChange={(e) => setForm({ ...form, eventName: e.target.value })}
              placeholder="e.g. SECE Technical Symposium 2026"
            />
            {formErrors.eventName && <span style={{ color: "var(--danger-text)", fontSize: "0.75rem" }}>{formErrors.eventName}</span>}
          </div>

          {/* Event Type */}
          <div className="input-field">
            <label className="input-label">Event Type *</label>
            <select
              className="select"
              value={form.eventType}
              onChange={(e) => setForm({ ...form, eventType: e.target.value })}
            >
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Expected Attendance */}
          <div className="input-field">
            <label className="input-label">Expected Attendance (Pax) *</label>
            <input
              type="number"
              className="input"
              min="1"
              max="2000"
              value={form.attendance}
              onChange={(e) => setForm({ ...form, attendance: e.target.value })}
              placeholder="e.g. 200"
            />
            {formErrors.attendance && <span style={{ color: "var(--danger-text)", fontSize: "0.75rem" }}>{formErrors.attendance}</span>}
          </div>

          {/* Department / Organizer */}
          <div className="input-field">
            <label className="input-label">Department / Organizer *</label>
            <input
              type="text"
              className="input"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              placeholder="e.g. Department of Computer Science & Engineering"
            />
            {formErrors.department && <span style={{ color: "var(--danger-text)", fontSize: "0.75rem" }}>{formErrors.department}</span>}
          </div>

          {/* Date */}
          <div className="input-field">
            <label className="input-label">Event Date *</label>
            <input
              type="date"
              className="input"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            {formErrors.date && <span style={{ color: "var(--danger-text)", fontSize: "0.75rem" }}>{formErrors.date}</span>}
          </div>

          {/* Time Window */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div className="input-field">
              <label className="input-label">Start Time *</label>
              <input
                type="time"
                className="input"
                value={form.start}
                onChange={(e) => setForm({ ...form, start: e.target.value })}
              />
              {formErrors.start && <span style={{ color: "var(--danger-text)", fontSize: "0.75rem" }}>{formErrors.start}</span>}
            </div>
            <div className="input-field">
              <label className="input-label">End Time *</label>
              <input
                type="time"
                className="input"
                value={form.end}
                onChange={(e) => setForm({ ...form, end: e.target.value })}
              />
              {formErrors.end && <span style={{ color: "var(--danger-text)", fontSize: "0.75rem" }}>{formErrors.end}</span>}
            </div>
          </div>
        </div>

        {/* ── Requirements Checkboxes ── */}
        <div>
          <label className="input-label" style={{ marginBottom: "10px", display: "block" }}>
            Technical & Infrastructure Requirements
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
            {[
              { key: "projector", label: "Projector / Display" },
              { key: "audioSystem", label: "Audio & PA System" },
              { key: "microphone", label: "Cordless Microphones" },
              { key: "wifi", label: "High-Speed Wi-Fi" },
              { key: "ac", label: "Air Conditioning (AC)" },
              { key: "stage", label: "Stage / Podium" },
              { key: "computers", label: "Computer Lab / PCs" },
              { key: "parking", label: "Campus Parking" },
              { key: "technicalSupport", label: "Technical Support Staff" },
              { key: "powerBackup", label: "Power Backup (UPS)" },
            ].map(({ key, label }) => {
              const checked = Boolean(form.requirements[key]);
              return (
                <label
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: checked ? "rgba(99, 102, 241, 0.12)" : "var(--panel)",
                    border: checked ? "1px solid var(--primary-light)" : "1px solid var(--border)",
                    cursor: "pointer",
                    fontSize: "0.82rem",
                    color: checked ? "#fff" : "var(--text-secondary)",
                    userSelect: "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleRequirementToggle(key)}
                    style={{ accentColor: "var(--primary)" }}
                  />
                  <span>{label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Analyze Feasibility Button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px", paddingTop: "14px", borderTop: "1px solid var(--border-subtle)" }}>
          <Button
            variant="primary"
            size="lg"
            onClick={handleAnalyzeFeasibility}
            loading={loading}
            icon={<Sparkles size={18} />}
          >
            Analyze Feasibility
          </Button>
        </div>
      </div>

      {/* ── Section 2: FEASIBILITY RESULT ── */}
      {feasibilityResult && (
        <div
          id="feasibility-result-section"
          className="card"
          style={{
            backgroundColor: "var(--panel-elevated)",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            boxShadow: "0 0 40px rgba(16, 185, 129, 0.08)",
            padding: "26px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* Header Banner */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", paddingBottom: "18px", borderBottom: "1px solid var(--border-subtle)" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--success-text)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
                <CheckCircle2 size={15} />
                <span>Feasibility Assessment Completed</span>
              </div>
              <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff", margin: 0 }}>
                Feasibility Analysis Result
              </h2>
              <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.88rem" }}>
                Evaluated across crowd capacity, technical facilities, schedule conflicts, and turnover buffers.
              </p>
            </div>

            {/* Overall Score Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", backgroundColor: "rgba(16, 185, 129, 0.1)", padding: "10px 18px", borderRadius: "var(--radius-lg)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
              <FeasibilityScoreGauge score={feasibilityResult.overallFeasibilityScore} size={84} strokeWidth={8} showLabel={false} />
              <div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#10b981", lineHeight: 1 }}>
                  {feasibilityResult.overallFeasibilityScore}% Feasible
                </div>
                <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontWeight: 600 }}>
                  {feasibilityResult.verdictLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Recommended Venue Card */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px",
              backgroundColor: "var(--panel)",
              borderRadius: "var(--radius-lg)",
              padding: "20px",
              border: "1px solid var(--border)",
            }}
          >
            {/* Left: Venue Spec & Identity */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "0.72rem", backgroundColor: "rgba(99, 102, 241, 0.2)", color: "var(--primary-light)", border: "1px solid rgba(99, 102, 241, 0.4)", padding: "2px 8px", borderRadius: "10px", fontWeight: 700, textTransform: "uppercase" }}>
                  ⭐ Recommended Venue
                </span>
                {feasibilityResult.space?.isVerified && (
                  <span style={{ fontSize: "0.72rem", backgroundColor: "rgba(16, 185, 129, 0.2)", color: "#34d399", border: "1px solid rgba(52, 211, 153, 0.4)", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
                    ✓ Verified SECE Facility
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", margin: 0 }}>
                {feasibilityResult.space?.name}
              </h3>

              <div style={{ display: "flex", gap: "16px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <span>🏛️ {feasibilityResult.space?.type}</span>
                <span>👥 {feasibilityResult.space?.capacity ? `${feasibilityResult.space.capacity} seats` : "Capacity not published"}</span>
                <span>🏛️ Free Institutional Use</span>
              </div>

              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {feasibilityResult.executiveSummary}
              </p>

              {/* Action Buttons: Compare & Book */}
              <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
                <Button
                  variant="primary"
                  onClick={() => handleProceedToBook(feasibilityResult.space)}
                  icon={<Sparkles size={15} />}
                >
                  Book This Venue
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => handleCompareWithAlternatives(feasibilityResult.space, feasibilityResult.alternativeVenues)}
                  icon={<Scale size={15} />}
                >
                  Compare Venues
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDetailedAuditSpace(feasibilityResult.space)}
                  icon={<Layers size={14} />}
                >
                  Detailed 4-Dim Audit
                </Button>
              </div>
            </div>

            {/* Right: Matched Requirements & Warnings */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", borderLeft: "1px solid var(--border)", paddingLeft: "20px" }}>
              {/* Matched Requirements */}
              <div>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--success-text)", fontWeight: 700, display: "block", marginBottom: "8px" }}>
                  Why Recommended (Matched Requirements):
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {(feasibilityResult.matchedRequirements || []).map((req, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "var(--text)" }}>
                      <div style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "rgba(16, 185, 129, 0.2)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Check size={11} strokeWidth={3} />
                      </div>
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warnings / Verification Notes */}
              {(feasibilityResult.warnings || []).length > 0 && (
                <div>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#f59e0b", fontWeight: 700, display: "block", marginBottom: "8px" }}>
                    Operational Warnings / Notes:
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {feasibilityResult.warnings.map((warn, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "#fbbf24" }}>
                        <AlertTriangle size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
                        <span>{warn}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Alternative Venues Section ── */}
          {(feasibilityResult.alternativeVenues || []).length > 0 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff", margin: 0 }}>
                  Alternative Suitable Venues
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCompareWithAlternatives(feasibilityResult.space, feasibilityResult.alternativeVenues)}
                  icon={<Scale size={14} />}
                >
                  Compare All Side-by-Side
                </Button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
                {feasibilityResult.alternativeVenues.map((alt) => (
                  <div
                    key={alt.id || alt._id}
                    className="card"
                    style={{
                      padding: "16px",
                      backgroundColor: "var(--panel)",
                      border: "1px solid var(--border)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <h5 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#fff" }}>
                          {alt.name}
                        </h5>
                        <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--primary-light)" }}>
                          {alt.score}% Fit
                        </span>
                      </div>
                      <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                        {alt.type} • {alt.capacity ? `${alt.capacity} seats` : "Capacity not published"}
                      </span>
                      <p style={{ margin: "8px 0 0", fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                        {alt.explanation}
                      </p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          addToCompare(String(alt.id || alt._id));
                          toast.success(`Added ${alt.name} to comparison!`);
                        }}
                      >
                        + Compare
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleProceedToBook(alt)}
                      >
                        Book
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Feasibility Audit Modal */}
      <FeasibilityAuditModal
        isOpen={Boolean(detailedAuditSpace)}
        onClose={() => setDetailedAuditSpace(null)}
        space={detailedAuditSpace}
        initialParams={{
          eventType: form.eventType,
          participants: Number(form.attendance),
          date: form.date,
          start: form.start,
          end: form.end,
          requirements: form.requirements,
        }}
        onProceedToBook={(targetSpace) => {
          setDetailedAuditSpace(null);
          handleProceedToBook(targetSpace);
        }}
      />

      {/* Venue Details Modal */}
      <VenueDetailsModal
        space={selectedVenueModal}
        isOpen={Boolean(selectedVenueModal)}
        onClose={() => setSelectedVenueModal(null)}
        onBookVenue={(id) => openBookingModal(id)}
      />
    </div>
  );
};

export default EventPlannerPage;
