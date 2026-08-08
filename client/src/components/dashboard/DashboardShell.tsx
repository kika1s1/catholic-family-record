import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { ExternalLink, LayoutDashboard, Menu, Users, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function DashboardShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle("dash-nav-lock", menuOpen);
    return () => document.body.classList.remove("dash-nav-lock");
  }, [menuOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 960) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className={`dash-app${menuOpen ? " menu-open" : ""}`}>
      <header className="dash-mobile-bar">
        <button
          type="button"
          className="dash-menu-btn"
          aria-expanded={menuOpen}
          aria-controls="dash-sidebar"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="dash-mobile-brand">
          Catholic Family <b>Record</b>
        </div>
      </header>

      <div
        className="dash-backdrop"
        aria-hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
      />

      <aside id="dash-sidebar" className="dash-sidebar">
        <div className="dash-brand">
          <div className="mark">
            The Catholic Family <b>Record</b>
          </div>
          <div className="sub">Partner console</div>
        </div>

        <nav className="dash-nav">
          <NavLink to="/dashboard" end>
            <LayoutDashboard size={16} />
            Overview
          </NavLink>
          <NavLink to="/dashboard/leads">
            <Users size={16} />
            Inquiries
          </NavLink>
          <a href="/" target="_blank" rel="noreferrer">
            <ExternalLink size={16} />
            View landing
          </a>
        </nav>

        <div className="dash-side-foot">
          <div className="dash-user">
            <strong>{user?.name}</strong>
            <span>{user?.email}</span>
          </div>
          <button type="button" className="dash-logout" onClick={() => void logout()}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="dash-main">
        <Outlet />
      </main>
    </div>
  );
}
