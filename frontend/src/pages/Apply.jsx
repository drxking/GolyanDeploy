import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiError, getFileUrl, saveSession } from '../api/client';
import { register } from '../api/authApi';
import {
  checkScholarshipAvailability,
  getMyApplication,
  getScholarshipCourses,
  saveAccountStep,
  saveAcademic,
  savePersonalInfo,
  submitApplication,
  uploadDocument,
  deleteDocument,
} from '../api/applicationApi';
import { createSubscription } from '../api/subscriptionApi';


const STEPS = ['Account', 'Personal Info', 'Academic', 'Documents', 'Review'];
const PROVINCES = ['Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpaschim'];
const DISTRICTS = [
  'Achham',
  'Arghakhanchi',
  'Baglung',
  'Baitadi',
  'Bajhang',
  'Bajura',
  'Banke',
  'Bara',
  'Bardiya',
  'Bhaktapur',
  'Bhojpur',
  'Chitwan',
  'Dadeldhura',
  'Dailekh',
  'Dang',
  'Darchula',
  'Dhading',
  'Dhankuta',
  'Dhanusa',
  'Dolakha',
  'Dolpa',
  'Doti',
  'Eastern Rukum',
  'Gorkha',
  'Gulmi',
  'Humla',
  'Ilam',
  'Jajarkot',
  'Jhapa',
  'Jumla',
  'Kailali',
  'Kalikot',
  'Kanchanpur',
  'Kapilvastu',
  'Kaski',
  'Kathmandu',
  'Kavrepalanchok',
  'Khotang',
  'Lalitpur',
  'Lamjung',
  'Mahottari',
  'Makwanpur',
  'Manang',
  'Morang',
  'Mugu',
  'Mustang',
  'Myagdi',
  'Nawalparasi',
  'Nawalpur',
  'Nuwakot',
  'Okhaldhunga',
  'Palpa',
  'Panchthar',
  'Parbat',
  'Parsa',
  'Pyuthan',
  'Ramechhap',
  'Rasuwa',
  'Rautahat',
  'Rolpa',
  'Rupandehi',
  'Salyan',
  'Sankhuwasabha',
  'Saptari',
  'Sarlahi',
  'Sindhuli',
  'Sindhupalchok',
  'Siraha',
  'Solukhumbu',
  'Sunsari',
  'Surkhet',
  'Syangja',
  'Tanahu',
  'Taplejung',
  'Terhathum',
  'Udayapur',
  'Western Rukum',
];

const EDUCATION_LEVELS = ['+2 / Higher Secondary', 'Bachelor', 'Master', 'PhD'];
const INCOME_RANGES = ['Below 1 Lakh', '1-3 Lakh', '3-5 Lakh', '5-10 Lakh', 'Above 10 Lakh'];
const CATEGORIES = ['None', 'Dalit', 'Janajati', 'Madhesi', 'Muslim', 'Person with Disability', 'Other'];
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const NOTIFICATION_OPTIONS = [
  ['newScholarshipOpenings', 'New Scholarship Openings', 'Be first to know when new scholarships are announced', 'T'],
  ['deadlineReminders', 'Deadline Reminders', 'Reminders before application deadlines close', 'D'],
  ['resultsAnnouncements', 'Results & Announcements', 'Scholarship results and winner announcements', 'R'],
  ['eligibilityCriteriaUpdates', 'Eligibility Criteria Updates', 'Changes to scholarship eligibility requirements', 'E'],
  ['meritBasedAwards', 'Merit-Based Awards', 'Special merit and excellence award opportunities', 'M'],
  ['internationalPrograms', 'International Programs', 'Global and cross-border scholarship opportunities', 'G'],
];

const DOCS = [
  { type: 'recent_photograph', label: 'Recent Photograph', hint: 'JPG or PNG, passport size' },
  { type: 'citizenship_front', label: 'Citizenship Front', hint: 'PDF, JPG, JPEG, or PNG' },
  { type: 'citizenship_back', label: 'Citizenship Back', hint: 'PDF, JPG, JPEG, or PNG' },
  { type: 'academic_transcript', label: 'Academic Transcript', hint: 'Most recent marksheet' },
  { type: 'character_certificate', label: 'Character Certificate', hint: 'From your institution' },
];
const GUARDIAN_DOC = { type: 'guardian_citizenship', label: 'Guardian Citizenship', hint: 'Required for applicants under 18' };

const emptyAccount = { fullName: '', email: '', mobileNumber: '', password: '', province: '', district: '' };
const emptyPersonal = {
  fullLegalName: '',
  dateOfBirth: '',
  gender: '',
  district: '',
  permanentAddress: '',
  temporaryAddress: '',
  guardianFullName: '',
  guardianContact: '',
};
const emptyAcademic = {
  educationLevel: '',
  desiredCourse: '',
  currentInstitution: '',
  gpaPercentage: '',
  familyIncomeRange: '',
  marginalizedCategory: 'None',
  sop: '',
  entranceExamScore: '',
};
const emptyInterest = {
  fullName: '',
  email: '',
  phoneNumber: '',
  programOfInterest: '',
  notificationPreferences: {
    newScholarshipOpenings: true,
    deadlineReminders: false,
    resultsAnnouncements: false,
    eligibilityCriteriaUpdates: false,
    meritBasedAwards: false,
    internationalPrograms: false,
  },
};

function documentActionError(error, fallback) {
  const message = getApiError(error);
  if (!message || message.toLowerCase().includes('something went wrong')) return fallback;
  return message;
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validMobile(mobile) {
  return /^(\+?977[-\s]?)?(97|98)\d{8}$/.test(String(mobile || '').replace(/\s/g, ''));
}

function isMinor(dateOfBirth) {
  if (!dateOfBirth) return false;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDelta = today.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age < 18;
}

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="form-label">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function TextInput({ value, onChange, type = 'text', placeholder, ...props }) {
  return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="form-input" {...props} />;
}

function SelectInput({ value, onChange, options, ...props }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="form-input" {...props}>
      <option value="">Select</option>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  );
}

function Stepper({ step, onSelect }) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between">
        {STEPS.map((label, index) => {
          const number = index + 1;
          const complete = step > number;
          const active = step === number;
          return (
            <React.Fragment key={label}>
              <button
                type="button"
                onClick={() => onSelect?.(number)}
                disabled={!onSelect}
                className="flex flex-col items-center min-w-0 disabled:cursor-default"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 text-sm font-bold ${complete ? 'bg-pg-maroon border-pg-maroon text-white' :
                  active ? 'bg-white border-pg-gold text-pg-maroon shadow-sm' :
                    'bg-white border-gray-200 text-gray-400'
                  }`}>
                  {complete ? '✓' : number}
                </div>
                <span className={`mt-2 text-xs font-semibold text-center hidden sm:block ${active ? 'text-pg-maroon' : 'text-gray-400'}`}>
                  {label}
                </span>
              </button>
              {index < STEPS.length - 1 && (
                <div className={`flex-1 h-1 mt-5 mx-2 rounded-full ${complete ? 'bg-pg-gold' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function FooterNav({ step, locked, saving, confirmation, onPrevious, onContinue, onSubmit }) {
  return (
    <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-3 items-center gap-3">
      <button
        type="button"
        onClick={onPrevious}
        disabled={step === 1}
        className="justify-self-start px-5 py-2.5 rounded-md border border-gray-300 text-sm font-semibold text-gray-700 disabled:text-gray-300 disabled:border-gray-200"
      >
        Previous
      </button>
      <span className="justify-self-center text-xs text-gray-400">{locked ? 'Read-only review' : saving ? 'Saving...' : 'Progress auto-saved'}</span>
      {step < 5 ? (
        <button type="button" onClick={onContinue} disabled={saving} className="btn-primary justify-self-end px-8 py-2.5 text-sm disabled:opacity-50">
          {locked ? 'Next' : 'Continue'}
        </button>
      ) : locked ? (
        <Link to="/dashboard" className="justify-self-end bg-white border border-pg-maroon text-pg-maroon font-bold px-6 py-2.5 rounded-md text-sm hover:bg-red-50">
          Dashboard
        </Link>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          disabled={!confirmation || locked}
          className="justify-self-end bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2.5 rounded-md text-sm disabled:bg-gray-300"
        >
          Submit
        </button>
      )}
    </div>
  );
}

function getDocumentUrl(file) {
  return getFileUrl(file);
}

function getDocumentKind(file) {
  const mimeType = file?.mimeType || '';
  const fileName = file?.fileName || '';
  if (mimeType.startsWith('image/') || /\.(jpe?g|png)$/i.test(fileName)) return 'image';
  if (mimeType === 'application/pdf' || /\.pdf$/i.test(fileName)) return 'pdf';
  return 'file';
}

function DocumentPreview({ file }) {
  const previewUrl = getDocumentUrl(file);
  if (!previewUrl) return null;

  const kind = getDocumentKind(file);

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
      {kind === 'image' && (
        <img
          src={previewUrl}
          alt={`${file.fileName || 'Document'} preview`}
          className="h-40 w-full object-contain bg-gray-100"
        />
      )}
      {kind === 'pdf' && (
        <iframe
          src={previewUrl}
          title={`${file.fileName || 'Document'} preview`}
          className="h-40 w-full bg-gray-100"
        />
      )}
      <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-3 py-2">
        <span className="min-w-0 truncate text-xs text-gray-600">{file.fileName || 'Uploaded document'}</span>
        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-xs font-semibold text-pg-maroon hover:text-pg-maroon-light"
        >
          Open
        </a>
      </div>
    </div>
  );
}

function InterestCaptureForm({
  interest,
  errors,
  saving,
  saved,
  selectedLevel,
  selectedCourse,
  onChange,
  onPreferenceChange,
  onSubmit,
  onBack,
}) {
  return (
    <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
      <div className="mb-8 ">
        <p className='bg-pg-maroon mb-4 text-white p-2  rounded-md text-sm font-medium'>That course is unavailable at the current moment! Fill up the details and we will contact you when it will be available</p>
        <h2 className="text-xl font-extrabold text-pg-maroon">Personal Information</h2>
      </div>

      {saved && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          Your notification request has been saved.
        </div>
      )}

      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Full Name" required error={errors.interestFullName}>
            <TextInput value={interest.fullName} onChange={(value) => onChange('fullName', value)} placeholder="Full Name *" />
          </Field>
          <Field label="Email Address" required error={errors.interestEmail}>
            <TextInput type="email" value={interest.email} onChange={(value) => onChange('email', value)} placeholder="Email Address *" />
            <p className="mt-1 text-xs text-gray-500">Notifications will be sent to this email</p>
          </Field>
          <Field label="Phone Number" error={errors.interestPhoneNumber}>
            <TextInput value={interest.phoneNumber} onChange={(value) => onChange('phoneNumber', value)} placeholder="Phone Number" />
          </Field>
          <Field label="Program of Interest">
            <TextInput value={interest.programOfInterest} onChange={(value) => onChange('programOfInterest', value)} placeholder="Program of Interest" />
          </Field>
        </div>

        <div className="my-9 border-t border-gray-200" />

        <section>
          <div className="flex items-center gap-3">
            {/* <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-sm font-black text-blue-700">!</span> */}
            <h3 className="text-xl font-extrabold ">Notification Preferences</h3>
          </div>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-gray-600">
            Scholarship programs open at specific times. Select the topics below to receive targeted notifications directly to your email when relevant programs become available.
          </p>

          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {NOTIFICATION_OPTIONS.map(([key, title, description, icon]) => (
              <label key={key} className="flex min-h-[84px] cursor-pointer items-start gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 hover:border-blue-200">
                <input
                  type="checkbox"
                  checked={Boolean(interest.notificationPreferences[key])}
                  onChange={(event) => onPreferenceChange(key, event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-700"
                />
                <span>
                  <span className="block text-sm font-bold">{title}</span>
                  <span className="mt-1 block text-sm leading-5 text-gray-600">{description}</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={onBack} className="text-sm font-semibold text-pg-maroon hover:underline">
            Choose another course
          </button>
          <button type="submit" disabled={saving} className="inline-flex items-center justify-center rounded-lg bg-pg-maroon px-10 py-3 text-sm font-extrabold text-white shadow-md hover:bg-pg-maroon/80 disabled:opacity-50">
            {saving ? 'Saving...' : 'Submit Application'}
            <span className="ml-3 text-xl leading-none">&gt;</span>
          </button>
        </div>

        <p className="mt-5 text-xs text-gray-500">
          Selected unavailable course: {selectedLevel} - {selectedCourse}
        </p>
      </form>
    </div>
  );
}

function UploadBox({ doc, uploaded, preview, disabled, status, onUpload, onDelete }) {
  const previewFile = preview || uploaded;
  const busy = status === 'Uploading...' || status === 'Removing...';
  const controlsDisabled = disabled || busy;

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 p-5 hover:border-pg-gold transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{doc.label}<span className="text-red-500 ml-0.5">*</span></p>
          <p className="text-xs text-gray-500 mt-1">{doc.hint}</p>
          {uploaded && <p className="text-xs text-green-700 mt-2 truncate max-w-[240px]">{uploaded.fileName}</p>}
          {!uploaded && preview && <p className="text-xs text-pg-maroon mt-2 truncate max-w-[240px]">{preview.fileName}</p>}
          {status && <p className="text-xs text-pg-maroon mt-2">{status}</p>}
        </div>
        <label className={`px-3 py-2 rounded-md text-xs font-bold ${controlsDisabled ? 'bg-gray-200 text-gray-400' : 'bg-white border border-pg-maroon text-pg-maroon cursor-pointer'}`}>
          {uploaded ? 'Re-upload' : 'Upload'}
          <input
            type="file"
            className="hidden"
            disabled={controlsDisabled}
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => {
              if (e.target.files?.[0]) onUpload(doc.type, e.target.files[0]);
              e.target.value = '';
            }}
          />
        </label>
      </div>
      <DocumentPreview file={previewFile} />
      {uploaded && !disabled && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onDelete(doc.type)}
          className="mt-4 text-xs font-semibold text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:text-gray-400"
        >
          Remove document
        </button>
      )}
    </div>
  );
}

export default function Apply() {
  const [step, setStep] = useState(1);
  const [account, setAccount] = useState(emptyAccount);
  const [personal, setPersonal] = useState(emptyPersonal);
  const [academic, setAcademic] = useState(emptyAcademic);
  const [scholarships, setScholarships] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [interest, setInterest] = useState(emptyInterest);
  const [interestSaved, setInterestSaved] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(Boolean(localStorage.getItem('pgs_token')));
  const [documents, setDocuments] = useState([]);
  const [application, setApplication] = useState(null);
  const [confirmation, setConfirmation] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('pgs_token')));
  const [uploadStatus, setUploadStatus] = useState({});
  const [documentPreviews, setDocumentPreviews] = useState({});
  const documentPreviewsRef = useRef({});
  const [submittedId, setSubmittedId] = useState('');
  const readableMessage = typeof message === 'string' ? message : '';

  const locked = application && !['draft', 'need_correction'].includes(application.status);
  const applicantIsMinor = isMinor(personal.dateOfBirth) || application?.isMinor;
  const courseOptions = useMemo(() => {
    const group = scholarships.find((item) => item.educationLevel === academic.educationLevel);
    return group?.courses?.map((course) => course.name) || [];
  }, [academic.educationLevel, scholarships]);
  const requiredDocs = useMemo(() => applicantIsMinor ? [...DOCS, GUARDIAN_DOC] : DOCS, [applicantIsMinor]);
  const documentsByType = useMemo(() => {
    return documents.reduce((acc, document) => ({ ...acc, [document.documentType]: document }), {});
  }, [documents]);

  useEffect(() => {
    const token = localStorage.getItem('pgs_token');
    const user = localStorage.getItem('pgs_user');
    if (user) {
      const parsed = JSON.parse(user);
      setAccount((current) => ({
        ...current,
        fullName: parsed.fullName || '',
        email: parsed.email || '',
        mobileNumber: parsed.mobileNumber || '',
        province: parsed.province || '',
        district: parsed.district || '',
      }));
      setInterest((current) => ({
        ...current,
        fullName: parsed.fullName || current.fullName,
        email: parsed.email || current.email,
        phoneNumber: parsed.mobileNumber || current.phoneNumber,
      }));
    }
    if (!token) return;

    getMyApplication()
      .then(({ application: app, documents: docs }) => {
        setApplication(app);
        setDocuments(docs || []);
        setStep(Math.min(app.currentStep || 1, 5));
        setSubmittedId(app.applicationId || '');
        setShowApplicationForm(Boolean(app.desiredCourse) || !['draft', 'need_correction'].includes(app.status));
        setPersonal({
          fullLegalName: app.fullLegalName || '',
          dateOfBirth: app.dateOfBirth ? app.dateOfBirth.slice(0, 10) : '',
          gender: app.gender || '',
          district: app.district || '',
          permanentAddress: app.permanentAddress || '',
          temporaryAddress: app.temporaryAddress || '',
          guardianFullName: app.guardianFullName || '',
          guardianContact: app.guardianContact || '',
        });
        setAcademic({
          educationLevel: app.educationLevel || '',
          desiredCourse: app.desiredCourse || '',
          currentInstitution: app.currentInstitution || '',
          gpaPercentage: app.gpaPercentage || '',
          familyIncomeRange: app.familyIncomeRange || '',
          marginalizedCategory: app.marginalizedCategory || 'None',
          sop: app.sop || '',
          entranceExamScore: app.entranceExamScore || '',
        });
      })
      .catch((error) => setMessage(getApiError(error)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getScholarshipCourses()
      .then(({ scholarships: items }) => setScholarships(items || []))
      .catch((error) => setMessage(getApiError(error)));
  }, []);

  useEffect(() => {
    documentPreviewsRef.current = documentPreviews;
  }, [documentPreviews]);

  useEffect(() => {
    return () => {
      Object.values(documentPreviewsRef.current).forEach((preview) => URL.revokeObjectURL(preview.fileUrl));
    };
  }, []);

  const patchPersonal = (field, value) => setPersonal((current) => ({ ...current, [field]: value }));
  const patchAcademic = (field, value) => {
    setAcademic((current) => {
      const next = { ...current, [field]: value };
      if (field === 'educationLevel') next.desiredCourse = '';
      return next;
    });
    if (field === 'educationLevel' || field === 'desiredCourse') {
      setAvailability(null);
      setInterestSaved(false);
    }
  };
  const patchAccount = (field, value) => setAccount((current) => ({ ...current, [field]: value }));
  const patchInterest = (field, value) => setInterest((current) => ({ ...current, [field]: value }));
  const patchInterestPreference = (field, value) => {
    setInterest((current) => ({
      ...current,
      notificationPreferences: { ...current.notificationPreferences, [field]: value },
    }));
  };

  async function handleAvailabilityCheck() {
    setMessage('');
    setErrors({});
    const next = {};
    if (!academic.educationLevel) next.educationLevel = 'Education level is required';
    if (!academic.desiredCourse) next.desiredCourse = 'Desired course is required';
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    try {
      setCheckingAvailability(true);
      const result = await checkScholarshipAvailability({
        educationLevel: academic.educationLevel,
        desiredCourse: academic.desiredCourse,
      });
      setAvailability(result);
      if (result.available) {
        setAcademic((current) => ({
          ...current,
          educationLevel: result.educationLevel,
          desiredCourse: result.desiredCourse,
        }));
        setShowApplicationForm(true);
      } else {
        setInterest((current) => ({
          ...current,
          fullName: current.fullName || account.fullName,
          email: current.email || account.email,
          phoneNumber: current.phoneNumber || account.mobileNumber,
          programOfInterest: current.programOfInterest || `${result.educationLevel} - ${result.desiredCourse}`,
        }));
      }
    } catch (error) {
      setMessage(getApiError(error));
    } finally {
      setCheckingAvailability(false);
    }
  }
  let navigate = useNavigate();


  async function submitInterest(event) {
    event.preventDefault();
    setMessage('');
    const next = {};
    if (!interest.fullName.trim()) next.interestFullName = 'Full name is required';
    if (!validEmail(interest.email)) next.interestEmail = 'Enter a valid email address';
    if (interest.phoneNumber && !validMobile(interest.phoneNumber)) next.interestPhoneNumber = 'Enter a valid Nepal mobile number';
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      setSaving(true);
      await createSubscription({
        fullName: interest.fullName.trim(),
        email: interest.email.trim(),
        phoneNumber: interest.phoneNumber.trim(),
        programOfInterest: interest.programOfInterest.trim() || `${academic.educationLevel} - ${academic.desiredCourse}`,
        targetLevel: academic.educationLevel,
        targetCourse: academic.desiredCourse,
        notificationPreferences: interest.notificationPreferences,
        source: 'apply_unavailable_course',
      });
      setInterestSaved(true);
      setMessage('');
      navigate("/")

    } catch (error) {
      setMessage(getApiError(error));
    } finally {
      setSaving(false);
    }
  }

  function validateAccount() {
    const next = {};
    if (!account.fullName.trim()) next.fullName = 'Full name is required';
    if (!validEmail(account.email)) next.email = 'Enter a valid email address';
    if (!validMobile(account.mobileNumber)) next.mobileNumber = 'Enter a valid Nepal mobile number';
    if (!account.password && !localStorage.getItem('pgs_token')) next.password = 'Password is required';
    if (!account.province) next.province = 'Province is required';
    if (!account.district) next.district = 'District is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validatePersonal() {
    const next = {};
    ['fullLegalName', 'dateOfBirth', 'gender', 'district', 'permanentAddress', 'guardianFullName', 'guardianContact'].forEach((field) => {
      if (!personal[field]) next[field] = 'Required';
    });
    if (personal.dateOfBirth && new Date(personal.dateOfBirth) > new Date()) next.dateOfBirth = 'Date of birth cannot be in the future';
    if (personal.guardianContact && !validMobile(personal.guardianContact)) next.guardianContact = 'Enter a valid mobile number';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateAcademic() {
    const next = {};
    ['educationLevel', 'desiredCourse', 'currentInstitution', 'gpaPercentage', 'familyIncomeRange'].forEach((field) => {
      if (!academic[field]) next[field] = 'Required';
    });
    if (academic.gpaPercentage) {
      const gpa = Number(academic.gpaPercentage);
      if (!/^\d+(\.\d+)?$/.test(academic.gpaPercentage) || gpa < 0 || gpa > 4) {
        next.gpaPercentage = 'Use a GPA from 0.0 to 4.0';
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateDocuments() {
    const missing = requiredDocs.filter((doc) => !documentsByType[doc.type]).map((doc) => doc.label);
    if (missing.length) {
      setMessage(`${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} required`);
      return false;
    }
    setMessage('');
    return true;
  }

  async function continueStep() {
    setMessage('');
    if (locked) {
      setStep((current) => Math.min(current + 1, 5));
      return;
    }

    try {
      setSaving(true);
      if (step === 1) {
        if (!validateAccount()) return;
        if (!localStorage.getItem('pgs_token')) {
          const session = await register(account);
          saveSession(session);
        }
        const data = await saveAccountStep();
        setApplication(data.application);
        setDocuments(data.documents || []);
      }
      if (step === 2) {
        if (!validatePersonal()) return;
        const data = await savePersonalInfo(personal);
        setApplication(data.application);
        setDocuments(data.documents || []);
      }
      if (step === 3) {
        if (!validateAcademic()) return;
        const result = await checkScholarshipAvailability({
          educationLevel: academic.educationLevel,
          desiredCourse: academic.desiredCourse,
        });
        if (!result.available) {
          setAvailability(result);
          setMessage('Scholarship is not currently available for the selected course');
          return;
        }
        const data = await saveAcademic(academic);
        setApplication(data.application);
        setDocuments(data.documents || []);
      }
      if (step === 4 && !validateDocuments()) return;
      setStep((current) => Math.min(current + 1, 5));
      setErrors({});
    } catch (error) {
      setMessage(getApiError(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(documentType, file) {
    setMessage('');
    if (!ALLOWED_TYPES.includes(file.type)) {
      setMessage('Only PDF, JPG, JPEG, and PNG files are allowed');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setMessage('File size must be 10MB or less');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setDocumentPreviews((current) => {
      if (current[documentType]) URL.revokeObjectURL(current[documentType].fileUrl);
      return {
        ...current,
        [documentType]: {
          fileUrl: previewUrl,
          fileName: file.name,
          mimeType: file.type,
        },
      };
    });

    try {
      setUploadStatus((current) => ({ ...current, [documentType]: 'Uploading...' }));
      const data = await uploadDocument(documentType, file);
      setApplication(data.application);
      const refreshed = await getMyApplication();
      setDocuments(refreshed.documents || []);
      setDocumentPreviews((current) => {
        if (current[documentType]) URL.revokeObjectURL(current[documentType].fileUrl);
        const next = { ...current };
        delete next[documentType];
        return next;
      });
      setUploadStatus((current) => ({ ...current, [documentType]: 'Uploaded' }));
    } catch (error) {
      setDocumentPreviews((current) => {
        if (current[documentType]) URL.revokeObjectURL(current[documentType].fileUrl);
        const next = { ...current };
        delete next[documentType];
        return next;
      });
      setUploadStatus((current) => ({ ...current, [documentType]: '' }));
      setMessage(documentActionError(error, 'Could not upload this document. Please try again.'));
    }
  }

  async function handleDeleteDocument(documentType) {
    setMessage('');
    try {
      setUploadStatus((current) => ({ ...current, [documentType]: 'Removing...' }));
      const data = await deleteDocument(documentType);
      setApplication(data.application);
      setDocuments(data.documents || []);
      setDocumentPreviews((current) => {
        if (current[documentType]) URL.revokeObjectURL(current[documentType].fileUrl);
        const next = { ...current };
        delete next[documentType];
        return next;
      });
      setUploadStatus((current) => ({ ...current, [documentType]: '' }));
      setMessage('Document removed successfully');
    } catch (error) {
      setUploadStatus((current) => ({ ...current, [documentType]: '' }));
      setMessage(documentActionError(error, 'Could not remove this document. Please refresh and try again.'));
    }
  }

  async function handleSubmit() {
    if (!validatePersonal() || !validateAcademic() || !validateDocuments()) return;
    try {
      setSaving(true);
      const data = await submitApplication({ confirmationAccepted: confirmation });
      setSubmittedId(data.applicationId);
      setApplication(data.application);
      setMessage('Application submitted successfully');
    } catch (error) {
      setMessage(getApiError(error));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 py-16 text-center text-gray-500">Loading application...</div>;
  }

  if (!showApplicationForm) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-gray-900">Check Scholarship Availability</h1>
            <p className="mt-2 text-gray-500">Select your education level and desired course before starting the application.</p>
          </div>

          {readableMessage && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {readableMessage}
            </div>
          )}

          {availability && !availability.available ? (
            <InterestCaptureForm
              interest={interest}
              errors={errors}
              saving={saving}
              saved={interestSaved}
              selectedLevel={academic.educationLevel}
              selectedCourse={academic.desiredCourse}
              onChange={patchInterest}
              onPreferenceChange={patchInterestPreference}
              onSubmit={submitInterest}
              onBack={() => {
                setAvailability(null);
                setInterestSaved(false);
              }}
            />
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Education Level" required error={errors.educationLevel}>
                  <SelectInput
                    value={academic.educationLevel}
                    onChange={(value) => patchAcademic('educationLevel', value)}
                    options={scholarships.map((item) => item.educationLevel)}
                  />
                </Field>
                <Field label="Desired Course" required error={errors.desiredCourse}>
                  <SelectInput
                    value={academic.desiredCourse}
                    onChange={(value) => patchAcademic('desiredCourse', value)}
                    options={courseOptions}
                    disabled={!academic.educationLevel}
                  />
                </Field>
              </div>

              {availability && (
                <div className={`mt-5 rounded-lg border px-4 py-3 text-sm ${availability.available ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                  {availability.message}
                </div>
              )}

              <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-100 pt-6">
                <Link to="/#scholarships" className="text-sm font-semibold text-pg-maroon hover:underline">
                  View scholarship categories
                </Link>
                <button
                  type="button"
                  onClick={handleAvailabilityCheck}
                  disabled={checkingAvailability}
                  className="btn-primary px-8 py-2.5 text-sm disabled:opacity-50"
                >
                  {checkingAvailability ? 'Checking...' : 'Check Availability'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900">Scholarship Application</h1>
          <p className="mt-2 text-gray-500">Complete all steps to submit your Pawan Golyan Scholarship application.</p>
        </div>

        <Stepper step={step} onSelect={locked ? setStep : undefined} />

        {readableMessage && (
          <div className={`mb-5 rounded-lg border px-4 py-3 text-sm ${readableMessage.includes('success') ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {readableMessage}
          </div>
        )}

        {locked && (
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <span>Submitted application is locked for editing. Application ID: <strong>{application.applicationId}</strong></span>
            <Link to="/dashboard" className="font-bold text-green-900 hover:underline">Back to dashboard</Link>
          </div>
        )}

        {!locked && academic.educationLevel && academic.desiredCourse && (
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <span>Scholarship available for <strong>{academic.educationLevel}</strong> - <strong>{academic.desiredCourse}</strong>.</span>
            <button
              type="button"
              onClick={() => {
                setShowApplicationForm(false);
                setAvailability(null);
                setStep(1);
              }}
              className="font-bold text-green-900 hover:underline"
            >
              Change course
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
          <div className="mb-6 pb-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-pg-gold uppercase tracking-widest">Step {step} of 5</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">{STEPS[step - 1]}</h2>
          </div>

          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Full Name" required error={errors.fullName}><TextInput value={account.fullName} onChange={(value) => patchAccount('fullName', value)} placeholder="As on official document" disabled={locked} /></Field>
              <Field label="Email Address" required error={errors.email}><TextInput type="email" value={account.email} onChange={(value) => patchAccount('email', value)} placeholder="you@email.com" disabled={locked} /></Field>
              <Field label="Mobile Number" required error={errors.mobileNumber}><TextInput value={account.mobileNumber} onChange={(value) => patchAccount('mobileNumber', value)} placeholder="+977-98XXXXXXXX" disabled={locked} /></Field>
              <Field label="Password" required error={errors.password}><TextInput type="password" value={account.password} onChange={(value) => patchAccount('password', value)} placeholder="Create a password" disabled={locked} /></Field>
              <Field label="Province" required error={errors.province}><SelectInput value={account.province} onChange={(value) => patchAccount('province', value)} options={PROVINCES} disabled={locked} /></Field>
              <Field label="District" required error={errors.district}><SelectInput value={account.district} onChange={(value) => patchAccount('district', value)} options={DISTRICTS} disabled={locked} /></Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Full Legal Name" required error={errors.fullLegalName}><TextInput value={personal.fullLegalName} onChange={(value) => patchPersonal('fullLegalName', value)} disabled={locked} /></Field>
                <Field label="Date of Birth" required error={errors.dateOfBirth}><TextInput type="date" value={personal.dateOfBirth} onChange={(value) => patchPersonal('dateOfBirth', value)} disabled={locked} /></Field>
                <Field label="Gender" required error={errors.gender}><SelectInput value={personal.gender} onChange={(value) => patchPersonal('gender', value)} options={['Male', 'Female', 'Other', 'Prefer not to say']} disabled={locked} /></Field>
                <Field label="District" required error={errors.district}><SelectInput value={personal.district} onChange={(value) => patchPersonal('district', value)} options={DISTRICTS} disabled={locked} /></Field>
                <Field label="Permanent Address" required error={errors.permanentAddress}><TextInput value={personal.permanentAddress} onChange={(value) => patchPersonal('permanentAddress', value)} disabled={locked} /></Field>
                <Field label="Temporary Address"><TextInput value={personal.temporaryAddress} onChange={(value) => patchPersonal('temporaryAddress', value)} disabled={locked} /></Field>
                <Field label="Guardian Full Name" required error={errors.guardianFullName}><TextInput value={personal.guardianFullName} onChange={(value) => patchPersonal('guardianFullName', value)} disabled={locked} /></Field>
                <Field label="Guardian Contact" required error={errors.guardianContact}><TextInput value={personal.guardianContact} onChange={(value) => patchPersonal('guardianContact', value)} disabled={locked} /></Field>
              </div>
              {applicantIsMinor && <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">Guardian citizenship will be required in the document step.</div>}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Current / Target Education Level" required error={errors.educationLevel}><SelectInput value={academic.educationLevel} onChange={(value) => patchAcademic('educationLevel', value)} options={EDUCATION_LEVELS} disabled={locked} /></Field>
                <Field label="Desired Course" required error={errors.desiredCourse}><SelectInput value={academic.desiredCourse} onChange={(value) => patchAcademic('desiredCourse', value)} options={courseOptions} disabled={locked || !academic.educationLevel} /></Field>
                <Field label="Current Institution" required error={errors.currentInstitution}><TextInput value={academic.currentInstitution} onChange={(value) => patchAcademic('currentInstitution', value)} disabled={locked} /></Field>
                <Field label="GPA" required error={errors.gpaPercentage}><TextInput type="number" step="0.01" min="0" max="4" value={academic.gpaPercentage} onChange={(value) => patchAcademic('gpaPercentage', value)} placeholder="3.6" disabled={locked} /></Field>
                <Field label="Family Annual Income" required error={errors.familyIncomeRange}><SelectInput value={academic.familyIncomeRange} onChange={(value) => patchAcademic('familyIncomeRange', value)} options={INCOME_RANGES} disabled={locked} /></Field>
                <Field label="Marginalized Category"><SelectInput value={academic.marginalizedCategory} onChange={(value) => patchAcademic('marginalizedCategory', value)} options={CATEGORIES} disabled={locked} /></Field>
                <Field label="Entrance Exam Score"><TextInput value={academic.entranceExamScore} onChange={(value) => patchAcademic('entranceExamScore', value)} disabled={locked} /></Field>
              </div>
              <Field label="SOP / Personal Statement">
                <textarea value={academic.sop} onChange={(e) => patchAcademic('sop', e.target.value)} rows="5" className="form-input" disabled={locked} />
              </Field>
            </div>
          )}

          {step === 4 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {requiredDocs.map((doc) => (
                <UploadBox
                  key={doc.type}
                  doc={doc}
                  uploaded={documentsByType[doc.type]}
                  preview={documentPreviews[doc.type]}
                  disabled={locked}
                  status={uploadStatus[doc.type]}
                  onUpload={handleUpload}
                  onDelete={handleDeleteDocument}
                />
              ))}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <h3 className="text-xl font-bold text-green-800">{submittedId ? 'Application Submitted' : 'Almost Done'}</h3>
                <p className="text-green-700 mt-2 text-sm">
                  {submittedId ? `Your Application ID is ${submittedId}.` : 'Review your information carefully before final submission.'}
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                <strong>Checklist before submitting:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>All required documents are uploaded</li>
                  <li>Personal information is accurate</li>
                  <li>Mobile number is correct</li>
                  <li>Student agrees to scholarship terms and conditions</li>
                </ul>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={confirmation} onChange={(e) => setConfirmation(e.target.checked)} className="mt-1 h-4 w-4 text-pg-maroon border-gray-300 rounded" disabled={locked} />
                <span className="text-sm text-gray-600">I confirm that all information provided is true and accurate.</span>
              </label>
            </div>
          )}

          <FooterNav
            step={step}
            locked={locked}
            saving={saving}
            confirmation={confirmation}
            onPrevious={() => setStep((current) => Math.max(current - 1, 1))}
            onContinue={continueStep}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
