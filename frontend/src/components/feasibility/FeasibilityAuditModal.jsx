import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Calendar,
  Clock,
  Users,
  Sparkles,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import FeasibilityScoreGauge from "./FeasibilityScoreGauge";
import { checkEventFeasibility } from "../../services/feasibilityService";
import Button from "../common/Button";

const EVENT_TYPES = [
  "Seminar",
  "Hackathon",
  "Workshop",
  "Conference",
  "Cultural",
  "Sports",
  "Meeting",
  "Wedding",
  "Training",
  "Club",
];

const FeasibilityAuditModal = ({ isOpen, onClose, space, initialParams = {}, onProceedToBook }) => {
  const [params, setParams] = useState({
    eventType: initialParams.eventType || "Seminar",
    participants: initialParams.participants || (space?.capacity ? Math.round(space.capacity * 0.7) : 100),
    date: initialParams.date || new Date().toISOString().split("T")[0],
    start: initialParams.start || "09:00",
    end: initialParams.end || "17:00",
    requirements: initialParams.requirements || {
      soundSystem: true,
      powerBackup: true,
      stageSetup: false,
      liveStreaming: false,
      catering: false,
    },
  });

  const [loading, setLoading] = useState(false);
  const [feasibility, setFeasibility] = useState(null);
  const [error, setError] = useState(null);
  const [completedMitigations, setCompletedMitigations] = useState({});

  const runAudit = useCallback(async () => {
    if (!space) return;
    setLoading(true);
    setError(null);
    try {
      const data = await checkEventFeasibility({
        spaceId: space.id || space._id,
        eventType: params.eventType,
        participants: Number(params.participants) || 50,
        date: params.date,
        start: params.start,
        end: params.end,
        requirements: params.requirements,
      });
      setFeasibility(data);
    } catch (err) {
      console.error("Feasibility audit failed:", err);
      setError(err?.response?.data?.message || "Failed to calculate event feasibility.");
    } finally {
      setLoading(false);
    }
  }, [space, params]);

  useEffect(() => {
    if (isOpen && space) {
      runAudit();
    }
  }, [isOpen, space, runAudit]);

  if (!isOpen || !space) return null;

  const toggleMitigation = (index) => {
    setCompletedMitigations((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const getDimensionIcon = (name) => {
    if (name.includes("Capacity")) return <Users size={16} className="text-indigo-400" />;
    if (name.includes("Technical")) return <Zap size={16} className="text-amber-400" />;
    if (name.includes("Temporal")) return <Clock size={16} className="text-cyan-400" />;
    return <ShieldCheck size={16} className="text-emerald-400" />;
  };

  const getStatusBadge = (status) => {
    if (status === "PASS") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 size={12} /> PASS
        </span>
      );
    }
    if (status === "WARNING" || status === "INFO") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertTriangle size={12} /> WARNING
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <XCircle size={12} /> CRITICAL
      </span>
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#111318",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "840px",
          maxHeight: "90vh",
          overflowY: "auto",
          color: "#fff",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "rgba(255, 255, 255, 0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "rgba(99, 102, 241, 0.15)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#818cf8",
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#fff" }}>
                  Event Feasibility Engine
                </h2>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    backgroundColor: "rgba(6, 182, 212, 0.15)",
                    color: "#22d3ee",
                    border: "1px solid rgba(6, 182, 212, 0.3)",
                  }}
                >
                  SPACIO AI
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)", margin: "2px 0 0 0" }}>
                Evaluating operational viability for <strong style={{ color: "#fff" }}>{space.name}</strong> ({space.capacity ? `Capacity: ${space.capacity} pax` : "Capacity not published"})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255, 255, 255, 0.5)",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Audit Inputs Bar */}
        <div
          style={{
            padding: "14px 24px",
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr)) auto",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <div>
            <label style={{ display: "block", fontSize: "10px", textTransform: "uppercase", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>
              Event Type
            </label>
            <select
              value={params.eventType}
              onChange={(e) => setParams({ ...params, eventType: e.target.value })}
              style={{
                width: "100%",
                padding: "6px 10px",
                backgroundColor: "#191c24",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "12px",
              }}
            >
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "10px", textTransform: "uppercase", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>
              Attendees (Pax)
            </label>
            <input
              type="number"
              min="1"
              value={params.participants}
              onChange={(e) => setParams({ ...params, participants: e.target.value })}
              style={{
                width: "100%",
                padding: "6px 10px",
                backgroundColor: "#191c24",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "12px",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "10px", textTransform: "uppercase", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>
              Target Date
            </label>
            <input
              type="date"
              value={params.date}
              onChange={(e) => setParams({ ...params, date: e.target.value })}
              style={{
                width: "100%",
                padding: "6px 10px",
                backgroundColor: "#191c24",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "12px",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "10px", textTransform: "uppercase", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>
              Schedule Time
            </label>
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <input
                type="time"
                value={params.start}
                onChange={(e) => setParams({ ...params, start: e.target.value })}
                style={{
                  width: "70px",
                  padding: "6px 4px",
                  backgroundColor: "#191c24",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "11px",
                }}
              />
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>-</span>
              <input
                type="time"
                value={params.end}
                onChange={(e) => setParams({ ...params, end: e.target.value })}
                style={{
                  width: "70px",
                  padding: "6px 4px",
                  backgroundColor: "#191c24",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "11px",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              onClick={runAudit}
              disabled={loading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                backgroundColor: "#4f46e5",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                height: "33px",
              }}
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              {loading ? "Analyzing..." : "Re-Calculate"}
            </button>
          </div>
        </div>

        {/* Audit Body */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
          {error && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#fca5a5",
                fontSize: "13px",
                marginBottom: "20px",
                display: "flex",
                gap: "8px",
                alignItems: "center",
              }}
            >
              <XCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {feasibility && (
            <div>
              {/* Executive Summary Card */}
              <div
                style={{
                  padding: "20px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  gap: "24px",
                  marginBottom: "24px",
                }}
              >
                <FeasibilityScoreGauge
                  score={feasibility.overallFeasibilityScore}
                  verdictTone={feasibility.verdictTone}
                  size={110}
                  strokeWidth={9}
                />

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#fff" }}>
                      {feasibility.verdictLabel}
                    </h3>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: 600,
                        backgroundColor:
                          feasibility.verdictTone === "success"
                            ? "rgba(16, 185, 129, 0.15)"
                            : feasibility.verdictTone === "warning"
                            ? "rgba(245, 158, 11, 0.15)"
                            : "rgba(239, 68, 68, 0.15)",
                        color:
                          feasibility.verdictTone === "success"
                            ? "#34d399"
                            : feasibility.verdictTone === "warning"
                            ? "#fbbf24"
                            : "#f87171",
                      }}
                    >
                      Score: {feasibility.overallFeasibilityScore}/100
                    </span>
                  </div>

                  <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.75)", lineHeight: 1.5, margin: "0 0 12px 0" }}>
                    {feasibility.executiveSummary}
                  </p>

                  <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "rgba(255, 255, 255, 0.5)" }}>
                    <span>
                      Runtime: <strong style={{ color: "#fff" }}>{feasibility.eventParams.durationHours}h</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Occupancy: <strong style={{ color: "#fff" }}>{space.capacity ? `${Math.round((params.participants / space.capacity) * 100)}%` : "Not published"}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Date: <strong style={{ color: "#fff" }}>{params.date}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 Dimensional Cards */}
              <h4 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(255, 255, 255, 0.5)", marginBottom: "12px" }}>
                Operational Dimensions Breakdown
              </h4>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "14px", marginBottom: "24px" }}>
                {feasibility.dimensions.map((dim, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "14px 16px",
                      borderRadius: "10px",
                      backgroundColor: "#151820",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {getDimensionIcon(dim.dimension)}
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>{dim.dimension}</span>
                        </div>
                        {getStatusBadge(dim.status)}
                      </div>

                      <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.45, margin: "0 0 10px 0" }}>
                        {dim.summary}
                      </p>
                    </div>

                    <div
                      style={{
                        paddingTop: "8px",
                        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "11px",
                      }}
                    >
                      <span style={{ color: "rgba(255, 255, 255, 0.4)" }}>Metric Indicator:</span>
                      <span style={{ color: "#818cf8", fontWeight: 600 }}>{dim.metric}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actionable Mitigations Checklist */}
              {feasibility.actionableMitigations && feasibility.actionableMitigations.length > 0 && (
                <div
                  style={{
                    padding: "18px 20px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(245, 158, 11, 0.04)",
                    border: "1px solid rgba(245, 158, 11, 0.2)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <ShieldCheck size={18} className="text-amber-400" />
                    <h4 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "#fbbf24" }}>
                      Pre-Event Actionable Mitigations ({feasibility.actionableMitigations.length})
                    </h4>
                  </div>

                  <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)", margin: "0 0 14px 0" }}>
                    Complete these operational steps to guarantee smooth execution on event day:
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {feasibility.actionableMitigations.map((mitigation, idx) => (
                      <label
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                          fontSize: "12px",
                          color: completedMitigations[idx] ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.85)",
                          textDecoration: completedMitigations[idx] ? "line-through" : "none",
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(completedMitigations[idx])}
                          onChange={() => toggleMitigation(idx)}
                          style={{
                            marginTop: "2px",
                            accentColor: "#10b981",
                            cursor: "pointer",
                          }}
                        />
                        <span>{mitigation}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "rgba(255, 255, 255, 0.02)",
          }}
        >
          <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)" }}>
            Tagline: <span style={{ color: "#a5b4fc", fontStyle: "italic" }}>"Plan. Match. Book. Execute."</span>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            {onProceedToBook && (
              <Button
                variant="primary"
                size="sm"
                icon={<ArrowRight size={14} />}
                disabled={feasibility && !feasibility.isBookable}
                onClick={() => {
                  onProceedToBook(space, params);
                  onClose();
                }}
              >
                Proceed to Book Venue
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeasibilityAuditModal;
