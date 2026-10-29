import React, { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { postApi } from '../lib/api';
import { isAuthenticated } from '../lib/auth';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Already signed in? Skip the form instead of showing it again.
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      // Use the centralized API utility to handle the base URL, headers, and JSON parsing
      const data: any = await postApi('/auth/login', { email, password });

      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('personId', data.personId);
      localStorage.setItem('roles', JSON.stringify(data.roles));

      navigate('/');
    } catch (err) {
      setError('Login failed. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md space-y-6 bg-surface p-8 rounded-lg shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-ink">
            Sign in to your account
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Enter your email and password to continue
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-md border border-danger-border bg-danger-bg p-3 text-sm text-danger"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-ink-muted"
            >
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

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-ink-muted"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex min-h-11 items-center gap-2 text-ink-muted">
              <input id="remember" type="checkbox" />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-primary-600 hover:text-primary-700">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary-600 py-3 font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

      </div>
    </div>
  );
}

export default Login;
