const {
  verifyAccessToken,
} = require('../utils/jwt.util');
const { error } = require('../utils/response.util');

module.exports = async (req, res, next) => {
  // Get token from Authorization header: "Bearer <token>"
  const authHeader = req.headers.authorization || '';
  const accessToken = authHeader.replace('Bearer ', '').trim();
  
  if (!accessToken) {
    return error(res, 'Not authenticated', 401);
  }

  try {
    req.user = verifyAccessToken(accessToken);
    return next();
  } catch {
    return error(res, 'Token invalid or expired', 401);
  }
};
