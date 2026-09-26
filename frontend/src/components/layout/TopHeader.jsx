import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Search, Bell, Menu, User, Settings, LogOut, Check, Building2, HelpCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { PATHS } from "../../utils/routePaths";
import { roleHomePath, ROLE_LABELS, ROLES } from "../../utils/roles";
import BRAND from "../../config/branding";

const TopHeader = ({ onToggleSidebar, onOpenCommandPalette, onOpenBookingModal }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, login } = useAuth();
  const { notifications, unreadNotifsCount } = useData();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const userMenuRef = useRef(null);
  const notifMenuRef = useRef(null);
  const roleMenuRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setShowNotifMenu(false);
      }
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target)) {
        setShowRoleMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute breadcrumbs and page title based on current pathname
  const getPageInfo = () => {
    const path = location.pathname;
    if (path === PATHS.SPACES || path === PATHS.EXPLORE) return { section: "Discovery", title: "Discover Venues" };
    if (path === PATHS.COMPARE) return { section: "Discovery", title: "Venue Comparison" };
    if (path === PATHS.PLANNER) return { section: "Discovery", title: "AI Recommendations & Planner" };
    if (path === PATHS.BOOKINGS) return { section: "Operations", title: "My Bookings" };
    if (path === PATHS.CALENDAR) return { section: "Operations", title: "Master Calendar" };
    if (path === PATHS.BOOKING_REPORT) return { section: "Management", title: "Analytics & Reports" };
    if (path === PATHS.SETTINGS) return { section: "System", title: "Platform Settings" };
    if (path.includes("dashboard")) return { section: "Overview", title: "Dashboard" };
    return { section: "Overview", title: "Overview" };
  };

  const { section, title } = getPageInfo();

  // Demo accounts
  const demoAccounts = [
    { role: ROLES.ADMIN, label: "Super Admin", email: "admin@sece.ac.in" },
    { role: ROLES.OWNER, label: "Venue Owner", email: "owner@demo.venbok.local" },
    { role: ROLES.CUSTOMER, label: "Event Planner / Customer", email: "customer@demo.venbok.local" },
    { role: ROLES.FACULTY, label: "Faculty Coordinator", email: "faculty@sece.ac.in" },
    { role: ROLES.STUDENT, label: "Student Club Lead", email: "faculty@demo.venbok.local" },
  ];

  const handleRoleSwitch = async (acc) => {
    try {
      setShowRoleMenu(false);
      await login({ email: acc.email, password: "Venbok@123" });
      navigate(roleHomePath(acc.role));
    } catch (err) {
      console.error("Role switch error", err);
    }
  };

  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : "U";

  return (
    <header className="spacio-top-header">
      {/* Left: Mobile Toggle + Breadcrumbs */}
      <div className="spacio-header-left">
        <button
          className="spacio-mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="spacio-header-breadcrumbs">
          <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{BRAND.name}</span>
          <span>/</span>
          <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{section}</span>
          <span>/</span>
          <span className="spacio-breadcrumb-active" style={{ fontSize: "0.88rem" }}>{title}</span>
        </div>
      </div>

      {/* Right: Search, Notifications, Role Switcher, Profile */}
      <div className="spacio-header-right">
        {/* Global Search box triggering Command Palette */}
        <div
          className="spacio-search-trigger"
          onClick={onOpenCommandPalette}
          role="button"
          tabIndex={0}
        >
          <Search size={15} color="var(--text-muted)" />
          <span>Search venues, bookings, events...</span>
          <span className="spacio-kbd-shortcut">
            {navigator.platform.toUpperCase().indexOf("MAC") >= 0 ? "⌘K" : "Ctrl K"}
          </span>
        </div>

        {/* Demo Role Switcher Badge */}
        <div style={{ position: "relative" }} ref={roleMenuRef}>
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 10px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--panel)",
              border: "1px solid var(--border)",
              color: "var(--primary-light)",
              fontSize: "0.76rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <span>{user?.role ? user.role.toUpperCase() : "GUEST"}</span>
            <span style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}>▼</span>
          </button>

          {showRoleMenu && (
            <div className="spacio-dropdown-menu" style={{ width: "230px" }}>
              <div style={{ padding: "8px 12px 6px", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Switch Demo Persona
              </div>
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  className="spacio-dropdown-item"
                  onClick={() => handleRoleSwitch(acc)}
                  style={{
                    color: user?.role === acc.role ? "var(--primary-light)" : "var(--text)",
                    fontWeight: user?.role === acc.role ? 700 : 500,
                  }}
                >
                  <span style={{ flex: 1 }}>{acc.label}</span>
                  {user?.role === acc.role && <Check size={14} color="var(--primary)" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Icon with Unread Dropdown */}
        <div style={{ position: "relative" }} ref={notifMenuRef}>
          <button
            className="spacio-header-icon-btn"
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            aria-label="View notifications"
          >
            <Bell size={17} />
            {unreadNotifsCount > 0 && <span className="spacio-notif-dot" />}
          </button>

          {showNotifMenu && (
            <div className="spacio-dropdown-menu" style={{ width: "320px", right: 0 }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem" }}>Notifications</span>
                <span style={{ fontSize: "0.72rem", color: "var(--primary-light)", fontWeight: 600 }}>
                  {unreadNotifsCount} New
                </span>
              </div>

              <div style={{ maxHeight: "280px", overflowY: "auto", padding: "6px" }}>
                {notifications && notifications.length > 0 ? (
                  notifications.slice(0, 5).map((n, i) => (
                    <div
                      key={n._id || i}
                      style={{
                        padding: "8px 10px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.82rem",
                        color: "var(--text-secondary)",
                        borderBottom: "1px solid var(--border-subtle)",
                      }}
                    >
                      <div style={{ fontWeight: 600, color: "var(--text)" }}>{n.title || "Booking Update"}</div>
                      <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        {n.message || "Your venue request has been processed."}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                    No pending notifications.
                  </div>
                )}
              </div>

              <div style={{ padding: "8px", borderTop: "1px solid var(--border)", textAlign: "center" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifMenu(false);
                    navigate(PATHS.BOOKINGS);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--primary-light)",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  View All Activity
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar with Profile Dropdown */}
        <div style={{ position: "relative" }} ref={userMenuRef}>
          <div
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "var(--radius-md)",
              background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.4)",
            }}
          >
            {userInitial}
          </div>

          {showUserMenu && (
            <div className="spacio-dropdown-menu" style={{ width: "220px", right: 0 }}>
              <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 700, color: "var(--text)", fontSize: "0.88rem" }}>
                  {user?.name || "Guest User"}
                </div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                  {user?.email || "guest@spacio.local"}
                </div>
              </div>

              <button
                className="spacio-dropdown-item"
                onClick={() => {
                  setShowUserMenu(false);
                  navigate(PATHS.SETTINGS);
                }}
              >
                <User size={15} /> <span>Profile & Account</span>
              </button>

              <button
                className="spacio-dropdown-item"
                onClick={() => {
                  setShowUserMenu(false);
                  navigate(PATHS.SETTINGS);
                }}
              >
                <Settings size={15} /> <span>Settings</span>
              </button>

              <div className="spacio-dropdown-divider" />

              {user ? (
                <button
                  className="spacio-dropdown-item"
                  style={{ color: "var(--danger-text)" }}
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                    navigate(PATHS.LOGIN);
                  }}
                >
                  <LogOut size={15} /> <span>Log out</span>
                </button>
              ) : (
                <button
                  className="spacio-dropdown-item"
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate(PATHS.LOGIN);
                  }}
                >
                  <User size={15} /> <span>Sign In</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
