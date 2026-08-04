// AXVO Backend — Auth service
// Service Layer (Phase 1 requirement): business logic and validation
// live here. Routes stay thin and only handle HTTP concerns.

const userRepository = require('../repositories/user.repository');
const sessionRepository = require('../repositories/session.repository');
const refreshTokenRepository = require('../repositories/refreshToken.repository');
const emailVerificationRepository = require('../repositories/emailVerification.repository');
const passwordResetRepository = require('../repositories/passwordReset.repository');
const { hashPassword, comparePassword } = require('../utils/password');
const {
  signAccessToken,
  ACCESS_TOKEN_EXPIRES_IN,
  signTwoFactorPendingToken,
  verifyTwoFactorPendingToken
} = require('../utils/jwt');
const { generateRefreshToken, hashToken } = require('../utils/tokens');
const { sendEmail } = require('../utils/email');
const { verifyCode: verifyTwoFactorCode } = require('../utils/twoFactor');
const { AppError } = require('../utils/errors');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

async function sendVerificationEmail(user) {
  const tokenPlain = generateRefreshToken(); // reused generator — just a random high-entropy string
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);

  await emailVerificationRepository.createToken({
    userId: user.id,
    tokenHash: hashToken(tokenPlain),
    expiresAt
  });

  try {
    await sendEmail({
      to: user.email,
      subject: 'AXVO — 請驗證你的 Email',
      html: `
        <p>歡迎加入 AXVO！</p>
        <p>你的驗證碼是：</p>
        <p style="font-size: 20px; font-weight: bold; letter-spacing: 1px;">${tokenPlain}</p>
        <p>這組驗證碼將在 24 小時後失效。</p>
      `
    });
  } catch (err) {
    // Registration should still succeed even if the email fails to send —
    // the user (or an admin) can trigger a resend later.
    console.error('[auth] Failed to send verification email:', err.message);
  }
}

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

  await sendVerificationEmail(user);

  return user;
}

async function verifyEmail(tokenPlain) {
  if (!tokenPlain) {
    throw new AppError('MISSING_TOKEN', 'Verification token is required', 400);
  }

  const tokenHash = hashToken(tokenPlain);
  const stored = await emailVerificationRepository.findValidByHash(tokenHash);
  if (!stored) {
    throw new AppError('INVALID_TOKEN', 'Verification token is invalid or expired', 401);
  }

  await emailVerificationRepository.markUsed(stored.id);
  await userRepository.markEmailVerified(stored.user_id);

  return { message: 'Email verified successfully' };
}

async function issueLoginTokens(user, ipAddress, userAgent) {
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

  if (user.two_factor_enabled) {
    // Password is correct, but the login isn't complete until the user
    // also provides a valid TOTP code via /2fa/verify.
    const pendingToken = signTwoFactorPendingToken({ sub: user.id });
    return { requires_2fa: true, pending_token: pendingToken };
  }

  return issueLoginTokens(user, ipAddress, userAgent);
}

async function verifyTwoFactorLogin({ pendingToken, code, ipAddress, userAgent }) {
  if (!pendingToken || !code) {
    throw new AppError('MISSING_FIELDS', 'pending_token and code are required', 400);
  }

  let payload;
  try {
    payload = verifyTwoFactorPendingToken(pendingToken);
  } catch (err) {
    throw new AppError('INVALID_PENDING_TOKEN', 'This login attempt has expired, please log in again', 401);
  }

  const user = await userRepository.findById(payload.sub);
  if (!user || !user.two_factor_enabled) {
    throw new AppError('INVALID_STATE', 'Two-factor authentication is not active for this account', 400);
  }

  const valid = verifyTwoFactorCode(code, user.two_factor_secret);
  if (!valid) {
    throw new AppError('INVALID_CODE', 'The verification code is invalid', 401);
  }

  return issueLoginTokens(user, ipAddress, userAgent);
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

async function forgotPassword({ email }) {
  // Always respond the same way whether or not the email exists —
  // this prevents attackers from using this endpoint to discover
  // which emails are registered.
  if (!email) {
    throw new AppError('MISSING_EMAIL', 'Email is required', 400);
  }

  const user = await userRepository.findByEmail(email);
  if (user) {
    const tokenPlain = generateRefreshToken();
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

    await passwordResetRepository.createToken({
      userId: user.id,
      tokenHash: hashToken(tokenPlain),
      expiresAt
    });

    try {
      await sendEmail({
        to: user.email,
        subject: 'AXVO — 重設密碼',
        html: `
          <p>我們收到了重設你 AXVO 密碼的請求。</p>
          <p>你的重設密碼驗證碼是：</p>
          <p style="font-size: 20px; font-weight: bold; letter-spacing: 1px;">${tokenPlain}</p>
          <p>這組驗證碼將在 1 小時後失效。如果不是你本人操作，請忽略這封信。</p>
        `
      });
    } catch (err) {
      console.error('[auth] Failed to send password reset email:', err.message);
    }
  }

  return { message: 'If that email exists, a reset code has been sent.' };
}

async function resetPassword({ token, newPassword }) {
  if (!token) {
    throw new AppError('MISSING_TOKEN', 'Reset token is required', 400);
  }
  if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(
      'WEAK_PASSWORD',
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      400
    );
  }

  const tokenHash = hashToken(token);
  const stored = await passwordResetRepository.findValidByHash(tokenHash);
  if (!stored) {
    throw new AppError('INVALID_TOKEN', 'Reset token is invalid or expired', 401);
  }

  const passwordHash = await hashPassword(newPassword);
  await userRepository.updatePassword(stored.user_id, passwordHash);
  await passwordResetRepository.markUsed(stored.id);

  // Security: a password reset should invalidate every existing login,
  // in case the account was compromised.
  await refreshTokenRepository.revokeAllForUser(stored.user_id);
  await sessionRepository.revokeAllForUser(stored.user_id);

  return { message: 'Password reset successfully. Please log in again.' };
}

module.exports = {
  register,
  login,
  verifyTwoFactorLogin,
  refreshAccessToken,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword
};
