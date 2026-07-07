const mongoose = require('mongoose');

const timelineEventSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    date: { type: Date, default: Date.now },
    done: { type: Boolean, default: false },
    active: { type: Boolean, default: false },
  },
  { _id: false }
);

const documentMetaSchema = new mongoose.Schema(
  {
    documentType: { type: String, required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: Number,
    mimeType: String,
    uploadedAt: { type: Date, default: Date.now },
    verifiedStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    applicationId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    educationLevel: {
      type: String,
      trim: true,
    },
    fullLegalName: { type: String, trim: true },
    dateOfBirth: Date,
    currentInstitution: { type: String, trim: true },
    desiredCourse: { type: String, trim: true },
    scholarshipAvailable: { type: Boolean, default: false },
    gpaPercentage: { type: String, trim: true },
    familyIncomeRange: { type: String, trim: true },
    district: { type: String, trim: true },
    gender: { type: String, trim: true },
    permanentAddress: { type: String, trim: true },
    temporaryAddress: { type: String, trim: true },
    guardianFullName: { type: String, trim: true },
    guardianContact: { type: String, trim: true },
    marginalizedCategory: { type: String, trim: true },
    disabilityStatus: { type: Boolean, default: false },
    sop: { type: String, trim: true },
    entranceExamScore: { type: String, trim: true },
    status: {
      type: String,
      enum: [
        'draft',
        'submitted',
        'under_review',
        'need_correction',
        'shortlisted',
        'interviewed',
        'approved',
        'rejected',
        'awarded',
      ],
      default: 'draft',
      index: true,
    },
    currentStep: {
      type: Number,
      min: 1,
      max: 5,
      default: 1,
    },
    isMinor: {
      type: Boolean,
      default: false,
    },
    completenessPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewNotes: String,
    reviewRemarks: String,
    correctionRequestedFields: {
      type: [String],
      default: [],
    },
    documents: {
      type: [documentMetaSchema],
      default: [],
    },
    applicationData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timeline: {
      type: [timelineEventSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

applicationSchema.pre('save', async function setApplicationId(next) {
  if (this.applicationId) return next();
  if (this.status === 'draft') return next();

  const year = new Date().getFullYear();
  const count = await mongoose.model('Application').countDocuments({
    applicationId: new RegExp(`^PGS-${year}-`),
    createdAt: {
      $gte: new Date(`${year}-01-01T00:00:00.000Z`),
      $lte: new Date(`${year}-12-31T23:59:59.999Z`),
    },
  });

  this.applicationId = `PGS-${year}-${String(count + 1).padStart(6, '0')}`;
  next();
});

module.exports = mongoose.model('Application', applicationSchema);
