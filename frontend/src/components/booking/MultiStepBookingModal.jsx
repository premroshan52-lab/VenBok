import React, { useState, useEffect, useMemo } from "react";
import { Check, Calendar, Clock, Users, Building2, Sparkles, AlertCircle, ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../common/Toast";
import { checkEventFeasibility } from "../../services/feasibilityService";
import FeasibilityScoreGauge from "../feasibility/FeasibilityScoreGauge";

const EVENT_TYPES = [
  "Seminar",
  "Hackathon",
  "Workshop",
  "Conference",
  "Club",
  "Training",
  "Meeting",
  "Cultural",
  "Corporate",
  "Exhibition",
];

const MultiStepBookingModal = ({ isOpen, onClose, initialSpaceId = null, initialData = null, onBookingSuccess }) => {
  const { spaces, addBooking } = useData();
  const { user } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [feasibility, setFeasibility] = useState(null);
  const [feasibilityLoading, setFeasibilityLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    type: "Seminar",
    participants: 100,
    organizedBy: user?.name || "Academic Department",
    notes: "",
    date: new Date().toISOString().split("T")[0],
    start: "09:00",
    end: "13:00",
    spaceId: initialSpaceId || (spaces[0]?.id ? String(spaces[0].id) : ""),
    catering: false,
    soundSystem: true,
    stageSetup: false,
    liveStreaming: false,
    powerBackup: true,
  });

  // When initialSpaceId or initialData changes
  useEffect(() => {
    if (initialSpaceId) {
      setFormData((prev) => ({ ...prev, spaceId: String(initialSpaceId) }));
    }
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        title: initialData.eventName || initialData.title || prev.title,
        type: initialData.eventType || initialData.type || prev.type,
        participants: initialData.participants || prev.participants,
        organizedBy: initialData.department || initialData.organizedBy || prev.organizedBy,
        date: initialData.date || prev.date,
        start: initialData.start || prev.start,
        end: initialData.end || prev.end,
        notes: initialData.notes || prev.notes,
        spaceId: initialSpaceId ? String(initialSpaceId) : (initialData.spaceId ? String(initialData.spaceId) : prev.spaceId),
        soundSystem: initialData.requirements?.soundSystem ?? initialData.requirements?.audioSystem ?? prev.soundSystem,
        powerBackup: initialData.requirements?.powerBackup ?? prev.powerBackup,
        stageSetup: initialData.requirements?.stage ?? prev.stageSetup,
      }));
    }
  }, [initialSpaceId, initialData]);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setErrorMsg("");
      if (!formData.spaceId && spaces.length > 0) {
        setFormData((prev) => ({ ...prev, spaceId: String(spaces[0].id) }));
      }
    }
  }, [isOpen, spaces]);

  const selectedSpace = useMemo(() => {
    return spaces.find((s) => String(s.id) === String(formData.spaceId)) || spaces[0] || null;
  }, [spaces, formData.spaceId]);

  // Live Feasibility Calculation when step is 3 or 4
  useEffect(() => {
    let isCancelled = false;
    const evaluateFeasibility = async () => {
      if (!selectedSpace) return;
      setFeasibilityLoading(true);
      try {
        const data = await checkEventFeasibility({
          spaceId: selectedSpace.id || selectedSpace._id,
          eventType: formData.type,
          participants: Number(formData.participants) || 50,
          date: formData.date,
          start: formData.start,
          end: formData.end,
          requirements: {
            catering: formData.catering,
            soundSystem: formData.soundSystem,
            stageSetup: formData.stageSetup,
            liveStreaming: formData.liveStreaming,
            powerBackup: formData.powerBackup,
          },
        });
        if (!isCancelled) {
          setFeasibility(data);
        }
      } catch (err) {
        console.error("Feasibility check error:", err);
      } finally {
        if (!isCancelled) setFeasibilityLoading(false);
      }
    };

    evaluateFeasibility();
    return () => {
      isCancelled = true;
    };
  }, [selectedSpace, formData.type, formData.participants, formData.date, formData.start, formData.end, formData.catering, formData.soundSystem, formData.stageSetup, formData.liveStreaming, formData.powerBackup]);

  // Handle Validation
  const validateCurrentStep = () => {
    setErrorMsg("");
    if (step === 1) {
      if (!formData.title.trim()) {
        setErrorMsg("Please enter an event title.");
        return false;
      }
      if (!formData.participants || Number(formData.participants) <= 0) {
        setErrorMsg("Please provide a valid participant count.");
        return false;
      }
    } else if (step === 2) {
      if (!formData.date) {
        setErrorMsg("Please select an event date.");
        return false;
      }
      if (!formData.start || !formData.end) {
        setErrorMsg("Start and end time are required.");
        return false;
      }
      if (formData.start >= formData.end) {
        setErrorMsg("End time must be later than start time.");
        return false;
      }
    } else if (step === 3) {
      if (!selectedSpace) {
        setErrorMsg("Please choose an eligible venue space.");
        return false;
      }
      if (selectedSpace.capacity && Number(formData.participants) > selectedSpace.capacity) {
        setErrorMsg(`Selected venue capacity (${selectedSpace.capacity} Pax) is less than expected participants (${formData.participants} Pax).`);
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setErrorMsg("");
    setStep((prev) => Math.max(prev - 1, 1));
  };

  // Submit Final Booking
  const handleFinalSubmit = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const payload = {
        title: formData.title,
        type: formData.type,
        spaceId: formData.spaceId,
        date: formData.date,
        start: formData.start,
        end: formData.end,
        participants: Number(formData.participants),
        organizedBy: formData.organizedBy,
        notes: formData.notes,
        requirements: {
          catering: formData.catering,
          soundSystem: formData.soundSystem,
          stageSetup: formData.stageSetup,
          liveStreaming: formData.liveStreaming,
          powerBackup: formData.powerBackup,
        },
      };

      const result = await addBooking(payload);
      if (result) {
        setStep(5);
        toast.success("Booking request reserved successfully!");
        if (onBookingSuccess) onBookingSuccess(result);
      } else {
        throw new Error("Could not reserve booking. Please check slot availability.");
      }
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Booking submission failed.";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const stepLabels = [
    { num: 1, title: "Event" },
    { num: 2, title: "Schedule" },
    { num: 3, title: "Venue" },
    { num: 4, title: "Review" },
    { num: 5, title: "Confirm" },
  ];

  return (
    <Modal
      title="Create New Venue Booking"
      subtitle="5-step intelligent reservation wizard"
      onClose={onClose}
      maxWidth="680px"
      footer={
        step < 5 ? (
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
            {step > 1 ? (
              <Button variant="ghost" onClick={handleBack} icon={<ArrowLeft size={16} />}>
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button onClick={handleNext}>
                Continue <ArrowRight size={16} />
              </Button>
            ) : (
              <Button onClick={handleFinalSubmit} loading={loading} icon={<Sparkles size={16} />}>
                Confirm & Submit Booking
              </Button>
            )}
          </div>
        ) : (
          <Button onClick={onClose} variant="primary">
            Done
          </Button>
        )
      }
    >
      {/* Progress Indicators */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        {stepLabels.map((s, idx) => {
          const isCurrent = step === s.num;
          const isDone = step > s.num;
          return (
            <React.Fragment key={s.num}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    backgroundColor: isDone ? "var(--success)" : isCurrent ? "var(--primary)" : "var(--panel-overlay)",
                    color: isDone || isCurrent ? "#fff" : "var(--text-muted)",
                    border: isCurrent ? "2px solid var(--primary-light)" : "1px solid var(--border)",
                    boxShadow: isCurrent ? "0 0 10px rgba(99, 102, 241, 0.4)" : "none",
                  }}
                >
                  {isDone ? <Check size={14} /> : `0${s.num}`}
                </div>
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? "var(--text)" : "var(--text-muted)",
                  }}
                >
                  {s.title}
                </span>
              </div>
              {idx < stepLabels.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: "1px",
                    backgroundColor: isDone ? "var(--success)" : "var(--border)",
                    margin: "0 8px",
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Error alert if any */}
      {errorMsg && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 14px",
            backgroundColor: "var(--danger-bg)",
            border: "1px solid var(--danger-border)",
            borderRadius: "var(--radius-md)",
            color: "var(--danger-text)",
            fontSize: "0.85rem",
            marginBottom: "18px",
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: EVENT DETAILS */}
      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="input-field">
            <label className="input-label">Event Name / Title *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. AI & Robotics National Hackathon 2026"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              autoFocus
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="input-field">
              <label className="input-label">Event Type</label>
              <select
                className="select"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-field">
              <label className="input-label">Expected Attendees (Pax) *</label>
              <input
                type="number"
                className="input"
                min="1"
                max="5000"
                value={formData.participants}
                onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
              />
            </div>
          </div>

          <div className="input-field">
            <label className="input-label">Organizing Body / Department</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. CSE Department / Innovation Cell"
              value={formData.organizedBy}
              onChange={(e) => setFormData({ ...formData, organizedBy: e.target.value })}
            />
          </div>

          <div className="input-field">
            <label className="input-label">Description & Special Notes</label>
            <textarea
              className="textarea"
              rows="3"
              placeholder="Specify setup requirements, VIP guests, or recording needs..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* STEP 2: DATE & SCHEDULE */}
      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="input-field">
            <label className="input-label">Event Date *</label>
            <input
              type="date"
              className="input"
              value={formData.date}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="input-field">
              <label className="input-label">Start Time *</label>
              <input
                type="time"
                className="input"
                value={formData.start}
                onChange={(e) => setFormData({ ...formData, start: e.target.value })}
              />
            </div>

            <div className="input-field">
              <label className="input-label">End Time *</label>
              <input
                type="time"
                className="input"
                value={formData.end}
                onChange={(e) => setFormData({ ...formData, end: e.target.value })}
              />
            </div>
          </div>

          <div
            style={{
              padding: "14px",
              backgroundColor: "var(--panel-elevated)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Clock size={20} color="var(--primary-light)" />
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text)" }}>
                Calculated Duration: {costCalculation.hours} Hours
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Overnight or multi-day reservations require department head verification.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: VENUE SELECTION */}
      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--text-muted)" }}>
            Select from venues matching your attendee size ({formData.participants} Pax):
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "320px", overflowY: "auto" }}>
            {spaces.map((space) => {
              const isSelected = String(space.id) === String(formData.spaceId);
              const fits = !space.capacity || space.capacity >= Number(formData.participants);

              return (
                <div
                  key={space.id}
                  onClick={() => setFormData({ ...formData, spaceId: String(space.id) })}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    borderRadius: "var(--radius-lg)",
                    backgroundColor: isSelected ? "rgba(99, 102, 241, 0.12)" : "var(--panel-elevated)",
                    border: isSelected ? "1px solid var(--primary-light)" : "1px solid var(--border)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: "var(--panel-overlay)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      {space.imageUrl ? (
                        <img src={space.imageUrl} alt={space.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <Building2 size={22} color={space.isVerified ? "#34d399" : "var(--primary-light)"} />
                      )}
                    </div>

                    <div>
                      <div style={{ fontWeight: 600, color: isSelected ? "#fff" : "var(--text)", fontSize: "0.92rem", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>{space.name}</span>
                        {space.isVerified && (
                          <span style={{ fontSize: "0.68rem", color: "#34d399", border: "1px solid rgba(52, 211, 153, 0.4)", padding: "1px 6px", borderRadius: "10px", backgroundColor: "rgba(6, 78, 59, 0.4)" }}>
                            SECE Verified
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", gap: "10px", marginTop: "2px" }}>
                        <span>{space.type}</span>
                        <span>•</span>
                        <span style={{ color: fits ? "var(--success-text)" : "var(--danger-text)" }}>
                          {space.capacity ? `Capacity: ${space.capacity} Pax` : "Capacity not published"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.76rem", color: "var(--accent-teal)", fontWeight: 600, display: "block" }}>
                      Institutional Access
                    </span>
                    {isSelected && (
                      <span style={{ fontSize: "0.74rem", color: "var(--primary-light)", fontWeight: 700 }}>
                        Selected ✓
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW & ADD-ONS */}
      {step === 4 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Summary Box */}
          <div
            style={{
              padding: "16px",
              borderRadius: "var(--radius-lg)",
              backgroundColor: "var(--panel-elevated)",
              border: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>
                RESERVATION SUMMARY
              </span>
              <span style={{ fontSize: "0.78rem", color: "var(--primary-light)", fontWeight: 600 }}>
                {formData.type}
              </span>
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>{formData.title}</div>
            <div style={{ display: "flex", gap: "16px", fontSize: "0.84rem", color: "var(--text-secondary)", flexWrap: "wrap", marginTop: "4px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <Building2 size={14} /> {selectedSpace?.name}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <Calendar size={14} /> {formData.date}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <Clock size={14} /> {formData.start} - {formData.end}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <Users size={14} /> {formData.participants} Attendees
              </span>
            </div>
          </div>

          {/* Add-ons & Equipment */}
          <div>
            <span className="input-label" style={{ marginBottom: "8px", display: "block" }}>
              FACILITY ADD-ONS & LOGISTICS
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[
                { key: "soundSystem", label: "Acoustic Audio & Mics (Campus AV)" },
                { key: "powerBackup", label: "Dedicated DG Power Backup (Campus Ops)" },
                { key: "liveStreaming", label: "4K Multi-Cam Live Streaming Support" },
                { key: "stageSetup", label: "Auditorium Stage & Podium Setup" },
                { key: "catering", label: "Institutional Hospitality / Refreshments" },
              ].map((item) => (
                <label
                  key={item.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--panel-overlay)",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                    fontSize: "0.82rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData[item.key]}
                    onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                    style={{ accentColor: "var(--primary)" }}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* SPACIO EVENT FEASIBILITY ENGINE ASSESSMENT */}
          <div
            style={{
              padding: "16px",
              borderRadius: "var(--radius-lg)",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              border:
                feasibility && feasibility.overallFeasibilityScore >= 80
                  ? "1px solid rgba(16, 185, 129, 0.3)"
                  : feasibility && feasibility.overallFeasibilityScore >= 50
                  ? "1px solid rgba(245, 158, 11, 0.3)"
                  : "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles size={16} color="var(--primary-light)" />
                <span style={{ fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#fff" }}>
                  Event Feasibility Assessment
                </span>
                <span style={{ fontSize: "0.7rem", padding: "1px 6px", borderRadius: "999px", backgroundColor: "rgba(99, 102, 241, 0.15)", color: "#818cf8", fontWeight: 600 }}>
                  SPACIO Engine
                </span>
              </div>
              {feasibilityLoading && (
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Evaluating operational parameters...</span>
              )}
            </div>

            {feasibility ? (
              <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                <FeasibilityScoreGauge
                  score={feasibility.overallFeasibilityScore}
                  verdictTone={feasibility.verdictTone}
                  size={80}
                  strokeWidth={7}
                  showLabel={false}
                />

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.92rem", color: "#fff" }}>
                      {feasibility.verdictLabel}
                    </span>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        padding: "2px 8px",
                        borderRadius: "999px",
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
                      Viability: {feasibility.overallFeasibilityScore}%
                    </span>
                  </div>

                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.4, margin: "0 0 8px 0" }}>
                    {feasibility.executiveSummary}
                  </p>

                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {feasibility.dimensions.map((dim, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: "0.68rem",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          backgroundColor:
                            dim.status === "PASS"
                              ? "rgba(16, 185, 129, 0.1)"
                              : dim.status === "WARNING" || dim.status === "INFO"
                              ? "rgba(245, 158, 11, 0.1)"
                              : "rgba(239, 68, 68, 0.1)",
                          color:
                            dim.status === "PASS"
                              ? "#34d399"
                              : dim.status === "WARNING" || dim.status === "INFO"
                              ? "#fbbf24"
                              : "#f87171",
                          border: `1px solid ${
                            dim.status === "PASS"
                              ? "rgba(16, 185, 129, 0.2)"
                              : dim.status === "WARNING" || dim.status === "INFO"
                              ? "rgba(245, 158, 11, 0.2)"
                              : "rgba(239, 68, 68, 0.2)"
                          }`,
                        }}
                      >
                        {dim.dimension.split(" ")[0]}: {dim.status}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Auditing density, AV/power loads, buffer schedule, and campus policies...
              </div>
            )}
          </div>
        </div>
      )}


      {/* STEP 5: CONFIRMATION RECEIPT */}
      {step === 5 && (
        <div style={{ textAlign: "center", padding: "20px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              border: "1px solid var(--success-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--success-text)",
              marginBottom: "8px",
            }}
          >
            <ShieldCheck size={32} />
          </div>

          <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff" }}>
            Booking Reserved Successfully!
          </h3>
          <p style={{ maxWidth: "440px", color: "var(--text-muted)", fontSize: "0.88rem", margin: 0 }}>
            Your event <strong>{formData.title}</strong> at <strong>{selectedSpace?.name}</strong> has been logged in the system and routed for coordinator verification.
          </p>

          <div
            style={{
              width: "100%",
              maxWidth: "440px",
              padding: "14px",
              backgroundColor: "var(--panel-elevated)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              textAlign: "left",
              fontSize: "0.84rem",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              marginTop: "8px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Date & Time:</span>
              <span style={{ color: "var(--text)", fontWeight: 600 }}>{formData.date} • {formData.start} - {formData.end}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Venue:</span>
              <span style={{ color: "var(--text)", fontWeight: 600 }}>{selectedSpace?.name}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Status:</span>
              <span style={{ color: "var(--warning-text)", fontWeight: 700 }}>Pending Approval</span>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default MultiStepBookingModal;
