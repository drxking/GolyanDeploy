import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api/authApi';
import { getApiError, saveSession } from '../api/client';

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const session = await login({ ...form, role: 'admin' });
      saveSession(session);
      navigate('/admin');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-lg border border-gray-800 bg-white p-8 shadow-xl">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 bg-pg-maroon rounded-sm flex items-center justify-center">
              <span className="text-pg-gold font-black text-sm">PG</span>
            </div>
            <span className="text-lg font-extrabold text-gray-900">Admin Panel</span>
          </Link>
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900">Admin Login</h1>
          <p className="mt-2 text-sm text-gray-500">Sign in to review scholarship applications.</p>
        </div>

        {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              placeholder="admin@golyan.com"
              className="form-input"
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </div>

          <div>
            <label className="form-label">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Your password"
                className="form-input pr-10"
                autoComplete="current-password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <Link to="/login" className="text-xs text-gray-400 hover:text-gray-600">Student login</Link>
        </div>
      </div>
    </div>
  );
}
