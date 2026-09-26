import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Calendar,
  Building2,
  Clock,
  Plus,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Ban,
  Download,
} from "lucide-react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../utils/roles";
import { useBookingModal } from "../components/layout/DashboardLayout";
import Button from "../components/common/Button";
import StatusBadge from "../components/common/StatusBadge";
import Tabs from "../components/common/Tabs";
import Drawer from "../components/common/Drawer";
import EmptyState from "../components/common/EmptyState";
import { useToast } from "../components/common/Toast";

const BOOKING_TABS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const BookingPage = () => {
  const { bookings, spaces, updateBookingStatus } = useData();
  const { user, role } = useAuth();
  const { openBookingModal } = useBookingModal();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  const actionMenuRef = useRef(null);

  // Close action menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) {
        setOpenActionMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const canApprove = role === ROLES.ADMIN || role === ROLES.FACULTY || role === ROLES.OWNER;

  // Space lookup map
  const spaceMap = useMemo(() => {
    const map = new Map();
    spaces.forEach((s) => map.set(String(s.id), s));
    return map;
  }, [spaces]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts = { all: bookings.length };
    counts.pending = bookings.filter((b) => ["Pending", "Requested"].includes(b.status)).length;
    counts.approved = bookings.filter((b) => ["Approved", "Confirmed"].includes(b.status)).length;
    counts.active = bookings.filter((b) => ["In Progress", "Active"].includes(b.status)).length;
    counts.completed = bookings.filter((b) => b.status === "Completed").length;
    counts.cancelled = bookings.filter((b) => ["Cancelled", "Rejected"].includes(b.status)).length;
    return counts;
  }, [bookings]);

  const tabsWithCounts = useMemo(() => {
    return BOOKING_TABS.map((t) => ({
      ...t,
      count: tabCounts[t.id] || 0,
    }));
  }, [tabCounts]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Tab filter
      if (activeTab === "pending" && !["Pending", "Requested"].includes(b.status)) return false;
      if (activeTab === "approved" && !["Approved", "Confirmed"].includes(b.status)) return false;
      if (activeTab === "active" && !["In Progress", "Active"].includes(b.status)) return false;
      if (activeTab === "completed" && b.status !== "Completed") return false;
      if (activeTab === "cancelled" && !["Cancelled", "Rejected"].includes(b.status)) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const space = spaceMap.get(String(b.spaceId));
        const matchesTitle = (b.title || "").toLowerCase().includes(q);
        const matchesOrg = (b.organizedBy || b.requestedBy || "").toLowerCase().includes(q);
        const matchesSpace = space ? space.name.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesOrg && !matchesSpace) return false;
      }

      return true;
    });
  }, [bookings, activeTab, searchQuery, spaceMap]);

  // Status Actions
  const handleStatusChange = async (id, newStatus) => {
    try {
      setOpenActionMenuId(null);
      await updateBookingStatus(id, newStatus);
      toast.success(`Booking ${newStatus.toLowerCase()} successfully.`);
    } catch {
      toast.error(`Failed to update booking status.`);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ── Top Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>
            Bookings
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.92rem" }}>
            Monitor lifecycle, approve campus requests, and manage venue reservations.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => openBookingModal()}
          icon={<Plus size={16} />}
        >
          New Booking
        </Button>
      </div>

      {/* ── Tabs & Search Bar ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <Tabs
          tabs={tabsWithCounts}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: "7px 14px",
            minWidth: "260px",
          }}
        >
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search event, venue, or organizer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text)",
              fontSize: "0.85rem",
              fontFamily: "inherit",
            }}
          />
        </div>
      </div>

      {/* ── Bookings Main Table ── */}
      {filteredBookings.length === 0 ? (
        <EmptyState
          title="No bookings found"
          description={`No ${activeTab !== "all" ? activeTab : ""} bookings found matching your search criteria.`}
          actionLabel="Create Reservation"
          onAction={() => openBookingModal()}
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Venue</th>
                <th>Date</th>
                <th>Time Window</th>
                <th>Organizer</th>
                <th>Attendees</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => {
                const space = spaceMap.get(String(booking.spaceId));
                const isMenuOpen = openActionMenuId === booking.id;

                return (
                  <tr key={booking.id}>
                    <td>
                      <span className="table-title">{booking.title}</span>
                      <span className="table-subtitle">{booking.type || "Event"}</span>
                    </td>
                    <td>
                      <span style={{ color: "var(--text)", fontWeight: 600 }}>
                        {space ? space.name : "Venue"}
                      </span>
                      <span className="table-subtitle">{space?.city || "Campus"}</span>
                    </td>
                    <td>{booking.date}</td>
                    <td>
                      {booking.start} - {booking.end}
                    </td>
                    <td>{booking.organizedBy || booking.requestedBy || "-"}</td>
                    <td>{booking.participants} Pax</td>
                    <td>
                      <StatusBadge status={booking.status} />
                    </td>

                    {/* Action Dropdown Menu */}
                    <td style={{ textAlign: "right", position: "relative" }}>
                      <button
                        onClick={() => setOpenActionMenuId(isMenuOpen ? null : booking.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--text-muted)",
                          padding: "6px",
                          borderRadius: "var(--radius-sm)",
                          cursor: "pointer",
                        }}
                        aria-label="Actions"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {isMenuOpen && (
                        <div
                          ref={actionMenuRef}
                          className="spacio-dropdown-menu"
                          style={{ right: "10px", top: "35px" }}
                        >
                          <button
                            className="spacio-dropdown-item"
                            onClick={() => {
                              setOpenActionMenuId(null);
                              setSelectedBooking(booking);
                            }}
                          >
                            <Eye size={14} /> <span>View Details</span>
                          </button>

                          {canApprove && booking.status === "Pending" && (
                            <>
                              <button
                                className="spacio-dropdown-item"
                                style={{ color: "var(--success-text)" }}
                                onClick={() => handleStatusChange(booking.id, "Approved")}
                              >
                                <CheckCircle size={14} /> <span>Approve Booking</span>
                              </button>

                              <button
                                className="spacio-dropdown-item"
                                style={{ color: "var(--danger-text)" }}
                                onClick={() => handleStatusChange(booking.id, "Rejected")}
                              >
                                <XCircle size={14} /> <span>Reject Request</span>
                              </button>
                            </>
                          )}

                          {booking.status !== "Cancelled" && (
                            <button
                              className="spacio-dropdown-item"
                              style={{ color: "var(--text-muted)" }}
                              onClick={() => handleStatusChange(booking.id, "Cancelled")}
                            >
                              <Ban size={14} /> <span>Cancel Booking</span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Booking Details Drawer ── */}
      <Drawer
        isOpen={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
        title={selectedBooking?.title || "Reservation Summary"}
        subtitle={`Reserved on ${selectedBooking?.date}`}
        footer={
          canApprove && selectedBooking?.status === "Pending" ? (
            <div style={{ display: "flex", gap: "10px", width: "100%", justifyContent: "flex-end" }}>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  handleStatusChange(selectedBooking.id, "Rejected");
                  setSelectedBooking(null);
                }}
              >
                Reject
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  handleStatusChange(selectedBooking.id, "Approved");
                  setSelectedBooking(null);
                }}
              >
                Approve
              </Button>
            </div>
          ) : null
        }
      >
        {selectedBooking && (
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div
              style={{
                padding: "16px",
                borderRadius: "var(--radius-lg)",
                backgroundColor: "var(--panel-elevated)",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontWeight: 700 }}>
                  STATUS
                </span>
                <StatusBadge status={selectedBooking.status} />
              </div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#fff", margin: 0 }}>
                {selectedBooking.title}
              </h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", fontSize: "0.86rem" }}>
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.76rem", display: "block" }}>VENUE</span>
                <strong style={{ color: "var(--text)" }}>
                  {spaceMap.get(String(selectedBooking.spaceId))?.name || "Campus Venue"}
                </strong>
              </div>

              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.76rem", display: "block" }}>ATTENDEES</span>
                <strong style={{ color: "var(--text)" }}>{selectedBooking.participants} Pax</strong>
              </div>

              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.76rem", display: "block" }}>DATE</span>
                <strong style={{ color: "var(--text)" }}>{selectedBooking.date}</strong>
              </div>

              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.76rem", display: "block" }}>HOURS</span>
                <strong style={{ color: "var(--text)" }}>
                  {selectedBooking.start} - {selectedBooking.end}
                </strong>
              </div>

              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.76rem", display: "block" }}>ORGANIZER</span>
                <strong style={{ color: "var(--text)" }}>
                  {selectedBooking.organizedBy || selectedBooking.requestedBy || "-"}
                </strong>
              </div>

              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.76rem", display: "block" }}>BOOKING TYPE</span>
                <strong style={{ color: "var(--accent-teal)" }}>
                  Free Institutional Booking
                </strong>
              </div>
            </div>

            {selectedBooking.notes && (
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.76rem", display: "block", marginBottom: "4px" }}>
                  SPECIAL INSTRUCTIONS / NOTES
                </span>
                <p style={{ margin: 0, padding: "10px", backgroundColor: "var(--panel-elevated)", borderRadius: "var(--radius-sm)", color: "var(--text-secondary)", fontSize: "0.84rem" }}>
                  {selectedBooking.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default BookingPage;
