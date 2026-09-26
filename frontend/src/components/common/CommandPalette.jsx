import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Building2, Calendar, LayoutDashboard, Sparkles, Scale, Settings, LogOut, ArrowRight, UserCheck } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { PATHS } from "../../utils/routePaths";
import { roleHomePath, ROLES } from "../../utils/roles";

const CommandPalette = ({ isOpen, onClose, onOpenBookingModal }) => {
  const navigate = useNavigate();
  const { spaces, bookings } = useData();
  const { user, logout, login } = useAuth();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Reset query on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Quick navigation items
  const staticCommands = useMemo(() => [
    {
      id: "nav-dash",
      title: "Go to Dashboard",
      category: "Navigation",
      icon: <LayoutDashboard size={16} />,
      action: () => navigate(user ? roleHomePath(user.role) : PATHS.HOME),
    },
    {
      id: "nav-discover",
      title: "Discover Venues",
      category: "Navigation",
      icon: <Building2 size={16} />,
      action: () => navigate(PATHS.SPACES),
    },
    {
      id: "nav-compare",
      title: "Compare Venues",
      category: "Navigation",
      icon: <Scale size={16} />,
      action: () => navigate(PATHS.COMPARE),
    },
    {
      id: "nav-ai",
      title: "AI Venue Match & Planner",
      category: "Navigation",
      icon: <Sparkles size={16} />,
      action: () => navigate(PATHS.PLANNER),
    },
    {
      id: "nav-bookings",
      title: "My Bookings & Reservations",
      category: "Navigation",
      icon: <Calendar size={16} />,
      action: () => navigate(PATHS.BOOKINGS),
    },
    {
      id: "nav-calendar",
      title: "Master Schedule Calendar",
      category: "Navigation",
      icon: <Calendar size={16} />,
      action: () => navigate(PATHS.CALENDAR),
    },
    {
      id: "action-booking",
      title: "Create New Booking...",
      category: "Actions",
      icon: <Sparkles size={16} color="#6366f1" />,
      action: () => {
        onClose();
        if (onOpenBookingModal) onOpenBookingModal();
      },
    },
    {
      id: "nav-settings",
      title: "Settings & Preferences",
      category: "Navigation",
      icon: <Settings size={16} />,
      action: () => navigate(PATHS.SETTINGS),
    },
  ], [navigate, user, onClose, onOpenBookingModal]);

  // Filtered items (Venues + Bookings + Commands)
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return staticCommands;
    }

    const matchedCommands = staticCommands.filter((c) =>
      c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
    );

    const matchedVenues = spaces
      .filter((s) => s.name.toLowerCase().includes(q) || (s.type || "").toLowerCase().includes(q))
      .slice(0, 4)
      .map((s) => ({
        id: `space-${s.id}`,
        title: `${s.name} (${s.type} • ${s.capacity ? `${s.capacity} Pax` : "Capacity not published"})`,
        category: "Venues",
        icon: <Building2 size={16} />,
        action: () => navigate(`${PATHS.SPACES}?venueId=${s.id}`),
      }));

    const matchedBookings = bookings
      .filter((b) => b.title.toLowerCase().includes(q) || (b.requestedBy || "").toLowerCase().includes(q))
      .slice(0, 3)
      .map((b) => ({
        id: `booking-${b.id}`,
        title: `${b.title} (${b.date} • ${b.status})`,
        category: "Bookings",
        icon: <Calendar size={16} />,
        action: () => navigate(PATHS.BOOKINGS),
      }));

    return [...matchedCommands, ...matchedVenues, ...matchedBookings];
  }, [query, staticCommands, spaces, bookings, navigate]);

  // Arrow key navigation
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
      e.preventDefault();
      filteredItems[selectedIndex].action();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="spacio-palette-overlay" onClick={onClose}>
      <div className="spacio-palette-box" onClick={(e) => e.stopPropagation()}>
        <div className="spacio-palette-input-wrap">
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            className="spacio-palette-input"
            placeholder="Type a command or search venues, bookings, events..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <span className="spacio-kbd-shortcut">ESC</span>
        </div>

        <div className="spacio-palette-results">
          {filteredItems.length === 0 ? (
            <div style={{ padding: "30px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.88rem" }}>
              No matching commands or resources found for "{query}".
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`spacio-palette-item ${isSelected ? "selected" : ""}`}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ color: isSelected ? "var(--primary-light)" : "var(--text-muted)" }}>
                      {item.icon}
                    </div>
                    <span>{item.title}</span>
                  </div>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                      backgroundColor: "var(--panel-elevated)",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
