import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import fetchApi, { postApi } from '../lib/api';

// Public page the emailed invite link opens: ?token=... The page checks the
// link first, then lets the person choose a password to create the account.
function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [invite, setInvite] = useState<{ email: string; personName: string | null } | null>(null);
  const [checked, setChecked] = useState(false);
  const [invalid, setInvalid] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setInvalid('This link is missing its token.');
      setChecked(true);
      return;
    }
    fetchApi(`/auth/invites/${encodeURIComponent(token)}`)
      .then((data: any) => {
        setInvite({ email: data.email, personName: data.personName });
      })
      .catch((err: any) => {
        setInvalid(err?.message || 'This link is invalid or has expired.');
      })
      .finally(() => setChecked(true));
  }, [token]);

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
      await postApi('/auth/accept-invite', { token, password });
      setDone(true);
    } catch (err: any) {
      setError(err?.message || 'Could not create the account');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'mt-1 w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md space-y-6 bg-surface p-8 rounded-lg shadow-sm">
        {checked && invalid && (
          <>
            <h2 className="text-2xl font-bold text-ink">Invalid link</h2>
            <p className="text-sm text-ink-muted">{invalid}</p>
            <Link to="/login" className="block rounded-lg bg-primary-600 py-3 text-center font-medium text-white hover:bg-primary-700">
              Go to sign in
            </Link>
          </>
        )}

        {checked && invite && done && (
          <>
            <h2 className="text-2xl font-bold text-ink">Account created</h2>
            <p className="text-sm text-ink-muted">
              Your account is ready. You can now sign in with your email and the password
              you just chose.
            </p>
            <Link to="/login" className="block rounded-lg bg-primary-600 py-3 text-center font-medium text-white hover:bg-primary-700">
              Sign in
            </Link>
          </>
        )}

        {checked && invite && !done && (
          <>
            <div>
              <h2 className="text-2xl font-bold text-ink">Create your account</h2>
              <p className="mt-1 text-sm text-ink-muted">
                {invite.personName ? `${invite.personName} — ` : ''}
                {invite.email}
              </p>
            </div>

            {error && (
              <div role="alert" className="rounded-md border border-danger-border bg-danger-bg p-3 text-sm text-danger">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-ink-muted">
                  Password
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
                  Confirm password
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
                disabled={loading}
                className="w-full rounded-lg bg-primary-600 py-3 font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default AcceptInvitePage;
