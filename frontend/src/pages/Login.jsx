import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Sparkles, Shield, User, Building2, GraduationCap, Check, ArrowRight } from "lucide-react";
import Button from "../components/common/Button";
import { useAuth } from "../context/AuthContext";
import { ROLES, roleHomePath } from "../utils/roles";
import BRAND from "../config/branding";

const Login = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(ROLES.ADMIN);
  const [phone, setPhone] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setError("");
      setLoading(true);

      if (mode === "register" && (role === ROLES.FACULTY || role === ROLES.STUDENT) && !email.endsWith("@sece.ac.in")) {
        setError("Institutional faculty/student registrations require an email ending with @sece.ac.in");
        setLoading(false);
        return;
      }

      let user = null;
      if (mode === "register") {
        const result = await register({
          name: name || "Platform User",
          email,
          password,
          role,
          phone,
          roleDescription,
        });

        user = result?.user || null;
        if (!user) {
          throw new Error(result?.message || "Registration failed. Please try again.");
        }
      } else {
        user = await login({ email, password });
      }

      navigate(roleHomePath(user?.role || role));
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Authentication failed. Please verify credentials.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail, demoRole) => {
    try {
      setError("");
      setLoading(true);
      setEmail(demoEmail);
      setPassword("Venbok@123");
      const user = await login({ email: demoEmail, password: "Venbok@123" });
      navigate(roleHomePath(user?.role || demoRole));
    } catch (err) {
      setError("Demo authentication failed. Ensure backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background radial glow */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.04) 50%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "460px",
          backgroundColor: "var(--panel)",
          border: "1px solid var(--border-strong)",
          borderRadius: "var(--radius-xl)",
          padding: "36px 32px",
          boxShadow: "var(--shadow-lg), 0 0 50px rgba(0, 0, 0, 0.8)",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "26px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "var(--radius-md)",
                background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
                color: "#fff",
                fontWeight: 800,
                fontSize: "1.1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 16px rgba(99, 102, 241, 0.4)",
              }}
            >
              {BRAND.shortBadge}
            </div>
            <span style={{ fontSize: "1.45rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#ffffff" }}>
              {BRAND.name}
            </span>
          </div>

          <h3 style={{ margin: "0 0 6px", fontSize: "1.2rem", color: "#ffffff", fontWeight: 700 }}>
            {mode === "register" ? "Create Account" : "Welcome Back"}
          </h3>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.84rem" }}>
            {BRAND.tagline}
          </p>
        </div>

        {/* 1-Click Quick Demo Login Section */}
        {mode === "login" && (
          <div
            style={{
              backgroundColor: "var(--panel-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "14px",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--primary-light)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                ⚡ 1-Click Demo Login:
              </span>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Pass: Venbok@123</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              {[
                { role: ROLES.ADMIN, label: "Super Admin", email: "admin@sece.ac.in", icon: <Shield size={12} /> },
                { role: ROLES.OWNER, label: "Venue Owner", email: "owner@demo.venbok.local", icon: <Building2 size={12} /> },
                { role: ROLES.CUSTOMER, label: "Event Planner", email: "customer@demo.venbok.local", icon: <User size={12} /> },
                { role: ROLES.FACULTY, label: "Faculty Lead", email: "faculty@sece.ac.in", icon: <GraduationCap size={12} /> },
              ].map((persona) => (
                <button
                  key={persona.role}
                  type="button"
                  onClick={() => handleQuickDemo(persona.email, persona.role)}
                  style={{
                    padding: "7px 10px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--panel)",
                    fontSize: "0.76rem",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary-light)";
                    e.currentTarget.style.color = "#fff";
                    e.currentTarget.style.backgroundColor = "var(--panel-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                    e.currentTarget.style.backgroundColor = "var(--panel)";
                  }}
                >
                  {persona.icon}
                  <span>{persona.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "var(--danger-bg)",
              border: "1px solid var(--danger-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--danger-text)",
              fontSize: "0.82rem",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {mode === "register" && (
            <div className="input-field">
              <label className="input-label">Full Name</label>
              <input
                type="text"
                className="input"
                required
                placeholder="e.g. Dr. Rajesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="input-field">
            <label className="input-label">Email Address</label>
            <input
              type="email"
              className="input"
              required
              placeholder="name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-field">
            <label className="input-label">Password</label>
            <input
              type="password"
              className="input"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {mode === "register" && (
            <div className="input-field">
              <label className="input-label">Select Role</label>
              <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value={ROLES.CUSTOMER}>Customer / Event Planner</option>
                <option value={ROLES.FACULTY}>Faculty Coordinator (@sece.ac.in)</option>
                <option value={ROLES.STUDENT}>Student Club Lead (@sece.ac.in)</option>
                <option value={ROLES.OWNER}>Venue Owner / Manager</option>
                <option value={ROLES.ADMIN}>Campus & Super Admin</option>
              </select>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            size="lg"
            style={{ width: "100%", marginTop: "6px" }}
          >
            {mode === "login" ? "Sign In to Platform" : "Create Account"}
          </Button>

          {/* Toggle Login/Register */}
          <div style={{ textAlign: "center", marginTop: "12px", fontSize: "0.82rem", color: "var(--text-muted)" }}>
            {mode === "login" ? (
              <span>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setError("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary-light)",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Register here
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary-light)",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Sign in
                </button>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
