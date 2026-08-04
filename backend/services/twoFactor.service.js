// AXVO Backend — Two-factor authentication service

const userRepository = require('../repositories/user.repository');
const twoFactorUtil = require('../utils/twoFactor');
const { AppError } = require('../utils/errors');

async function setupTwoFactor(userId, email) {
  const secret = twoFactorUtil.generateSecret();
  await userRepository.setTwoFactorSecret(userId, secret);

  const otpAuthUrl = twoFactorUtil.buildOtpAuthUrl(email, secret);
  const qrCodeDataUrl = await twoFactorUtil.generateQrCodeDataUrl(otpAuthUrl);

  return { secret, otpauth_url: otpAuthUrl, qr_code_data_url: qrCodeDataUrl };
}

async function enableTwoFactor(userId, code) {
  const user = await userRepository.findById(userId);
  if (!user || !user.two_factor_secret) {
    throw new AppError('TWO_FACTOR_NOT_SETUP', 'Please set up 2FA first', 400);
  }

  const valid = twoFactorUtil.verifyCode(code, user.two_factor_secret);
  if (!valid) {
    throw new AppError('INVALID_CODE', 'The verification code is invalid', 401);
  }

  await userRepository.enableTwoFactor(userId);
  return { message: 'Two-factor authentication enabled' };
}

async function disableTwoFactor(userId) {
  await userRepository.disableTwoFactor(userId);
  return { message: 'Two-factor authentication disabled' };
}

module.exports = { setupTwoFactor, enableTwoFactor, disableTwoFactor };
