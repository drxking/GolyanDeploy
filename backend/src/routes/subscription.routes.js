const express = require('express');
const Subscription = require('../models/Subscription');
const ApiError = require('../utils/apiError');

const router = express.Router();

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function normalizePreferences(input = {}) {
  return {
    newScholarshipOpenings: input.newScholarshipOpenings !== false,
    deadlineReminders: Boolean(input.deadlineReminders),
    resultsAnnouncements: Boolean(input.resultsAnnouncements),
    eligibilityCriteriaUpdates: Boolean(input.eligibilityCriteriaUpdates),
    meritBasedAwards: Boolean(input.meritBasedAwards),
    internationalPrograms: Boolean(input.internationalPrograms),
  };
}

router.post('/', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const fullName = String(req.body.fullName || req.body.full_name || '').trim();
    const phoneNumber = String(req.body.phoneNumber || req.body.phone_number || '').trim();
    const programOfInterest = String(req.body.programOfInterest || req.body.program_of_interest || '').trim();
    const targetLevel = String(req.body.targetLevel || req.body.target_level || 'General Updates').trim();
    const targetCourse = String(req.body.targetCourse || req.body.target_course || 'Newsletter').trim();
    const notificationPreferences = normalizePreferences(req.body.notificationPreferences || req.body.notification_preferences);
    const source = String(req.body.source || 'availability_form').trim();

    if (!validateEmail(email)) throw new ApiError(400, 'Enter a valid email address');
    if (phoneNumber && !/^(\+?977[-\s]?)?(97|98)\d{8}$/.test(phoneNumber.replace(/\s/g, ''))) {
      throw new ApiError(400, 'Enter a valid Nepal mobile number');
    }
    if (!targetLevel) throw new ApiError(400, 'Target level is required');
    if (!targetCourse) throw new ApiError(400, 'Target course is required');

    const subscription = await Subscription.findOneAndUpdate(
      { email, targetLevel, targetCourse },
      {
        email,
        fullName,
        phoneNumber,
        programOfInterest: programOfInterest || `${targetLevel} - ${targetCourse}`,
        targetLevel,
        targetCourse,
        notificationPreferences,
        source,
        isSubscribed: true,
        unsubscribedAt: null,
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      success: true,
      message: 'Subscription saved',
      data: { subscription },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/unsubscribe', async (req, res, next) => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();
    const targetLevel = String(req.query.targetLevel || req.query.target_level || '').trim();
    const targetCourse = String(req.query.targetCourse || req.query.target_course || '').trim();

    if (!validateEmail(email)) throw new ApiError(400, 'Enter a valid email address');
    if (!targetLevel) throw new ApiError(400, 'Target level is required');
    if (!targetCourse) throw new ApiError(400, 'Target course is required');

    const subscription = await Subscription.findOneAndUpdate(
      { email, targetLevel, targetCourse },
      { isSubscribed: false, unsubscribedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!subscription) throw new ApiError(404, 'Subscription not found');

    res.json({
      success: true,
      message: 'You have been unsubscribed from these course updates.',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
