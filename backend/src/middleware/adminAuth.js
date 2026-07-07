const { requireAuth, requireRoles } = require('./auth');

module.exports = [requireAuth, requireRoles('admin')];
