// AXVO Backend — Password hashing
// Using bcryptjs (pure JavaScript) instead of bcrypt to avoid native
// compilation issues on hosting platforms like Render's free tier.

const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

async function hashPassword(plainTextPassword) {
  return bcrypt.hash(plainTextPassword, SALT_ROUNDS);
}

async function comparePassword(plainTextPassword, passwordHash) {
  return bcrypt.compare(plainTextPassword, passwordHash);
}

module.exports = { hashPassword, comparePassword };
