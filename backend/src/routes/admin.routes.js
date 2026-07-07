const express = require('express');
const Application = require('../models/Application');
const Document = require('../models/Document');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { requireAuth, requireRoles } = require('../middleware/auth');
const ApiError = require('../utils/apiError');

const router = express.Router();

router.use(requireAuth, requireRoles('admin'));

router.get('/dashboard', async (req, res, next) => {
  try {
    const studentUsers = await User.find({ role: 'student' }).select('_id');
    const studentUserIds = studentUsers.map((user) => user._id);
    const studentApplicationQuery = { user: { $in: studentUserIds } };
    const [totalApplicants, statusCounts, topDistricts, levelCounts, genderCounts, recentApplications, subscriptionCount] =
      await Promise.all([
        Promise.resolve(studentUserIds.length),
        Application.aggregate([{ $match: studentApplicationQuery }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
        Application.aggregate([
          { $match: { ...studentApplicationQuery, district: { $ne: null } } },
          { $group: { _id: '$district', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 6 },
        ]),
        Application.aggregate([{ $match: studentApplicationQuery }, { $group: { _id: '$educationLevel', count: { $sum: 1 } } }]),
        Application.aggregate([{ $match: studentApplicationQuery }, { $group: { _id: '$gender', count: { $sum: 1 } } }]),
        Application.find(studentApplicationQuery)
          .populate('user', 'fullName email province district')
          .sort({ createdAt: -1 })
          .limit(10),
        Subscription.countDocuments(),
      ]);

    const byStatus = statusCounts.reduce((acc, item) => {
      acc[item._id || 'unknown'] = item.count;
      return acc;
    }, {});

    res.json({
      stats: {
        totalApplicants,
        underReview: byStatus.under_review || 0,
        shortlisted: byStatus.shortlisted || 0,
        awarded: byStatus.awarded || 0,
        subscriptions: subscriptionCount,
        byStatus,
      },
      topDistricts,
      levelCounts,
      genderCounts,
      recentApplications,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/subscriptions', async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { email: new RegExp(search, 'i') },
        { fullName: new RegExp(search, 'i') },
        { phoneNumber: new RegExp(search, 'i') },
        { programOfInterest: new RegExp(search, 'i') },
        { targetLevel: new RegExp(search, 'i') },
        { targetCourse: new RegExp(search, 'i') },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [subscriptions, total] = await Promise.all([
      Subscription.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Subscription.countDocuments(query),
    ]);

    res.json({ subscriptions, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    next(error);
  }
});

router.get('/applications', async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const studentUsers = await User.find({ role: 'student' }).select('_id');
    const studentUserIds = studentUsers.map((user) => user._id);
    const query = { user: { $in: studentUserIds } };

    if (status && status !== 'all') query.status = status;
    if (search) {
      const matchingUsers = await User.find({
        role: 'student',
        $or: [
          { fullName: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') },
          { mobileNumber: new RegExp(search, 'i') },
        ],
      }).select('_id');
      query.$or = [
        { applicationId: new RegExp(search, 'i') },
        { district: new RegExp(search, 'i') },
        { educationLevel: new RegExp(search, 'i') },
        { desiredCourse: new RegExp(search, 'i') },
        { user: { $in: matchingUsers.map((user) => user._id) } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [applications, total] = await Promise.all([
      Application.find(query)
        .populate('user', 'fullName email mobileNumber province district')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Application.countDocuments(query),
    ]);

    res.json({ applications, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    next(error);
  }
});

router.get('/applications/:id', async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id).populate('user', 'fullName email mobileNumber province district role');
    if (!application) throw new ApiError(404, 'Application not found');
    if (application.user?.role && application.user.role !== 'student') throw new ApiError(404, 'Application not found');

    const documents = await Document.find({ application: application.id }).sort({ createdAt: -1 });
    res.json({ application, documents });
  } catch (error) {
    next(error);
  }
});

router.patch('/applications/:id/status', async (req, res, next) => {
  try {
    const { status, reviewNotes, reviewRemarks } = req.body;
    const allowed = [
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

    if (!allowed.includes(status)) {
      throw new ApiError(400, 'Invalid application status');
    }

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      {
        status,
        reviewNotes,
        reviewRemarks,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
        $push: { timeline: { label: `Status changed to ${status}`, date: new Date(), done: true } },
      },
      { new: true, runValidators: true }
    );

    if (!application) throw new ApiError(404, 'Application not found');
    res.json({ application });
  } catch (error) {
    next(error);
  }
});

router.patch('/applications/:id/request-correction', async (req, res, next) => {
  try {
    const { remarks, fields = [] } = req.body;
    if (!remarks) throw new ApiError(400, 'Correction remarks are required');

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      {
        status: 'need_correction',
        reviewRemarks: remarks,
        reviewNotes: remarks,
        correctionRequestedFields: Array.isArray(fields) ? fields : [],
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
        $push: { timeline: { label: 'Correction requested', date: new Date(), done: true } },
      },
      { new: true, runValidators: true }
    );

    if (!application) throw new ApiError(404, 'Application not found');
    res.json({ success: true, message: 'Correction requested', application });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
