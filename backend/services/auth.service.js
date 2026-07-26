// AXVO Backend — Auth service
// Service Layer (Phase 1 requirement): business logic and validation
// live here. Routes stay thin and only handle HTTP concerns.

const userRepository = require('../repositories/user.repository');
const sessionRepository = require('../repositories/session.repository');
const refreshTokenRepository = require('../repositories/refreshToken.repository');
const { hashPassword, comparePassword } = require('../utils/password');
const { signAccessToken, ACCESS_TOKEN_EXPIRES_IN } = require('../utils/jwt');
const { generateRefreshToken, hashToken } = require('../utils/tokens');
const { AppError } = require('../utils/errors');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

async function register({ email, password }) {
  if (!email || !EMAIL_REGEX.test(email)) {
    throw new AppError('INVALID_EMAIL', 'Please provide a valid email address', 400);
  }
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(
      'WEAK_PASSWORD',
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      400
    );
  }

  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new AppError('EMAIL_TAKEN', 'An account with this email already exists', 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await userRepository.createUser({ email, passwordHash });
  return user;
}

async function login({ email, password, ipAddress, userAgent }) {
  if (!email || !password) {
    throw new AppError('MISSING_CREDENTIALS', 'Email and password are required', 400);
  }

  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }

  const passwordMatches = await comparePassword(password, user.password_hash);
  if (!passwordMatches) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }

  if (user.status !== 'active') {
    throw new AppError('ACCOUNT_DISABLED', 'This account is not active', 403);
  }

  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });

  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  await sessionRepository.createSession({ userId: user.id, ipAddress, userAgent, expiresAt });

  const refreshTokenPlain = generateRefreshToken();
  await refreshTokenRepository.createRefreshToken({
    userId: user.id,
    tokenHash: hashToken(refreshTokenPlain),
    expiresAt
  });

  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: ACCESS_TOKEN_EXPIRES_IN,
    refresh_token: refreshTokenPlain,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status
    }
  };
}

async function refreshAccessToken(refreshTokenPlain) {
  if (!refreshTokenPlain) {
    throw new AppError('MISSING_REFRESH_TOKEN', 'Refresh token is required', 400);
  }

  const tokenHash = hashToken(refreshTokenPlain);
  const stored = await refreshTokenRepository.findValidByHash(tokenHash);
  if (!stored) {
    throw new AppError('INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired', 401);
  }

  const user = await userRepository.findById(stored.user_id);
  if (!user || user.status !== 'active') {
    throw new AppError('ACCOUNT_DISABLED', 'This account is not active', 403);
  }

  // Rotation: the old refresh token is single-use — revoke it and issue a new one.
  await refreshTokenRepository.revokeById(stored.id);

  const newRefreshTokenPlain = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  await refreshTokenRepository.createRefreshToken({
    userId: user.id,
    tokenHash: hashToken(newRefreshTokenPlain),
    expiresAt
  });

  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });

  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: ACCESS_TOKEN_EXPIRES_IN,
    refresh_token: newRefreshTokenPlain
  };
}

async function logout(refreshTokenPlain) {
  if (!refreshTokenPlain) {
    return; // idempotent no-op — logging out with no token is not an error
  }
  await refreshTokenRepository.revokeByHash(hashToken(refreshTokenPlain));
}

module.exports = { register, login, refreshAccessToken, logout };
