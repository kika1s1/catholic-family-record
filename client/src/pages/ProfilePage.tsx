import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { btn, card, eyebrow, fieldInput, fieldLabel, pageHead } from "../components/ui/classes";

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete: string;
  placeholder: string;
}) {
  return (
    <div className="mb-4">
      <label className={fieldLabel} htmlFor={id}>{label}</label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          minLength={id === "current-password" ? undefined : 12}
          className={`${fieldInput} pr-12`}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-slate-800"
          onClick={onToggle}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

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
      <header className={pageHead}>
        <div>
          <p className={eyebrow}>Account</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-slate-900">Profile settings</h1>
          <p className="mt-1 text-slate-600">Update your display name and console password.</p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={card}>
          <h3 className="font-serif text-xl font-semibold text-slate-900">Display name</h3>
          <p className="mt-1 text-sm text-slate-500">Shown in the admin console sidebar and session.</p>

          <form className="mt-6" onSubmit={onSaveName}>
            <div className="mb-4">
              <label className={fieldLabel} htmlFor="profile-email">Email</label>
              <input
                id="profile-email"
                type="email"
                value={user?.email ?? ""}
                disabled
                readOnly
                className={fieldInput}
              />
            </div>
            <div className="mb-6">
              <label className={fieldLabel} htmlFor="profile-name">Name</label>
              <input
                id="profile-name"
                type="text"
                autoComplete="name"
                placeholder="e.g. Margaret Chen"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={120}
                className={fieldInput}
              />
            </div>
            <button className={btn} type="submit" disabled={nameSaving}>
              {nameSaving ? "Saving…" : "Save name"}
            </button>
            {nameMsg ? (
              <p className={`mt-3 text-sm ${nameMsg.ok ? "text-emerald-700" : "text-red-700"}`}>
                {nameMsg.text}
              </p>
            ) : null}
          </form>
        </section>

        <section className={card}>
          <h3 className="font-serif text-xl font-semibold text-slate-900">Change password</h3>
          <p className="mt-1 text-sm text-slate-500">Use at least 12 characters. You will stay signed in.</p>

          <form className="mt-6" onSubmit={onChangePassword}>
            <PasswordField
              id="current-password"
              label="Current password"
              value={currentPassword}
              onChange={setCurrentPassword}
              show={showCurrent}
              onToggle={() => setShowCurrent((v) => !v)}
              autoComplete="current-password"
              placeholder="Enter your current password"
            />
            <PasswordField
              id="new-password"
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              show={showNew}
              onToggle={() => setShowNew((v) => !v)}
              autoComplete="new-password"
              placeholder="e.g. at least 12 characters"
            />
            <PasswordField
              id="confirm-password"
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
              autoComplete="new-password"
              placeholder="Re-enter the new password"
            />
            <button className={btn} type="submit" disabled={passSaving}>
              {passSaving ? "Updating…" : "Update password"}
            </button>
            {passMsg ? (
              <p className={`mt-3 text-sm ${passMsg.ok ? "text-emerald-700" : "text-red-700"}`}>
                {passMsg.text}
              </p>
            ) : null}
          </form>
        </section>
      </div>
    </>
  );
}
