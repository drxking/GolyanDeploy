import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiError, getFileUrl } from '../api/client';
import { getApplicationDetail, getApplications, getAdminDashboard, getSubscriptions, requestCorrection, updateApplicationStatus } from '../api/adminApi';

const STATUS_OPTIONS = [
  'draft',
  'submitted',
  'under_review',
  'need_correction',
  'shortlisted',
  'interviewed',
  'approved',
  'rejected',
  'awarded',
];

const REVIEW_FIELDS = [
  ['personal_info', 'Personal information'],
  ['academic', 'Academic details'],
  ['recent_photograph', 'Recent photograph'],
  ['citizenship_front', 'Citizenship front'],
  ['citizenship_back', 'Citizenship back'],
  ['academic_transcript', 'Academic transcript'],
  ['character_certificate', 'Character certificate'],
  ['guardian_citizenship', 'Guardian citizenship'],
];

const statusStyles = {
  draft: 'bg-gray-100 text-gray-700 ring-1 ring-gray-300',
  submitted: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  under_review: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
  need_correction: 'bg-orange-50 text-orange-800 ring-1 ring-orange-200',
  shortlisted: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  interviewed: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  awarded: 'bg-green-50 text-green-700 ring-1 ring-green-200',
  rejected: 'bg-red-50 text-red-700 ring-1 ring-red-200',
};

function formatStatus(status = '') {
  return status.replace(/_/g, ' ') || 'unknown';
}

function itemId(item) {
  return item?.id || item?._id;
}

function fileHref(document) {
  return getFileUrl(document);
}

function formatLabel(value = '') {
  return value.replace(/_/g, ' ');
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : '-';
}

function valueOrDash(value) {
  return value || value === 0 ? value : '-';
}

function documentKind(document) {
  const mimeType = document?.mimeType || '';
  const fileName = document?.fileName || '';
  if (mimeType.startsWith('image/') || /\.(jpe?g|png)$/i.test(fileName)) return 'image';
  if (mimeType === 'application/pdf' || /\.pdf$/i.test(fileName)) return 'pdf';
  return 'file';
}

function countLabel(count, label) {
  return `${count} ${count === 1 ? label : `${label}s`}`;
}

function AdminMetric({ label, value }) {
  return (
    <div className="rounded-md border border-gray-300 bg-gray-50 px-4 py-3">
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <p className="text-2xl font-extrabold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function SmallList({ title, items, emptyLabel }) {
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-300 p-5">
      <h3 className="font-bold text-gray-900">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.length ? items.map((item, index) => (
          <div key={`${title}-${item._id || item.label || index}`} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-gray-700 truncate">{item._id || item.label || 'Unknown'}</span>
            <span className="font-bold text-gray-900">{item.count}</span>
          </div>
        )) : <p className="text-sm text-gray-500">{emptyLabel}</p>}
      </div>
    </div>
  );
}

function DetailItems({ title, items }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-md border border-gray-300 bg-white p-3">
            <p className="text-gray-500 text-xs">{label}</p>
            <p className="mt-1 font-medium text-gray-900 break-words">{valueOrDash(value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentPreviewModal({ document, onClose }) {
  if (!document) return null;
  const href = fileHref(document);
  const kind = documentKind(document);

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 px-4 py-6">
      <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-lg border border-gray-300 bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-gray-300 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{formatLabel(document.documentType)}</p>
            <h3 className="truncate text-lg font-bold text-gray-900">{document.fileName || 'Document'}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 bg-gray-50 p-4">
          {href && kind === 'image' && (
            <img src={href} alt={`${document.fileName || 'Document'} preview`} className="h-full w-full object-contain" />
          )}
          {href && kind === 'pdf' && (
            <iframe src={href} title={`${document.fileName || 'Document'} preview`} className="h-full w-full rounded-md border border-gray-300 bg-white" />
          )}
          {href && kind === 'file' && (
            <div className="flex h-full items-center justify-center text-center">
              <a href={href} target="_blank" rel="noreferrer" className="btn-primary text-sm">
                Open document
              </a>
            </div>
          )}
          {!href && <div className="flex h-full items-center justify-center text-sm text-red-300">Document link unavailable</div>}
        </div>
      </div>
    </div>
  );
}

function AdminDocumentCard({ document, onPreview }) {
  const href = fileHref(document);
  const kind = documentKind(document);

  return (
    <button
      type="button"
      onClick={() => onPreview(document)}
      disabled={!href}
      className="overflow-hidden rounded-md border border-gray-300 bg-white text-left hover:border-pg-gold disabled:cursor-not-allowed disabled:opacity-60"
    >
      {href && kind === 'image' && <img src={href} alt="" className="h-28 w-full object-contain bg-gray-50" />}
      {href && kind === 'pdf' && <div className="flex h-28 items-center justify-center bg-gray-50 text-sm font-bold text-pg-maroon">PDF</div>}
      <div className="p-3">
        <span className="font-semibold capitalize text-pg-maroon">{formatLabel(document.documentType)}</span>
        <span className="block truncate text-xs text-gray-500">{document.fileName}</span>
      </div>
    </button>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [applications, setApplications] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionSearch, setSubscriptionSearch] = useState('');
  const [subscriptionTotal, setSubscriptionTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [remarks, setRemarks] = useState('');
  const [reviewStatus, setReviewStatus] = useState('under_review');
  const [correctionFields, setCorrectionFields] = useState([]);
  const [alert, setAlert] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const stats = dashboard?.stats || {};
  const byStatus = stats.byStatus || {};

  const recentApplications = useMemo(() => dashboard?.recentApplications || [], [dashboard]);
  const selectedIndex = useMemo(() => {
    if (!selected) return -1;
    const selectedId = itemId(selected);
    return applications.findIndex((app) => itemId(app) === selectedId);
  }, [applications, selected]);

  async function loadDashboard() {
    const data = await getAdminDashboard();
    setDashboard(data);
  }

  async function loadApplications(nextPage = page) {
    const data = await getApplications({ status: filter, search: search.trim(), page: nextPage, limit });
    setApplications(data.applications || []);
    setTotal(data.total || 0);
    setPage(data.page || nextPage);
  }

  async function loadSubscriptions() {
    const data = await getSubscriptions({ search: subscriptionSearch.trim(), page: 1, limit: 12 });
    setSubscriptions(data.subscriptions || []);
    setSubscriptionTotal(data.total || 0);
  }

  async function refreshAll(nextPage = page) {
    setAlert('');
    try {
      await Promise.all([loadDashboard(), loadApplications(nextPage), loadSubscriptions()]);
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

    refreshAll(1);
  }, []);

  useEffect(() => {
    loadApplications(1).catch((err) => setAlert(getApiError(err)));
  }, [filter]);

  useEffect(() => {
    if (!alert) return undefined;
    const timeout = window.setTimeout(() => setAlert(''), 5000);
    return () => window.clearTimeout(timeout);
  }, [alert]);

  async function openDetail(id) {
    setAlert('');
    setDetailLoading(true);
    try {
      const data = await getApplicationDetail(id);
      setSelected(data.application);
      setDocuments(data.documents || []);
      setRemarks(data.application.reviewRemarks || data.application.reviewNotes || '');
      setReviewStatus(data.application.status || 'under_review');
      setCorrectionFields(data.application.correctionRequestedFields || []);
    } catch (err) {
      setAlert(getApiError(err));
    } finally {
      setDetailLoading(false);
    }
  }

  async function changeStatus() {
    if (!selected) return;
    setAlert('');
    setSaving(true);
    try {
      await updateApplicationStatus(itemId(selected), {
        status: reviewStatus,
        reviewNotes: remarks,
        reviewRemarks: remarks,
      });
      await Promise.all([loadDashboard(), loadApplications(page), openDetail(itemId(selected))]);
      setAlert('Application status updated successfully');
    } catch (err) {
      setAlert(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function sendCorrection() {
    if (!selected) return;
    if (!remarks.trim()) {
      setAlert('Correction remarks are required');
      return;
    }
    setAlert('');
    setSaving(true);
    try {
      await requestCorrection(itemId(selected), { remarks, fields: correctionFields });
      await Promise.all([loadDashboard(), loadApplications(page), openDetail(itemId(selected))]);
      setReviewStatus('need_correction');
      setAlert('Correction request sent successfully');
    } catch (err) {
      setAlert(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  function toggleCorrectionField(field) {
    setCorrectionFields((current) => (
      current.includes(field) ? current.filter((item) => item !== field) : [...current, field]
    ));
  }

  function openAdjacentApplication(direction) {
    const next = applications[selectedIndex + direction];
    if (next) openDetail(itemId(next));
  }

  if (loading) {
    return <div className="min-h-screen bg-white py-16 text-center text-gray-500">Loading admin dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-widest">Admin Panel</p>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-950 mt-0.5">Pawan Golyan Scholarship Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Review, shortlist, request corrections, and award applications.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin" className="rounded-md bg-gray-950 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800">
              Dashboard
            </Link>
            <Link to="/admin/subscriptions" className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50">
              Subscriptions
            </Link>
            <button
              type="button"
              onClick={() => refreshAll(page)}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="p-5 border-b border-gray-300">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Applications</h3>
                  <p className="text-sm text-gray-500 mt-1">{countLabel(total, 'record')} found · Showing up to 10 per page</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadApplications(1)}
                    type="text"
                    placeholder="Search ID, name, email..."
                    className="form-input bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 text-sm py-2 sm:w-64"
                  />
                  <select value={filter} onChange={(e) => setFilter(e.target.value)} className="form-input bg-white border-gray-300 text-gray-900 text-sm py-2 sm:w-44">
                    <option value="all">All Status</option>
                    {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
                  </select>
                  <button type="button" onClick={() => loadApplications(1)} className="rounded-md bg-gray-950 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">Search</button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-100">
                  <tr>{['ID', 'Applicant', 'District', 'Level', 'Course', 'Status', 'Action'].map((heading) => (
                    <th key={heading} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{heading}</th>
                  ))}</tr>
                </thead>
                <tbody className="bg-gray-50 divide-y divide-gray-300">
                  {applications.length ? applications.map((app) => (
                    <tr key={itemId(app)} className={`${selected && itemId(selected) === itemId(app) ? 'bg-amber-50' : 'hover:bg-gray-100'}`}>
                      <td className="px-5 py-4 text-xs font-mono text-gray-500">{app.applicationId || 'Draft'}</td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-gray-900">{app.user?.fullName || app.fullLegalName || 'Unnamed applicant'}</p>
                        <p className="text-xs text-gray-500">{app.user?.email || '-'}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">{app.district || app.user?.district || '-'}</td>
                      <td className="px-5 py-4 text-sm text-gray-700">{app.educationLevel || '-'}</td>
                      <td className="px-5 py-4 text-sm text-gray-700">{app.desiredCourse || '-'}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusStyles[app.status] || statusStyles.draft}`}>{formatStatus(app.status)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => openDetail(itemId(app))} className="text-xs text-pg-maroon font-semibold hover:underline">Review</button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="7" className="px-5 py-10 text-center text-sm text-gray-500">No applications match the current filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-gray-300 flex items-center justify-between gap-3 bg-white">
              <button
                type="button"
                onClick={() => loadApplications(Math.max(page - 1, 1))}
                disabled={page <= 1}
                className="px-3 py-2 rounded-md border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <button
                type="button"
                onClick={() => loadApplications(Math.min(page + 1, totalPages))}
                disabled={page >= totalPages}
                className="px-3 py-2 rounded-md border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40"
              >
                Next
              </button>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <AdminMetric label="Total Applicants" value={stats.totalApplicants || 0} />
          <AdminMetric label="Submitted" value={byStatus.submitted || 0} />
          <AdminMetric label="Under Review" value={stats.underReview || 0} />
          <AdminMetric label="Subscribers" value={stats.subscriptions || 0} />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Subscribed Emails</h3>
                <p className="text-sm text-gray-500 mt-1">{countLabel(subscriptionTotal, 'subscriber')} saved for future email updates.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={subscriptionSearch}
                  onChange={(e) => setSubscriptionSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadSubscriptions()}
                  type="text"
                  placeholder="Search email, level, course..."
                  className="form-input bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 text-sm py-2 sm:w-72"
                />
                <button type="button" onClick={loadSubscriptions} className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50">Search</button>
                <Link to="/admin/subscriptions" className="rounded-md bg-gray-950 px-4 py-2 text-center text-sm font-medium text-white hover:bg-gray-800">
                  Send Emails
                </Link>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-100">
                <tr>{['Subscriber', 'Phone', 'Target Level', 'Target Course', 'Subscribed'].map((heading) => (
                  <th key={heading} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{heading}</th>
                ))}</tr>
              </thead>
              <tbody className="bg-gray-50 divide-y divide-gray-300">
                {subscriptions.length ? subscriptions.map((subscription) => (
                  <tr key={itemId(subscription)} className="hover:bg-gray-100">
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-gray-900">{subscription.fullName || subscription.email}</p>
                      <p className="text-xs text-gray-500">{subscription.email}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">{subscription.phoneNumber || '-'}</td>
                    <td className="px-5 py-4 text-sm text-gray-700">{subscription.targetLevel}</td>
                    <td className="px-5 py-4 text-sm text-gray-700">{subscription.targetCourse}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{formatDate(subscription.createdAt)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="px-5 py-10 text-center text-sm text-gray-500">No subscribed emails found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

          <div className="rounded-lg border border-gray-300 bg-gray-50 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Application Detail</h3>
            {detailLoading ? (
              <p className="text-sm text-gray-500">Loading detail...</p>
            ) : !selected ? (
              <div className="space-y-5">
                <p className="text-sm text-gray-500">Select an application to review.</p>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Applications</p>
                  <div className="space-y-2">
                    {recentApplications.slice(0, 5).map((app) => (
                      <button
                        key={itemId(app)}
                        type="button"
                        onClick={() => openDetail(itemId(app))}
                        className="w-full text-left rounded-md border border-gray-300 bg-white p-3 hover:bg-gray-100"
                      >
                        <p className="text-sm font-semibold text-gray-900">{app.user?.fullName || app.fullLegalName || 'Unnamed applicant'}</p>
                        <p className="text-xs text-gray-500">{app.applicationId || formatStatus(app.status)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Applicant</p>
                    <p className="font-semibold text-gray-900">{selected.user?.fullName || selected.fullLegalName || 'Unnamed applicant'}</p>
                    <p className="text-sm text-gray-500">{selected.user?.email || '-'} · {selected.user?.mobileNumber || '-'}</p>
                    <span className={`inline-flex mt-3 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusStyles[selected.status] || statusStyles.draft}`}>
                      {formatStatus(selected.status)}
                    </span>
                  </div>
                  <button type="button" onClick={() => setSelected(null)} className="text-xs font-semibold text-gray-500 hover:text-gray-700">
                    Close
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-md border border-gray-300 bg-white p-2">
                  <button
                    type="button"
                    onClick={() => openAdjacentApplication(-1)}
                    disabled={selectedIndex <= 0}
                    className="px-3 py-1.5 rounded-md bg-gray-50 border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-500">
                    {selectedIndex >= 0 ? `${selectedIndex + 1} of ${applications.length}` : 'Selected'}
                  </span>
                  <button
                    type="button"
                    onClick={() => openAdjacentApplication(1)}
                    disabled={selectedIndex < 0 || selectedIndex >= applications.length - 1}
                    className="px-3 py-1.5 rounded-md bg-gray-50 border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>

                <DetailItems
                  title="Application"
                  items={[
                    ['Application ID', selected.applicationId || 'Draft'],
                    ['Status', formatStatus(selected.status)],
                    ['Submitted', formatDate(selected.submittedAt)],
                    ['Completeness', `${selected.completenessPercentage || 0}%`],
                    ['Province', selected.user?.province],
                    ['District', selected.district || selected.user?.district],
                    ['Desired course', selected.desiredCourse],
                  ]}
                />

                <DetailItems
                  title="Personal"
                  items={[
                    ['Legal name', selected.fullLegalName || selected.user?.fullName],
                    ['Date of birth', formatDate(selected.dateOfBirth)],
                    ['Gender', selected.gender],
                    ['Permanent address', selected.permanentAddress],
                    ['Temporary address', selected.temporaryAddress],
                    ['Mobile number', selected.user?.mobileNumber],
                  ]}
                />

                <DetailItems
                  title="Academic"
                  items={[
                    ['Education', selected.educationLevel],
                    ['Desired course', selected.desiredCourse],
                    ['Institution', selected.currentInstitution],
                    ['GPA', selected.gpaPercentage],
                    ['Income', selected.familyIncomeRange],
                    ['Entrance score', selected.entranceExamScore],
                  ]}
                />

                <DetailItems
                  title="Applicant Background"
                  items={[
                    ['Province', selected.user?.province],
                    ['District', selected.district || selected.user?.district],
                    ['Category', selected.marginalizedCategory],
                    ['Disability status', selected.disabilityStatus ? 'Yes' : 'No'],
                  ]}
                />

                <DetailItems
                  title="Guardian"
                  items={[
                    ['Guardian name', selected.guardianFullName],
                    ['Guardian contact', selected.guardianContact],
                    ['Minor applicant', selected.isMinor ? 'Yes' : 'No'],
                  ]}
                />

                {selected.sop && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Statement of Purpose</p>
                    <p className="text-sm text-gray-700 max-h-28 overflow-auto rounded-md border border-gray-300 bg-white p-3">{selected.sop}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-gray-500 mb-2">Documents</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {documents.length ? documents.map((document) => (
                      <AdminDocumentCard key={itemId(document)} document={document} onPreview={setPreviewDocument} />
                    )) : <p className="text-sm text-gray-500">No documents uploaded.</p>}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="form-label text-gray-700">Review Status</label>
                  <select value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)} className="form-input bg-white border-gray-300 text-gray-900">
                    {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
                  </select>
                  <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows="4" placeholder="Review remarks" className="form-input bg-white border-gray-300 text-gray-900 placeholder:text-gray-500" />
                </div>

                <div>
                  <p className="form-label text-gray-700">Correction Fields</p>
                  <div className="grid grid-cols-1 gap-2">
                    {REVIEW_FIELDS.map(([field, label]) => (
                      <label key={field} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={correctionFields.includes(field)}
                          onChange={() => toggleCorrectionField(field)}
                          className="h-4 w-4 text-pg-maroon border-gray-300 rounded"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={changeStatus} disabled={saving} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
                    {saving ? 'Saving...' : 'Update Status'}
                  </button>
                  <button onClick={sendCorrection} disabled={saving} className="px-4 py-2 rounded-md bg-amber-100 text-amber-800 text-sm font-bold disabled:opacity-50">
                    Request Correction
                  </button>
                </div>
              </div>
            )}
          </div>
      </div>
      {alert && (
        <div className={`fixed bottom-5 right-5 z-[80] max-w-sm rounded-lg border px-4 py-3 text-sm shadow-lg ${
          alert.includes('success') || alert.includes('sent') ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          {alert}
        </div>
      )}
      <DocumentPreviewModal document={previewDocument} onClose={() => setPreviewDocument(null)} />
    </div>
  );
}
