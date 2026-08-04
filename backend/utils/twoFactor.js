// AXVO Backend — Two-factor authentication (TOTP) helpers
// Compatible with Google Authenticator, Microsoft Authenticator, Authy, etc.

const { authenticator } = require('otplib');
const QRCode = require('qrcode');

const ISSUER = 'AXVO';

function generateSecret() {
  return authenticator.generateSecret();
}

function buildOtpAuthUrl(email, secret) {
  return authenticator.keyuri(email, ISSUER, secret);
}

function verifyCode(code, secret) {
  try {
    return authenticator.verify({ token: code, secret });
  } catch (err) {
    return false;
  }
}

async function generateQrCodeDataUrl(otpAuthUrl) {
  return QRCode.toDataURL(otpAuthUrl);
}

module.exports = { generateSecret, buildOtpAuthUrl, verifyCode, generateQrCodeDataUrl };
