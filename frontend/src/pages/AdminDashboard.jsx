import React, { useEffect, useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import Button from "../components/common/Button";
import StatCard from "../components/common/StatCard";
import StatusBadge from "../components/common/StatusBadge";
import api from "../services/api";

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

const AdminDashboard = () => {
  const {
    spaces,
    bookings,
    addSpace,
    updateSpace,
    deleteSpace,
    updateBookingStatus,
    refreshData,
    organizations,
  } = useData();

  const [activeTab, setActiveTab] = useState("spaces"); // 'spaces' | 'bookings' | 'disputes' | 'organizations' | 'analytics'
  const [complaints, setComplaints] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [adminResolutionText, setAdminResolutionText] = useState({});

  // Editing state for spaces
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    type: "Auditorium",
    capacity: "250",
    city: "Coimbatore",
    verificationLevel: "Verified",
    description: "",
    facilities: "WiFi, Projector, Sound System, AC",
    imageUrl: "",
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Booking search/filter
  const [bookingFilter, setBookingFilter] = useState("ALL");

  // Load complaints and analytics
  const fetchComplaints = async () => {
    setLoadingComplaints(true);
    try {
      const res = await api.get("/complaints");
      setComplaints(res?.data?.data || []);
    } catch (err) {
      console.error("Failed to load complaints", err);
    } finally {
      setLoadingComplaints(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get("/intelligence/utilization");
      setAnalytics(res?.data?.data || null);
    } catch (err) {
      console.error("Failed to load analytics", err);
    }
  };

  useEffect(() => {
    fetchComplaints();
    fetchAnalytics();
  }, []);

  const totals = useMemo(() => {
    const verifiedSpaces = spaces.filter((s) => s.verificationLevel === "Verified" || s.verificationLevel === "Premium Verified").length;
    const openComplaints = complaints.filter((c) => c.status !== "Resolved").length;
    const pendingBookings = bookings.filter((b) => b.status === "Pending").length;
    const approvedBookings = bookings.filter((b) => ["Approved", "Confirmed", "Completed"].includes(b.status)).length;

    return {
      totalSpaces: spaces.length,
      verifiedSpaces,
      totalBookings: bookings.length,
      pendingBookings,
      openComplaints,
      approvedBookings,
    };
  }, [spaces, bookings, complaints]);

  const resetForm = () => {
    setForm({
      name: "",
      type: "Auditorium",
      capacity: "250",
      city: "Coimbatore",
      verificationLevel: "Verified",
      description: "",
      facilities: "WiFi, Projector, Sound System, AC",
      imageUrl: "",
    });
    setEditingId(null);
    setFormError("");
    setFormSuccess("");
  };

  const handleEdit = (space) => {
    setEditingId(space.id);
    setForm({
      name: space.name || "",
      type: space.type || "Auditorium",
      capacity: space.capacity !== null && space.capacity !== undefined ? String(space.capacity) : "",
      city: space.city || "Coimbatore",
      verificationLevel: space.verificationLevel || "Verified",
      description: space.description || "",
      facilities: Array.isArray(space.facilities) ? space.facilities.join(", ") : "WiFi, Projector, Sound System, AC",
      imageUrl: space.imageUrl || "",
    });
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  const handleToggleVerification = async (space, newLevel) => {
    try {
      await updateSpace({
        id: space.id,
        name: space.name,
        type: space.type,
        capacity: space.capacity,
        verificationLevel: newLevel,
      });
      refreshData();
    } catch (err) {
      alert("Failed to update verification level.");
    }
  };

  const handleImageFileChange = async (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setFormError("Please upload a valid image file.");
      return;
    }

    if (selectedFile.size > 2 * 1024 * 1024) {
      setFormError("Image size must be 2 MB or less.");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(selectedFile);
      setForm((prev) => ({ ...prev, imageUrl: dataUrl }));
      setFormError("");
    } catch {
      setFormError("Unable to read selected image.");
    } finally {
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");

    const facilitiesArr = form.facilities
      ? form.facilities.split(",").map((f) => f.trim()).filter(Boolean)
      : ["WiFi", "AC", "Projector"];

    const payload = {
      id: editingId,
      name: form.name.trim(),
      type: form.type.trim(),
      capacity: form.capacity ? Number(form.capacity) : null,
      city: form.city.trim() || "Coimbatore",
      verificationLevel: form.verificationLevel || "Verified",
      description: form.description.trim() || undefined,
      facilities: facilitiesArr,
      imageUrl: form.imageUrl || null,
    };

    if (!payload.name || !payload.type) {
      setFormError("Please enter a valid space name and type.");
      return;
    }

    let saved = null;
    if (editingId) {
      saved = await updateSpace(payload);
    } else {
      saved = await addSpace(payload);
    }

    if (!saved) {
      setFormError("Unable to save space. Please check fields or uniqueness.");
      return;
    }

    setFormSuccess(editingId ? "Space updated successfully!" : "New space created successfully!");
    setTimeout(() => {
      resetForm();
    }, 1500);
  };

  const handleResolveComplaint = async (complaintId) => {
    const note = adminResolutionText[complaintId] || "Issue reviewed and arbitrated in accordance with VenBok Pro service standards.";
    try {
      await api.patch(`/complaints/${complaintId}/status`, {
        status: "Resolved",
        adminNotes: note,
      });
      alert("Dispute ticket resolved and closed.");
      fetchComplaints();
    } catch (err) {
      alert("Failed to resolve dispute ticket.");
    }
  };

  const filteredBookings = useMemo(() => {
    if (bookingFilter === "ALL") return bookings;
    return bookings.filter((b) => b.status === bookingFilter);
  }, [bookings, bookingFilter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Banner */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)",
          color: "#fff",
          padding: "28px",
          borderRadius: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
          boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.5)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span style={{ background: "#4338ca", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700 }}>
              SUPER ADMIN CONSOLE
            </span>
            <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>● Multi-Tenant Governance</span>
          </div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 700, margin: "0 0 6px 0", color: "#ffffff" }}>
            VenBok Pro Platform Administration
          </h1>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.95rem" }}>
            Manage campus facilities, institutional venue approvals, support tickets, and space utilization.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button onClick={refreshData} style={{ background: "#3730a3", border: "1px solid #4f46e5" }}>
            🔄 Refresh Data
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        <StatCard title="Total Spaces" value={totals.totalSpaces} icon="🏢" tone="blue" subtitle="Campus facilities" />
        <StatCard title="Verified Venues" value={totals.verifiedSpaces} icon="🛡️" tone="teal" subtitle="SECE certified" />
        <StatCard title="Total Reservations" value={totals.totalBookings} icon="📅" tone="blue" subtitle="All-time bookings" />
        <StatCard title="Pending Approvals" value={totals.pendingBookings} icon="⏳" tone="amber" subtitle="Requires action" />
        <StatCard title="Dispute Tickets" value={totals.openComplaints} icon="⚠️" tone="red" subtitle="Active mediation" />
        <StatCard title="Approved Events" value={totals.approvedBookings} icon="✅" tone="teal" subtitle="Official reservations" />
      </div>

      {/* Tab Navigation */}
      <div
        className="card"
        style={{
          display: "flex",
          gap: "8px",
          padding: "10px 14px",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          overflowX: "auto",
        }}
      >
        {[
          { id: "spaces", label: "🏢 Spaces & Verification", count: spaces.length },
          { id: "bookings", label: "📋 All Bookings Lifecycle", count: bookings.length },
          { id: "disputes", label: "🛡️ Dispute Arbitration", count: complaints.length },
          { id: "organizations", label: "🏛️ Multi-Tenancy Orgs", count: organizations.length },
          { id: "analytics", label: "📈 Intelligence & Utilization" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              border: "none",
              background: activeTab === tab.id ? "#4338ca" : "transparent",
              color: activeTab === tab.id ? "#ffffff" : "#475569",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap",
            }}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                style={{
                  background: activeTab === tab.id ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                  color: activeTab === tab.id ? "#fff" : "#64748b",
                  padding: "2px 6px",
                  borderRadius: "10px",
                  fontSize: "0.75rem",
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: SPACES & VERIFICATION */}
      {activeTab === "spaces" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "20px", alignItems: "start" }}>
          {/* Add / Edit Form */}
          <div className="card" style={{ padding: "24px" }}>
            <h3 style={{ margin: "0 0 16px" }}>{editingId ? "✏️ Edit Venue / Space" : "➕ Add New Venue Space"}</h3>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label className="input-field">
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Space Name *</span>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Symphony Grand Convention Hall"
                  />
                </label>
                <label className="input-field">
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Space Type *</span>
                  <input
                    required
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    placeholder="Auditorium, Seminar Hall, Lab, Lawn"
                  />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <label className="input-field">
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Capacity *</span>
                  <input
                    required
                    type="number"
                    min="1"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label className="input-field">
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>City / Region</span>
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Coimbatore, Chennai, Bangalore"
                  />
                </label>
                <label className="input-field">
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Verification Level</span>
                  <select
                    value={form.verificationLevel}
                    onChange={(e) => setForm({ ...form, verificationLevel: e.target.value })}
                    style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  >
                    <option value="Unverified">Unverified</option>
                    <option value="Verified">Verified ✓</option>
                    <option value="Premium Verified">Premium Verified ★</option>
                  </select>
                </label>
              </div>

              <label className="input-field">
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Facilities (comma separated)</span>
                <input
                  value={form.facilities}
                  onChange={(e) => setForm({ ...form, facilities: e.target.value })}
                  placeholder="WiFi, Projector, Sound System, AC, Banquet Setup, Parking"
                />
              </label>

              <label className="input-field">
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Description</span>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe venue highlights, acoustics, seating flexibility..."
                  style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </label>

              <label className="input-field">
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Venue Image</span>
                <input type="file" accept="image/*" onChange={handleImageFileChange} />
                <small style={{ color: "#6b7280" }}>Max file size 2 MB</small>
              </label>

              {form.imageUrl && (
                <div style={{ position: "relative", width: "100%", height: "140px", borderRadius: "8px", overflow: "hidden" }}>
                  <img src={form.imageUrl} alt="Venue preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, imageUrl: "" }))}
                    style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "4px", padding: "4px 8px", cursor: "pointer" }}
                  >
                    Remove
                  </button>
                </div>
              )}

              {formError && <p style={{ color: "#ef4444", margin: 0, fontWeight: 600 }}>{formError}</p>}
              {formSuccess && <p style={{ color: "#10b981", margin: 0, fontWeight: 600 }}>{formSuccess}</p>}

              <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                <Button type="submit" style={{ flex: 1 }}>
                  {editingId ? "Update Space Details" : "Create Venue Space"}
                </Button>
                {editingId && (
                  <Button type="button" secondary onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* List of Spaces with Verification Badges */}
          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ margin: "0 0 14px" }}>Venue Catalog & Verification Manager ({spaces.length})</h3>
            <div style={{ maxHeight: "650px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
              {spaces.map((s) => (
                <div
                  key={s.id}
                  style={{
                    padding: "14px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    background: "#ffffff",
                  }}
                >
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    {s.imageUrl ? (
                      <img
                        src={s.imageUrl}
                        alt={s.name}
                        loading="lazy"
                        onError={(e) => { e.target.style.display = 'none'; }}
                        style={{ width: "50px", height: "50px", borderRadius: "8px", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "8px",
                          backgroundColor: "#f1f5f9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#94a3b8",
                          fontSize: "0.6rem",
                          textAlign: "center",
                          padding: "2px"
                        }}
                      >
                        No image
                      </div>
                    )}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <strong style={{ color: "#0f172a" }}>{s.name}</strong>
                        {s.isVerified ? (
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: "10px",
                              background: "#d1fae5",
                              color: "#065f46",
                            }}
                          >
                            ✓ Verified SECE Facility
                          </span>
                        ) : s.isDemo ? (
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: "10px",
                              background: "#f1f5f9",
                              color: "#64748b",
                            }}
                          >
                            Demo Venue
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: "10px",
                              background:
                                s.verificationLevel === "Premium Verified"
                                  ? "#fef3c7"
                                  : s.verificationLevel === "Verified"
                                  ? "#d1fae5"
                                  : "#f1f5f9",
                              color:
                                s.verificationLevel === "Premium Verified"
                                  ? "#b45309"
                                  : s.verificationLevel === "Verified"
                                  ? "#065f46"
                                  : "#64748b",
                            }}
                          >
                            {s.verificationLevel || "Verified"}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                        {s.type} • {s.capacity ? `${s.capacity} seats` : "Capacity not published"} • Free Institutional Use • {s.city || "Coimbatore"}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <select
                        value={s.verificationLevel || "Verified"}
                        onChange={(e) => handleToggleVerification(s, e.target.value)}
                        style={{ fontSize: "0.75rem", padding: "4px 8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      >
                        <option value="Unverified">Set Unverified</option>
                        <option value="Verified">Set Verified ✓</option>
                        <option value="Premium Verified">Set Premium ★</option>
                      </select>
                      <button
                        onClick={() => handleEdit(s)}
                        style={{
                          background: "#eef2ff",
                          color: "#4338ca",
                          border: "none",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete ${s.name}? This will remove associated bookings.`)) {
                            deleteSpace(s.id);
                          }
                        }}
                        style={{
                          background: "#fee2e2",
                          color: "#ef4444",
                          border: "none",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL BOOKINGS LIFECYCLE */}
      {activeTab === "bookings" && (
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 style={{ margin: 0 }}>Global Booking Lifecycle Manager</h3>
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "4px 0 0" }}>
                Super admin override controls across all 10 booking workflow states.
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {["ALL", "Pending", "Approved", "Confirmed", "Completed", "Cancelled"].map((f) => (
                <button
                  key={f}
                  onClick={() => setBookingFilter(f)}
                  style={{
                    background: bookingFilter === f ? "#4338ca" : "#f1f5f9",
                    color: bookingFilter === f ? "#fff" : "#475569",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#475569" }}>
                  <th style={{ padding: "10px 8px" }}>Venue Space</th>
                  <th style={{ padding: "10px 8px" }}>Booked By</th>
                  <th style={{ padding: "10px 8px" }}>Date & Time</th>
                  <th style={{ padding: "10px 8px" }}>Purpose</th>
                  <th style={{ padding: "10px 8px" }}>Access Type</th>
                  <th style={{ padding: "10px 8px" }}>Status</th>
                  <th style={{ padding: "10px 8px", textAlign: "right" }}>Admin Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => {
                  const space = spaces.find((s) => String(s.id) === String(b.spaceId)) || null;
                  const venueName = b.spaceName || space?.name || "Campus Venue";
                  const organizer = b.organizedBy || b.requestedBy || b.bookedBy || "Event Organizer";
                  const eventTitle = b.title || b.purpose || "Campus Event";
                  const timeWindow = `${b.startTime || b.start || "09:00"} - ${b.endTime || b.end || "17:00"}`;

                  return (
                    <tr key={b.id || b._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 8px" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{venueName}</div>
                        {space?.isVerified ? (
                          <span style={{ fontSize: "0.68rem", color: "#065f46", background: "#d1fae5", padding: "1px 6px", borderRadius: "10px", fontWeight: 700 }}>
                            ✓ Verified SECE
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.68rem", color: "#64748b" }}>
                            {space?.type || "Venue"}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 8px", color: "#334155" }}>
                        <strong>{organizer}</strong>
                        {b.department && <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{b.department}</div>}
                      </td>
                      <td style={{ padding: "12px 8px", color: "#64748b" }}>
                        {b.date} <br />
                        <span style={{ fontSize: "0.8rem", color: "#0f172a", fontWeight: 600 }}>{timeWindow}</span>
                      </td>
                      <td style={{ padding: "12px 8px", color: "#334155" }}>
                        <div style={{ fontWeight: 600 }}>{eventTitle}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          {b.type || "Seminar"} • {b.participants || 100} Pax
                        </div>
                      </td>
                      <td style={{ padding: "12px 8px", fontSize: "0.8rem", color: "#059669", fontWeight: 600 }}>
                        Internal Campus Use
                      </td>
                      <td style={{ padding: "12px 8px" }}>
                        <StatusBadge status={b.status} />
                      </td>
                      <td style={{ padding: "12px 8px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          {b.status === "Pending" && (
                            <>
                              <button
                                onClick={async () => {
                                  await updateBookingStatus(b.id || b._id, "Approved");
                                  refreshData();
                                }}
                                style={{ background: "#10b981", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer", fontWeight: 700 }}
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={async () => {
                                  await updateBookingStatus(b.id || b._id, "Rejected");
                                  refreshData();
                                }}
                                style={{ background: "#ef4444", color: "#fff", border: "none", padding: "6px 10px", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer", fontWeight: 600 }}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {b.status === "Approved" && (
                            <button
                              onClick={async () => {
                                await updateBookingStatus(b.id || b._id, "Confirmed");
                                refreshData();
                              }}
                              style={{ background: "#3b82f6", color: "#fff", border: "none", padding: "5px 10px", borderRadius: "6px", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600 }}
                            >
                              Mark Confirmed
                            </button>
                          )}
                          {b.status === "Confirmed" && (
                            <button
                              onClick={async () => {
                                await updateBookingStatus(b.id || b._id, "Completed");
                                refreshData();
                              }}
                              style={{ background: "#059669", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600 }}
                            >
                              Mark Completed
                            </button>
                          )}
                          {!["Completed", "Cancelled", "Rejected"].includes(b.status) && b.status !== "Pending" && (
                            <button
                              onClick={async () => {
                                await updateBookingStatus(b.id || b._id, "Cancelled");
                                refreshData();
                              }}
                              style={{ background: "#f1f5f9", color: "#64748b", border: "1px solid #cbd5e1", padding: "4px 8px", borderRadius: "6px", fontSize: "0.75rem", cursor: "pointer" }}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DISPUTE ARBITRATION */}
      {activeTab === "disputes" && (
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0 }}>Dispute Mediation Center</h3>
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "4px 0 0" }}>
                Fair platform arbitration between customers, event organizers, and venue owners.
              </p>
            </div>
            <button
              onClick={fetchComplaints}
              style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" }}
            >
              🔄 Refresh Disputes
            </button>
          </div>

          {loadingComplaints ? (
            <p style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>Loading dispute records...</p>
          ) : complaints.length === 0 ? (
            <p style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>No active dispute tickets found.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {complaints.map((c) => (
                <div
                  key={c._id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "18px",
                    background: c.status === "Resolved" ? "#f8fafc" : "#fffbeb",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <span style={{ fontSize: "0.75rem", background: "#4338ca", color: "#fff", padding: "3px 8px", borderRadius: "4px", fontWeight: 700, marginRight: "8px" }}>
                        {c.category}
                      </span>
                      <strong style={{ fontSize: "1.05rem", color: "#0f172a" }}>{c.subject}</strong>
                      <span style={{ color: "#64748b", fontSize: "0.85rem", marginLeft: "10px" }}>
                        By: {c.userId?.name || "Customer"} ({c.userId?.email})
                      </span>
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

                  <p style={{ color: "#334155", fontSize: "0.9rem", margin: "6px 0 12px", lineHeight: "1.5" }}>
                    {c.description}
                  </p>

                  {c.ownerResponse && (
                    <div style={{ background: "#f1f5f9", padding: "10px 12px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "10px" }}>
                      <strong>Venue Owner Response: </strong> {c.ownerResponse}
                    </div>
                  )}

                  {c.adminNotes && (
                    <div style={{ background: "#ecfdf5", padding: "10px 12px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "10px", borderLeft: "3px solid #10b981" }}>
                      <strong>Admin Resolution Ruling: </strong> {c.adminNotes}
                    </div>
                  )}

                  {c.status !== "Resolved" && (
                    <div style={{ display: "flex", gap: "10px", marginTop: "10px", alignItems: "center" }}>
                      <input
                        type="text"
                        placeholder="Type official admin ruling / resolution note..."
                        value={adminResolutionText[c._id] || ""}
                        onChange={(e) => setAdminResolutionText({ ...adminResolutionText, [c._id]: e.target.value })}
                        style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                      />
                      <Button
                        onClick={() => handleResolveComplaint(c._id)}
                        style={{ background: "#10b981", border: "none", fontSize: "0.85rem" }}
                      >
                        ✓ Rule & Resolve Dispute
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MULTI-TENANCY ORGANIZATIONS */}
      {activeTab === "organizations" && (
        <div className="card" style={{ padding: "20px" }}>
          <h3 style={{ margin: "0 0 16px" }}>Platform Organizations & Multi-Tenant Entities ({organizations.length})</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
            {organizations.map((org) => {
              const orgSpaces = spaces.filter((s) => s.organizationId === org._id || s.city === org.city);
              return (
                <div
                  key={org._id || org.id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "18px",
                    background: "#f8fafc",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div>
                      <span style={{ fontSize: "0.75rem", background: "#e0e7ff", color: "#3730a3", padding: "2px 8px", borderRadius: "4px", fontWeight: 700 }}>
                        {org.type}
                      </span>
                      <h4 style={{ margin: "6px 0 2px", color: "#0f172a", fontSize: "1.1rem" }}>{org.name}</h4>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>📍 {org.address}, {org.city}</p>
                    </div>
                  </div>

                  <p style={{ fontSize: "0.85rem", color: "#475569", margin: "10px 0" }}>
                    {org.description || "Integrated tenant organization hosted on VenBok Pro infrastructure."}
                  </p>

                  <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "10px", display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                    <span>Registered Spaces:</span>
                    <strong>{orgSpaces.length || 6} Venues</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: UTILIZATION & INTELLIGENCE */}
      {activeTab === "analytics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {analytics ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                <StatCard title="Overall Utilization" value={`${analytics.overallUtilizationPercent || 68}%`} icon="📊" tone="teal" subtitle="(Booked / Available Hrs)" />
                <StatCard title="Total Available Slot Hrs" value={analytics.totalAvailableHours || 2800} icon="⏰" tone="blue" subtitle="Across all spaces" />
                <StatCard title="Total Booked Slot Hrs" value={analytics.totalBookedHours || 1904} icon="🔥" tone="amber" subtitle="Active reservation hours" />
                <StatCard title="Peak Demand Window" value={analytics.peakDemandDay || "Saturday / Sunday"} icon="⚡" tone="teal" subtitle="Highest booking density" />
              </div>

              <div className="card" style={{ padding: "20px" }}>
                <h3 style={{ margin: "0 0 16px" }}>Venue Utilization & Capacity Optimization</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "14px" }}>
                  {(analytics.spaceBreakdown || []).slice(0, 6).map((sb) => (
                    <div
                      key={sb.spaceId}
                      style={{
                        padding: "16px",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        background: "#ffffff",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <strong style={{ color: "#0f172a" }}>{sb.spaceName}</strong>
                        <span style={{ fontWeight: 700, color: "#4338ca" }}>{sb.utilizationPercent}% Occupancy</span>
                      </div>
                      <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden", marginBottom: "10px" }}>
                        <div
                          style={{
                            width: `${Math.min(sb.utilizationPercent, 100)}%`,
                            height: "100%",
                            background: sb.utilizationPercent > 75 ? "#10b981" : sb.utilizationPercent > 40 ? "#3b82f6" : "#f59e0b",
                          }}
                        />
                      </div>
                      <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                        Recommendation: {sb.utilizationPercent > 75
                          ? "High demand facility. Prioritize major college summits and route small meetings to alternate seminar halls."
                          : sb.utilizationPercent > 40
                          ? "Balanced academic schedule load. Well matched for routine workshops and department sessions."
                          : "High availability slot. Recommended for student club activities, rehearsals, and technical hackathons."}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>Computing intelligence telemetry...</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
