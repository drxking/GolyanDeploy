const express = require('express');
const Application = require('../models/Application');
const Document = require('../models/Document');
const { requireAuth, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRoles('student'));

router.get('/application-status', async (req, res, next) => {
  try {
    const application = await Application.findOne({ user: req.user.id });
    if (!application) {
      return res.json({
        success: true,
        data: { status: 'not_started', completenessPercentage: 0, documents: [] },
      });
    }

    const documents = await Document.find({ application: application.id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: {
        applicationId: application.applicationId,
        status: application.status,
        currentStep: application.currentStep,
        completenessPercentage: application.completenessPercentage,
        submittedAt: application.submittedAt,
        reviewRemarks: application.reviewRemarks,
        documents,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
