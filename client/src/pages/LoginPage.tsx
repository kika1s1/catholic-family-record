import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { btn, fieldInput, fieldLabel } from "../components/ui/classes";

function BrandLogo() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-3 text-white no-underline"
      aria-label="The Catholic Family Record — go to landing page"
    >
      <span className="inline-flex h-12 w-12 items-center justify-center" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-12 w-12">
          <circle cx="24" cy="24" r="23" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
          <circle cx="24" cy="24" r="16" fill="currentColor" opacity="0.14" />
          <path
            d="M24 12v24M16.5 18.5h15M16.5 29.5h15"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="font-serif text-xl font-semibold">
        The Catholic Family <span className="text-amber-300">Record</span>
      </span>
    </Link>
  );
}

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ||
    "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="flex bg-slate-900 px-8 py-10 text-white lg:px-14 lg:py-16">
        <div className="flex w-full max-w-lg flex-col justify-between">
          <BrandLogo />
          <div className="mt-12">
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-300">Admin console</p>
            <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight">
              Review leads and landing activity.
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-slate-300">
              Sign in to review Discovery Session requests and activity from the
              landing page — roles, organizations, and pipeline status.
            </p>
          </div>
          <p className="mt-12 text-sm text-slate-400">
            Serving Catholic schools and parishes for over 20 years
          </p>
        </div>
      </aside>

      <section className="flex items-center bg-stone-50 px-6 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">Admin access</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-slate-900">Sign in</h2>
          <p className="mt-2 text-base text-slate-600">
            Use your admin credentials to open the operations dashboard.
          </p>

          <form className="mt-8" onSubmit={onSubmit}>
            <div className="mb-4">
              <label className={fieldLabel} htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="e.g. admin@optionc.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={fieldInput}
              />
            </div>
            <div className="mb-6">
              <label className={fieldLabel} htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`${fieldInput} pr-12`}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-slate-800"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button className={btn} type="submit" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </button>
            {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
          </form>

          <Link className="mt-8 inline-block text-sm font-medium text-slate-600 no-underline hover:text-slate-900" to="/">
            ← Back to landing page
          </Link>
        </div>
      </section>
    </div>
  );
}
