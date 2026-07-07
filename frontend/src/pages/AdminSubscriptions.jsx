import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiError } from '../api/client';
import { getSubscriptions, sendCampaignEmail } from '../api/adminApi';

function itemId(item) {
  return item?.id || item?._id;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : '-';
}

function countLabel(count, label) {
  return `${count} ${count === 1 ? label : `${label}s`}`;
}

function selectedPreferenceLabels(subscription) {
  const preferences = subscription.notificationPreferences || {};
  const labels = [
    ['newScholarshipOpenings', 'Openings'],
    ['deadlineReminders', 'Deadlines'],
    ['resultsAnnouncements', 'Results'],
    ['eligibilityCriteriaUpdates', 'Eligibility'],
    ['meritBasedAwards', 'Merit'],
    ['internationalPrograms', 'International'],
  ];
  return labels.filter(([key]) => preferences[key]).map(([, label]) => label);
}

function AdminShell({ children }) {
  return (
    <div className="min-h-screen bg-white text-gray-950">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-gray-500">Admin</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-950">Subscriptions</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/admin" className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50">
                Dashboard
              </Link>
              <Link to="/admin/subscriptions" className="rounded-md bg-gray-950 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800">
                Subscriptions
              </Link>
            </div>
          </div>
        </div>
      </div>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}

export default function AdminSubscriptions() {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [alert, setAlert] = useState('');
  const [campaignResult, setCampaignResult] = useState(null);
  const [form, setForm] = useState({
    targetLevel: '',
    targetCourse: '',
    subject: '',
    message: '',
  });

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const categories = useMemo(() => {
    const map = new Map();
    subscriptions.forEach((subscription) => {
      const key = `${subscription.targetLevel}||${subscription.targetCourse}`;
      if (!map.has(key)) {
        map.set(key, {
          targetLevel: subscription.targetLevel,
          targetCourse: subscription.targetCourse,
          count: 0,
        });
      }
      map.get(key).count += 1;
    });
    return Array.from(map.values());
  }, [subscriptions]);

  async function loadSubscriptions(nextPage = page) {
    setAlert('');
    try {
      const data = await getSubscriptions({ search: search.trim(), page: nextPage, limit });
      setSubscriptions(data.subscriptions || []);
      setTotal(data.total || 0);
      setPage(data.page || nextPage);
    } catch (err) {
      if ([401, 403].includes(err?.response?.status)) {
        localStorage.removeItem('pgs_token');
        localStorage.removeItem('pgs_user');
        navigate('/admin/login');
        return;
      }
      setAlert(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const rawUser = localStorage.getItem('pgs_user');
    const user = rawUser ? JSON.parse(rawUser) : null;
    if (!localStorage.getItem('pgs_token') || user?.role !== 'admin') {
      navigate('/admin/login');
      return;
    }

    loadSubscriptions(1);
  }, []);

  useEffect(() => {
    if (!alert) return undefined;
    const timeout = window.setTimeout(() => setAlert(''), 6000);
    return () => window.clearTimeout(timeout);
  }, [alert]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function useCategory(subscription) {
    setForm((current) => ({
      ...current,
      targetLevel: subscription.targetLevel || '',
      targetCourse: subscription.targetCourse || '',
    }));
  }

  async function submitCampaign(event) {
    event.preventDefault();
    setAlert('');
    setCampaignResult(null);

    if (!form.targetLevel.trim() || !form.targetCourse.trim() || !form.subject.trim() || !form.message.trim()) {
      setAlert('Target level, target course, subject, and message are required.');
      return;
    }

    setSending(true);
    try {
      const data = await sendCampaignEmail({
        targetLevel: form.targetLevel.trim(),
        targetCourse: form.targetCourse.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      setCampaignResult(data.campaign);
      setAlert('Campaign email sending completed.');
    } catch (err) {
      setAlert(getApiError(err));
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <AdminShell>
        <div className="rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-500">Loading subscriptions...</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="min-w-0 rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-950">Subscriber List</h2>
                <p className="mt-1 text-sm text-gray-500">{countLabel(total, 'subscriber')} found</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && loadSubscriptions(1)}
                  type="text"
                  placeholder="Search name, email, phone, course..."
                  className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-950 outline-none placeholder:text-gray-400 focus:border-gray-400 sm:w-72"
                />
                <button
                  type="button"
                  onClick={() => loadSubscriptions(1)}
                  className="h-10 rounded-md bg-gray-950 px-4 text-sm font-medium text-white hover:bg-gray-800"
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Subscriber', 'Phone', 'Program', 'Preferences', 'Status', 'Created', ''].map((heading) => (
                    <th key={heading} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {subscriptions.length ? subscriptions.map((subscription) => (
                  <tr key={itemId(subscription)} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-950">{subscription.fullName || subscription.email}</p>
                      <p className="text-xs text-gray-500">{subscription.email}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{subscription.phoneNumber || '-'}</td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700">{subscription.targetCourse}</p>
                      <p className="text-xs text-gray-500">{subscription.targetLevel}</p>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-600">
                      {selectedPreferenceLabels(subscription).join(', ') || '-'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        subscription.isSubscribed === false ? 'bg-gray-100 text-gray-600' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {subscription.isSubscribed === false ? 'Unsubscribed' : 'Subscribed'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{formatDate(subscription.createdAt)}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => useCategory(subscription)}
                        className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                      >
                        Use category
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="px-5 py-12 text-center text-sm text-gray-500">No subscribers match the current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-gray-200 p-4">
            <button
              type="button"
              onClick={() => loadSubscriptions(Math.max(page - 1, 1))}
              disabled={page <= 1}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button
              type="button"
              onClick={() => loadSubscriptions(Math.min(page + 1, totalPages))}
              disabled={page >= totalPages}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <div>
              <h2 className="text-base font-semibold text-gray-950">Send Campaign</h2>
              <p className="mt-1 text-sm text-gray-500">Emails are sent only to active subscribers in the selected category.</p>
            </div>

            <form onSubmit={submitCampaign} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Target Level</label>
                <input
                  value={form.targetLevel}
                  onChange={(event) => updateForm('targetLevel', event.target.value)}
                  type="text"
                  className="mt-1 h-10 w-full rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                  placeholder="Bachelor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Target Course</label>
                <input
                  value={form.targetCourse}
                  onChange={(event) => updateForm('targetCourse', event.target.value)}
                  type="text"
                  className="mt-1 h-10 w-full rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                  placeholder="Information Technology"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Subject</label>
                <input
                  value={form.subject}
                  onChange={(event) => updateForm('subject', event.target.value)}
                  type="text"
                  className="mt-1 h-10 w-full rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                  placeholder="New Course Update"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Message</label>
                <textarea
                  value={form.message}
                  onChange={(event) => updateForm('message', event.target.value)}
                  rows="8"
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                  placeholder="Your email message here"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="h-10 w-full rounded-md bg-gray-950 px-4 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send Bulk Email'}
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold text-gray-950">Visible Categories</h2>
            <div className="mt-4 space-y-2">
              {categories.length ? categories.map((category) => (
                <button
                  key={`${category.targetLevel}-${category.targetCourse}`}
                  type="button"
                  onClick={() => useCategory(category)}
                  className="flex w-full items-center justify-between gap-3 rounded-md border border-gray-200 px-3 py-2 text-left hover:bg-gray-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-gray-950">{category.targetCourse}</span>
                    <span className="block truncate text-xs text-gray-500">{category.targetLevel}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">{category.count}</span>
                </button>
              )) : (
                <p className="text-sm text-gray-500">No categories on this page.</p>
              )}
            </div>
          </section>

          {campaignResult && (
            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="text-base font-semibold text-gray-950">Last Campaign</h2>
              <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-md bg-gray-50 p-3">
                  <dt className="text-xs text-gray-500">Recipients</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-950">{campaignResult.totalRecipients || 0}</dd>
                </div>
                <div className="rounded-md bg-gray-50 p-3">
                  <dt className="text-xs text-gray-500">Sent</dt>
                  <dd className="mt-1 text-lg font-semibold text-emerald-700">{campaignResult.sentCount || 0}</dd>
                </div>
                <div className="rounded-md bg-gray-50 p-3">
                  <dt className="text-xs text-gray-500">Failed</dt>
                  <dd className="mt-1 text-lg font-semibold text-red-600">{campaignResult.failedCount || 0}</dd>
                </div>
              </dl>
            </section>
          )}
        </aside>
      </div>

      {alert && (
        <div className={`fixed bottom-5 right-5 z-[80] max-w-sm rounded-lg border px-4 py-3 text-sm shadow-lg ${
          alert.includes('completed') ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          {alert}
        </div>
      )}
    </AdminShell>
  );
}
