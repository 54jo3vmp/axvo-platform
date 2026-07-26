// AXVO Backend — Authentication middleware
// Protects routes that require a logged-in user. Reads the access
// token from the "Authorization: Bearer <token>" header, verifies it,
// and attaches the decoded payload to req.user.

const { verifyAccessToken } = require('../utils/jwt');
const { AppError } = require('../utils/errors');

function authenticate(req, res, next) {
  const authHeader = req.get('authorization') || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError('UNAUTHORIZED', 'Missing or invalid Authorization header', 401));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    return next();
  } catch (err) {
    return next(new AppError('UNAUTHORIZED', 'Access token is invalid or expired', 401));
  }
}

module.exports = authenticate;
