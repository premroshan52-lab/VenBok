import React, { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Button from "../common/Button";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { PATHS } from "../../utils/routePaths";
import { ROLES, roleHomePath } from "../../utils/roles";

const TopNavbar = () => {
  const { user, logout, login } = useAuth();
  const {
    mode,
    togglePlatformMode,
    compareVenueIds,
    notifications,
    unreadNotifsCount,
  } = useData();
  const navigate = useNavigate();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showDemoSwitcher, setShowDemoSwitcher] = useState(false);

  const userInitial = user?.name ? String(user.name).trim().charAt(0).toUpperCase() : "V";
  const roleText = user?.role ? String(user.role).toUpperCase() : "GUEST";

  const handleDemoSwitch = async (email, role) => {
    try {
      setShowDemoSwitcher(false);
      await login({ email, password: "Venbok@123" });
      navigate(roleHomePath(role));
    } catch (err) {
      console.error("Quick demo login failed", err);
    }
  };

  const navLinks = useMemo(() => {
    const commonLinks = [
      { label: "Home", path: PATHS.HOME, icon: "🏠" },
      { label: "Smart Search & Map", path: PATHS.EXPLORE, icon: "🔍" },
      { label: "Event Planner", path: PATHS.PLANNER, icon: "🎯" },
      {
        label: `Compare${compareVenueIds.length > 0 ? ` (${compareVenueIds.length})` : ""}`,
        path: PATHS.COMPARE,
        icon: "⚖️",
      },
      { label: "Venues", path: PATHS.SPACES, icon: "🏢" },
      { label: "Calendar", path: PATHS.CALENDAR, icon: "📅" },
    ];

    if (!user) {
      return commonLinks;
    }

    const dashboardLink = {
      label: "Dashboard",
      path: roleHomePath(user.role),
      icon: "⚡",
    };

    const userLinks = [
      ...commonLinks,
      dashboardLink,
    ];

    if (user.role === ROLES.ADMIN || user.role === ROLES.OWNER) {
      userLinks.push({ label: "Reports", path: PATHS.BOOKING_REPORT, icon: "📊" });
    }

    return userLinks;
  }, [user, compareVenueIds]);

  return (
    <header className="navbar" style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
      {/* Brand Logo */}
      <div className="navbar-brand" onClick={() => navigate(PATHS.HOME)} style={{ cursor: "pointer" }}>
        <div
          className="brand-logo-badge"
          style={{
            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #06b6d4 100%)",
            color: "#ffffff",
            fontWeight: 800,
            fontSize: "1.1rem",
            boxShadow: "0 4px 14px rgba(79, 70, 229, 0.4)",
          }}
        >
          VP
        </div>
        <div className="navbar-brand-text">
          <div className="brand-title-wrap">
            <span className="brand-title" style={{ letterSpacing: "-0.03em", fontWeight: 800 }}>
              VENBOK
            </span>
            <span
              className="brand-pro-tag"
              style={{
                background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
                color: "#ffffff",
                fontSize: "0.68rem",
                fontWeight: 800,
                letterSpacing: "0.05em",
                padding: "2px 8px",
                borderRadius: "6px",
                boxShadow: "0 2px 8px rgba(6, 182, 212, 0.3)",
              }}
            >
              PRO
            </span>
          </div>
          <p className="navbar-subtitle" style={{ color: "#64748b", fontSize: "0.74rem", fontWeight: 500 }}>
            Intelligent Venue & Event Platform
          </p>
        </div>
      </div>

      <button
        className="mobile-menu-btn"
        onClick={() => setIsNavOpen((prev) => !prev)}
        aria-label={isNavOpen ? "Close navigation menu" : "Open navigation menu"}
      >
        <span />
        <span />
        <span />
      </button>

      {/* Nav Links */}
      <nav className={`navbar-nav${isNavOpen ? " open" : ""}`}>
        {navLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            onClick={() => setIsNavOpen(false)}
            className={({ isActive }) => `navbar-link${isActive ? " active" : ""}`}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <span style={{ fontSize: "0.95rem" }}>{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Actions & Role Switcher */}
      <div className="navbar-actions">
        {/* Mode Switcher */}
        <button
          className={`mode-toggle-btn ${mode}`}
          onClick={togglePlatformMode}
          title={`Switch to ${mode === "marketplace" ? "Institution Mode" : "Marketplace Mode"}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 14px",
            borderRadius: "20px",
            border: mode === "marketplace" ? "1px solid #c7d2fe" : "1px solid #bbf7d0",
            background: mode === "marketplace" ? "#eef2ff" : "#f0fdf4",
            color: mode === "marketplace" ? "#3730a3" : "#166534",
            fontWeight: 700,
            fontSize: "0.8rem",
            cursor: "pointer",
            transition: "all 0.25s ease",
          }}
        >
          <span>{mode === "marketplace" ? "🎪 Marketplace" : "🏛️ Institution"}</span>
          <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>⇄</span>
        </button>

        {/* Notifications Icon with Badge */}
        {user ? (
          <div className="notif-wrapper" style={{ position: "relative" }}>
            <button
              className="notif-btn"
              onClick={() => setShowNotifs((prev) => !prev)}
              aria-label="Notifications"
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "1rem",
                position: "relative",
              }}
            >
              🔔
              {unreadNotifsCount > 0 && (
                <span
                  className="notif-count-badge"
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    background: "#ef4444",
                    color: "#ffffff",
                    borderRadius: "50%",
                    width: "18px",
                    height: "18px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 0 2px #fff",
                  }}
                >
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div
                className="notif-dropdown card"
                style={{
                  position: "absolute",
                  right: 0,
                  top: "48px",
                  width: "320px",
                  maxHeight: "380px",
                  overflowY: "auto",
                  padding: "16px",
                  zIndex: 50,
                  boxShadow: "0 15px 35px rgba(0,0,0,0.15)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px" }}>
                  <strong style={{ fontSize: "0.95rem" }}>Notifications</strong>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{notifications.length} total</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {notifications.length === 0 ? (
                    <p style={{ margin: 0, padding: "16px", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
                      No notifications yet.
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id || n._id}
                        style={{
                          padding: "10px",
                          borderRadius: "8px",
                          background: n.isRead ? "#f8fafc" : "#eef2ff",
                          borderLeft: `3px solid ${n.isRead ? "#94a3b8" : "#4338ca"}`,
                        }}
                      >
                        <strong style={{ fontSize: "0.85rem", color: "#0f172a", display: "block" }}>{n.title}</strong>
                        <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#475569", lineHeight: "1.4" }}>
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* 1-Click Quick Demo Login Switcher */}
        <div className="demo-menu-wrapper" style={{ position: "relative" }}>
          <button
            onClick={() => setShowDemoSwitcher((prev) => !prev)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 13px",
              borderRadius: "10px",
              border: "1px solid #c7d2fe",
              background: "linear-gradient(135deg, #eef2ff 0%, #ede9fe 100%)",
              color: "#4338ca",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(67, 56, 202, 0.1)",
              transition: "all 0.2s ease",
            }}
          >
            <span>⚡ Demo Logins</span>
            <span style={{ fontSize: "0.7rem" }}>▼</span>
          </button>

          {showDemoSwitcher && (
            <div
              className="demo-switcher-dropdown card"
              style={{
                position: "absolute",
                right: 0,
                top: "44px",
                width: "280px",
                padding: "14px",
                zIndex: 60,
                boxShadow: "0 20px 40px rgba(15, 23, 42, 0.2)",
                borderRadius: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Switch Active Persona
                </span>
                <span style={{ fontSize: "0.7rem", color: "#10b981", fontWeight: 700 }}>Pass: Venbok@123</span>
              </div>

              {[
                { role: ROLES.ADMIN, label: "Campus & Super Admin", user: "Dr. Senthil Kumar", email: "admin@sece.ac.in", icon: "🛡️" },
                { role: ROLES.OWNER, label: "Commercial Venue Owner", user: "Rajesh Varma", email: "owner@demo.venbok.local", icon: "🏢" },
                { role: ROLES.CUSTOMER, label: "Event Planner / Customer", user: "Kavitha M", email: "customer@demo.venbok.local", icon: "✨" },
                { role: ROLES.FACULTY, label: "Faculty Coordinator", user: "Prof. Arunkumar", email: "faculty@sece.ac.in", icon: "🎓" },
                { role: ROLES.STUDENT, label: "Student / Club Lead", user: "Sakthikanth R", email: "student@sece.ac.in", icon: "🎒" },
              ].map((item) => (
                <button
                  key={item.role}
                  onClick={() => handleDemoSwitch(item.email, item.role)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #f1f5f9",
                    background: user?.email === item.email ? "#eef2ff" : "#ffffff",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = user?.email === item.email ? "#eef2ff" : "#ffffff")}
                >
                  <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: "0.84rem", color: "#0f172a", display: "block" }}>{item.label}</strong>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.user}</span>
                  </div>
                  {user?.email === item.email && (
                    <span style={{ color: "#4338ca", fontSize: "0.8rem", fontWeight: 700 }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Pill / Login */}
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              className="user-pill"
              onClick={() => navigate(roleHomePath(user.role))}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 10px 4px 4px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "24px",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                }}
              >
                {userInitial}
              </span>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>
                {user.name?.split(" ")[0]}
              </span>
            </div>

            <Button
              className="secondary"
              onClick={logout}
              style={{ padding: "6px 12px", fontSize: "0.82rem" }}
            >
              Logout
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => navigate(PATHS.LOGIN)}
            style={{
              padding: "7px 18px",
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              border: "none",
              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
              fontWeight: 600,
            }}
          >
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
};

export default TopNavbar;
