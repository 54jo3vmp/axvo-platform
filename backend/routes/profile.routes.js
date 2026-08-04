// AXVO Backend — Profile routes
// Mounted at /api/v1/profile in server.js, behind the auth middleware.

const express = require('express');
const profileService = require('../services/profile.service');

const router = express.Router();

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const profile = await profileService.getProfile(req.user.id);
    res.status(200).json({ profile });
  })
);

router.put(
  '/',
  asyncHandler(async (req, res) => {
    const { full_name: fullName, address, country_id: countryId, currency_id: currencyId, language } =
      req.body || {};
    const profile = await profileService.updateProfile(req.user.id, {
      fullName,
      address,
      countryId,
      currencyId,
      language
    });
    res.status(200).json({ profile });
  })
);

module.exports = router;
