import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  ChevronUp,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "../../styles/dashboard.css";

export function DashboardShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) {
      document.body.classList.remove("dash-nav-lock");
      document.body.style.removeProperty("--dash-lock-gap");
      return;
    }

    const gap = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    document.body.style.setProperty("--dash-lock-gap", `${gap}px`);
    document.body.classList.add("dash-nav-lock");

    return () => {
      document.body.classList.remove("dash-nav-lock");
      document.body.style.removeProperty("--dash-lock-gap");
    };
  }, [menuOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 960px)");
    const onChange = () => {
      if (!mq.matches) setMenuOpen(false);
    };
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!accountOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [accountOpen]);

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

        <div className="dash-side-foot" ref={accountRef}>
          <div className={`dash-account${accountOpen ? " is-open" : ""}`}>
            {accountOpen ? (
              <div className="dash-account-menu" role="menu">
                <Link
                  to="/dashboard/profile"
                  role="menuitem"
                  className="dash-account-item"
                  onClick={() => setAccountOpen(false)}
                >
                  <UserRound size={15} />
                  Profile
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  className="dash-account-item danger"
                  onClick={() => {
                    setAccountOpen(false);
                    void logout();
                  }}
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            ) : null}

            <button
              type="button"
              className="dash-account-trigger"
              aria-expanded={accountOpen}
              aria-haspopup="menu"
              onClick={() => setAccountOpen((v) => !v)}
            >
              <span className="dash-user">
                <strong>{user?.name}</strong>
                <span>{user?.email}</span>
              </span>
              <ChevronUp
                size={16}
                className={`dash-account-chevron${accountOpen ? " open" : ""}`}
              />
            </button>
          </div>
        </div>
      </aside>

      <main className="dash-main">
        <Outlet />
      </main>
    </div>
  );
}
