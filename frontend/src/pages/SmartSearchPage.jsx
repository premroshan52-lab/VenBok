import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { PATHS } from "../utils/routePaths";
import Button from "../components/common/Button";
import api from "../services/api";

const ALL_FACILITIES = [
  "Air Conditioning",
  "Projector",
  "Sound System",
  "Stage",
  "WiFi",
  "Power Backup",
  "Parking",
  "Video Conferencing",
  "Computer Systems",
  "Green Rooms",
];

const SmartSearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { spaces, toggleSaveVenue, savedVenueIds, addToCompare, compareVenueIds, addBooking } = useData();

  // Query parameters from URL
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get("q") || "";
  const initialVenueId = queryParams.get("venueId") || "";

  // State
  const [naturalQuery, setNaturalQuery] = useState(initialQuery);
  const [parsedCriteria, setParsedCriteria] = useState(null);
  const [capacityFilter, setCapacityFilter] = useState(50);
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [selectedType, setSelectedType] = useState("All");
  const [sortBy, setSortBy] = useState("match");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'map'
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [bookingModalVenue, setBookingModalVenue] = useState(null);

  // Booking Modal Form State
  const [bookingForm, setBookingForm] = useState({
    title: "",
    type: "Seminar",
    date: new Date().toISOString().split("T")[0],
    start: "09:00",
    end: "13:00",
    participants: 100,
    organizedBy: "",
    notes: "",
    catering: false,
    soundSystem: false,
    stageSetup: false,
  });
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse natural query on enter or load
  const runNaturalQueryParse = async (text) => {
    if (!text || !text.trim()) {
      setParsedCriteria(null);
      return;
    }
    try {
      const response = await api.post("/intelligence/parse-query", { query: text });
      const parsed = response?.data?.data?.parsed;
      if (parsed) {
        setParsedCriteria(parsed);
        if (parsed.capacity) setCapacityFilter(parsed.capacity);
        if (parsed.facilities && parsed.facilities.length) setSelectedFacilities(parsed.facilities);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    if (initialQuery) {
      runNaturalQueryParse(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    if (initialVenueId && spaces.length) {
      const match = spaces.find((s) => String(s.id) === String(initialVenueId));
      if (match) setSelectedVenue(match);
    }
  }, [initialVenueId, spaces]);

  const handleFacilityToggle = (facility) => {
    setSelectedFacilities((prev) =>
      prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
    );
  };

  // Calculate intelligent score for each space
  const scoredSpaces = useMemo(() => {
    return spaces.map((space) => {
      // 1. Capacity Score
      let capScore = 85;
      if (space.capacity !== null && space.capacity !== undefined) {
        if (space.capacity < capacityFilter) {
          capScore = Math.max(20, Math.round((space.capacity / capacityFilter) * 80));
        } else if (space.capacity > capacityFilter * 2) {
          capScore = 75;
        } else {
          capScore = 100;
        }
      }

      // 2. Facilities Score
      let facScore = 100;
      if (selectedFacilities.length > 0) {
        const count = selectedFacilities.filter((f) =>
          (space.facilities || []).some((sf) => sf.toLowerCase().includes(f.toLowerCase()))
        ).length;
        facScore = Math.round((count / selectedFacilities.length) * 100);
      }

      // 3. Rating Score
      const ratScore = Math.round(((space.rating || 4.5) / 5) * 100);

      // Total Weighted Match
      let overallMatch = Math.round(capScore * 0.55 + facScore * 0.3 + ratScore * 0.15);
      if (space.isVerified) {
        overallMatch = Math.min(100, overallMatch + 4);
      }

      return {
        ...space,
        matchScore: overallMatch,
        breakdown: {
          capacity: capScore,
          facilities: facScore,
          rating: ratScore,
        },
      };
    });
  }, [spaces, capacityFilter, selectedFacilities]);

  // Filter & Sort
  const filteredSpaces = useMemo(() => {
    return scoredSpaces
      .filter((s) => {
        if (selectedType !== "All" && s.type !== selectedType) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "match") return b.matchScore - a.matchScore;
        if (sortBy === "capacity") return (b.capacity || 0) - (a.capacity || 0);
        if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
        return 0;
      });
  }, [scoredSpaces, selectedType, sortBy]);

  const handleOpenBooking = (space) => {
    setBookingModalVenue(space);
    setBookingForm((prev) => ({
      ...prev,
      participants: space.capacity ? Math.min(space.capacity, 150) : 100,
    }));
    setBookingError("");
    setBookingSuccess(false);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate(PATHS.LOGIN);
      return;
    }
    setBookingError("");
    setIsSubmitting(true);

    try {
      await addBooking({
        title: bookingForm.title || `${bookingModalVenue.name} Reservation`,
        type: bookingForm.type,
        spaceId: bookingModalVenue.id,
        date: bookingForm.date,
        start: bookingForm.start,
        end: bookingForm.end,
        participants: Number(bookingForm.participants),
        organizedBy: bookingForm.organizedBy || user.name,
        notes: bookingForm.notes,
        requestedBy: user.name,
        requestedRole: user.role,
        requirements: {
          catering: bookingForm.catering,
          soundSystem: bookingForm.soundSystem,
          stageSetup: bookingForm.stageSetup,
        },
      });

      setBookingSuccess(true);
      setTimeout(() => {
        setBookingModalVenue(null);
        navigate(PATHS.BOOKINGS);
      }, 1400);
    } catch (err) {
      setBookingError(err.message || "Failed to submit booking request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="search-explore-page">
      {/* ── Top Smart Search Bar ─────────────────────────────────────────── */}
      <div className="search-top-header card">
        <div className="search-title-row">
          <div>
            <h2>Intelligent Venue Discovery & Recommendation</h2>
            <p className="muted">
              Enter natural event descriptions or filter specifications to calculate real-time match scores.
            </p>
          </div>

          <div className="view-toggle-btns">
            <button
              className={`view-mode-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              🏢 Grid View
            </button>
            <button
              className={`view-mode-btn ${viewMode === "map" ? "active" : ""}`}
              onClick={() => setViewMode("map")}
            >
              📍 Interactive Map
            </button>
          </div>
        </div>

        <form
          className="nlp-search-form"
          onSubmit={(e) => {
            e.preventDefault();
            runNaturalQueryParse(naturalQuery);
          }}
        >
          <div className="nlp-input-wrap">
            <span className="nlp-badge">AI PARSER</span>
            <input
              type="text"
              className="nlp-input"
              placeholder="e.g., 'Need a 250 person hall for a symposium with AC and stage'..."
              value={naturalQuery}
              onChange={(e) => setNaturalQuery(e.target.value)}
            />
          </div>
          <Button type="submit">Match Venues</Button>
        </form>

        {parsedCriteria && (
          <div className="nlp-parsed-chip-row">
            <span className="chip-label">Understood Intent:</span>
            <span className="parsed-chip">👥 Capacity: {parsedCriteria.capacity}+</span>
            <span className="parsed-chip">🎯 Event: {parsedCriteria.eventType}</span>
            {(parsedCriteria.facilities || []).map((f) => (
              <span key={f} className="parsed-chip active">
                ✓ {f}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="search-body-layout">
        {/* ── Left Filter Sidebar ──────────────────────────────────────── */}
        <aside className="search-filters-sidebar card">
          <div className="filter-header-row">
            <h4>Filters</h4>
            <button
              className="clear-link-btn"
              onClick={() => {
                setCapacityFilter(50);
                setSelectedFacilities([]);
                setSelectedType("All");
                setParsedCriteria(null);
                setNaturalQuery("");
              }}
            >
              Reset All
            </button>
          </div>

          {/* Venue Type */}
          <div className="filter-group">
            <label className="filter-label">Venue Category</label>
            <select
              className="filter-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="All">All Categories ({spaces.length})</option>
              <option value="Auditorium">Auditorium</option>
              <option value="Seminar Hall">Seminar Hall</option>
              <option value="Laboratory">Laboratory</option>
              <option value="Meeting Room">Meeting Room</option>
              <option value="Outdoor">Outdoor Amphitheatre</option>
              <option value="Sports">Sports Arena</option>
              <option value="Event Hall">Cultural / Event Hall</option>
              <option value="Training Room">Training Suite</option>
              <option value="Innovation Space">Innovation Hub</option>
            </select>
          </div>

          {/* Minimum Capacity Slider */}
          <div className="filter-group">
            <div className="slider-label-row">
              <label className="filter-label">Min Capacity</label>
              <span className="slider-val">{capacityFilter} Pax</span>
            </div>
            <input
              type="range"
              min="20"
              max="800"
              step="20"
              value={capacityFilter}
              onChange={(e) => setCapacityFilter(Number(e.target.value))}
              className="filter-slider"
            />
          </div>

          {/* Required Facilities Checkboxes */}
          <div className="filter-group">
            <label className="filter-label">Required Amenities</label>
            <div className="facilities-check-grid">
              {ALL_FACILITIES.map((f) => {
                const checked = selectedFacilities.includes(f);
                return (
                  <label key={f} className={`check-pill ${checked ? "checked" : ""}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleFacilityToggle(f)}
                      style={{ display: "none" }}
                    />
                    {checked ? "✓ " : "+ "} {f}
                  </label>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ── Main Results View ─────────────────────────────────────────── */}
        <main className="search-results-area">
          {/* Sorting Bar */}
          <div className="sort-bar-row">
            <span className="results-count-text">
              Showing <strong>{filteredSpaces.length}</strong> venues matching your criteria
            </span>

            <div className="sort-select-wrap">
              <span className="muted" style={{ fontSize: "13px" }}>Sort By:</span>
              <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="match">Match Score (Highest First)</option>
                <option value="capacity">Capacity (Largest First)</option>
                <option value="rating">Customer Rating</option>
              </select>
            </div>
          </div>

          {/* Mode 1: Interactive Map View */}
          {viewMode === "map" ? (
            <div className="map-view-shell card">
              <div className="map-canvas-container">
                <svg className="campus-map-svg" viewBox="0 0 900 500">
                  {/* Campus Layout Background Representation */}
                  <rect width="900" height="500" fill="#0f172a" rx="12" />
                  <path d="M 50 250 Q 450 150 850 250" stroke="#334155" strokeWidth="18" fill="none" />
                  <path d="M 450 50 L 450 450" stroke="#334155" strokeWidth="14" fill="none" />

                  {/* Campus Zone Circles */}
                  <circle cx="200" cy="180" r="90" fill="#1e293b" opacity="0.6" />
                  <text x="140" y="180" fill="#64748b" fontSize="13" fontWeight="bold">Academic Quad</text>

                  <circle cx="700" cy="200" r="110" fill="#1e293b" opacity="0.6" />
                  <text x="640" y="200" fill="#64748b" fontSize="13" fontWeight="bold">Tech Park & Labs</text>

                  <circle cx="450" cy="360" r="80" fill="#1e293b" opacity="0.6" />
                  <text x="390" y="360" fill="#64748b" fontSize="13" fontWeight="bold">Sports & Activity</text>

                  {/* Dynamic Venue Pins */}
                  {filteredSpaces.map((space, index) => {
                    // Spread coordinates across map canvas
                    const cx = 120 + ((index * 83) % 680);
                    const cy = 90 + ((index * 61) % 320);
                    const isSelected = selectedVenue?.id === space.id;

                    return (
                      <g
                        key={space.id}
                        className={`map-marker ${isSelected ? "selected" : ""}`}
                        onClick={() => setSelectedVenue(space)}
                        style={{ cursor: "pointer" }}
                      >
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isSelected ? 18 : 12}
                          fill={isSelected ? "#22c55e" : "#0284c7"}
                          stroke="#ffffff"
                          strokeWidth={isSelected ? 3 : 2}
                        />
                        <text
                          x={cx}
                          y={cy + 4}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="10"
                          fontWeight="bold"
                        >
                          {index + 1}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Map Selected Venue Floating Card */}
              {selectedVenue && (
                <div className="map-floating-preview card">
                  <div className="preview-header">
                    <img src={selectedVenue.imageUrl} alt={selectedVenue.name} className="preview-thumb" />
                    <div>
                      <h5>{selectedVenue.name}</h5>
                      <p className="muted" style={{ margin: "2px 0", fontSize: "12px" }}>
                        📍 {selectedVenue.address}
                      </p>
                      <span className="institutional-tag" style={{ color: "#38bdf8", fontSize: "0.82rem", fontWeight: 600 }}>
                        Free Institutional Booking
                      </span>
                    </div>
                  </div>
                  <div className="preview-btns">
                    <Button onClick={() => handleOpenBooking(selectedVenue)} style={{ flex: 1, padding: "8px" }}>
                      Book This Space
                    </Button>
                    <Button
                      className="secondary"
                      onClick={() => navigate(`${PATHS.CALENDAR}?spaceId=${selectedVenue.id}`)}
                      style={{ padding: "8px" }}
                    >
                      Calendar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Mode 2: Grid View */
            <div className="venues-grid-layout">
              {filteredSpaces.map((space) => {
                const isSaved = savedVenueIds.includes(String(space.id));
                const isCompared = compareVenueIds.includes(String(space.id));

                return (
                  <article key={space.id} className="card venue-result-card">
                    <div className="result-img-wrap">
                      <img src={space.imageUrl} alt={space.name} className="result-img" />
                      <span className="result-type-tag">{space.type}</span>
                      <button
                        className={`venue-heart-btn ${isSaved ? "active" : ""}`}
                        onClick={() => toggleSaveVenue(space.id)}
                      >
                        {isSaved ? "❤️" : "🤍"}
                      </button>

                      {/* Smart Match Meter */}
                      <div
                        className="match-score-badge"
                        title={`Match Breakdown: Capacity ${space.breakdown?.capacity}%, Facilities ${space.breakdown?.facilities}%, Quality & Specs ${space.breakdown?.rating}%`}
                      >
                        <span className="match-num">{space.matchScore}%</span>
                        <span className="match-label">Match</span>
                      </div>
                    </div>

                    <div className="result-card-body">
                      <div className="result-header-row">
                        <div>
                          <h4 className="result-title">{space.name}</h4>
                          <p className="result-location">📍 {space.address || "Main Campus Quad"}</p>
                        </div>
                        <span className="rating-pill">★ {space.rating || 4.8}</span>
                      </div>

                      {/* Match Explanation Pill */}
                      <div className="match-rationale-box">
                        <span className="sparkle-icon">✨</span>
                        <p>
                          {space.matchScore >= 90
                            ? `Exceptional match for ${capacityFilter}+ attendees with key AV & comfort amenities.`
                            : space.capacity
                            ? `Recommended: Capacity (${space.capacity} pax) aligns well with your requested specifications.`
                            : "Recommended: Flexible facility with verified institutional amenities."}
                        </p>
                      </div>

                      {/* Facilities list */}
                      <div className="result-facilities">
                        {(space.facilities || []).slice(0, 4).map((f) => (
                          <span key={f} className="facility-pill small">
                            {f}
                          </span>
                        ))}
                      </div>

                      {/* Bottom Access & Actions */}
                      <div className="result-bottom-bar">
                        <div>
                          <span className="institutional-tag" style={{ color: "var(--accent-teal)", fontWeight: 600 }}>Institutional Access</span>
                          <div className="daily-tag">Free Campus Reservation</div>
                        </div>

                        <div className="result-actions">
                          <button
                            className={`compare-btn-pill ${isCompared ? "active" : ""}`}
                            onClick={() => addToCompare(space.id)}
                          >
                            {isCompared ? "✓ Compared" : "+ Compare"}
                          </button>
                          <Button onClick={() => handleOpenBooking(space)} style={{ padding: "8px 16px" }}>
                            Book Space
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* ── Booking & Conflict Reservation Modal ─────────────────────────── */}
      {bookingModalVenue && (
        <div className="modal-backdrop">
          <div className="modal-shell card">
            <div className="modal-header">
              <div>
                <h3>Request Reservation: {bookingModalVenue.name}</h3>
                <p className="muted" style={{ margin: 0, fontSize: "13px" }}>
                  Max Capacity: {bookingModalVenue.capacity ? `${bookingModalVenue.capacity} Pax` : "Capacity not published"} | Free Institutional Booking
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setBookingModalVenue(null)}>
                ✕
              </button>
            </div>

            {bookingSuccess ? (
              <div className="modal-success-box">
                <span className="success-icon">✓</span>
                <h4>Reservation Request Submitted!</h4>
                <p>
                  Your booking request has been sent to the administrator for approval. You will receive an in-app
                  notification once confirmed.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="modal-form">
                {bookingError && <div className="form-error-banner">{bookingError}</div>}

                <div className="form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>Event Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AI & Cloud Computing Conclave"
                      value={bookingForm.title}
                      onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Event Category</label>
                    <select
                      value={bookingForm.type}
                      onChange={(e) => setBookingForm({ ...bookingForm, type: e.target.value })}
                    >
                      <option value="Seminar">Seminar</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Hackathon">Hackathon</option>
                      <option value="Conference">Conference</option>
                      <option value="Club">Club Activity</option>
                      <option value="Training">Training</option>
                      <option value="Cultural">Cultural</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      required
                      value={bookingForm.date}
                      onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Start Time</label>
                    <input
                      type="time"
                      required
                      value={bookingForm.start}
                      onChange={(e) => setBookingForm({ ...bookingForm, start: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>End Time</label>
                    <input
                      type="time"
                      required
                      value={bookingForm.end}
                      onChange={(e) => setBookingForm({ ...bookingForm, end: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Expected Participants</label>
                    <input
                      type="number"
                      min="1"
                      max={bookingModalVenue.capacity}
                      required
                      value={bookingForm.participants}
                      onChange={(e) => setBookingForm({ ...bookingForm, participants: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Organized By (Dept / Club / Organization)</label>
                  <input
                    type="text"
                    placeholder="e.g. CSE Department & AI Research Cell"
                    value={bookingForm.organizedBy}
                    onChange={(e) => setBookingForm({ ...bookingForm, organizedBy: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Special Equipment & Service Requirements</label>
                  <div className="checkbox-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={bookingForm.soundSystem}
                        onChange={(e) => setBookingForm({ ...bookingForm, soundSystem: e.target.checked })}
                      />{" "}
                      Sound System & Cordless Mics
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={bookingForm.stageSetup}
                        onChange={(e) => setBookingForm({ ...bookingForm, stageSetup: e.target.checked })}
                      />{" "}
                      Stage Setup & Podiums
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={bookingForm.catering}
                        onChange={(e) => setBookingForm({ ...bookingForm, catering: e.target.checked })}
                      />{" "}
                      Catering / Dining Area Allocation
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Additional Notes / Special Instructions</label>
                  <textarea
                    rows="2"
                    placeholder="Provide any additional logistical requirements..."
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  />
                </div>

                <div className="modal-actions-row">
                  <Button
                    type="button"
                    className="secondary"
                    onClick={() => setBookingModalVenue(null)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Checking Availability..." : "Confirm & Submit Request"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartSearchPage;
