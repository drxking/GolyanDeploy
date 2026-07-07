const Campaign = require('../models/Campaign');
const Subscription = require('../models/Subscription');
const ApiError = require('../utils/apiError');
const { sendBulkEmail, verifyEmailConfig } = require('../services/emailService');

const SEND_DELAY_MS = Number(process.env.EMAIL_SEND_DELAY_MS || 500);
const BUSINESS_NAME = process.env.BUSINESS_NAME || 'Business Name';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeRequiredString(value) {
  return String(value || '').trim();
}

function buildBaseUrl(req) {
  return `${req.protocol}://${req.get('host')}`;
}

function buildUnsubscribeUrl(req, subscription) {
  const params = new URLSearchParams({
    email: subscription.email,
    targetLevel: subscription.targetLevel,
    targetCourse: subscription.targetCourse,
  });

  return `${buildBaseUrl(req)}/api/subscriptions/unsubscribe?${params.toString()}`;
}

async function sendCampaignEmail(req, res, next) {
  let campaign;

  try {
    const targetLevel = normalizeRequiredString(req.body.targetLevel || req.body.target_level);
    const targetCourse = normalizeRequiredString(req.body.targetCourse || req.body.target_course);
    const subject = normalizeRequiredString(req.body.subject);
    const message = normalizeRequiredString(req.body.message);

    if (!targetLevel) throw new ApiError(400, 'Target level is required');
    if (!targetCourse) throw new ApiError(400, 'Target course is required');
    if (!subject) throw new ApiError(400, 'Subject is required');
    if (!message) throw new ApiError(400, 'Message is required');

    const subscribers = await Subscription.find({
      targetLevel,
      targetCourse,
      isSubscribed: true,
    }).sort({ createdAt: 1 });

    campaign = await Campaign.create({
      subject,
      message,
      targetLevel,
      targetCourse,
      totalRecipients: subscribers.length,
      status: 'sending',
      sentBy: req.user?.id || null,
    });

    if (subscribers.length > 0) {
      verifyEmailConfig();
    }

    for (const subscriber of subscribers) {
      try {
        await sendBulkEmail({
          to: subscriber.email,
          subject,
          message,
          unsubscribeUrl: buildUnsubscribeUrl(req, subscriber),
          businessName: BUSINESS_NAME,
        });

        campaign.sentCount += 1;
      } catch (error) {
        campaign.failedCount += 1;
        console.error(`Campaign ${campaign.id} failed for ${subscriber.email}:`, error.message);
      }

      await campaign.save();

      if (SEND_DELAY_MS > 0) {
        await delay(SEND_DELAY_MS);
      }
    }

    campaign.status = 'sent';
    campaign.sentAt = new Date();
    await campaign.save();

    res.status(200).json({
      success: true,
      message: 'Campaign email sending completed',
      campaign,
    });
  } catch (error) {
    if (campaign) {
      campaign.status = 'failed';
      await campaign.save().catch((saveError) => {
        console.error('Failed to update campaign status:', saveError);
      });
    }

    next(error);
  }
}

module.exports = { sendCampaignEmail };
