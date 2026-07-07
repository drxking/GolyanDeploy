import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient, { getApiError, getFileUrl } from '../api/client';
import { getMyApplication } from '../api/applicationApi';

const statusColors = {
  not_started: 'bg-gray-100 text-gray-600',
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  need_correction: 'bg-amber-100 text-amber-700',
  shortlisted: 'bg-purple-100 text-purple-700',
  approved: 'bg-emerald-100 text-emerald-700',
  awarded: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const statusLabels = {
  not_started: 'Not Started',
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  need_correction: 'Needs Correction',
  shortlisted: 'Shortlisted',
  approved: 'Approved',
  awarded: 'Awarded',
  rejected: 'Rejected',
};

function formatDocumentType(type = '') {
  return type.replace(/_/g, ' ');
}

function getDocumentKind(document) {
  const mimeType = document?.mimeType || '';
  const fileName = document?.fileName || '';
  if (mimeType.startsWith('image/') || /\.(jpe?g|png)$/i.test(fileName)) return 'image';
  if (mimeType === 'application/pdf' || /\.pdf$/i.test(fileName)) return 'pdf';
  return 'file';
}

function DashboardDocument({ document }) {
  const href = getFileUrl(document);
  const kind = getDocumentKind(document);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
      {href && kind === 'image' && (
        <img src={href} alt={`${document.fileName || 'Document'} preview`} className="h-28 w-full object-contain bg-gray-100" />
      )}
      {href && kind === 'pdf' && (
        <iframe src={href} title={`${document.fileName || 'Document'} preview`} className="h-28 w-full bg-gray-100" />
      )}
      <div className="p-3">
        <p className="text-sm font-semibold capitalize text-gray-800">{formatDocumentType(document.documentType)}</p>
        <p className="mt-0.5 truncate text-xs text-gray-400">{document.fileName}</p>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-bold text-pg-maroon hover:text-pg-maroon-light">
            Open document
          </a>
        ) : (
          <p className="mt-3 text-xs text-red-600">Document link unavailable</p>
        )}
      </div>
    </div>
  );
}

function valueOrDash(value) {
  return value || value === 0 ? value : '-';
}

function formatDate(date) {
  return date ? new Date(date).toLocaleDateString() : '-';
}

function DetailGrid({ title, items }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-bold text-gray-900 mb-4">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        {items.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
            <p className="mt-1 text-sm font-medium text-gray-800 break-words">{valueOrDash(value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [application, setApplication] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('pgs_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => null);

    getMyApplication()
      .then((data) => {
        setApplication(data.application);
        setDocuments(data.documents || []);
      })
      .catch((err) => setError(getApiError(err)));
  }, []);

  const status = application?.status || 'not_started';
  const canEdit = !application || ['draft', 'need_correction'].includes(status);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-pg-maroon text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-red-200 text-sm font-medium">Welcome back,</p>
            <h1 className="text-2xl font-extrabold">{user?.fullName || 'Student'}</h1>
            <p className="text-red-200 text-xs mt-0.5">Application ID: {application?.applicationId || 'Not submitted yet'}</p>
          </div>
          <Link to="/apply" className="bg-white text-pg-maroon text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-gray-100 transition-colors shadow">
            {canEdit ? 'Continue Application' : 'View Application'}
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Current Status</p>
                  <h2 className="mt-1 text-xl font-bold text-gray-900">{application?.educationLevel || 'Scholarship Application'}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {application?.submittedAt ? `Submitted ${new Date(application.submittedAt).toLocaleDateString()}` : 'Draft progress is saved automatically'}
                  </p>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${statusColors[status]}`}>
                  {statusLabels[status]}
                </span>
              </div>

              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">Application Completeness</span>
                  <span className="font-bold text-pg-maroon">{application?.completenessPercentage || 0}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-gradient-to-r from-pg-maroon to-pg-gold h-3 rounded-full" style={{ width: `${application?.completenessPercentage || 0}%` }} />
                </div>
              </div>
            </div>

            {application?.reviewRemarks && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                <h3 className="font-bold text-amber-900">Correction Remarks</h3>
                <p className="text-sm text-amber-800 mt-2">{application.reviewRemarks}</p>
              </div>
            )}

            <DetailGrid
              title="Personal Details"
              items={[
                ['Full legal name', application?.fullLegalName || user?.fullName],
                ['Date of birth', formatDate(application?.dateOfBirth)],
                ['Gender', application?.gender],
                ['District', application?.district || user?.district],
                ['Permanent address', application?.permanentAddress],
                ['Temporary address', application?.temporaryAddress],
              ]}
            />

            <DetailGrid
              title="Guardian Details"
              items={[
                ['Guardian full name', application?.guardianFullName],
                ['Guardian contact', application?.guardianContact],
                ['Minor applicant', application?.isMinor ? 'Yes' : application ? 'No' : '-'],
              ]}
            />

            <DetailGrid
              title="Academic Details"
              items={[
                ['Education level', application?.educationLevel],
                ['Current institution', application?.currentInstitution],
                ['GPA', application?.gpaPercentage],
                ['Family income range', application?.familyIncomeRange],
                ['Entrance exam score', application?.entranceExamScore],
              ]}
            />

            <DetailGrid
              title="Applicant Background"
              items={[
                ['Province', user?.province],
                ['District', application?.district || user?.district],
                ['Marginalized category', application?.marginalizedCategory],
                ['Disability status', application?.disabilityStatus ? 'Yes' : application ? 'No' : '-'],
              ]}
            />

            {application?.sop && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-3">Statement of Purpose</h3>
                <p className="text-sm leading-6 text-gray-700 whitespace-pre-wrap">{application.sop}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Uploaded Documents</h3>
              <div className="space-y-3">
                {documents.length ? documents.map((document) => (
                  <DashboardDocument key={document.id || document._id || document.documentType} document={document} />
                )) : <p className="text-sm text-gray-500">No documents uploaded yet.</p>}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link to="/apply" className="block p-3 rounded-xl hover:bg-gray-50 border border-gray-100 text-sm font-semibold text-gray-800">
                  {canEdit ? 'Edit Application' : 'Review Submitted Application'}
                </Link>
                <a href="mailto:scholarships@golyan.com" className="block p-3 rounded-xl hover:bg-gray-50 border border-gray-100 text-sm font-semibold text-gray-800">
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
