import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { user, setUser } = useAuth();

  const [name, setName] = useState(user?.name ?? "");

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);
  const [nameMsg, setNameMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [nameSaving, setNameSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passMsg, setPassMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [passSaving, setPassSaving] = useState(false);

  async function onSaveName(e: FormEvent) {
    e.preventDefault();
    setNameMsg(null);
    setNameSaving(true);
    try {
      const res = await api.updateProfile(name.trim());
      setUser(res.user);
      setName(res.user.name);
      setNameMsg({ text: "Display name updated.", ok: true });
    } catch (err) {
      setNameMsg({
        text: err instanceof Error ? err.message : "Unable to update name",
        ok: false,
      });
    } finally {
      setNameSaving(false);
    }
  }

  async function onChangePassword(e: FormEvent) {
    e.preventDefault();
    setPassMsg(null);

    if (newPassword !== confirmPassword) {
      setPassMsg({ text: "New password and confirmation do not match.", ok: false });
      return;
    }

    setPassSaving(true);
    try {
      const res = await api.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPassMsg({ text: res.message || "Password updated.", ok: true });
    } catch (err) {
      setPassMsg({
        text: err instanceof Error ? err.message : "Unable to change password",
        ok: false,
      });
    } finally {
      setPassSaving(false);
    }
  }

  return (
    <>
      <header className="dash-top">
        <div>
          <div className="dash-eyebrow">Account</div>
          <h1>Profile settings</h1>
          <p>Update your display name and console password.</p>
        </div>
      </header>

      <div className="profile-grid">
        <section className="profile-card">
          <h3>Display name</h3>
          <p className="panel-sub">Shown in the admin console sidebar and session.</p>

          <form onSubmit={onSaveName}>
            <div className="login-field">
              <label htmlFor="profile-email">Email</label>
              <input
                id="profile-email"
                type="email"
                value={user?.email ?? ""}
                disabled
                readOnly
              />
            </div>
            <div className="login-field">
              <label htmlFor="profile-name">Name</label>
              <input
                id="profile-name"
                type="text"
                autoComplete="name"
                placeholder="e.g. Margaret Chen"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={120}
              />
            </div>
            <button className="login-btn" type="submit" disabled={nameSaving}>
              {nameSaving ? "Saving…" : "Save name"}
            </button>
            {nameMsg ? (
              <p className={nameMsg.ok ? "profile-ok" : "login-error"}>{nameMsg.text}</p>
            ) : null}
          </form>
        </section>

        <section className="profile-card">
          <h3>Change password</h3>
          <p className="panel-sub">Use at least 12 characters. You will stay signed in.</p>

          <form onSubmit={onChangePassword}>
            <div className="login-field">
              <label htmlFor="current-password">Current password</label>
              <div className="login-password-wrap">
                <input
                  id="current-password"
                  type={showCurrent ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowCurrent((v) => !v)}
                  aria-label={showCurrent ? "Hide current password" : "Show current password"}
                >
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="new-password">New password</label>
              <div className="login-password-wrap">
                <input
                  id="new-password"
                  type={showNew ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="e.g. at least 12 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={12}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowNew((v) => !v)}
                  aria-label={showNew ? "Hide new password" : "Show new password"}
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="confirm-password">Confirm new password</label>
              <div className="login-password-wrap">
                <input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter the new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={12}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Hide confirmation" : "Show confirmation"}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button className="login-btn" type="submit" disabled={passSaving}>
              {passSaving ? "Updating…" : "Update password"}
            </button>
            {passMsg ? (
              <p className={passMsg.ok ? "profile-ok" : "login-error"}>{passMsg.text}</p>
            ) : null}
          </form>
        </section>
      </div>
    </>
  );
}
