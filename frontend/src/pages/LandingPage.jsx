import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sparkles, Building2, Calendar, Scale, ArrowRight, ShieldCheck, Heart, Star, Check } from "lucide-react";
import { useData } from "../context/DataContext";
import { useBookingModal } from "../components/layout/DashboardLayout";
import { PATHS } from "../utils/routePaths";
import Button from "../components/common/Button";
import BRAND from "../config/branding";

const LandingPage = () => {
  const navigate = useNavigate();
  const { spaces, savedVenueIds, toggleSaveVenue, addToCompare, compareVenueIds } = useData();
  const { openBookingModal } = useBookingModal();
  const [searchPrompt, setSearchPrompt] = useState("");

  const handlePromptSearch = (event) => {
    event.preventDefault();
    if (!searchPrompt.trim()) {
      navigate(PATHS.SPACES);
      return;
    }
    navigate(`${PATHS.SPACES}?q=${encodeURIComponent(searchPrompt.trim())}`);
  };

  const featuredSpaces = spaces.slice(0, 6);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
      {/* ── 1. Hero Section ──────────────────────────────────────────────── */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "48px 16px 24px",
          position: "relative",
        }}
      >
        {/* Glow badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "5px 14px",
            borderRadius: "var(--radius-full)",
            backgroundColor: "rgba(99, 102, 241, 0.12)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            color: "var(--primary-light)",
            fontSize: "0.8rem",
            fontWeight: 700,
            marginBottom: "20px",
          }}
        >
          <Sparkles size={14} />
          <span>Intelligent Venue Discovery & Scheduling Platform</span>
        </div>

        <h1
          style={{
            fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.035em",
            lineHeight: 1.15,
            maxWidth: "840px",
            margin: "0 0 16px",
          }}
        >
          Discover Verified Spaces. <br />
          <span
            style={{
              background: "linear-gradient(135deg, #818cf8 0%, #06b6d4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Plan Confidently. Optimize Utilization.
          </span>
        </h1>

        <p
          style={{
            fontSize: "1.05rem",
            color: "var(--text-secondary)",
            maxWidth: "680px",
            lineHeight: 1.6,
            margin: "0 0 32px",
          }}
        >
          Whether organizing a national hackathon, academic symposium, executive board summit, or
          cultural convention — {BRAND.name} connects you with live availability, technical specs, and instant reservation.
        </p>

        {/* Global Search Bar */}
        <form
          onSubmit={handlePromptSearch}
          style={{
            width: "100%",
            maxWidth: "640px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "8px 12px 8px 18px",
            borderRadius: "var(--radius-xl)",
            backgroundColor: "var(--panel)",
            border: "1px solid var(--border-strong)",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(99, 102, 241, 0.12)",
          }}
        >
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search venue by name, keyword, capacity, or location..."
            value={searchPrompt}
            onChange={(e) => setSearchPrompt(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#fff",
              fontSize: "0.95rem",
              fontFamily: "inherit",
            }}
          />
          <Button type="submit" variant="primary">
            Explore Venues
          </Button>
        </form>

        {/* Quick Suggestion Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", justifyContent: "center", marginTop: "18px" }}>
          <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontWeight: 600 }}>Suggested:</span>
          {["Auditorium", "Seminar Hall", "Innovation Hub", "Conference Room", "Outdoor Lawn"].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => navigate(`${PATHS.SPACES}?q=${encodeURIComponent(tag)}`)}
              style={{
                background: "var(--panel-elevated)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-full)",
                color: "var(--text-secondary)",
                padding: "3px 10px",
                fontSize: "0.76rem",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--primary-light)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* ── 2. Live Platform Metrics Strip ── */}
      <div
        className="card"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          padding: "24px 32px",
          backgroundColor: "var(--panel-elevated)",
          textAlign: "center",
        }}
      >
        <div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", lineHeight: 1 }}>{spaces.length || 20}+</div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "4px" }}>Verified Venue Spaces</div>
        </div>
        <div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--primary-light)", lineHeight: 1 }}>48+</div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "4px" }}>Campus Productions Hosted</div>
        </div>
        <div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--success-text)", lineHeight: 1 }}>92%</div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "4px" }}>Capacity Utilization Rate</div>
        </div>
        <div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--warning-text)", lineHeight: 1 }}>4.8 ★</div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "4px" }}>Organizer Satisfaction Score</div>
        </div>
      </div>

      {/* ── 3. Featured Spaces Section ── */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px" }}>
          <div>
            <span style={{ fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--primary-light)", fontWeight: 700 }}>
              CURATED COLLECTION
            </span>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", margin: "4px 0 0" }}>
              Featured Campus & Corporate Venues
            </h2>
          </div>

          <Button variant="outline" size="sm" onClick={() => navigate(PATHS.SPACES)}>
            View All Venues <ArrowRight size={14} />
          </Button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {featuredSpaces.map((space) => {
            const isCompared = compareVenueIds.includes(String(space.id));

            return (
              <div
                key={space.id}
                className="card card-interactive"
                style={{
                  padding: 0,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                {/* Photo Header */}
                <div style={{ width: "100%", height: "170px", position: "relative", backgroundColor: "var(--panel-elevated)" }}>
                  {space.imageUrl ? (
                    <img
                      src={space.imageUrl}
                      alt={space.name}
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = "none";
                        if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                      }}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : null}
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: space.imageUrl ? "none" : "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(18, 24, 38, 0.95)",
                      color: "var(--text-muted)",
                      gap: "6px"
                    }}
                  >
                    <Building2 size={36} color="var(--primary-light)" opacity={0.5} />
                    <span style={{ fontSize: "0.72rem" }}>Venue image unavailable</span>
                  </div>

                  <div
                    style={{
                      position: "absolute",
                      top: "10px",
                      left: "10px",
                      padding: "3px 8px",
                      borderRadius: "var(--radius-full)",
                      backgroundColor: space.isVerified ? "rgba(16, 185, 129, 0.9)" : "rgba(11, 13, 16, 0.85)",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: space.isVerified ? "#ffffff" : "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    {space.isVerified ? "✓ Verified SECE Facility" : (space.isDemo ? "Demo Venue" : (space.verificationLevel || "Verified"))}
                  </div>

                  <div
                    style={{
                      position: "absolute",
                      bottom: "10px",
                      right: "10px",
                      padding: "4px 8px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "rgba(15, 23, 42, 0.85)",
                      backdropFilter: "blur(4px)",
                      color: "#38bdf8",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      border: "1px solid rgba(56, 189, 248, 0.3)",
                    }}
                  >
                    🏛️ Institutional
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff", margin: 0 }}>
                      {space.name}
                    </h4>
                    <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                      {space.type} • {space.capacity ? `${space.capacity} Pax` : "Capacity not published"}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    {space.description?.slice(0, 90)}...
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "4px" }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`${PATHS.SPACES}?venueId=${space.id}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => openBookingModal(space.id)}
                      icon={<Sparkles size={13} />}
                    >
                      Book Venue
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4. Intelligent Workflow Steps ── */}
      <div className="card" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--primary-light)", fontWeight: 700 }}>
            INTELLIGENT LIFECYCLE
          </span>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", margin: "4px 0 0" }}>
            How {BRAND.name} Streamlines Venue Management
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
          {[
            {
              step: "01",
              title: "AI Venue Matching",
              desc: "Natural language input parses your event requirements, technical AV specs, and attendance to deliver scored recommendations.",
            },
            {
              step: "02",
              title: "Side-by-Side Comparison",
              desc: "Evaluate technical specs, equipment buffers, acoustics, and layout suitability across campus venues.",
            },
            {
              step: "03",
              title: "Conflict-Free Reservation",
              desc: "Real-time calendar locking verifies room schedule and academic timetable overlaps to eliminate double bookings.",
            },
            {
              step: "04",
              title: "Optimization & Analytics",
              desc: "Track occupancy metrics, peak booking time windows, and seasonal demand through clean SaaS analytics.",
            },
          ].map((item) => (
            <div
              key={item.step}
              style={{
                padding: "20px",
                borderRadius: "var(--radius-lg)",
                backgroundColor: "var(--panel-elevated)",
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 900,
                  color: "var(--primary-light)",
                  fontFamily: "var(--font-heading)",
                }}
              >
                {item.step}
              </div>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff", margin: 0 }}>
                {item.title}
              </h4>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
