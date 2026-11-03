import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { postApi } from '../lib/api';

// Public page the emailed reset link opens: ?token=...
function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await postApi('/auth/reset-password', { token, password });
      setDone(true);
    } catch (err: any) {
      setError(err?.message || 'Could not reset the password');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'mt-1 w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md space-y-6 bg-surface p-8 rounded-lg shadow-sm">
        {done ? (
          <>
            <h2 className="text-2xl font-bold text-ink">Password updated</h2>
            <p className="text-sm text-ink-muted">
              Your password has been changed. You can now sign in with it.
            </p>
            <Link to="/login" className="block rounded-lg bg-primary-600 py-3 text-center font-medium text-white hover:bg-primary-700">
              Sign in
            </Link>
          </>
        ) : (
          <>
            <div>
              <h2 className="text-2xl font-bold text-ink">Choose a new password</h2>
              {!token && (
                <p className="mt-1 text-sm text-danger">
                  This link is missing its token. Request a new one from the sign in page.
                </p>
              )}
            </div>

            {error && (
              <div role="alert" className="rounded-md border border-danger-border bg-danger-bg p-3 text-sm text-danger">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-ink-muted">
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-ink-muted">
                  Confirm new password
                </label>
                <input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !token}
                className="w-full rounded-lg bg-primary-600 py-3 font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update password'}
              </button>
            </form>

            <Link to="/forgot-password" className="block text-center text-sm text-ink-muted hover:text-ink">
              Request a new link
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default ResetPasswordPage;
