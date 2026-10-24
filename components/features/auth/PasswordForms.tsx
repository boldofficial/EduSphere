'use client';

import { useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api-client';

function detailOf(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: Record<string, unknown> } }).response?.data;
  if (!data) return fallback;
  const first = data.detail ?? data.new_password ?? Object.values(data)[0];
  return (Array.isArray(first) ? first.join(' ') : String(first ?? '')) || fallback;
}

const inputClass =
  'w-full rounded-control border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100';

function NewPasswordFields({
  password,
  confirm,
  onPassword,
  onConfirm,
}: {
  password: string;
  confirm: string;
  onPassword: (v: string) => void;
  onConfirm: (v: string) => void;
}) {
  return (
    <>
      <label className="block space-y-1">
        <span className="text-sm font-semibold text-gray-700">New password</span>
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => onPassword(e.target.value)}
          className={inputClass}
          required
          minLength={8}
        />
        <span className="block text-xs text-gray-500">
          At least 8 characters. Avoid your name or admission number.
        </span>
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-semibold text-gray-700">Type it again</span>
        <input
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => onConfirm(e.target.value)}
          className={inputClass}
          required
        />
      </label>
    </>
  );
}

function Shell({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md space-y-5 rounded-card border border-gray-100 bg-white p-6 shadow-card sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <KeyRound size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-600">{intro}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

function SubmitButton({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="inline-flex w-full items-center justify-center gap-2 rounded-control bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
    >
      {busy && <Loader2 size={16} className="animate-spin" />} {label}
    </button>
  );
}

/** Shown instead of the dashboard until someone signed in with a temporary password picks their own. */
export function ChangePasswordGate({
  onDone,
  onLogout,
}: {
  onDone: () => void;
  onLogout: () => void;
}) {
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('The two passwords do not match.');
    setBusy(true);
    try {
      await apiClient.post('users/change-password/', {
        current_password: current,
        new_password: password,
      });
      onDone();
    } catch (err) {
      setError(detailOf(err, 'Could not change your password.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell
      title="Choose your own password"
      intro="You signed in with a temporary password. Pick a new one that only you know before you continue."
    >
      <form onSubmit={submit} className="space-y-4">
        <label className="block space-y-1">
          <span className="text-sm font-semibold text-gray-700">Temporary password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className={inputClass}
            required
          />
        </label>
        <NewPasswordFields
          password={password}
          confirm={confirm}
          onPassword={setPassword}
          onConfirm={setConfirm}
        />
        {error && <p className="text-sm text-danger-700">{error}</p>}
        <SubmitButton busy={busy} label="Save and continue" />
        <button
          type="button"
          onClick={onLogout}
          className="w-full text-center text-sm font-semibold text-gray-500 hover:text-gray-800"
        >
          Sign out
        </button>
      </form>
    </Shell>
  );
}

/** Target of the emailed reset link: /reset-password?uid=…&token=… */
export function ResetPasswordForm({ uid, token }: { uid: string; token: string }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('The two passwords do not match.');
    setBusy(true);
    try {
      await apiClient.post('users/password-reset-confirm/', {
        uid,
        token,
        new_password: password,
      });
      setDone(true);
    } catch (err) {
      setError(detailOf(err, 'This link has expired or was already used. Request a new one.'));
    } finally {
      setBusy(false);
    }
  };

  if (!uid || !token)
    return (
      <Shell
        title="Reset link incomplete"
        intro="Open the link from your email again, or request a new one from the sign-in page."
      >
        <a href="/login" className="text-sm font-bold text-brand-600 hover:text-brand-700">
          Go to sign in
        </a>
      </Shell>
    );

  if (done)
    return (
      <Shell title="Password changed" intro="You can now sign in with your new password.">
        <a
          href="/login"
          className="inline-flex w-full items-center justify-center rounded-control bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
        >
          Go to sign in
        </a>
      </Shell>
    );

  return (
    <Shell title="Set a new password" intro="Choose a new password for your account.">
      <form onSubmit={submit} className="space-y-4">
        <NewPasswordFields
          password={password}
          confirm={confirm}
          onPassword={setPassword}
          onConfirm={setConfirm}
        />
        {error && <p className="text-sm text-danger-700">{error}</p>}
        <SubmitButton busy={busy} label="Save new password" />
      </form>
    </Shell>
  );
}
