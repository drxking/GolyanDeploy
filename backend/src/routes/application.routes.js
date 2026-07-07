const express = require('express');
const Application = require('../models/Application');
const Document = require('../models/Document');
const ApiError = require('../utils/apiError');
const { requireAuth } = require('../middleware/auth');
const { uploadMiddleware, uploadFile, deleteFile } = require('../storage');
const { checkScholarshipAvailability, listScholarships } = require('../data/scholarships');

const router = express.Router();

const REQUIRED_DOCUMENTS = [
  'recent_photograph',
  'citizenship_front',
  'citizenship_back',
  'academic_transcript',
  'character_certificate',
];

function success(res, message, data = {}) {
  res.json({ success: true, message, data });
}

function removeUndefined(input) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}

function normalizeApplicationPayload(body) {
  return removeUndefined({
    educationLevel: body.educationLevel || body.education_level,
    desiredCourse: body.desiredCourse || body.desired_course,
    scholarshipAvailable: body.scholarshipAvailable || body.scholarship_available || false,
    currentInstitution: body.currentInstitution || body.current_institution,
    gpaPercentage: body.gpaPercentage || body.gpa_percentage || body.gpa,
    familyIncomeRange: body.familyIncomeRange || body.family_income_range,
    district: body.district,
    gender: body.gender,
    permanentAddress: body.permanentAddress || body.permanent_address,
    temporaryAddress: body.temporaryAddress || body.temporary_address,
    guardianFullName: body.guardianFullName || body.guardian_full_name,
    guardianContact: body.guardianContact || body.guardian_contact,
    marginalizedCategory: body.marginalizedCategory || body.marginalized_category,
    disabilityStatus: body.disabilityStatus || body.disability_status || false,
    sop: body.sop,
    entranceExamScore: body.entranceExamScore || body.entrance_exam_score,
    completenessPercentage: body.completenessPercentage || body.completeness_percentage,
    applicationData: body.applicationData || body.application_data || {},
  });
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function validateMobile(mobile) {
  return /^(\+?977[-\s]?)?(97|98)\d{8}$/.test(String(mobile || '').replace(/\s/g, ''));
}

function validateGpa(value) {
  const raw = String(value || '').trim();
  if (/^\d+(\.\d+)?$/.test(raw)) {
    const number = Number(raw);
    return number >= 0 && number <= 4;
  }
  return false;
}

function calculateIsMinor(dateOfBirth) {
  if (!dateOfBirth) return false;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDelta = today.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age < 18;
}

function ensureEditable(application) {
  if (application.status !== 'draft' && application.status !== 'need_correction') {
    throw new ApiError(400, 'Submitted application is locked from editing');
  }
}

async function getOrCreateApplication(userId) {
  let application = await Application.findOne({ user: userId });
  if (!application) {
    application = await Application.create({
      user: userId,
      status: 'draft',
      currentStep: 1,
      timeline: [{ label: 'Application Started', date: new Date(), done: true }],
    });
  }
  return application;
}

function documentTypesFor(application) {
  return application.isMinor ? [...REQUIRED_DOCUMENTS, 'guardian_citizenship'] : REQUIRED_DOCUMENTS;
}

async function serializeApplication(application) {
  const documents = await Document.find({ application: application.id }).sort({ createdAt: -1 });
  return { application, documents };
}

async function cleanupDocumentFile(document) {
  try {
    const result = await deleteFile(document);
    if (result?.result && result.result !== 'ok') {
      console.warn('Document file cleanup did not remove a provider asset', {
        documentId: document?.id || document?._id,
        documentType: document?.documentType,
        key: document?.key || document?.filePath,
        providerResult: result.result,
      });
    }
  } catch (error) {
    console.warn('Document file cleanup failed', {
      documentId: document?.id || document?._id,
      documentType: document?.documentType,
      key: document?.key || document?.filePath,
      message: error.message,
    });
  }
}

async function validateReadyForSubmission(application, confirmationAccepted) {
  if (!confirmationAccepted) throw new ApiError(400, 'Confirmation is required before submission');

  const user = await application.populate('user', 'fullName email mobileNumber province district');
  if (!user.user.fullName || !validateEmail(user.user.email) || !validateMobile(user.user.mobileNumber)) {
    throw new ApiError(400, 'Complete account information is required');
  }
  if (!user.user.province || !user.user.district) throw new ApiError(400, 'Province and district are required');

  const personalRequired = [
    ['fullLegalName', 'Full legal name is required'],
    ['dateOfBirth', 'Date of birth is required'],
    ['gender', 'Gender is required'],
    ['district', 'District is required'],
    ['permanentAddress', 'Permanent address is required'],
    ['guardianFullName', 'Guardian full name is required'],
    ['guardianContact', 'Guardian contact is required'],
  ];
  for (const [field, message] of personalRequired) {
    if (!application[field]) throw new ApiError(400, message);
  }

  const academicRequired = [
    ['educationLevel', 'Education level is required'],
    ['desiredCourse', 'Desired course is required'],
    ['currentInstitution', 'Current institution is required'],
    ['gpaPercentage', 'GPA is required'],
    ['familyIncomeRange', 'Family annual income is required'],
  ];
  for (const [field, message] of academicRequired) {
    if (!application[field]) throw new ApiError(400, message);
  }
  if (!validateGpa(application.gpaPercentage)) {
    throw new ApiError(400, 'GPA must be between 0.0 and 4.0');
  }
  if (!checkScholarshipAvailability(application.educationLevel, application.desiredCourse).available) {
    throw new ApiError(400, 'Scholarship is not currently available for the selected course');
  }

  const docs = await Document.find({ application: application.id });
  const uploadedTypes = new Set(docs.map((doc) => doc.documentType));
  for (const type of documentTypesFor(application)) {
    if (!uploadedTypes.has(type)) {
      throw new ApiError(400, `${type.replace(/_/g, ' ')} is required`);
    }
  }
}

async function handleDocumentUpload(req, res, next) {
  try {
    const application = await getOrCreateApplication(req.user.id);
    ensureEditable(application);
    const documentType = req.body.documentType || req.body.document_type;
    const allowedTypes = [...REQUIRED_DOCUMENTS, 'guardian_citizenship'];
    if (!allowedTypes.includes(documentType)) throw new ApiError(400, 'Invalid document type');

    const oldDocument = await Document.findOne({ application: application.id, documentType });

    const uploadedFile = await uploadFile(req.file, {
      userId: req.user.id,
      folder: documentType,
    });

    const document = await Document.create({
      application: application.id,
      user: req.user.id,
      documentType,
      provider: uploadedFile.provider,
      key: uploadedFile.key,
      resourceType: uploadedFile.resourceType,
      filePath: uploadedFile.filePath,
      fileUrl: uploadedFile.fileUrl,
      fileName: uploadedFile.fileName,
      mimeType: uploadedFile.mimeType,
      size: uploadedFile.size,
    });

    application.documents = application.documents.filter((doc) => doc.documentType !== documentType);
    application.documents.push({
      documentType,
      fileName: document.fileName,
      filePath: document.filePath,
      fileUrl: document.fileUrl,
      fileSize: document.size,
      mimeType: document.mimeType,
      uploadedAt: document.createdAt,
      verifiedStatus: document.verificationStatus,
    });
    application.currentStep = Math.max(application.currentStep || 1, 5);
    application.completenessPercentage = Math.max(application.completenessPercentage || 0, 80);
    await application.save();

    if (oldDocument) {
      await Document.deleteOne({ _id: oldDocument.id });
      await cleanupDocumentFile(oldDocument);
    }

    success(res, 'Document uploaded successfully', { document, application });
  } catch (error) {
    next(error);
  }
}

router.get('/scholarships', (req, res) => {
  success(res, 'Scholarship courses loaded', { scholarships: listScholarships(req.query.educationLevel) });
});

router.post('/scholarships/check', (req, res, next) => {
  try {
    const educationLevel = req.body.educationLevel || req.body.education_level;
    const desiredCourse = req.body.desiredCourse || req.body.desired_course;
    if (!educationLevel || !desiredCourse) {
      throw new ApiError(400, 'Education level and desired course are required');
    }
    success(res, 'Scholarship availability checked', checkScholarshipAvailability(educationLevel, desiredCourse));
  } catch (error) {
    next(error);
  }
});

router.use(requireAuth);

router.get('/me', async (req, res, next) => {
  try {
    const application = await getOrCreateApplication(req.user.id);
    const data = await serializeApplication(application);
    success(res, 'Application loaded', data);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const existing = await Application.findOne({ user: req.user.id });
    if (existing) throw new ApiError(400, 'User already has an application');

    const payload = normalizeApplicationPayload(req.body);
    if (payload.educationLevel || payload.desiredCourse) {
      const availability = checkScholarshipAvailability(payload.educationLevel, payload.desiredCourse);
      if (!availability.available) throw new ApiError(400, 'Scholarship is not currently available for the selected course');
      payload.scholarshipAvailable = true;
      payload.educationLevel = availability.educationLevel;
      payload.desiredCourse = availability.desiredCourse;
    }
    const application = await Application.create({
      ...payload,
      user: req.user.id,
      currentStep: 3,
      timeline: [{ label: 'Application Started', date: new Date(), done: true }],
    });

    success(res, 'Application created', { application });
  } catch (error) {
    next(error);
  }
});

router.patch('/account', async (req, res, next) => {
  try {
    const application = await getOrCreateApplication(req.user.id);
    ensureEditable(application);
    application.currentStep = Math.max(application.currentStep || 1, 2);
    await application.save();
    success(res, 'Account step saved', await serializeApplication(application));
  } catch (error) {
    next(error);
  }
});

router.patch('/personal-info', async (req, res, next) => {
  try {
    const application = await getOrCreateApplication(req.user.id);
    ensureEditable(application);

    const {
      fullLegalName,
      full_legal_name,
      dateOfBirth,
      date_of_birth,
      gender,
      district,
      permanentAddress,
      permanent_address,
      temporaryAddress,
      temporary_address,
      guardianFullName,
      guardian_full_name,
      guardianContact,
      guardian_contact,
    } = req.body;

    const dob = dateOfBirth || date_of_birth;
    if (dob && new Date(dob) > new Date()) throw new ApiError(400, 'Date of birth cannot be in the future');
    if ((guardianContact || guardian_contact) && !validateMobile(guardianContact || guardian_contact)) {
      throw new ApiError(400, 'Guardian contact must be a valid mobile number');
    }

    Object.assign(application, removeUndefined({
      fullLegalName: fullLegalName || full_legal_name,
      dateOfBirth: dob,
      gender,
      district,
      permanentAddress: permanentAddress || permanent_address,
      temporaryAddress: temporaryAddress || temporary_address,
      guardianFullName: guardianFullName || guardian_full_name,
      guardianContact: guardianContact || guardian_contact,
    }));
    application.isMinor = calculateIsMinor(application.dateOfBirth);
    application.currentStep = Math.max(application.currentStep || 1, 3);
    application.completenessPercentage = Math.max(application.completenessPercentage || 0, 35);
    await application.save();

    success(res, 'Personal information saved', await serializeApplication(application));
  } catch (error) {
    next(error);
  }
});

router.patch('/academic', async (req, res, next) => {
  try {
    const application = await getOrCreateApplication(req.user.id);
    ensureEditable(application);
    const payload = normalizeApplicationPayload(req.body);

    if (payload.gpaPercentage && !validateGpa(payload.gpaPercentage)) {
      throw new ApiError(400, 'GPA must be between 0.0 and 4.0');
    }
    const availability = checkScholarshipAvailability(payload.educationLevel, payload.desiredCourse);
    if (!availability.available) {
      throw new ApiError(400, 'Scholarship is not currently available for the selected course');
    }
    payload.educationLevel = availability.educationLevel;
    payload.desiredCourse = availability.desiredCourse;
    payload.scholarshipAvailable = true;

    Object.assign(application, payload);
    application.currentStep = Math.max(application.currentStep || 1, 4);
    application.completenessPercentage = Math.max(application.completenessPercentage || 0, 60);
    await application.save();

    success(res, 'Academic information saved', await serializeApplication(application));
  } catch (error) {
    next(error);
  }
});

router.patch('/me', async (req, res, next) => {
  try {
    const application = await getOrCreateApplication(req.user.id);
    ensureEditable(application);
    Object.assign(application, normalizeApplicationPayload(req.body));
    await application.save();
    success(res, 'Application saved', await serializeApplication(application));
  } catch (error) {
    next(error);
  }
});

router.post('/documents/upload', uploadMiddleware.single('file'), handleDocumentUpload);

router.post('/:applicationId/documents', uploadMiddleware.single('file'), async (req, res, next) => {
  try {
    const application = await Application.findOne({ _id: req.params.applicationId, user: req.user.id });
    if (!application) throw new ApiError(404, 'Application not found');
    return handleDocumentUpload(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.delete('/documents/:documentType', async (req, res, next) => {
  try {
    const application = await getOrCreateApplication(req.user.id);
    ensureEditable(application);
    const document = await Document.findOne({
      application: application.id,
      user: req.user.id,
      documentType: req.params.documentType,
    });
    if (!document) {
      application.documents = application.documents.filter((doc) => doc.documentType !== req.params.documentType);
      await application.save();
      return success(res, 'Document removed', await serializeApplication(application));
    }

    await Document.deleteOne({ _id: document.id });
    application.documents = application.documents.filter((doc) => doc.documentType !== req.params.documentType);
    await application.save();
    await cleanupDocumentFile(document);

    success(res, 'Document removed', await serializeApplication(application));
  } catch (error) {
    next(error);
  }
});

router.post('/submit', async (req, res, next) => {
  try {
    const application = await getOrCreateApplication(req.user.id);
    if (application.status !== 'draft' && application.status !== 'need_correction') {
      throw new ApiError(400, 'Application has already been submitted');
    }

    await validateReadyForSubmission(application, req.body.confirmationAccepted || req.body.confirmation_accepted);
    application.status = 'submitted';
    application.submittedAt = new Date();
    application.currentStep = 5;
    application.completenessPercentage = 100;
    application.correctionRequestedFields = [];
    application.timeline.push({ label: 'Application Submitted', date: new Date(), done: true });
    await application.save();

    success(res, 'Application submitted successfully', {
      applicationId: application.applicationId,
      status: application.status,
      application,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/me/submit', async (req, res, next) => {
  req.url = '/submit';
  return router.handle(req, res, next);
});

module.exports = router;
