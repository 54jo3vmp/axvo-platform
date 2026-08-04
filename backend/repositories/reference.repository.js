// AXVO Backend — Reference data repository (countries, currencies)

const { pool } = require('../db');

async function listCountries() {
  const result = await pool.query('SELECT id, code, name FROM countries ORDER BY name');
  return result.rows;
}

async function listCurrencies() {
  const result = await pool.query('SELECT id, code, name, symbol FROM currencies ORDER BY name');
  return result.rows;
}

async function countryExists(id) {
  const result = await pool.query('SELECT 1 FROM countries WHERE id = $1', [id]);
  return result.rowCount > 0;
}

async function currencyExists(id) {
  const result = await pool.query('SELECT 1 FROM currencies WHERE id = $1', [id]);
  return result.rowCount > 0;
}

module.exports = { listCountries, listCurrencies, countryExists, currencyExists };
