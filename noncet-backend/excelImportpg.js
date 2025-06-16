const mysql = require('mysql2/promise');
const xlsx = require('xlsx');
const pool = require('./config/db'); // Make sure db.js is correct
const Path = require('path'); // No () after require

require('dotenv').config();

(async function importPGData() {
  try {
    const filePath = Path.join(process.env.FILE_PATH, "PG.xlsx");
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Fix here
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet);

    const insertQuery = `
      INSERT INTO pg_cutoffs (institute_name, course)
      VALUES (?, ?)
    `;

    for (let row of rows) {
      await pool.execute(insertQuery, [
        row["College/Institute"] || null,
        row["Course"] || null,
      ]);
    }

    console.log('PG course data imported successfully!');
    await pool.end();
  } catch (err) {
    console.error('Error importing PG course data:', err);
  }
})();
