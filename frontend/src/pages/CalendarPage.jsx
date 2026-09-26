import React from "react";
import CalendarView from "../components/calendar/CalendarView";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../utils/roles";

const CalendarPage = () => {
  const { role } = useAuth();
  const canEdit = role === ROLES.ADMIN || role === ROLES.FACULTY;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>
          Master Calendar
        </h1>
        <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.92rem" }}>
          Campus-wide schedules, operational slot occupancy, and facility availability.
        </p>
      </div>

      <CalendarView editable={canEdit} />
    </div>
  );
};

export default CalendarPage;
