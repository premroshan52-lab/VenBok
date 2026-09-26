import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Building2, Users } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useBookingModal } from "../layout/DashboardLayout";
import StatusBadge from "../common/StatusBadge";
import Button from "../common/Button";
import Drawer from "../common/Drawer";

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8:00 to 18:00

const CalendarView = ({ editable = false }) => {
  const { spaces, bookings, timetableOverrides, setTimetableOverride } = useData();
  const { openBookingModal } = useBookingModal();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month"); // 'month' | 'week' | 'day'
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Month calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString("en-US", { month: "long" });

  const spaceLookup = useMemo(() => {
    const map = new Map();
    spaces.forEach((s) => map.set(String(s.id), s));
    return map;
  }, [spaces]);

  // Navigate dates
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === "month") next.setMonth(next.getMonth() - 1);
      else if (viewMode === "week") next.setDate(next.getDate() - 7);
      else next.setDate(next.getDate() - 1);
      return next;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === "month") next.setMonth(next.getMonth() + 1);
      else if (viewMode === "week") next.setDate(next.getDate() + 7);
      else next.setDate(next.getDate() + 1);
      return next;
    });
  };

  const handleToday = () => setCurrentDate(new Date());

  // Generate calendar days for Month view
  const monthDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days = [];

    // Prev month padding
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        dayNum: prevMonthTotalDays - i,
        dateStr: "",
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      const dateStr = d.toISOString().split("T")[0];
      days.push({
        dayNum: i,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === new Date().toISOString().split("T")[0],
      });
    }

    // Next month padding to fill 35 or 42 cells
    const remaining = 35 - days.length;
    if (remaining > 0) {
      for (let i = 1; i <= remaining; i++) {
        days.push({
          dayNum: i,
          dateStr: "",
          isCurrentMonth: false,
        });
      }
    }

    return days;
  }, [year, month]);

  // Bookings mapped by date string
  const bookingsByDate = useMemo(() => {
    const map = new Map();
    bookings.forEach((b) => {
      if (!b.date) return;
      if (!map.has(b.date)) map.set(b.date, []);
      map.get(b.date).push(b);
    });
    return map;
  }, [bookings]);

  // Selected date for day view
  const dayDateStr = currentDate.toISOString().split("T")[0];
  const dayBookings = bookingsByDate.get(dayDateStr) || [];

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "18px", padding: "20px" }}>
      {/* ── Calendar Controls Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#fff", margin: 0 }}>
            {viewMode === "month" && `${monthName} ${year}`}
            {viewMode === "day" && currentDate.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}
            {viewMode === "week" && `Week of ${monthName} ${year}`}
          </h2>

          <div style={{ display: "flex", gap: "4px" }}>
            <button
              onClick={handlePrev}
              style={{
                background: "var(--panel-elevated)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-secondary)",
                padding: "6px 8px",
                cursor: "pointer",
                display: "flex",
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNext}
              style={{
                background: "var(--panel-elevated)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-secondary)",
                padding: "6px 8px",
                cursor: "pointer",
                display: "flex",
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <Button variant="secondary" size="sm" onClick={handleToday}>
            Today
          </Button>
        </div>

        {/* View Mode Toggle & Book Slot action */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ display: "flex", background: "var(--panel-elevated)", padding: "3px", borderRadius: "8px", border: "1px solid var(--border)" }}>
            {["month", "week", "day"].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  background: viewMode === mode ? "var(--primary)" : "transparent",
                  color: viewMode === mode ? "#fff" : "var(--text-muted)",
                  border: "none",
                  padding: "5px 12px",
                  borderRadius: "6px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {mode}
              </button>
            ))}
          </div>

          <Button variant="primary" size="sm" onClick={() => openBookingModal()}>
            + Book Slot
          </Button>
        </div>
      </div>

      {/* ── Status Color Legend ── */}
      <div style={{ display: "flex", gap: "16px", fontSize: "0.75rem", color: "var(--text-muted)", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontWeight: 600, textTransform: "uppercase" }}>Status Key:</span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} /> Approved
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b" }} /> Pending
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#06b6d4" }} /> Completed
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} /> Rejected / Cancelled
        </span>
      </div>

      {/* ── MONTH VIEW ── */}
      {viewMode === "month" && (
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          {/* Day of week headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: "var(--panel-elevated)", borderBottom: "1px solid var(--border)" }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
              <div key={dayName} style={{ padding: "10px", textAlign: "center", fontSize: "0.76rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar grid cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {monthDays.map((cell, idx) => {
              const dayBookingsList = cell.dateStr ? bookingsByDate.get(cell.dateStr) || [] : [];

              return (
                <div
                  key={idx}
                  style={{
                    minHeight: "105px",
                    padding: "8px",
                    borderRight: (idx + 1) % 7 !== 0 ? "1px solid var(--border-subtle)" : "none",
                    borderBottom: idx < monthDays.length - 7 ? "1px solid var(--border-subtle)" : "none",
                    backgroundColor: cell.isCurrentMonth ? "transparent" : "rgba(255, 255, 255, 0.015)",
                    opacity: cell.isCurrentMonth ? 1 : 0.4,
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: cell.isToday ? 800 : 600,
                        color: cell.isToday ? "#fff" : "var(--text-muted)",
                        background: cell.isToday ? "var(--primary)" : "transparent",
                        width: cell.isToday ? "22px" : "auto",
                        height: cell.isToday ? "22px" : "auto",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {cell.dayNum}
                    </span>
                    {dayBookingsList.length > 0 && (
                      <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                        {dayBookingsList.length}
                      </span>
                    )}
                  </div>

                  {/* Booking Events within this day */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px", overflowY: "hidden" }}>
                    {dayBookingsList.slice(0, 3).map((b) => {
                      const space = spaceLookup.get(String(b.spaceId));
                      const isApproved = ["Approved", "Confirmed"].includes(b.status);
                      const isPending = ["Pending", "Requested"].includes(b.status);

                      const pillColor = isApproved ? "#10b981" : isPending ? "#f59e0b" : "#64748b";

                      return (
                        <div
                          key={b.id}
                          onClick={() => setSelectedBooking(b)}
                          style={{
                            padding: "3px 6px",
                            borderRadius: "4px",
                            backgroundColor: `${pillColor}1a`,
                            borderLeft: `2px solid ${pillColor}`,
                            fontSize: "0.7rem",
                            color: "#fff",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            fontWeight: 500,
                          }}
                          title={`${b.title} (${b.start}-${b.end})`}
                        >
                          {b.start} {b.title}
                        </div>
                      );
                    })}
                    {dayBookingsList.length > 3 && (
                      <span style={{ fontSize: "0.68rem", color: "var(--primary-light)", fontWeight: 600 }}>
                        +{dayBookingsList.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── DAY / WEEK VIEW ── */}
      {(viewMode === "day" || viewMode === "week") && (
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", backgroundColor: "var(--panel-elevated)", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>
              Time-slot Schedule for {dayDateStr}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {HOURS.map((hour) => {
              const timeStr = `${String(hour).padStart(2, "0")}:00`;
              const nextTimeStr = `${String(hour + 1).padStart(2, "0")}:00`;

              // Check if any booking overlaps with this hour
              const matchingBookings = dayBookings.filter((b) => {
                if (!b.start || !b.end) return false;
                return b.start < nextTimeStr && b.end > timeStr;
              });

              return (
                <div
                  key={hour}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "80px 1fr",
                    borderBottom: "1px solid var(--border-subtle)",
                    minHeight: "56px",
                  }}
                >
                  <div
                    style={{
                      padding: "10px",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      backgroundColor: "var(--panel-elevated)",
                      borderRight: "1px solid var(--border-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {timeStr}
                  </div>

                  <div style={{ padding: "8px 12px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                    {matchingBookings.length === 0 ? (
                      <span style={{ fontSize: "0.78rem", color: "var(--text-disabled)" }}>
                        Open Slot • Available
                      </span>
                    ) : (
                      matchingBookings.map((b) => {
                        const space = spaceLookup.get(String(b.spaceId));
                        return (
                          <div
                            key={b.id}
                            onClick={() => setSelectedBooking(b)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "6px 12px",
                              borderRadius: "var(--radius-md)",
                              backgroundColor: "rgba(99, 102, 241, 0.15)",
                              border: "1px solid var(--primary-light)",
                              color: "#fff",
                              fontSize: "0.82rem",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            <StatusBadge status={b.status} size="sm" />
                            <span>{b.title}</span>
                            <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                              ({space?.name || "Venue"})
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Booking Detail Drawer ── */}
      <Drawer
        isOpen={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
        title={selectedBooking?.title || "Booking Details"}
        subtitle={`Scheduled on ${selectedBooking?.date}`}
      >
        {selectedBooking && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ padding: "14px", backgroundColor: "var(--panel-elevated)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  CURRENT STATUS
                </span>
                <StatusBadge status={selectedBooking.status} />
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
                {selectedBooking.title}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "0.85rem" }}>
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block" }}>VENUE</span>
                <strong style={{ color: "var(--text)" }}>
                  {spaceLookup.get(String(selectedBooking.spaceId))?.name || "Campus Venue"}
                </strong>
              </div>

              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block" }}>ATTENDEES</span>
                <strong style={{ color: "var(--text)" }}>{selectedBooking.participants} Pax</strong>
              </div>

              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block" }}>TIME WINDOW</span>
                <strong style={{ color: "var(--text)" }}>
                  {selectedBooking.start} - {selectedBooking.end}
                </strong>
              </div>

              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block" }}>ORGANIZER</span>
                <strong style={{ color: "var(--text)" }}>
                  {selectedBooking.organizedBy || selectedBooking.requestedBy || "-"}
                </strong>
              </div>
            </div>

            {selectedBooking.notes && (
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block", marginBottom: "4px" }}>
                  NOTES
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

export default CalendarView;
