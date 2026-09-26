import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Scale,
  Sparkles,
  Calendar,
  Layers,
  Settings,
  Bell,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  CalendarCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { PATHS } from "../../utils/routePaths";
import { roleHomePath, ROLES } from "../../utils/roles";
import BRAND from "../../config/branding";

const Sidebar = ({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
  onOpenNotifications,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { compareVenueIds, unreadNotifsCount } = useData();

  const dashboardTarget = user ? roleHomePath(user.role) : PATHS.CUSTOMER_DASHBOARD;

  const handleNavClick = () => {
    if (onCloseMobile) onCloseMobile();
  };

  const navGroups = [
    {
      title: "OVERVIEW",
      items: [
        {
          label: "Dashboard",
          path: dashboardTarget,
          icon: <LayoutDashboard size={18} />,
          exact: true,
        },
      ],
    },
    {
      title: "DISCOVERY",
      items: [
        {
          label: "Discover Venues",
          path: PATHS.SPACES,
          icon: <Building2 size={18} />,
        },
        {
          label: "Venue Comparison",
          path: PATHS.COMPARE,
          icon: <Scale size={18} />,
          badge: compareVenueIds.length > 0 ? compareVenueIds.length : null,
        },
        {
          label: "AI Recommendations",
          path: PATHS.PLANNER,
          icon: <Sparkles size={18} />,
        },
      ],
    },
    {
      title: "OPERATIONS",
      items: [
        {
          label: "My Bookings",
          path: PATHS.BOOKINGS,
          icon: <CalendarCheck size={18} />,
        },
        {
          label: "Calendar",
          path: PATHS.CALENDAR,
          icon: <Calendar size={18} />,
        },
      ],
    },
    {
      title: "MANAGEMENT",
      // Expose management routes for admins, owners, coordinators
      items: [
        {
          label: "Spaces",
          path: PATHS.SPACES,
          icon: <Layers size={18} />,
        },
        {
          label: "Availability",
          path: PATHS.CALENDAR,
          icon: <Calendar size={18} />,
        },
        {
          label: "Analytics",
          path: PATHS.BOOKING_REPORT,
          icon: <BarChart3 size={18} />,
        },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        {
          label: "Notifications",
          path: PATHS.NOTIFICATIONS,
          icon: <Bell size={18} />,
          badge: unreadNotifsCount > 0 ? unreadNotifsCount : null,
          isAction: true,
          action: () => {
            if (onOpenNotifications) onOpenNotifications();
          },
        },
        {
          label: "Settings",
          path: PATHS.SETTINGS,
          icon: <Settings size={18} />,
        },
      ],
    },
  ];

  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : "U";

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(5, 6, 8, 0.7)",
            backdropFilter: "blur(6px)",
            zIndex: 99,
          }}
        />
      )}

      <aside
        className={`spacio-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
      >
        {/* Top Header: Logo + Brand + Collapse button */}
        <div className="spacio-sidebar-header">
          <div
            className="spacio-brand"
            onClick={() => {
              navigate(PATHS.HOME);
              handleNavClick();
            }}
          >
            <div className="spacio-brand-badge">{BRAND.shortBadge}</div>
            {!collapsed && (
              <div className="spacio-brand-info">
                <span className="spacio-brand-title">{BRAND.name}</span>
                <span className="spacio-brand-tagline">{BRAND.tagline}</span>
              </div>
            )}
          </div>

          <button
            className="spacio-collapse-toggle"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Sidebar Navigation Groups */}
        <div className="spacio-sidebar-nav">
          {navGroups.map((group) => (
            <div key={group.title} className="spacio-nav-group">
              {!collapsed && <div className="spacio-nav-group-title">{group.title}</div>}

              {group.items.map((item) => {
                const isActive = location.pathname === item.path;

                if (item.isAction) {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={`spacio-nav-item ${isActive ? "active" : ""}`}
                      onClick={() => {
                        item.action();
                        handleNavClick();
                      }}
                      style={{ background: "transparent", border: "none", width: "100%", cursor: "pointer", textAlign: "left" }}
                    >
                      <span className="spacio-nav-icon">{item.icon}</span>
                      {!collapsed && <span className="spacio-nav-label">{item.label}</span>}
                      {!collapsed && item.badge !== null && item.badge !== undefined && (
                        <span className="spacio-nav-badge active-badge">{item.badge}</span>
                      )}
                    </button>
                  );
                }

                return (
                  <NavLink
                    key={item.label}
                    to={item.path}
                    className={({ isActive: navActive }) =>
                      `spacio-nav-item ${navActive ? "active" : ""}`
                    }
                    onClick={handleNavClick}
                  >
                    <span className="spacio-nav-icon">{item.icon}</span>
                    {!collapsed && <span className="spacio-nav-label">{item.label}</span>}
                    {!collapsed && item.badge !== null && item.badge !== undefined && (
                      <span className="spacio-nav-badge active-badge">{item.badge}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom User Profile Section */}
        <div className="spacio-sidebar-footer">
          <div
            className="spacio-user-card"
            onClick={() => {
              navigate(PATHS.SETTINGS);
              handleNavClick();
            }}
          >
            <div className="spacio-user-avatar">{userInitial}</div>

            {!collapsed && (
              <div className="spacio-user-details">
                <span className="spacio-user-name">{user?.name || "Guest Planner"}</span>
                <span className="spacio-user-role">
                  {user?.role ? user.role.toUpperCase() : "VISITOR"}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
