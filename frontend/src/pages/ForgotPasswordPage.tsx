import { useState } from 'react';
import { Link } from 'react-router-dom';
import { postApi } from '../lib/api';

// Public page: request a password reset email. The backend always answers the
// same message, so the response never reveals whether the email has an account.
function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await postApi('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      // Same surface either way — the user is told to check their email
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md space-y-6 bg-surface p-8 rounded-lg shadow-sm">
        {sent ? (
          <>
            <h2 className="text-2xl font-bold text-ink">Check your email</h2>
            <p className="text-sm text-ink-muted">
              If an account exists for that email, a reset link has been sent. The link is
              valid for one hour.
            </p>
            <Link to="/login" className="block rounded-lg bg-primary-600 py-3 text-center font-medium text-white hover:bg-primary-700">
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <div>
              <h2 className="text-2xl font-bold text-ink">Forgot your password?</h2>
              <p className="mt-1 text-sm text-ink-muted">
                Enter your email and we will send you a link to reset it.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-ink-muted">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary-600 py-3 font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>

            <Link to="/login" className="block text-center text-sm text-ink-muted hover:text-ink">
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
