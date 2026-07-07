import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api/authApi';
import { getApiError, saveSession } from '../api/client';

const Login = () => {
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
      const session = await login({ ...form, role: 'student' });
      saveSession(session);
      navigate('/dashboard');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-pg-maroon flex-col items-center justify-center px-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 -left-10 w-72 h-72 bg-pg-gold rounded-full"></div>
          <div className="absolute bottom-20 -right-10 w-96 h-96 bg-white rounded-full"></div>
        </div>
        <div className="relative z-10 text-center text-white max-w-md">
          <div className="w-16 h-16 bg-pg-gold rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-pg-maroon font-black text-2xl">PG</span>
          </div>
          <h1 className="text-4xl font-extrabold">Pawan Golyan<br />Scholarship Program</h1>
          <div className="mt-4 h-1 w-16 bg-pg-gold rounded-full mx-auto"></div>
          <p className="mt-6 text-red-200 text-lg leading-relaxed">
            Log in to track your application, upload documents, and stay informed on your scholarship status.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-extrabold text-pg-gold">2,500+</div>
              <div className="text-xs text-red-200 mt-1 uppercase tracking-wide">Scholars</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-pg-gold">77</div>
              <div className="text-xs text-red-200 mt-1 uppercase tracking-wide">Districts</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-pg-gold">94%</div>
              <div className="text-xs text-red-200 mt-1 uppercase tracking-wide">Grad Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 bg-pg-maroon rounded-sm flex items-center justify-center">
                <span className="text-pg-gold font-black text-sm">PG</span>
              </div>
              <span className="text-xl font-extrabold text-pg-maroon">Golyan<span className="text-pg-gold">Scholars</span></span>
            </Link>
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900">Student Login</h2>
          <p className="mt-2 text-sm text-gray-500">Sign in to continue your scholarship application.</p>

          {/* Form */}
          {error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                placeholder="you@email.com"
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
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 text-pg-maroon border-gray-300 rounded" />
                <span className="text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-pg-maroon font-semibold hover:text-pg-maroon-light">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            New applicant?{' '}
            <Link to="/apply" className="text-pg-maroon font-semibold hover:underline">
              Create an account →
            </Link>
          </p>

          {/* Divider */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <Link to="/" className="text-xs text-gray-400 hover:text-gray-600">← Back to main website</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
