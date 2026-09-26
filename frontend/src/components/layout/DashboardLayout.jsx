import React, { useState, useEffect, createContext, useContext } from "react";
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";
import CommandPalette from "../common/CommandPalette";
import MultiStepBookingModal from "../booking/MultiStepBookingModal";
import Drawer from "../common/Drawer";
import { useData } from "../../context/DataContext";
import { ToastProvider } from "../common/Toast";

export const BookingModalContext = createContext({
  openBookingModal: () => {},
});

export const useBookingModal = () => useContext(BookingModalContext);

const DashboardLayout = ({ children }) => {
  const { notifications, unreadNotifsCount } = useData();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("spacio_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [bookingModalState, setBookingModalState] = useState({
    isOpen: false,
    initialSpaceId: null,
    initialData: null,
  });
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);

  // Global ⌘K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("spacio_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const openBookingModal = (spaceId = null, initialData = null) => {
    setBookingModalState({
      isOpen: true,
      initialSpaceId: spaceId,
      initialData: initialData,
    });
  };

  const closeBookingModal = () => {
    setBookingModalState({
      isOpen: false,
      initialSpaceId: null,
      initialData: null,
    });
  };

  return (
    <ToastProvider>
      <BookingModalContext.Provider value={{ openBookingModal }}>
        <div className="spacio-shell">
          {/* Collapsible SaaS Sidebar */}
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebarCollapse}
            mobileOpen={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
            onOpenNotifications={() => setNotifDrawerOpen(true)}
          />

          {/* Main Layout Area */}
          <div
            className={`spacio-main-wrapper ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
          >
            {/* Top Navigation Header */}
            <TopHeader
              onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)}
              onOpenCommandPalette={() => setCommandPaletteOpen(true)}
              onOpenBookingModal={() => openBookingModal()}
            />

            {/* Viewport Content */}
            <main className="spacio-content">{children}</main>
          </div>

          {/* Global Keyboard Command Palette */}
          <CommandPalette
            isOpen={commandPaletteOpen}
            onClose={() => setCommandPaletteOpen(false)}
            onOpenBookingModal={() => openBookingModal()}
          />

          {/* Global 5-Step Multi-Step Booking Modal */}
          <MultiStepBookingModal
            isOpen={bookingModalState.isOpen}
            initialSpaceId={bookingModalState.initialSpaceId}
            initialData={bookingModalState.initialData}
            onClose={closeBookingModal}
          />

          {/* Notifications Side Drawer */}
          <Drawer
            isOpen={notifDrawerOpen}
            onClose={() => setNotifDrawerOpen(false)}
            title="System & Booking Activity"
            subtitle={`${unreadNotifsCount} pending notices`}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {notifications && notifications.length > 0 ? (
                notifications.map((item, idx) => (
                  <div
                    key={item._id || idx}
                    style={{
                      padding: "14px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--panel-elevated)",
                      border: "1px solid var(--border)",
                      fontSize: "0.85rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 700, color: "#fff" }}>
                        {item.title || "Reservation Notice"}
                      </span>
                      <span style={{ fontSize: "0.74rem", color: "var(--primary-light)", fontWeight: 600 }}>
                        {item.type || "Update"}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.82rem", lineHeight: 1.5 }}>
                      {item.message || "Your booking has been reviewed."}
                    </p>
                  </div>
                ))
              ) : (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                  No recent notifications found.
                </div>
              )}
            </div>
          </Drawer>
        </div>
      </BookingModalContext.Provider>
    </ToastProvider>
  );
};

export default DashboardLayout;
