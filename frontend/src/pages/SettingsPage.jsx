import React, { useState } from "react";
import { User, Building2, Bell, Shield, Sliders, Check, Save } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import Tabs from "../components/common/Tabs";
import Button from "../components/common/Button";
import { useToast } from "../components/common/Toast";
import BRAND from "../config/branding";

const SETTINGS_TABS = [
  { id: "profile", label: "Profile" },
  { id: "organization", label: "Organization" },
  { id: "notifications", label: "Notifications" },
  { id: "security", label: "Security" },
  { id: "preferences", label: "Preferences" },
];

const SettingsPage = () => {
  const { user } = useAuth();
  const { organizations } = useData();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("profile");

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "Dr. S. Senthil Kumar",
    email: user?.email || "admin@sece.ac.in",
    phone: user?.phone || "+91 98421 00001",
    role: user?.role ? user.role.toUpperCase() : "ADMIN",
    roleDescription: user?.roleDescription || "Dean of Student Affairs & Venue Administrator",
  });

  // Notifications preferences
  const [notifPrefs, setNotifPrefs] = useState({
    emailOnApproval: true,
    emailOnNewBooking: true,
    weeklyUtilizationSummary: false,
    disputeAlerts: true,
  });

  // Security preferences
  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    toast.success("Profile preferences saved successfully.");
  };

  const handleSaveSecurity = (e) => {
    e.preventDefault();
    if (securityForm.newPassword && securityForm.newPassword !== securityForm.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    toast.success("Security credentials updated.");
    setSecurityForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ── Page Header ── */}
      <div>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>
          Platform Settings
        </h1>
        <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.92rem" }}>
          Configure account credentials, organizational profile, notifications, and security policies.
        </p>
      </div>

      {/* ── Tabs Navigation ── */}
      <Tabs
        tabs={SETTINGS_TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="underline"
      />

      {/* ── PROFILE TAB ── */}
      {activeTab === "profile" && (
        <div className="card" style={{ maxWidth: "700px" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: "16px" }}>
            Personal Profile & Credentials
          </h3>

          <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div className="input-field">
                <label className="input-label">Full Name</label>
                <input
                  type="text"
                  className="input"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                />
              </div>

              <div className="input-field">
                <label className="input-label">Email Address</label>
                <input
                  type="email"
                  className="input"
                  value={profileForm.email}
                  disabled
                  style={{ opacity: 0.7 }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div className="input-field">
                <label className="input-label">Phone Number</label>
                <input
                  type="tel"
                  className="input"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>

              <div className="input-field">
                <label className="input-label">Platform Role</label>
                <input
                  type="text"
                  className="input"
                  value={profileForm.role}
                  disabled
                  style={{ opacity: 0.7 }}
                />
              </div>
            </div>

            <div className="input-field">
              <label className="input-label">Role Description / Title</label>
              <input
                type="text"
                className="input"
                value={profileForm.roleDescription}
                onChange={(e) => setProfileForm({ ...profileForm, roleDescription: e.target.value })}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
              <Button type="submit" variant="primary" icon={<Save size={16} />}>
                Save Profile
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── ORGANIZATION TAB ── */}
      {activeTab === "organization" && (
        <div className="card" style={{ maxWidth: "700px" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: "16px" }}>
            Institutional & Campus Organization
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ padding: "16px", backgroundColor: "var(--panel-elevated)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.74rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>
                PRIMARY ENTITY
              </div>
              <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "#fff", marginTop: "2px" }}>
                {organizations[0]?.name || "Sri Eshwar College of Engineering"}
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "4px" }}>
                Code: {organizations[0]?.code || "SECE"} • Domain: {organizations[0]?.domain || "sece.ac.in"}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div className="input-field">
                <label className="input-label">Institution License & Access Policy</label>
                <input type="text" className="input" value="Enterprise License (Internal Campus Free)" disabled style={{ opacity: 0.8 }} />
              </div>

              <div className="input-field">
                <label className="input-label">Standard Timezone</label>
                <input type="text" className="input" value="Asia/Kolkata (IST +5:30)" disabled style={{ opacity: 0.8 }} />
              </div>
            </div>

            <div className="input-field">
              <label className="input-label">Campus Address</label>
              <textarea
                className="textarea"
                rows="2"
                readOnly
                value="Vadasithur Road, Kinathukadavu, Coimbatore, Tamil Nadu 641202"
                style={{ opacity: 0.8 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS TAB ── */}
      {activeTab === "notifications" && (
        <div className="card" style={{ maxWidth: "700px" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: "16px" }}>
            Notification Triggers & Delivery
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {[
              { key: "emailOnApproval", label: "Email notification upon booking approval or rejection", desc: "Receive immediate dispatch when request decision is executed" },
              { key: "emailOnNewBooking", label: "Real-time coordinator alerts for new reservation requests", desc: "Sent when an organizer submits a space booking" },
              { key: "weeklyUtilizationSummary", label: "Weekly campus venue utilization analytics digest", desc: "PDF report sent every Monday morning" },
              { key: "disputeAlerts", label: "Urgent facility maintenance or dispute escalations", desc: "High priority operational notifications" },
            ].map((item) => (
              <label
                key={item.key}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "14px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--panel-elevated)",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={notifPrefs[item.key]}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, [item.key]: e.target.checked })}
                  style={{ accentColor: "var(--primary)", marginTop: "3px" }}
                />
                <div>
                  <div style={{ fontWeight: 600, color: "var(--text)", fontSize: "0.88rem" }}>{item.label}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>{item.desc}</div>
                </div>
              </label>
            ))}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
              <Button variant="primary" onClick={() => toast.success("Notification preferences saved.")}>
                Save Preferences
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── SECURITY TAB ── */}
      {activeTab === "security" && (
        <div className="card" style={{ maxWidth: "700px" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: "16px" }}>
            Authentication & Security Credentials
          </h3>

          <form onSubmit={handleSaveSecurity} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="input-field">
              <label className="input-label">Current Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••••••"
                value={securityForm.currentPassword}
                onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div className="input-field">
                <label className="input-label">New Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Min 8 characters"
                  value={securityForm.newPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                />
              </div>

              <div className="input-field">
                <label className="input-label">Confirm New Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Repeat new password"
                  value={securityForm.confirmPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
              <Button type="submit" variant="primary" icon={<Shield size={16} />}>
                Update Password
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── PREFERENCES TAB ── */}
      {activeTab === "preferences" && (
        <div className="card" style={{ maxWidth: "700px" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: "16px" }}>
            Platform Theme & Interface Preferences
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ padding: "14px", backgroundColor: "var(--panel-elevated)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <div style={{ fontWeight: 600, color: "#fff", fontSize: "0.9rem" }}>Design System Theme</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Active: <strong>Premium Dark SaaS</strong> (Linear & Stripe Dashboard inspired)
              </div>
            </div>

            <div style={{ padding: "14px", backgroundColor: "var(--panel-elevated)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <div style={{ fontWeight: 600, color: "#fff", fontSize: "0.9rem" }}>Keyboard Shortcut Palette</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Press <strong>⌘K</strong> or <strong>Ctrl+K</strong> from anywhere to instantly open the global command palette.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
