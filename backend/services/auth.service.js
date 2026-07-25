// AXVO Backend — Auth service
// Service Layer (Phase 1 requirement): business logic and validation
// live here. Routes stay thin and only handle HTTP concerns.

const userRepository = require('../repositories/user.repository');
const { hashPassword, comparePassword } = require('../utils/password');
const { signAccessToken, ACCESS_TOKEN_EXPIRES_IN } = require('../utils/jwt');
const { AppError } = require('../utils/errors');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

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

async function login({ email, password }) {
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

  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: ACCESS_TOKEN_EXPIRES_IN,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status
    }
  };
}

module.exports = { register, login };
