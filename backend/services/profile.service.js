// AXVO Backend — Profile service

const profileRepository = require('../repositories/profile.repository');
const userRepository = require('../repositories/user.repository');
const referenceRepository = require('../repositories/reference.repository');
const { AppError } = require('../utils/errors');

async function getProfile(userId) {
  const [profile, user] = await Promise.all([
    profileRepository.findByUserId(userId),
    userRepository.findById(userId)
  ]);

  return {
    full_name: profile ? profile.full_name : null,
    avatar_url: profile ? profile.avatar_url : null,
    address: profile ? profile.address : null,
    currency_id: profile ? profile.currency_id : null,
    language: profile ? profile.language : 'zh-TW',
    country_id: user ? user.country_id : null
  };
}

async function updateProfile(userId, { fullName, address, countryId, currencyId, language }) {
  if (countryId !== undefined && countryId !== null) {
    const exists = await referenceRepository.countryExists(countryId);
    if (!exists) {
      throw new AppError('INVALID_COUNTRY', 'That country_id does not exist', 400);
    }
    await userRepository.updateCountry(userId, countryId);
  }

  if (currencyId !== undefined && currencyId !== null) {
    const exists = await referenceRepository.currencyExists(currencyId);
    if (!exists) {
      throw new AppError('INVALID_CURRENCY', 'That currency_id does not exist', 400);
    }
  }

  await profileRepository.upsert(userId, { fullName, address, currencyId, language });
  return getProfile(userId);
}

module.exports = { getProfile, updateProfile };
