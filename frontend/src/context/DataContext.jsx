import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const DataContext = createContext(null);
const OVERRIDES_STORAGE_KEY = "scsb_timetable_overrides";
const SAVED_VENUES_KEY = "venbok_saved_venues";
const PLATFORM_MODE_KEY = "venbok_platform_mode";

const uniqueById = (items) => {
  const map = new Map();
  (Array.isArray(items) ? items : []).forEach((item) => {
    if (!item || item.id === undefined || item.id === null) {
      return;
    }
    map.set(String(item.id), item);
  });
  return Array.from(map.values());
};

export const DataProvider = ({ children }) => {
  const [spaces, setSpaces] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  // Platform Mode: 'marketplace' vs 'institution'
  const [mode, setMode] = useState(() => {
    try {
      return window.localStorage.getItem(PLATFORM_MODE_KEY) || "marketplace";
    } catch {
      return "marketplace";
    }
  });

  // Saved / Favorite Venues
  const [savedVenueIds, setSavedVenueIds] = useState(() => {
    try {
      const raw = window.localStorage.getItem(SAVED_VENUES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Venues selected for side-by-side comparison (max 4)
  const [compareVenueIds, setCompareVenueIds] = useState([]);

  const [timetableOverrides, setTimetableOverrides] = useState(() => {
    try {
      const raw = window.localStorage.getItem(OVERRIDES_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const togglePlatformMode = () => {
    setMode((prev) => {
      const next = prev === "marketplace" ? "institution" : "marketplace";
      try {
        window.localStorage.setItem(PLATFORM_MODE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  };

  const toggleSaveVenue = (venueId) => {
    setSavedVenueIds((prev) => {
      const id = String(venueId);
      const exists = prev.includes(id);
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        window.localStorage.setItem(SAVED_VENUES_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const addToCompare = (venueId) => {
    setCompareVenueIds((prev) => {
      const id = String(venueId);
      if (prev.includes(id)) return prev;
      if (prev.length >= 4) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const removeFromCompare = (venueId) => {
    setCompareVenueIds((prev) => prev.filter((id) => id !== String(venueId)));
  };

  const clearCompare = () => setCompareVenueIds([]);

  const loadSpaces = async () => {
    try {
      const response = await api.get("/spaces");
      const normalized = uniqueById(response?.data?.data || []);
      setSpaces(normalized);
    } catch {
      setSpaces([]);
    }
  };

  const loadBookings = async () => {
    try {
      const response = await api.get("/bookings");
      const normalized = uniqueById(response?.data?.data || []);
      setBookings(normalized);
    } catch {
      setBookings([]);
    }
  };

  const loadTimetableOverrides = async () => {
    try {
      const response = await api.get("/timetable-overrides");
      const overrides = Array.isArray(response?.data?.data) ? response.data.data : [];
      setTimetableOverrides(overrides);
    } catch {
      setTimetableOverrides([]);
    }
  };

  const loadPromotions = async () => {
    try {
      const response = await api.get("/promotions");
      setPromotions(Array.isArray(response?.data?.data) ? response.data.data : []);
    } catch {
      setPromotions([]);
    }
  };

  const loadOrganizations = async () => {
    try {
      const response = await api.get("/organizations");
      setOrganizations(Array.isArray(response?.data?.data) ? response.data.data : []);
    } catch {
      setOrganizations([]);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await api.get("/notifications");
      const data = response?.data?.data;
      if (data) {
        setNotifications(data.notifications || []);
        setUnreadNotifsCount(data.unreadCount || 0);
      }
    } catch {
      // not logged in or endpoint not available
    }
  };

  const loadAll = () => {
    loadSpaces();
    loadBookings();
    loadTimetableOverrides();
    loadPromotions();
    loadOrganizations();
    loadNotifications();
  };

  useEffect(() => {
    loadAll();
    setTimetable([]);
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      loadSpaces();
      loadBookings();
      loadTimetableOverrides();
      loadNotifications();
    }, 12000);

    const handleFocus = () => loadAll();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(timetableOverrides));
    } catch {
      // ignore
    }
  }, [timetableOverrides]);

  const setTimetableOverrideAsync = async (override) => {
    try {
      if (override.status) {
        await api.post("/timetable-overrides", override);
      }
    } catch (error) {
      console.error("Failed to sync timetable override", error);
    }

    setTimetableOverrides((prev) => {
      const rest = prev.filter(
        (item) =>
          !(
            item.spaceId === override.spaceId &&
            item.date === override.date &&
            item.start === override.start &&
            item.end === override.end
          )
      );
      if (!override.status) return rest;
      return [...rest, override];
    });
  };

  const addSpace = async (space) => {
    try {
      const response = await api.post("/spaces", space);
      const created = response?.data?.data;
      if (created?.id) await loadSpaces();
      return created;
    } catch {
      return null;
    }
  };

  const updateSpace = async (space) => {
    try {
      const response = await api.put(`/spaces/${space.id}`, space);
      const updated = response?.data?.data;
      if (updated?.id) await loadSpaces();
      return updated;
    } catch {
      return null;
    }
  };

  const deleteSpace = async (id) => {
    try {
      await api.delete(`/spaces/${id}`);
      await loadSpaces();
      await loadBookings();
    } catch {
      return;
    }
  };

  const addBooking = async (booking) => {
    try {
      const response = await api.post("/bookings", booking);
      const created = response?.data?.data;
      if (created?.id) await loadBookings();
      return created;
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || "Unable to save booking";
      throw new Error(message);
    }
  };

  const updateBookingStatus = async (id, status, extra = {}) => {
    try {
      const response = await api.patch(`/bookings/${id}/status`, { status, ...extra });
      const updated = response?.data?.data;
      if (updated?.id) await loadBookings();
      return updated;
    } catch {
      return null;
    }
  };

  const value = useMemo(
    () => ({
      spaces,
      bookings,
      timetable,
      timetableOverrides,
      organizations,
      promotions,
      notifications,
      unreadNotifsCount,
      mode,
      togglePlatformMode,
      savedVenueIds,
      toggleSaveVenue,
      compareVenueIds,
      addToCompare,
      removeFromCompare,
      clearCompare,
      addSpace,
      updateSpace,
      deleteSpace,
      addBooking,
      updateBookingStatus,
      setTimetableOverride: setTimetableOverrideAsync,
      refreshData: loadAll,
    }),
    [
      spaces,
      bookings,
      timetable,
      timetableOverrides,
      organizations,
      promotions,
      notifications,
      unreadNotifsCount,
      mode,
      savedVenueIds,
      compareVenueIds,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => useContext(DataContext);
