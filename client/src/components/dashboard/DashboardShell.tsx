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

const navItem =
  "flex items-center gap-2 rounded-md px-3 py-2 text-sm no-underline transition duration-200";

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
      document.body.classList.remove("overflow-hidden");
      return;
    }
    document.body.classList.add("overflow-hidden");
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [menuOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
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
    <div className="min-h-screen bg-stone-50 lg:pl-64">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-stone-200 bg-white px-4 lg:hidden">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-stone-300 bg-white text-slate-800"
          aria-expanded={menuOpen}
          aria-controls="dash-sidebar"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="font-serif text-base font-semibold text-slate-900">
          Catholic Family <span className="text-amber-800">Record</span>
        </div>
      </header>

      {menuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <aside
        id="dash-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-slate-200 transition-transform duration-200 ${
          menuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="border-b border-slate-800 px-5 py-6">
          <div className="font-serif text-lg font-semibold text-white">
            The Catholic Family <span className="text-amber-300">Record</span>
          </div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Admin console
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `${navItem} ${isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`
            }
          >
            <LayoutDashboard size={16} />
            Overview
          </NavLink>
          <NavLink
            to="/dashboard/leads"
            className={({ isActive }) =>
              `${navItem} ${isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`
            }
          >
            <Users size={16} />
            Inquiries
          </NavLink>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className={`${navItem} text-slate-300 hover:bg-slate-800 hover:text-white`}
          >
            <ExternalLink size={16} />
            View landing
          </a>
        </nav>

        <div className="relative border-t border-slate-800 p-3" ref={accountRef}>
          {accountOpen ? (
            <div className="absolute inset-x-3 bottom-full mb-2 overflow-hidden rounded-md border border-slate-700 bg-slate-800" role="menu">
              <Link
                to="/dashboard/profile"
                role="menuitem"
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-100 no-underline hover:bg-slate-700"
                onClick={() => setAccountOpen(false)}
              >
                <UserRound size={15} />
                Profile
              </Link>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-300 hover:bg-slate-700"
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
            className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left hover:bg-slate-800"
            aria-expanded={accountOpen}
            aria-haspopup="menu"
            onClick={() => setAccountOpen((v) => !v)}
          >
            <span className="min-w-0">
              <strong className="block truncate text-sm text-white">{user?.name}</strong>
              <span className="block truncate text-xs text-slate-400">{user?.email}</span>
            </span>
            <ChevronUp
              size={16}
              className={`shrink-0 text-slate-400 transition duration-200 ${accountOpen ? "" : "rotate-180"}`}
            />
          </button>
        </div>
      </aside>

      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
