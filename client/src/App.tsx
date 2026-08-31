import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";

const DashboardShell = lazy(() =>
  import("./components/dashboard/DashboardShell").then((m) => ({
    default: m.DashboardShell,
  })),
);
const DashboardOverview = lazy(() => import("./pages/DashboardOverview"));
const LeadsPage = lazy(() => import("./pages/LeadsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

function DashboardFallback() {
  return (
    <div className="p-8 font-sans text-slate-600">
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Suspense fallback={<DashboardFallback />}>
                  <DashboardShell />
                </Suspense>
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={
                <Suspense fallback={<DashboardFallback />}>
                  <DashboardOverview />
                </Suspense>
              }
            />
            <Route
              path="leads"
              element={
                <Suspense fallback={<DashboardFallback />}>
                  <LeadsPage />
                </Suspense>
              }
            />
            <Route
              path="profile"
              element={
                <Suspense fallback={<DashboardFallback />}>
                  <ProfilePage />
                </Suspense>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
