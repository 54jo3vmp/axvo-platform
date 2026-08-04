// AXVO Backend — Reference data routes (countries, currencies)
// Public — no login required, since dropdowns need this before a user
// is even registered.

const express = require('express');
const referenceRepository = require('../repositories/reference.repository');

const router = express.Router();

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

router.get(
  '/countries',
  asyncHandler(async (req, res) => {
    const countries = await referenceRepository.listCountries();
    res.status(200).json({ countries });
  })
);

router.get(
  '/currencies',
  asyncHandler(async (req, res) => {
    const currencies = await referenceRepository.listCurrencies();
    res.status(200).json({ currencies });
  })
);

module.exports = router;
