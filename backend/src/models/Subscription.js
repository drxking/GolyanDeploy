const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    fullName: {
      type: String,
      trim: true,
      default: '',
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: '',
    },
    programOfInterest: {
      type: String,
      trim: true,
      default: '',
    },
    targetLevel: {
      type: String,
      required: true,
      trim: true,
    },
    targetCourse: {
      type: String,
      required: true,
      trim: true,
    },
    notificationPreferences: {
      newScholarshipOpenings: { type: Boolean, default: true },
      deadlineReminders: { type: Boolean, default: false },
      resultsAnnouncements: { type: Boolean, default: false },
      eligibilityCriteriaUpdates: { type: Boolean, default: false },
      meritBasedAwards: { type: Boolean, default: false },
      internationalPrograms: { type: Boolean, default: false },
    },
    source: {
      type: String,
      trim: true,
      default: 'availability_form',
    },
    isSubscribed: {
      type: Boolean,
      default: true,
    },
    unsubscribedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

subscriptionSchema.index({ email: 1, targetLevel: 1, targetCourse: 1 }, { unique: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
