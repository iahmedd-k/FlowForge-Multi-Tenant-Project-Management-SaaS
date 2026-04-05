const { error } = require('../utils/response.util');

module.exports = (...allowedRoles) => (req, res, next) => {
  const activeRole = req.workspaceRole || req.user?.role;
  if (!allowedRoles.includes(activeRole))
    return error(res, 'Access denied', 403);
  next();
};
