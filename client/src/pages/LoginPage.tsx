import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "../styles/dashboard.css";

function BrandLogo() {
  return (
    <Link to="/" className="login-logo" aria-label="The Catholic Family Record — go to landing page">
      <span className="login-logo-mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
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
      <span className="login-logo-text">
        The Catholic Family <b>Record</b>
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
    <div className="login-page">
      <aside className="login-panel login-panel-brand">
        <div className="login-brand-inner">
          <BrandLogo />
          <div className="login-brand-copy">
            <p className="login-eyebrow">Partner console</p>
            <h1>One family. One record. One faith.</h1>
            <p className="login-brand-lede">
              Sign in to review Discovery Session requests and activity from the
              landing page — roles, organizations, and pipeline status in one place.
            </p>
          </div>
          <p className="login-brand-foot">Serving Catholic schools and parishes for over 20 years</p>
        </div>
      </aside>

      <section className="login-panel login-panel-form">
        <div className="login-form-shell">
          <div className="login-form-intro">
            <p className="login-eyebrow dark">Partner access</p>
            <h2>Sign in</h2>
            <p className="login-form-lede">
              Use your console credentials to open the operations dashboard.
            </p>
          </div>

          <form onSubmit={onSubmit}>
            <div className="login-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="e.g. you@yourdiocese.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="login-field">
              <label htmlFor="password">Password</label>
              <div className="login-password-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your partner console password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button className="login-btn" type="submit" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </button>
            {error ? <p className="login-error">{error}</p> : null}
          </form>

          <Link className="login-back" to="/">
            ← Back to landing page
          </Link>
        </div>
      </section>
    </div>
  );
}
