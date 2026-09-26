import React from "react";
import { Route, Routes } from "react-router-dom";
import Login from "../pages/Login";
import LandingPage from "../pages/LandingPage";
import SmartSearchPage from "../pages/SmartSearchPage";
import EventPlannerPage from "../pages/EventPlannerPage";
import VenueComparePage from "../pages/VenueComparePage";
import CustomerDashboard from "../pages/CustomerDashboard";
import OwnerDashboard from "../pages/OwnerDashboard";
import AdminDashboard from "../pages/AdminDashboard";
import FacultyDashboard from "../pages/FacultyDashboard";
import StudentDashboard from "../pages/StudentDashboard";
import BookingPage from "../pages/BookingPage";
import SpacePage from "../pages/SpacePage";
import CalendarPage from "../pages/CalendarPage";
import BookingReportPage from "../pages/BookingReportPage";
import SettingsPage from "../pages/SettingsPage";
import NotFound from "../pages/NotFound";
import DashboardLayout from "../components/layout/DashboardLayout";
import ProtectedRoute from "./ProtectedRoute";
import { ROLES } from "../utils/roles";
import { PATHS } from "../utils/routePaths";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Landing & Discovery */}
      <Route
        path={PATHS.HOME}
        element={
          <DashboardLayout>
            <LandingPage />
          </DashboardLayout>
        }
      />
      <Route path={PATHS.LOGIN} element={<Login />} />

      {/* Discovery & Planning Tools (Open to all with Navbar) */}
      <Route
        path={PATHS.EXPLORE}
        element={
          <DashboardLayout>
            <SmartSearchPage />
          </DashboardLayout>
        }
      />
      <Route
        path={PATHS.PLANNER}
        element={
          <DashboardLayout>
            <EventPlannerPage />
          </DashboardLayout>
        }
      />
      <Route
        path={PATHS.COMPARE}
        element={
          <DashboardLayout>
            <VenueComparePage />
          </DashboardLayout>
        }
      />

      {/* Customer & Event Planner Dashboard */}
      <Route
        path={PATHS.CUSTOMER_DASHBOARD}
        element={
          <ProtectedRoute allowedRoles={[ROLES.CUSTOMER, ROLES.ADMIN, ROLES.COORDINATOR, ROLES.FACULTY]}>
            <DashboardLayout>
              <CustomerDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path={PATHS.SAVED}
        element={
          <ProtectedRoute allowedRoles={[ROLES.CUSTOMER, ROLES.ADMIN, ROLES.COORDINATOR, ROLES.FACULTY, ROLES.STUDENT, ROLES.OWNER]}>
            <DashboardLayout>
              <CustomerDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Commercial Venue Owner Dashboard */}
      <Route
        path={PATHS.OWNER_DASHBOARD}
        element={
          <ProtectedRoute allowedRoles={[ROLES.OWNER, ROLES.ADMIN]}>
            <DashboardLayout>
              <OwnerDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Super & Campus Admin Dashboard */}
      <Route
        path={PATHS.ADMIN_DASHBOARD}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <DashboardLayout>
              <AdminDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Educational Institution Dashboards */}
      <Route
        path={PATHS.FACULTY_DASHBOARD}
        element={
          <ProtectedRoute allowedRoles={[ROLES.FACULTY, ROLES.ADMIN]}>
            <DashboardLayout>
              <FacultyDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path={PATHS.COORDINATOR_DASHBOARD}
        element={
          <ProtectedRoute allowedRoles={[ROLES.COORDINATOR, ROLES.STUDENT, ROLES.ADMIN]}>
            <DashboardLayout>
              <StudentDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Shared Platform Views */}
      <Route
        path={PATHS.BOOKINGS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.FACULTY, ROLES.COORDINATOR, ROLES.STUDENT, ROLES.CUSTOMER, ROLES.OWNER]}>
            <DashboardLayout>
              <BookingPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path={PATHS.SPACES}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.FACULTY, ROLES.COORDINATOR, ROLES.STUDENT, ROLES.CUSTOMER, ROLES.OWNER]}>
            <DashboardLayout>
              <SpacePage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path={PATHS.CALENDAR}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.FACULTY, ROLES.COORDINATOR, ROLES.STUDENT, ROLES.CUSTOMER, ROLES.OWNER]}>
            <DashboardLayout>
              <CalendarPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path={PATHS.BOOKING_REPORT}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.OWNER]}>
            <DashboardLayout>
              <BookingReportPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={PATHS.SETTINGS}
        element={
          <DashboardLayout>
            <SettingsPage />
          </DashboardLayout>
        }
      />

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
