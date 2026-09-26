import React, { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Filter, SlidersHorizontal, Building2, Plus, Sparkles, LayoutGrid, ListFilter, Check, CalendarCheck } from "lucide-react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../utils/roles";
import { PATHS } from "../utils/routePaths";
import { useBookingModal } from "../components/layout/DashboardLayout";
import SpaceCard from "../components/space/SpaceCard";
import VenueDetailsModal from "../components/space/VenueDetailsModal";
import FeasibilityAuditModal from "../components/feasibility/FeasibilityAuditModal";
import Modal from "../components/common/Modal";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import { useToast } from "../components/common/Toast";

const ALL_FACILITIES = [
  "Air Conditioning",
  "Projector",
  "Sound System",
  "WiFi",
  "Power Backup",
  "Parking",
  "Stage",
  "Video Conferencing",
];

const SpacePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialVenueId = searchParams.get("venueId");

  const { spaces, compareVenueIds, addToCompare, removeFromCompare, addSpace, updateSpace, deleteSpace } = useData();
  const { role } = useAuth();
  const { openBookingModal } = useBookingModal();
  const toast = useToast();

  const isManager = role === ROLES.ADMIN || role === ROLES.OWNER;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [minCapacity, setMinCapacity] = useState(0);
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [trustFilter, setTrustFilter] = useState("all"); // 'all' | 'verified' | 'demo'
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'

  // Modals state
  const [activeDetailsSpace, setActiveDetailsSpace] = useState(() => {
    if (initialVenueId) {
      return spaces.find((s) => String(s.id) === String(initialVenueId)) || null;
    }
    return null;
  });

  const [feasibilitySpace, setFeasibilitySpace] = useState(null);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState(null);
  const [spaceForm, setSpaceForm] = useState({
    name: "",
    type: "Auditorium",
    capacity: 250,
    city: "Coimbatore",
    address: "Campus Main Block, Vadasithur Road",
    verificationLevel: "Verified",
    description: "",
    facilities: ["Air Conditioning", "Projector", "WiFi", "Sound System"],
    imageUrl: "",
  });

  // Extract unique venue types from existing spaces
  const venueTypes = useMemo(() => {
    const types = new Set(["All"]);
    spaces.forEach((s) => {
      if (s.type) types.add(s.type);
    });
    return Array.from(types);
  }, [spaces]);

  // Toggle facility filter
  const toggleFacility = (facility) => {
    setSelectedFacilities((prev) =>
      prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
    );
  };

  // Filtered and prioritized spaces computation
  const filteredSpaces = useMemo(() => {
    const result = spaces.filter((space) => {
      // 0. Trust Filter
      if (trustFilter === "verified" && !space.isVerified) return false;
      if (trustFilter === "demo" && space.isVerified) return false;

      // 1. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = space.name.toLowerCase().includes(q);
        const matchesType = (space.type || "").toLowerCase().includes(q);
        const matchesCity = (space.city || "").toLowerCase().includes(q);
        const matchesDesc = (space.description || "").toLowerCase().includes(q);
        if (!matchesName && !matchesType && !matchesCity && !matchesDesc) return false;
      }

      // 2. Type
      if (selectedType !== "All" && space.type !== selectedType) {
        return false;
      }

      // 3. Min Capacity
      if (minCapacity > 0) {
        if (!space.capacity || space.capacity < minCapacity) return false;
      }

      // 4. Facilities check
      if (selectedFacilities.length > 0) {
        const spaceFacs = (space.facilities || []).map((f) => f.toLowerCase());
        const hasAll = selectedFacilities.every((f) => spaceFacs.includes(f.toLowerCase()));
        if (!hasAll) return false;
      }

      return true;
    });

    // Prioritize official SECE verified venues first
    return result.sort((a, b) => {
      if (a.isVerified && !b.isVerified) return -1;
      if (!a.isVerified && b.isVerified) return 1;
      return 0;
    });
  }, [spaces, trustFilter, searchQuery, selectedType, minCapacity, selectedFacilities]);

  // Toggle comparison
  const handleToggleCompare = (spaceId) => {
    const id = String(spaceId);
    if (compareVenueIds.includes(id)) {
      removeFromCompare(id);
      toast.info("Removed from comparison.");
    } else {
      addToCompare(id);
      toast.success("Added to side-by-side comparison!");
    }
  };

  // Open Add/Edit Modal
  const handleOpenAddSpace = () => {
    setEditingSpace(null);
    setSpaceForm({
      name: "",
      type: "Auditorium",
      capacity: 250,
      city: "Coimbatore",
      address: "Campus Main Block, Vadasithur Road",
      verificationLevel: "Verified",
      description: "",
      facilities: ["Air Conditioning", "Projector", "WiFi", "Sound System"],
      imageUrl: "",
    });
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditSpace = (space) => {
    setEditingSpace(space);
    setSpaceForm({
      name: space.name || "",
      type: space.type || "Auditorium",
      capacity: space.capacity || 100,
      city: space.city || "Coimbatore",
      address: space.address || "",
      verificationLevel: space.verificationLevel || "Verified",
      description: space.description || "",
      facilities: space.facilities || ["Air Conditioning", "Projector"],
      imageUrl: space.imageUrl || "",
    });
    setIsAddEditModalOpen(true);
  };

  const handleSaveSpace = async (e) => {
    e.preventDefault();
    if (!spaceForm.name.trim()) {
      toast.error("Venue name is required.");
      return;
    }
    try {
      if (editingSpace) {
        await updateSpace({ id: editingSpace.id, ...spaceForm });
        toast.success("Venue space updated successfully!");
      } else {
        await addSpace(spaceForm);
        toast.success("New venue space added successfully!");
      }
      setIsAddEditModalOpen(false);
    } catch {
      toast.error("Failed to save venue space.");
    }
  };

  const handleDeleteSpace = async (id) => {
    if (window.confirm("Are you sure you want to delete this venue? This action cannot be undone.")) {
      await deleteSpace(id);
      toast.info("Venue removed.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ── Page Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>
            Discover Venues
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.92rem" }}>
            Find, evaluate, and reserve verified spaces across campus and corporate hubs.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {isManager && (
            <Button variant="outline" onClick={handleOpenAddSpace} icon={<Plus size={16} />}>
              Add Space
            </Button>
          )}

          <Button variant="primary" onClick={() => navigate(PATHS.PLANNER)} icon={<CalendarCheck size={16} />}>
            Plan an Event
          </Button>

          <Button variant="secondary" onClick={() => openBookingModal()} icon={<Sparkles size={16} />}>
            Quick Reserve
          </Button>
        </div>
      </div>

      {/* ── Search & Filter Control Bar ── */}
      <div
        className="card"
        style={{
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          backgroundColor: "var(--panel-elevated)",
        }}
      >
        {/* Trust Filter Selector (Verified SECE vs Demo) */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setTrustFilter("all")}
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-full)",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              border: trustFilter === "all" ? "1px solid var(--primary)" : "1px solid var(--border)",
              backgroundColor: trustFilter === "all" ? "var(--primary)" : "var(--panel)",
              color: trustFilter === "all" ? "#fff" : "var(--text-secondary)",
              transition: "all 0.15s ease",
            }}
          >
            All Venues ({spaces.length})
          </button>

          <button
            type="button"
            onClick={() => setTrustFilter("verified")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "var(--radius-full)",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer",
              border: trustFilter === "verified" ? "1px solid #34d399" : "1px solid rgba(52, 211, 153, 0.35)",
              backgroundColor: trustFilter === "verified" ? "rgba(6, 78, 59, 0.9)" : "rgba(6, 78, 59, 0.2)",
              color: "#34d399",
              transition: "all 0.15s ease",
            }}
          >
            <Check size={13} strokeWidth={3} />
            Verified SECE Facilities ({spaces.filter((s) => s.isVerified).length})
          </button>

          <button
            type="button"
            onClick={() => setTrustFilter("demo")}
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-full)",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              border: trustFilter === "demo" ? "1px solid #94a3b8" : "1px solid var(--border)",
              backgroundColor: trustFilter === "demo" ? "rgba(71, 85, 105, 0.6)" : "var(--panel)",
              color: trustFilter === "demo" ? "#fff" : "var(--text-muted)",
              transition: "all 0.15s ease",
            }}
          >
            Demo Venues ({spaces.filter((s) => !s.isVerified).length})
          </button>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Main Search Input */}
          <div
            style={{
              flex: 1,
              minWidth: "260px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "var(--panel)",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-md)",
              padding: "8px 14px",
            }}
          >
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by venue name, location, keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--text)",
                fontSize: "0.88rem",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Type Selector Dropdown */}
          <div style={{ minWidth: "160px" }}>
            <select
              className="select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{ padding: "8px 12px" }}
            >
              {venueTypes.map((t) => (
                <option key={t} value={t}>
                  {t === "All" ? "All Venue Types" : t}
                </option>
              ))}
            </select>
          </div>

          {/* Min Capacity Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "0.82rem" }}>
            <span>Min Pax:</span>
            <input
              type="number"
              className="input"
              style={{ width: "80px", padding: "6px 10px" }}
              min="0"
              step="50"
              value={minCapacity || ""}
              placeholder="0"
              onChange={(e) => setMinCapacity(Number(e.target.value))}
            />
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: "flex", gap: "4px", background: "var(--panel)", padding: "3px", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <button
              onClick={() => setViewMode("grid")}
              style={{
                background: viewMode === "grid" ? "var(--primary)" : "transparent",
                color: viewMode === "grid" ? "#fff" : "var(--text-muted)",
                border: "none",
                padding: "6px 8px",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
              }}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              style={{
                background: viewMode === "table" ? "var(--primary)" : "transparent",
                color: viewMode === "table" ? "#fff" : "var(--text-muted)",
                border: "none",
                padding: "6px 8px",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
              }}
            >
              <ListFilter size={15} />
            </button>
          </div>
        </div>

        {/* Facilities Filter Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "0.78rem" }}>
          <span style={{ color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", fontSize: "0.72rem" }}>
            Facilities:
          </span>
          {ALL_FACILITIES.map((fac) => {
            const isChecked = selectedFacilities.includes(fac);
            return (
              <button
                key={fac}
                onClick={() => toggleFacility(fac)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "4px 10px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: isChecked ? "rgba(99, 102, 241, 0.15)" : "var(--panel)",
                  color: isChecked ? "var(--primary-light)" : "var(--text-secondary)",
                  border: isChecked ? "1px solid var(--primary-light)" : "1px solid var(--border)",
                  cursor: "pointer",
                  fontSize: "0.78rem",
                  fontWeight: isChecked ? 600 : 500,
                  transition: "all 0.15s ease",
                }}
              >
                {isChecked && <Check size={12} />}
                <span>{fac}</span>
              </button>
            );
          })}
          {selectedFacilities.length > 0 && (
            <button
              onClick={() => setSelectedFacilities([])}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--danger-text)",
                cursor: "pointer",
                padding: "4px 8px",
                fontSize: "0.75rem",
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ── Venues Grid / Table Display ── */}
      {filteredSpaces.length === 0 ? (
        <EmptyState
          title="No venues found"
          description="Try changing your filters, keywords, or search criteria."
          actionLabel="Reset Search"
          onAction={() => {
            setSearchQuery("");
            setSelectedType("All");
            setMinCapacity(0);
            setSelectedFacilities([]);
          }}
        />
      ) : viewMode === "grid" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredSpaces.map((space) => (
            <div key={space.id} style={{ display: "flex", flexDirection: "column" }}>
              <SpaceCard
                space={space}
                onViewDetails={() => setActiveDetailsSpace(space)}
                onBookNow={() => openBookingModal(space.id)}
                isCompared={compareVenueIds.includes(String(space.id))}
                onToggleCompare={handleToggleCompare}
                onCheckFeasibility={() => setFeasibilitySpace(space)}
              />
              {isManager && (
                <div style={{ display: "flex", gap: "6px", marginTop: "6px", justifyContent: "flex-end" }}>
                  <Button variant="ghost" size="sm" onClick={() => handleOpenEditSpace(space)}>
                    Edit Space
                  </Button>
                  <Button variant="ghost" size="sm" style={{ color: "var(--danger-text)" }} onClick={() => handleDeleteSpace(space.id)}>
                    Delete
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Venue Name</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Access Type</th>
                <th>Location</th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSpaces.map((space) => (
                <tr key={space.id}>
                  <td>
                    <span className="table-title">{space.name}</span>
                    {space.isVerified ? (
                      <span className="table-subtitle" style={{ color: "#34d399", fontWeight: 700 }}>
                        ✓ Verified SECE Facility
                      </span>
                    ) : (
                      <span className="table-subtitle" style={{ color: "#94a3b8" }}>
                        Demo Venue
                      </span>
                    )}
                  </td>
                  <td>{space.type}</td>
                  <td>
                    {space.capacity ? (
                      <span><strong>{space.capacity}</strong> seats</span>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Capacity not published</span>
                    )}
                  </td>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.82rem", color: "#38bdf8", fontWeight: 600 }}>
                      Institutional Free Use
                    </span>
                  </td>
                  <td>{space.city || "Coimbatore"}</td>
                  <td>★ {space.rating || 4.8}</td>
                  <td>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <Button variant="secondary" size="sm" onClick={() => setActiveDetailsSpace(space)}>
                        Details
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => openBookingModal(space.id)}>
                        Book
                      </Button>
                      {isManager && (
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEditSpace(space)}>
                          Edit
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Venue Details Modal ── */}
      <VenueDetailsModal
        space={activeDetailsSpace}
        isOpen={Boolean(activeDetailsSpace)}
        onClose={() => setActiveDetailsSpace(null)}
        onBookVenue={(id) => openBookingModal(id)}
        isCompared={activeDetailsSpace ? compareVenueIds.includes(String(activeDetailsSpace.id)) : false}
        onToggleCompare={handleToggleCompare}
      />

      {/* ── Add / Edit Venue Modal (For Managers / Admins / Owners) ── */}
      {isAddEditModalOpen && (
        <Modal
          title={editingSpace ? "Edit Venue Space" : "Add New Venue Space"}
          subtitle="Define capacity, equipment, and facility details"
          onClose={() => setIsAddEditModalOpen(false)}
          maxWidth="640px"
          footer={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", width: "100%" }}>
              <Button variant="secondary" onClick={() => setIsAddEditModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveSpace}>
                {editingSpace ? "Save Changes" : "Create Venue"}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSaveSpace} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="input-field">
              <label className="input-label">Venue Name *</label>
              <input
                type="text"
                className="input"
                required
                value={spaceForm.name}
                onChange={(e) => setSpaceForm({ ...spaceForm, name: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="input-field">
                <label className="input-label">Venue Type</label>
                <input
                  type="text"
                  className="input"
                  value={spaceForm.type}
                  onChange={(e) => setSpaceForm({ ...spaceForm, type: e.target.value })}
                />
              </div>

              <div className="input-field">
                <label className="input-label">Capacity (Pax) *</label>
                <input
                  type="number"
                  className="input"
                  min="1"
                  required
                  value={spaceForm.capacity}
                  onChange={(e) => setSpaceForm({ ...spaceForm, capacity: Number(e.target.value) })}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="input-field">
                <label className="input-label">Campus Block / Building</label>
                <input
                  type="text"
                  className="input"
                  value={spaceForm.address}
                  onChange={(e) => setSpaceForm({ ...spaceForm, address: e.target.value })}
                  placeholder="e.g. IT Centre, Main Block"
                />
              </div>

              <div className="input-field">
                <label className="input-label">Booking Policy</label>
                <input
                  type="text"
                  className="input"
                  disabled
                  value="Internal Institutional (Free)"
                  style={{ opacity: 0.8, cursor: "not-allowed" }}
                />
              </div>
            </div>

            <div className="input-field">
              <label className="input-label">Image URL</label>
              <input
                type="url"
                className="input"
                placeholder="https://images.unsplash.com/..."
                value={spaceForm.imageUrl}
                onChange={(e) => setSpaceForm({ ...spaceForm, imageUrl: e.target.value })}
              />
            </div>

            <div className="input-field">
              <label className="input-label">Description</label>
              <textarea
                className="textarea"
                rows="3"
                value={spaceForm.description}
                onChange={(e) => setSpaceForm({ ...spaceForm, description: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Feasibility Engine Audit Modal */}
      <FeasibilityAuditModal
        isOpen={Boolean(feasibilitySpace)}
        onClose={() => setFeasibilitySpace(null)}
        space={feasibilitySpace}
        onProceedToBook={(targetSpace, eventParams) => {
          setFeasibilitySpace(null);
          openBookingModal(targetSpace.id || targetSpace._id);
        }}
      />
    </div>
  );
};


export default SpacePage;
